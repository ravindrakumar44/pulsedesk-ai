using System.ComponentModel.DataAnnotations;
using HelpdeskSentiment.Api.Models;

namespace HelpdeskSentiment.Api.DTOs;

public class ComplaintCreateDto
{
    [Required(ErrorMessage = "Complaint title is required.")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Complaint title must be between 3 and 200 characters.")]
    public string ComplaintTitle { get; set; } = string.Empty;

    [Required(ErrorMessage = "Complaint description or transcript is required.")]
    [MinLength(5, ErrorMessage = "Please provide at least 5 characters describing your issue.")]
    public string ComplaintDescription { get; set; } = string.Empty;

    [Required(ErrorMessage = "Complaint category is required.")]
    [StringLength(80)]
    public string ComplaintCategory { get; set; } = string.Empty;

    [Required(ErrorMessage = "Input method (Voice or Text) is required.")]
    [StringLength(20)]
    public string InputMethod { get; set; } = "Text";

    /// <summary>
    /// For voice submissions, contains the customer-reviewed speech transcript.
    /// If omitted for text submissions, defaults to ComplaintDescription.
    /// </summary>
    public string? Transcript { get; set; }
}

public class SentimentAnalysisDto
{
    public int Id { get; set; }
    public string Sentiment { get; set; } = string.Empty;
    public string Emotion { get; set; } = string.Empty;
    public double SentimentScore { get; set; }
    public double? ConfidenceScore { get; set; }
    public string ScoreType { get; set; } = "HeuristicLexiconScore";
    public bool IsCalibratedProbability { get; set; } = false;
    public string Explanation { get; set; } = string.Empty;
    public DateTime AnalyzedAt { get; set; }
}

public class ComplaintResponseDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string ComplaintTitle { get; set; } = string.Empty;
    public string ComplaintDescription { get; set; } = string.Empty;
    public string ComplaintCategory { get; set; } = string.Empty;
    public string InputMethod { get; set; } = string.Empty;
    public string Transcript { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = DomainConstants.Priorities.Medium;
    public int? AssignedAgentId { get; set; }
    public string? AssignedAgentName { get; set; }
    public string? ResolutionMessage { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public SentimentAnalysisDto? SentimentAnalysis { get; set; }
}

public class UpdateComplaintStatusDto
{
    [Required(ErrorMessage = "Status is required.")]
    public string Status { get; set; } = string.Empty;

    public string? ResolutionMessage { get; set; }
}

public class ResolveComplaintDto
{
    [Required(ErrorMessage = "A resolution message is required.")]
    [MinLength(5, ErrorMessage = "Resolution message must be at least 5 characters.")]
    public string ResolutionMessage { get; set; } = string.Empty;
}

public class AnalyzeSentimentRequestDto
{
    [Required(ErrorMessage = "Text is required for sentiment analysis.")]
    [MinLength(3, ErrorMessage = "Text must be at least 3 characters.")]
    public string Text { get; set; } = string.Empty;
}
