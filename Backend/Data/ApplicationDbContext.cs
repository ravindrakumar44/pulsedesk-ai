using HelpdeskSentiment.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskSentiment.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Complaint> Complaints => Set<Complaint>();
    public DbSet<SentimentAnalysis> SentimentAnalyses => Set<SentimentAnalysis>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.FullName).IsRequired().HasMaxLength(120);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(180);
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
            entity.Property(u => u.PhoneNumber).HasMaxLength(30);
            entity.Property(u => u.Role).IsRequired().HasMaxLength(30);
        });

        modelBuilder.Entity<Complaint>(entity =>
        {
            entity.ToTable("Complaints");
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.CustomerId);
            entity.HasIndex(c => c.AssignedAgentId);
            entity.HasIndex(c => c.Status);
            entity.HasIndex(c => c.Priority);
            entity.HasIndex(c => c.ComplaintCategory);
            entity.HasIndex(c => c.CreatedAt);

            entity.Property(c => c.ComplaintTitle).IsRequired().HasMaxLength(200);
            entity.Property(c => c.ComplaintDescription).IsRequired();
            entity.Property(c => c.ComplaintCategory).IsRequired().HasMaxLength(80);
            entity.Property(c => c.InputMethod).IsRequired().HasMaxLength(20);
            entity.Property(c => c.Transcript).IsRequired();
            entity.Property(c => c.Status).IsRequired().HasMaxLength(30);
            entity.Property(c => c.Priority).IsRequired().HasMaxLength(20).HasDefaultValue(DomainConstants.Priorities.Medium);

            entity.HasOne(c => c.Customer)
                .WithMany(u => u.Complaints)
                .HasForeignKey(c => c.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.AssignedAgent)
                .WithMany(u => u.AssignedComplaints)
                .HasForeignKey(c => c.AssignedAgentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SentimentAnalysis>(entity =>
        {
            entity.ToTable("SentimentAnalyses");
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.ComplaintId).IsUnique();
            entity.HasIndex(s => s.Sentiment);
            entity.HasIndex(s => s.Emotion);

            entity.Property(s => s.Sentiment).IsRequired().HasMaxLength(30);
            entity.Property(s => s.Emotion).IsRequired().HasMaxLength(40);
            entity.Property(s => s.Explanation).IsRequired();

            entity.HasOne(s => s.Complaint)
                .WithOne(c => c.SentimentAnalysis)
                .HasForeignKey<SentimentAnalysis>(s => s.ComplaintId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
