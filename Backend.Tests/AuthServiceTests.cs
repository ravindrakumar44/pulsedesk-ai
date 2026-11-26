using HelpdeskSentiment.Api.Data;
using HelpdeskSentiment.Api.DTOs;
using HelpdeskSentiment.Api.Models;
using HelpdeskSentiment.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace HelpdeskSentiment.Tests;

public class AuthServiceTests
{
    private static ApplicationDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static IConfiguration CreateTestConfiguration()
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "TestOnly_HelpdeskSentiment_JwtSigningKey_Min32Chars!",
            ["Jwt:Issuer"] = "HelpdeskSentimentApi",
            ["Jwt:Audience"] = "HelpdeskSentimentClient",
            ["Jwt:ExpiryMinutes"] = "60"
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
    }

    [Fact]
    public async Task RegisterAsync_CreatesCustomerWithHashedPasswordAndJwt()
    {
        await using var context = CreateInMemoryContext();
        var authService = new AuthService(context, CreateTestConfiguration());

        var response = await authService.RegisterAsync(new RegisterDto
        {
            FullName = "Neha Kapoor",
            Email = "Neha.Kapoor@Example.com",
            Password = "SecurePassword123",
            PhoneNumber = "+91-9876501234"
        });

        Assert.False(string.IsNullOrWhiteSpace(response.Token));
        Assert.Equal("neha.kapoor@example.com", response.User.Email);
        Assert.Equal(DomainConstants.Roles.Customer, response.User.Role);

        var savedUser = await context.Users.SingleAsync();
        Assert.NotEqual("SecurePassword123", savedUser.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify("SecurePassword123", savedUser.PasswordHash));
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ThrowsInvalidOperationException()
    {
        await using var context = CreateInMemoryContext();
        var authService = new AuthService(context, CreateTestConfiguration());

        await authService.RegisterAsync(new RegisterDto
        {
            FullName = "First User",
            Email = "dup@example.com",
            Password = "Password123"
        });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            authService.RegisterAsync(new RegisterDto
            {
                FullName = "Second User",
                Email = "DUP@example.com",
                Password = "Password123"
            }));
    }

    [Fact]
    public async Task LoginAsync_ValidAndInvalidCredentials_HandledCorrectly()
    {
        await using var context = CreateInMemoryContext();
        var authService = new AuthService(context, CreateTestConfiguration());

        await authService.RegisterAsync(new RegisterDto
        {
            FullName = "Karan Mehta",
            Email = "karan@example.com",
            Password = "MyPassword123"
        });

        var loginOk = await authService.LoginAsync(new LoginDto
        {
            Email = "karan@example.com",
            Password = "MyPassword123"
        });

        Assert.Equal("Karan Mehta", loginOk.User.FullName);
        Assert.False(string.IsNullOrWhiteSpace(loginOk.Token));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            authService.LoginAsync(new LoginDto
            {
                Email = "karan@example.com",
                Password = "WrongPassword"
            }));
    }

    [Fact]
    public async Task CreateAgentAsync_CreatesAgentAndAllowsAgentLogin()
    {
        await using var context = CreateInMemoryContext();
        var authService = new AuthService(context, CreateTestConfiguration());

        var createdAgent = await authService.CreateAgentAsync(new RegisterDto
        {
            FullName = "Vikram Rao",
            Email = "vikram.agent@example.com",
            Password = "AgentPassword123",
            PhoneNumber = "+91-9800000101"
        });

        Assert.Equal(DomainConstants.Roles.Agent, createdAgent.Role);

        var loginResult = await authService.LoginAsync(new LoginDto
        {
            Email = "vikram.agent@example.com",
            Password = "AgentPassword123"
        });

        Assert.Equal(DomainConstants.Roles.Agent, loginResult.User.Role);
        Assert.False(string.IsNullOrWhiteSpace(loginResult.Token));
    }

    [Fact]
    public async Task RegisterAgentAsync_CreatesAgentRoleAndReturnsJwt()
    {
        await using var context = CreateInMemoryContext();
        var authService = new AuthService(context, CreateTestConfiguration());

        var response = await authService.RegisterAgentAsync(new RegisterDto
        {
            FullName = "Self Registered Agent",
            Email = "Self.Agent@Example.com",
            Password = "AgentPass123",
            PhoneNumber = "+91-9811112222"
        });

        Assert.Equal(DomainConstants.Roles.Agent, response.User.Role);
        Assert.Equal("self.agent@example.com", response.User.Email);
        Assert.False(string.IsNullOrWhiteSpace(response.Token));
    }
}
