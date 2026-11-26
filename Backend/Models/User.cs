using System.ComponentModel.DataAnnotations;

namespace HelpdeskSentiment.Api.Models;

public static class DomainConstants
{
    public static class Roles
    {
        public const string Customer = "Customer";
        public const string Agent = "Agent";
        public const string Admin = "Admin";
    }

    public static class Priorities
    {
        public const string High = "High";
        public const string Medium = "Medium";
        public const string Low = "Low";

        public static readonly string[] All = [High, Medium, Low];
    }

    public static class InputMethods
    {
        public const string Voice = "Voice";
        public const string Text = "Text";

        public static readonly string[] All = [Voice, Text];
    }

    public static class ComplaintStatuses
    {
        public const string Pending = "Pending";
        public const string InProgress = "In Progress";
        public const string Resolved = "Resolved";
        public const string Closed = "Closed";

        public static readonly string[] All = [Pending, InProgress, Resolved, Closed];
    }

    public static class ComplaintCategories
    {
        public const string InternetNetwork = "Internet / Network Issues";
        public const string Payment = "Payment Issues";
        public const string Product = "Product Issues";
        public const string TechnicalSupport = "Technical Support";
        public const string Account = "Account Issues";
        public const string Other = "Other";

        public static readonly string[] All =
        [
            InternetNetwork,
            Payment,
            Product,
            TechnicalSupport,
            Account,
            Other
        ];
    }

    public static class Sentiments
    {
        public const string Positive = "Positive";
        public const string Negative = "Negative";
        public const string Neutral = "Neutral";
    }

    public static class Emotions
    {
        public const string Happy = "Happy";
        public const string Angry = "Angry";
        public const string Frustrated = "Frustrated";
        public const string Disappointed = "Disappointed";
        public const string Satisfied = "Satisfied";
        public const string Neutral = "Neutral";
    }
}

public class User
{
    public int Id { get; set; }

    [Required]
    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(180)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Role { get; set; } = DomainConstants.Roles.Customer;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();

    public ICollection<Complaint> AssignedComplaints { get; set; } = new List<Complaint>();
}
