namespace HelpdeskSentiment.Api.DTOs;

public class AgentKpiDto
{
    public int TotalAssignedComplaints { get; set; }
    public int PendingComplaints { get; set; }
    public int InProgressComplaints { get; set; }
    public int ResolvedComplaints { get; set; }
    public int HighPriorityComplaints { get; set; }
    public int AvailableUnassignedComplaints { get; set; }
}

public class PriorityCountItemDto
{
    public string Priority { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class StatusCountItemDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AgentDashboardDto
{
    public AgentKpiDto Kpis { get; set; } = new();
    public List<StatusCountItemDto> StatusBreakdown { get; set; } = new();
    public List<PriorityCountItemDto> PriorityBreakdown { get; set; } = new();
    public List<SentimentDistributionItemDto> SentimentDistribution { get; set; } = new();
    public List<ComplaintResponseDto> HighPriorityAssigned { get; set; } = new();
    public List<ComplaintResponseDto> RecentAssigned { get; set; } = new();
}

public class AgentComplaintFilterDto
{
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? Sentiment { get; set; }
    public string? Category { get; set; }
    public string? Search { get; set; }
}

public class AgentProfileDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int AssignedComplaintCount { get; set; }
    public int PendingComplaintCount { get; set; }
    public int InProgressComplaintCount { get; set; }
    public int ResolvedComplaintCount { get; set; }
}
