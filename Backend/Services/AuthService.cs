using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HelpdeskSentiment.Api.Data;
using HelpdeskSentiment.Api.DTOs;
using HelpdeskSentiment.Api.Interfaces;
using HelpdeskSentiment.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace HelpdeskSentiment.Api.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var user = await CreateUserWithRoleAsync(dto, DomainConstants.Roles.Customer);
        return GenerateAuthResponse(user);
    }

    public async Task<AuthResponseDto> RegisterAgentAsync(RegisterDto dto)
    {
        var user = await CreateUserWithRoleAsync(dto, DomainConstants.Roles.Agent);
        return GenerateAuthResponse(user);
    }

    public async Task<UserProfileDto> CreateAgentAsync(RegisterDto dto)
    {
        var user = await CreateUserWithRoleAsync(dto, DomainConstants.Roles.Agent);
        return MapToProfile(user);
    }

    private async Task<User> CreateUserWithRoleAsync(RegisterDto dto, string role)
    {
        string normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        bool exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            throw new InvalidOperationException("An account with this email address already exists.");
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty,
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        string normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return GenerateAuthResponse(user);
    }

    public async Task<UserProfileDto> GetProfileAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User account not found.");

        return MapToProfile(user);
    }

    private AuthResponseDto GenerateAuthResponse(User user)
    {
        string jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT signing key is not configured.");
        string issuer = _configuration["Jwt:Issuer"] ?? "HelpdeskSentimentApi";
        string audience = _configuration["Jwt:Audience"] ?? "HelpdeskSentimentClient";
        int expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out int mins) ? mins : 480;

        var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
        var credentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new AuthResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expiresAt,
            User = MapToProfile(user)
        };
    }

    private static UserProfileDto MapToProfile(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        Role = user.Role,
        CreatedAt = user.CreatedAt
    };
}
