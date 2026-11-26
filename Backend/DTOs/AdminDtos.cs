namespace HelpdeskSentiment.Api.DTOs;

public class AdminKpiDto
{
    public int TotalCustomers { get; set; }
    public int TotalAgents { get; set; }
    public int TotalComplaints { get; set; }
    public int PositiveSentiments { get; set; }
    public int NegativeSentiments { get; set; }
    public int NeutralSentiments { get; set; }
    public double AverageSentimentScore { get; set; }
    public int PendingComplaints { get; set; }
    public int ResolvedComplaints { get; set; }
}

public class SentimentDistributionItemDto
{
    public string Sentiment { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class CategoryCountItemDto
{
    public string Category { get; set; } = string.Empty;
    public int Total { get; set; }
    public int Positive { get; set; }
    public int Negative { get; set; }
    public int Neutral { get; set; }
}

public class SentimentTrendPointDto
{
    public string Date { get; set; } = string.Empty;
    public int Positive { get; set; }
    public int Negative { get; set; }
    public int Neutral { get; set; }
    public int Total { get; set; }
}

public class EmotionCountItemDto
{
    public string Emotion { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AdminDashboardDto
{
    public AdminKpiDto Kpis { get; set; } = new();
    public List<SentimentDistributionItemDto> SentimentDistribution { get; set; } = new();
    public List<CategoryCountItemDto> ComplaintsByCategory { get; set; } = new();
    public List<SentimentTrendPointDto> SentimentTrends { get; set; } = new();
    public List<ComplaintResponseDto> RecentComplaints { get; set; } = new();
    public List<ComplaintResponseDto> NegativeAttentionComplaints { get; set; } = new();
}

public class AdminAnalyticsDto
{
    public AdminKpiDto Summary { get; set; } = new();
    public List<SentimentDistributionItemDto> SentimentDistribution { get; set; } = new();
    public List<EmotionCountItemDto> EmotionDistribution { get; set; } = new();
    public List<CategoryCountItemDto> CategoryBreakdown { get; set; } = new();
    public List<SentimentTrendPointDto> DailyTrends { get; set; } = new();
    public int VoiceSubmissions { get; set; }
    public int TextSubmissions { get; set; }
    public double ResolutionRatePercent { get; set; }
}

public class AdminCustomerSummaryDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int TotalComplaints { get; set; }
    public int PositiveCount { get; set; }
    public int NegativeCount { get; set; }
    public int NeutralCount { get; set; }
    public string LatestSentiment { get; set; } = "N/A";
    public DateTime? LastComplaintAt { get; set; }
}

public class AdminAgentSummaryDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int TotalAssigned { get; set; }
    public int PendingCount { get; set; }
    public int InProgressCount { get; set; }
    public int ResolvedCount { get; set; }
    public DateTime? LastActivityAt { get; set; }
}

public class AdminComplaintFilterDto
{
    public string? Sentiment { get; set; }
    public string? Category { get; set; }
    public string? Status { get; set; }
    public string? Search { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
