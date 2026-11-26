using HelpdeskSentiment.Api.Data;
using HelpdeskSentiment.Api.DTOs;
using HelpdeskSentiment.Api.Models;
using HelpdeskSentiment.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HelpdeskSentiment.Tests;

public class ComplaintServiceTests
{
    private static ApplicationDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateComplaintAsync_PersistsComplaintPriorityAndSentimentAnalysis()
    {
        await using var context = CreateInMemoryContext();
        var customer = new User
        {
            FullName = "Test Customer",
            Email = "customer@test.local",
            PasswordHash = "hashed",
            Role = DomainConstants.Roles.Customer
        };
        context.Users.Add(customer);
        await context.SaveChangesAsync();

        var service = new ComplaintService(context, new SentimentAnalysisService());

        var created = await service.CreateComplaintAsync(customer.Id, new ComplaintCreateDto
        {
            ComplaintTitle = "Router keeps disconnecting",
            ComplaintDescription = "My connection keeps disconnecting and is extremely frustrating.",
            ComplaintCategory = DomainConstants.ComplaintCategories.InternetNetwork,
            InputMethod = DomainConstants.InputMethods.Voice,
            Transcript = "My connection keeps disconnecting and is extremely frustrating."
        });

        Assert.NotNull(created);
        Assert.Equal(DomainConstants.ComplaintStatuses.Pending, created.Status);
        Assert.Equal(DomainConstants.Priorities.High, created.Priority);
        Assert.Null(created.AssignedAgentId);
        Assert.Equal(DomainConstants.InputMethods.Voice, created.InputMethod);
        Assert.NotNull(created.SentimentAnalysis);
        Assert.Equal(DomainConstants.Sentiments.Negative, created.SentimentAnalysis!.Sentiment);
        Assert.Null(created.SentimentAnalysis.ConfidenceScore);
    }

    [Fact]
    public async Task GetComplaintByIdAsync_OtherCustomerCannotAccess_ThrowsUnauthorized()
    {
        await using var context = CreateInMemoryContext();
        var owner = new User { FullName = "Owner", Email = "owner@test.local", PasswordHash = "h", Role = DomainConstants.Roles.Customer };
        var other = new User { FullName = "Other", Email = "other@test.local", PasswordHash = "h", Role = DomainConstants.Roles.Customer };
        context.Users.AddRange(owner, other);
        await context.SaveChangesAsync();

        var service = new ComplaintService(context, new SentimentAnalysisService());
        var created = await service.CreateComplaintAsync(owner.Id, new ComplaintCreateDto
        {
            ComplaintTitle = "Billing overcharge",
            ComplaintDescription = "I was overcharged on my monthly invoice and disappointed.",
            ComplaintCategory = DomainConstants.ComplaintCategories.Payment,
            InputMethod = DomainConstants.InputMethods.Text
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetComplaintByIdAsync(created.Id, other.Id, isAdmin: false));

        var ownerView = await service.GetComplaintByIdAsync(created.Id, owner.Id, isAdmin: false);
        var adminView = await service.GetComplaintByIdAsync(created.Id, other.Id, isAdmin: true);
        Assert.Equal(created.Id, ownerView.Id);
        Assert.Equal(created.Id, adminView.Id);
    }

    [Fact]
    public async Task AgentClaimAndResolveWorkflow_EnforcesExclusivityAndResolutionMessage()
    {
        await using var context = CreateInMemoryContext();
        var customer = new User { FullName = "Customer A", Email = "c@test.local", PasswordHash = "h", Role = DomainConstants.Roles.Customer };
        context.Users.Add(customer);
        await context.SaveChangesAsync();

        var service = new ComplaintService(context, new SentimentAnalysisService());
        // Created before agents exist so it enters the unassigned available queue
        var created = await service.CreateComplaintAsync(customer.Id, new ComplaintCreateDto
        {
            ComplaintTitle = "App login failure",
            ComplaintDescription = "Unable to log into my account after password reset, very frustrating.",
            ComplaintCategory = DomainConstants.ComplaintCategories.Account,
            InputMethod = DomainConstants.InputMethods.Text
        });

        var agent1 = new User { FullName = "Agent One", Email = "a1@test.local", PasswordHash = "h", Role = DomainConstants.Roles.Agent };
        var agent2 = new User { FullName = "Agent Two", Email = "a2@test.local", PasswordHash = "h", Role = DomainConstants.Roles.Agent };
        context.Users.AddRange(agent1, agent2);
        await context.SaveChangesAsync();

        // Available queue shows unassigned complaint
        var availableBefore = await service.GetAvailableComplaintsAsync(new AgentComplaintFilterDto());
        Assert.Single(availableBefore);

        // Agent 1 claims complaint
        var claimed = await service.ClaimComplaintAsync(created.Id, agent1.Id);
        Assert.Equal(agent1.Id, claimed.AssignedAgentId);
        Assert.Equal(DomainConstants.ComplaintStatuses.Pending, claimed.Status);

        // Available queue no longer includes it
        var availableAfter = await service.GetAvailableComplaintsAsync(new AgentComplaintFilterDto());
        Assert.Empty(availableAfter);

        // Agent 2 cannot claim or inspect/modify Agent 1's assigned complaint
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ClaimComplaintAsync(created.Id, agent2.Id));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetAgentComplaintByIdAsync(created.Id, agent2.Id));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateAgentComplaintStatusAsync(created.Id, agent2.Id, new UpdateComplaintStatusDto
            {
                Status = DomainConstants.ComplaintStatuses.InProgress
            }));

        // Agent 1 moves Pending -> In Progress
        var inProgress = await service.UpdateAgentComplaintStatusAsync(created.Id, agent1.Id, new UpdateComplaintStatusDto
        {
            Status = DomainConstants.ComplaintStatuses.InProgress
        });
        Assert.Equal(DomainConstants.ComplaintStatuses.InProgress, inProgress.Status);

        // Cannot mark Resolved without a resolution message
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.UpdateAgentComplaintStatusAsync(created.Id, agent1.Id, new UpdateComplaintStatusDto
            {
                Status = DomainConstants.ComplaintStatuses.Resolved,
                ResolutionMessage = ""
            }));
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.ResolveComplaintAsync(created.Id, agent1.Id, new ResolveComplaintDto
            {
                ResolutionMessage = "ok"
            }));

        // Agent 1 resolves with proper message
        var resolved = await service.ResolveComplaintAsync(created.Id, agent1.Id, new ResolveComplaintDto
        {
            ResolutionMessage = "Reset the customer's SSO token and verified successful login."
        });
        Assert.Equal(DomainConstants.ComplaintStatuses.Resolved, resolved.Status);
        Assert.NotNull(resolved.ResolvedAt);
        Assert.Equal("Reset the customer's SSO token and verified successful login.", resolved.ResolutionMessage);

        // Customer sees status & resolution message, but NOT private agent identity
        var customerView = await service.GetComplaintByIdAsync(created.Id, customer.Id, isAdmin: false);
        Assert.Equal(DomainConstants.ComplaintStatuses.Resolved, customerView.Status);
        Assert.Equal("Reset the customer's SSO token and verified successful login.", customerView.ResolutionMessage);
        Assert.Null(customerView.AssignedAgentId);
        Assert.Null(customerView.AssignedAgentName);

        // Agent dashboard & profile reflect accurate counts
        var agentDashboard = await service.GetAgentDashboardAsync(agent1.Id);
        Assert.Equal(1, agentDashboard.Kpis.TotalAssignedComplaints);
        Assert.Equal(1, agentDashboard.Kpis.ResolvedComplaints);
        Assert.Equal(0, agentDashboard.Kpis.PendingComplaints);

        var agentProfile = await service.GetAgentProfileAsync(agent1.Id);
        Assert.Equal(1, agentProfile.AssignedComplaintCount);
        Assert.Equal(1, agentProfile.ResolvedComplaintCount);
    }

    [Fact]
    public async Task GetAdminDashboardAsync_ReturnsRealAggregatedMetrics()
    {
        await using var context = CreateInMemoryContext();
        var customer = new User { FullName = "Ravi", Email = "ravi@test.local", PasswordHash = "h", Role = DomainConstants.Roles.Customer };
        context.Users.Add(customer);
        await context.SaveChangesAsync();

        var service = new ComplaintService(context, new SentimentAnalysisService());
        await service.CreateComplaintAsync(customer.Id, new ComplaintCreateDto
        {
            ComplaintTitle = "Great support",
            ComplaintDescription = "Thank you, the team was very helpful and resolved my issue!",
            ComplaintCategory = DomainConstants.ComplaintCategories.TechnicalSupport,
            InputMethod = DomainConstants.InputMethods.Text
        });
        await service.CreateComplaintAsync(customer.Id, new ComplaintCreateDto
        {
            ComplaintTitle = "Terrible outage",
            ComplaintDescription = "The worst internet outage, completely broken and unacceptable!",
            ComplaintCategory = DomainConstants.ComplaintCategories.InternetNetwork,
            InputMethod = DomainConstants.InputMethods.Voice
        });

        var dashboard = await service.GetAdminDashboardAsync();

        Assert.Equal(1, dashboard.Kpis.TotalCustomers);
        Assert.Equal(2, dashboard.Kpis.TotalComplaints);
        Assert.Equal(1, dashboard.Kpis.PositiveSentiments);
        Assert.Equal(1, dashboard.Kpis.NegativeSentiments);
        Assert.Equal(0, dashboard.Kpis.NeutralSentiments);
        Assert.Single(dashboard.NegativeAttentionComplaints);
    }

    [Fact]
    public async Task GetAllAgentsAsync_ReturnsRegisteredAgentsWithTicketCounts()
    {
        await using var context = CreateInMemoryContext();
        var customer = new User { FullName = "Customer", Email = "cust@test.local", PasswordHash = "h", Role = DomainConstants.Roles.Customer };
        var agent = new User { FullName = "Agent Alpha", Email = "alpha@test.local", PasswordHash = "h", PhoneNumber = "9999999999", Role = DomainConstants.Roles.Agent };
        context.Users.AddRange(customer, agent);
        await context.SaveChangesAsync();

        var service = new ComplaintService(context, new SentimentAnalysisService());
        var created = await service.CreateComplaintAsync(customer.Id, new ComplaintCreateDto
        {
            ComplaintTitle = "Modem issue",
            ComplaintDescription = "Modem is broken and frustrating.",
            ComplaintCategory = DomainConstants.ComplaintCategories.Product,
            InputMethod = DomainConstants.InputMethods.Text
        });

        var agents = await service.GetAllAgentsAsync();
        var dashboard = await service.GetAdminDashboardAsync();

        Assert.Single(agents);
        Assert.Equal("Agent Alpha", agents[0].FullName);
        Assert.Equal(1, agents[0].TotalAssigned);
        Assert.Equal(1, agents[0].PendingCount);
        Assert.Equal(1, dashboard.Kpis.TotalAgents);
    }

    [Fact]
    public async Task CreateComplaintAsync_AutoRoutesToLeastLoadedAgent()
    {
        await using var context = CreateInMemoryContext();
        var customer = new User { FullName = "Customer", Email = "cust2@test.local", PasswordHash = "h", Role = DomainConstants.Roles.Customer };
        var agent1 = new User { FullName = "Agent 1", Email = "ag1@test.local", PasswordHash = "h", Role = DomainConstants.Roles.Agent };
        var agent2 = new User { FullName = "Agent 2", Email = "ag2@test.local", PasswordHash = "h", Role = DomainConstants.Roles.Agent };
        context.Users.AddRange(customer, agent1, agent2);
        await context.SaveChangesAsync();

        var service = new ComplaintService(context, new SentimentAnalysisService());

        // 1st complaint -> Agent 1 (0 active vs 0 active, lowest Id)
        var c1 = await service.CreateComplaintAsync(customer.Id, new ComplaintCreateDto
        {
            ComplaintTitle = "Issue 1",
            ComplaintDescription = "My connection is broken and slow.",
            ComplaintCategory = DomainConstants.ComplaintCategories.InternetNetwork,
            InputMethod = DomainConstants.InputMethods.Text
        });
        var c1Admin = await service.GetComplaintByIdAsync(c1.Id, 0, isAdmin: true);
        Assert.Equal(agent1.Id, c1Admin.AssignedAgentId);

        // 2nd complaint -> Agent 2 (0 active vs Agent 1's 1 active)
        var c2 = await service.CreateComplaintAsync(customer.Id, new ComplaintCreateDto
        {
            ComplaintTitle = "Issue 2",
            ComplaintDescription = "Payment failed and frustrated.",
            ComplaintCategory = DomainConstants.ComplaintCategories.Payment,
            InputMethod = DomainConstants.InputMethods.Text
        });
        var c2Admin = await service.GetComplaintByIdAsync(c2.Id, 0, isAdmin: true);
        Assert.Equal(agent2.Id, c2Admin.AssignedAgentId);

        // Agent 1 resolves Issue 1 -> Agent 1 now has 0 active vs Agent 2's 1 active
        await service.ResolveComplaintAsync(c1.Id, agent1.Id, new ResolveComplaintDto
        {
            ResolutionMessage = "Reset broadband port and confirmed stability."
        });

        // 3rd complaint -> routes back to Agent 1 (least active load!)
        var c3 = await service.CreateComplaintAsync(customer.Id, new ComplaintCreateDto
        {
            ComplaintTitle = "Issue 3",
            ComplaintDescription = "Need help with account settings.",
            ComplaintCategory = DomainConstants.ComplaintCategories.Account,
            InputMethod = DomainConstants.InputMethods.Text
        });
        var c3Admin = await service.GetComplaintByIdAsync(c3.Id, 0, isAdmin: true);
        Assert.Equal(agent1.Id, c3Admin.AssignedAgentId);
    }
}
