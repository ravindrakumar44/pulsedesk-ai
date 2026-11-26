using System.ComponentModel.DataAnnotations;

namespace HelpdeskSentiment.Api.Models;

public class Complaint
{
    public int Id { get; set; }

    public int CustomerId { get; set; }

    [Required]
    [MaxLength(200)]
    public string ComplaintTitle { get; set; } = string.Empty;

    [Required]
    public string ComplaintDescription { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string ComplaintCategory { get; set; } = DomainConstants.ComplaintCategories.Other;

    [Required]
    [MaxLength(20)]
    public string InputMethod { get; set; } = DomainConstants.InputMethods.Text;

    [Required]
    public string Transcript { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = DomainConstants.ComplaintStatuses.Pending;

    [Required]
    [MaxLength(20)]
    public string Priority { get; set; } = DomainConstants.Priorities.Medium;

    public int? AssignedAgentId { get; set; }

    public string? ResolutionMessage { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User Customer { get; set; } = null!;

    public User? AssignedAgent { get; set; }

    public SentimentAnalysis? SentimentAnalysis { get; set; }
}
