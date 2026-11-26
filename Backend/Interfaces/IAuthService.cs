using HelpdeskSentiment.Api.DTOs;

namespace HelpdeskSentiment.Api.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> RegisterAgentAsync(RegisterDto dto);
    Task<UserProfileDto> CreateAgentAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<UserProfileDto> GetProfileAsync(int userId);
}
