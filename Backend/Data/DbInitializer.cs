using HelpdeskSentiment.Api.Interfaces;
using HelpdeskSentiment.Api.Models;
using HelpdeskSentiment.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskSentiment.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger logger)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var sentimentService = scope.ServiceProvider.GetRequiredService<ISentimentAnalysisService>();

        // Apply any pending EF Core migrations safely
        await context.Database.MigrateAsync();

        // Seed initial administrator account when configured (or in Development)
        string? adminEmail = configuration["AdminSeed:Email"];
        string? adminPassword = configuration["AdminSeed:Password"];
        string adminName = configuration["AdminSeed:FullName"] ?? "Helpdesk Administrator";

        if (environment.IsDevelopment())
        {
            adminEmail ??= "admin@pulsedesk.local";
            adminPassword ??= "Admin@12345";
        }

        if (!string.IsNullOrWhiteSpace(adminEmail) && !string.IsNullOrWhiteSpace(adminPassword))
        {
            string normalizedAdminEmail = adminEmail.Trim().ToLowerInvariant();
            bool adminExists = await context.Users.AnyAsync(u => u.Email.ToLower() == normalizedAdminEmail);

            if (!adminExists)
            {
                context.Users.Add(new User
                {
                    FullName = adminName,
                    Email = normalizedAdminEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                    PhoneNumber = "+91-9800000001",
                    Role = DomainConstants.Roles.Admin,
                    CreatedAt = DateTime.UtcNow.AddDays(-14)
                });
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded initial administrator account: {Email}", normalizedAdminEmail);
            }
        }

        bool seedSampleData = configuration.GetValue<bool>("SeedData:EnableSampleData", environment.IsDevelopment());

        // Seed initial development Support Agent accounts (independent of existing complaints)
        if (environment.IsDevelopment() || configuration.GetValue<bool>("AgentSeed:Enabled", false))
        {
            string defaultAgentPass = configuration["AgentSeed:DefaultPassword"] ?? "Agent@12345";
            var seedAgents = new[]
            {
                new { Name = "Vikram Rao", Email = configuration["AgentSeed:Email"] ?? "agent@pulsedesk.local", Phone = "+91-9800000101" },
                new { Name = "Meera Iyer", Email = "agent2@pulsedesk.local", Phone = "+91-9800000102" }
            };

            foreach (var ag in seedAgents)
            {
                string normalizedAgentEmail = ag.Email.Trim().ToLowerInvariant();
                bool exists = await context.Users.AnyAsync(u => u.Email.ToLower() == normalizedAgentEmail);
                if (!exists)
                {
                    context.Users.Add(new User
                    {
                        FullName = ag.Name,
                        Email = normalizedAgentEmail,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultAgentPass),
                        PhoneNumber = ag.Phone,
                        Role = DomainConstants.Roles.Agent,
                        CreatedAt = DateTime.UtcNow.AddDays(-12)
                    });
                    logger.LogInformation("Seeded support agent account: {Email}", normalizedAgentEmail);
                }
            }
            await context.SaveChangesAsync();
        }

        if (!seedSampleData || await context.Complaints.AnyAsync())
        {
            return;
        }

        var availableAgents = await context.Users
            .Where(u => u.Role == DomainConstants.Roles.Agent)
            .OrderBy(u => u.Id)
            .ToListAsync();

        // Seed realistic demonstration customers and complaints (analyzed by the actual NLP service)
        string demoCustomerPassword = configuration["SeedData:DemoCustomerPassword"] ?? "Customer@123";
        var demoCustomers = new List<User>
        {
            new()
            {
                FullName = "Aarav Sharma",
                Email = "aarav.sharma@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(demoCustomerPassword),
                PhoneNumber = "+91-9876543210",
                Role = DomainConstants.Roles.Customer,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new()
            {
                FullName = "Priya Nair",
                Email = "priya.nair@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(demoCustomerPassword),
                PhoneNumber = "+91-9822334455",
                Role = DomainConstants.Roles.Customer,
                CreatedAt = DateTime.UtcNow.AddDays(-8)
            },
            new()
            {
                FullName = "Rohan Verma",
                Email = "rohan.verma@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(demoCustomerPassword),
                PhoneNumber = "+91-9811223344",
                Role = DomainConstants.Roles.Customer,
                CreatedAt = DateTime.UtcNow.AddDays(-6)
            },
            new()
            {
                FullName = "Sneha Patel",
                Email = "sneha.patel@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(demoCustomerPassword),
                PhoneNumber = "+91-9899887766",
                Role = DomainConstants.Roles.Customer,
                CreatedAt = DateTime.UtcNow.AddDays(-4)
            }
        };

        context.Users.AddRange(demoCustomers);
        await context.SaveChangesAsync();

        var seedComplaints = new[]
        {
            new
            {
                Customer = demoCustomers[0],
                Title = "Fiber broadband keeps disconnecting every 20 minutes",
                Category = DomainConstants.ComplaintCategories.InternetNetwork,
                InputMethod = DomainConstants.InputMethods.Voice,
                Transcript = "My internet connection keeps disconnecting again and again since yesterday evening. It is extremely frustrating because I cannot attend work meetings and there has been no response from support!",
                Status = DomainConstants.ComplaintStatuses.Pending,
                ResolutionMessage = (string?)null,
                DaysAgo = 5
            },
            new
            {
                Customer = demoCustomers[1],
                Title = "Double deduction on monthly subscription invoice",
                Category = DomainConstants.ComplaintCategories.Payment,
                InputMethod = DomainConstants.InputMethods.Voice,
                Transcript = "I was overcharged twice for my monthly plan and this is totally unacceptable. Nobody replied to my ticket and I am really angry about this delay in refund.",
                Status = DomainConstants.ComplaintStatuses.InProgress,
                ResolutionMessage = (string?)null,
                DaysAgo = 4
            },
            new
            {
                Customer = demoCustomers[2],
                Title = "Router installation completed smoothly",
                Category = DomainConstants.ComplaintCategories.TechnicalSupport,
                InputMethod = DomainConstants.InputMethods.Text,
                Transcript = "The technician arrived on time, was very polite and helpful, and resolved my router setup issue quickly. Works great and I am completely satisfied!",
                Status = DomainConstants.ComplaintStatuses.Resolved,
                ResolutionMessage = (string?)"Verified fiber signal levels and confirmed stable Wi-Fi throughput with customer.",
                DaysAgo = 3
            },
            new
            {
                Customer = demoCustomers[3],
                Title = "Request to update registered billing email address",
                Category = DomainConstants.ComplaintCategories.Account,
                InputMethod = DomainConstants.InputMethods.Text,
                Transcript = "I submitted a request to change my billing email address on the portal from my old address to the new corporate address for future invoices.",
                Status = DomainConstants.ComplaintStatuses.Pending,
                ResolutionMessage = (string?)null,
                DaysAgo = 2
            },
            new
            {
                Customer = demoCustomers[0],
                Title = "Smart modem arrived with damaged power adapter",
                Category = DomainConstants.ComplaintCategories.Product,
                InputMethod = DomainConstants.InputMethods.Voice,
                Transcript = "I received the replacement unit today, however the power adapter is defective and damaged. Very disappointed because I expected better packaging quality.",
                Status = DomainConstants.ComplaintStatuses.Pending,
                ResolutionMessage = (string?)null,
                DaysAgo = 1
            },
            new
            {
                Customer = demoCustomers[1],
                Title = "Appreciation for quick refund confirmation",
                Category = DomainConstants.ComplaintCategories.Payment,
                InputMethod = DomainConstants.InputMethods.Text,
                Transcript = "Thank you so much to the billing team! The support executive was responsive and professional, and the refund confirmation was amazing and fast.",
                Status = DomainConstants.ComplaintStatuses.Closed,
                ResolutionMessage = (string?)"Refund processed and confirmation receipt shared with the customer.",
                DaysAgo = 0
            }
        };

        var activeLoadByAgent = availableAgents.ToDictionary(a => a.Id, _ => 0);
        var totalLoadByAgent = availableAgents.ToDictionary(a => a.Id, _ => 0);

        foreach (var item in seedComplaints)
        {
            var createdAt = DateTime.UtcNow.AddDays(-item.DaysAgo);
            var analysis = sentimentService.Analyze($"{item.Title}. {item.Transcript}");

            int? assignedAgentId = null;
            if (availableAgents.Count > 0)
            {
                assignedAgentId = availableAgents
                    .OrderBy(a => activeLoadByAgent[a.Id])
                    .ThenBy(a => totalLoadByAgent[a.Id])
                    .ThenBy(a => a.Id)
                    .First().Id;

                totalLoadByAgent[assignedAgentId.Value]++;
                if (item.Status != DomainConstants.ComplaintStatuses.Resolved &&
                    item.Status != DomainConstants.ComplaintStatuses.Closed)
                {
                    activeLoadByAgent[assignedAgentId.Value]++;
                }
            }

            bool isFinished = item.Status == DomainConstants.ComplaintStatuses.Resolved ||
                              item.Status == DomainConstants.ComplaintStatuses.Closed;

            context.Complaints.Add(new Complaint
            {
                CustomerId = item.Customer.Id,
                ComplaintTitle = item.Title,
                ComplaintDescription = item.Transcript,
                ComplaintCategory = item.Category,
                InputMethod = item.InputMethod,
                Transcript = item.Transcript,
                Status = item.Status,
                Priority = ComplaintService.DeterminePriority(analysis),
                AssignedAgentId = assignedAgentId,
                ResolutionMessage = item.ResolutionMessage,
                ResolvedAt = isFinished ? createdAt.AddHours(2) : null,
                CreatedAt = createdAt,
                UpdatedAt = isFinished ? createdAt.AddHours(2) : createdAt,
                SentimentAnalysis = new SentimentAnalysis
                {
                    Sentiment = analysis.Sentiment,
                    Emotion = analysis.Emotion,
                    SentimentScore = analysis.SentimentScore,
                    ConfidenceScore = analysis.ConfidenceScore,
                    Explanation = analysis.Explanation,
                    AnalyzedAt = createdAt
                }
            });
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} sample complaints with NLP sentiment analysis.", seedComplaints.Length);
    }
}
