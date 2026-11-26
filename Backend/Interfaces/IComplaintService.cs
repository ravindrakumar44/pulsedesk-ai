using HelpdeskSentiment.Api.DTOs;

namespace HelpdeskSentiment.Api.Interfaces;

public interface IComplaintService
{
    // Customer operations
    Task<ComplaintResponseDto> CreateComplaintAsync(int customerId, ComplaintCreateDto dto);
    Task<List<ComplaintResponseDto>> GetCustomerComplaintsAsync(int customerId);
    Task<ComplaintResponseDto> GetComplaintByIdAsync(int complaintId, int requesterId, bool isAdmin);

    // Admin read-only & analytics operations
    Task<List<ComplaintResponseDto>> GetAllComplaintsAsync(AdminComplaintFilterDto filter);
    Task<AdminDashboardDto> GetAdminDashboardAsync();
    Task<AdminAnalyticsDto> GetAdminAnalyticsAsync();
    Task<List<AdminCustomerSummaryDto>> GetAllCustomersAsync();
    Task<List<AdminAgentSummaryDto>> GetAllAgentsAsync();

    // Agent assignment & resolution operations
    Task<AgentDashboardDto> GetAgentDashboardAsync(int agentId);
    Task<List<ComplaintResponseDto>> GetAvailableComplaintsAsync(AgentComplaintFilterDto filter);
    Task<List<ComplaintResponseDto>> GetAgentAssignedComplaintsAsync(int agentId, AgentComplaintFilterDto filter);
    Task<ComplaintResponseDto> GetAgentComplaintByIdAsync(int complaintId, int agentId);
    Task<ComplaintResponseDto> ClaimComplaintAsync(int complaintId, int agentId);
    Task<ComplaintResponseDto> UpdateAgentComplaintStatusAsync(int complaintId, int agentId, UpdateComplaintStatusDto dto);
    Task<ComplaintResponseDto> ResolveComplaintAsync(int complaintId, int agentId, ResolveComplaintDto dto);
    Task<AgentProfileDto> GetAgentProfileAsync(int agentId);
}
