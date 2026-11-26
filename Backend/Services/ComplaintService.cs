using HelpdeskSentiment.Api.Data;
using HelpdeskSentiment.Api.DTOs;
using HelpdeskSentiment.Api.Interfaces;
using HelpdeskSentiment.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskSentiment.Api.Services;

public class ComplaintService : IComplaintService
{
    private readonly ApplicationDbContext _context;
    private readonly ISentimentAnalysisService _sentimentService;

    public ComplaintService(ApplicationDbContext context, ISentimentAnalysisService sentimentService)
    {
        _context = context;
        _sentimentService = sentimentService;
    }

    public static string DeterminePriority(SentimentAnalysisResult analysis)
    {
        if (analysis.Sentiment == DomainConstants.Sentiments.Negative)
        {
            if (analysis.SentimentScore <= -0.45 ||
                analysis.Emotion == DomainConstants.Emotions.Angry ||
                analysis.Emotion == DomainConstants.Emotions.Frustrated)
            {
                return DomainConstants.Priorities.High;
            }
            return DomainConstants.Priorities.Medium;
        }

        return analysis.Sentiment == DomainConstants.Sentiments.Neutral
            ? DomainConstants.Priorities.Medium
            : DomainConstants.Priorities.Low;
    }

    public async Task<ComplaintResponseDto> CreateComplaintAsync(int customerId, ComplaintCreateDto dto)
    {
        var customer = await _context.Users.FindAsync(customerId)
            ?? throw new KeyNotFoundException("Customer account not found.");

        string category = DomainConstants.ComplaintCategories.All
            .FirstOrDefault(c => c.Equals(dto.ComplaintCategory.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? throw new ArgumentException($"Invalid complaint category. Allowed: {string.Join(", ", DomainConstants.ComplaintCategories.All)}");

        string inputMethod = DomainConstants.InputMethods.All
            .FirstOrDefault(m => m.Equals(dto.InputMethod.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? throw new ArgumentException("InputMethod must be either 'Voice' or 'Text'.");

        string description = dto.ComplaintDescription.Trim();
        string transcript = string.IsNullOrWhiteSpace(dto.Transcript) ? description : dto.Transcript.Trim();

        if (inputMethod == DomainConstants.InputMethods.Voice && string.IsNullOrWhiteSpace(transcript))
        {
            throw new ArgumentException("Voice complaint transcript cannot be empty.");
        }

        string textToAnalyze = $"{dto.ComplaintTitle.Trim()}. {transcript}";
        var analysisResult = _sentimentService.Analyze(textToAnalyze);
        string priority = DeterminePriority(analysisResult);
        int? assignedAgentId = await SelectLeastLoadedAgentIdAsync();

        var now = DateTime.UtcNow;
        var complaint = new Complaint
        {
            CustomerId = customerId,
            ComplaintTitle = dto.ComplaintTitle.Trim(),
            ComplaintDescription = description,
            ComplaintCategory = category,
            InputMethod = inputMethod,
            Transcript = transcript,
            Status = DomainConstants.ComplaintStatuses.Pending,
            Priority = priority,
            AssignedAgentId = assignedAgentId,
            CreatedAt = now,
            UpdatedAt = now,
            SentimentAnalysis = new SentimentAnalysis
            {
                Sentiment = analysisResult.Sentiment,
                Emotion = analysisResult.Emotion,
                SentimentScore = analysisResult.SentimentScore,
                ConfidenceScore = analysisResult.ConfidenceScore,
                Explanation = analysisResult.Explanation,
                AnalyzedAt = now
            }
        };

        _context.Complaints.Add(complaint);
        await _context.SaveChangesAsync();

        complaint.Customer = customer;
        return MapToResponse(complaint, includeAgentDetails: false);
    }

    public async Task<List<ComplaintResponseDto>> GetCustomerComplaintsAsync(int customerId)
    {
        var complaints = await _context.Complaints
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.SentimentAnalysis)
            .Where(c => c.CustomerId == customerId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return complaints.Select(c => MapToResponse(c, includeAgentDetails: false)).ToList();
    }

    public async Task<ComplaintResponseDto> GetComplaintByIdAsync(int complaintId, int requesterId, bool isAdmin)
    {
        var complaint = await _context.Complaints
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.AssignedAgent)
            .Include(c => c.SentimentAnalysis)
            .FirstOrDefaultAsync(c => c.Id == complaintId)
            ?? throw new KeyNotFoundException($"Complaint #{complaintId} was not found.");

        if (!isAdmin && complaint.CustomerId != requesterId)
        {
            throw new UnauthorizedAccessException("You are not authorized to view this complaint.");
        }

        return MapToResponse(complaint, includeAgentDetails: isAdmin);
    }

    public async Task<List<ComplaintResponseDto>> GetAllComplaintsAsync(AdminComplaintFilterDto filter)
    {
        var query = _context.Complaints
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.AssignedAgent)
            .Include(c => c.SentimentAnalysis)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Sentiment))
        {
            string sentiment = filter.Sentiment.Trim();
            query = query.Where(c => c.SentimentAnalysis != null && c.SentimentAnalysis.Sentiment == sentiment);
        }

        if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            string category = filter.Category.Trim();
            query = query.Where(c => c.ComplaintCategory == category);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            string status = filter.Status.Trim();
            query = query.Where(c => c.Status == status);
        }

        if (filter.FromDate.HasValue)
        {
            var fromUtc = filter.FromDate.Value.Date;
            query = query.Where(c => c.CreatedAt >= fromUtc);
        }

        if (filter.ToDate.HasValue)
        {
            var toUtcExclusive = filter.ToDate.Value.Date.AddDays(1);
            query = query.Where(c => c.CreatedAt < toUtcExclusive);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            string search = filter.Search.Trim().ToLower();
            bool hasId = int.TryParse(search.TrimStart('#'), out int searchId);

            query = query.Where(c =>
                (hasId && c.Id == searchId) ||
                c.Customer.FullName.ToLower().Contains(search) ||
                c.Customer.Email.ToLower().Contains(search) ||
                c.ComplaintTitle.ToLower().Contains(search));
        }

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return items.Select(c => MapToResponse(c, includeAgentDetails: true)).ToList();
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync()
    {
        int totalCustomers = await _context.Users
            .CountAsync(u => u.Role == DomainConstants.Roles.Customer);
        int totalAgents = await _context.Users
            .CountAsync(u => u.Role == DomainConstants.Roles.Agent);

        var complaints = await _context.Complaints
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.AssignedAgent)
            .Include(c => c.SentimentAnalysis)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var kpis = BuildKpis(totalCustomers, totalAgents, complaints);
        var distribution = BuildSentimentDistribution(complaints);
        var byCategory = BuildCategoryBreakdown(complaints);
        var trends = BuildTrends(complaints);

        var recent = complaints.Take(8).Select(c => MapToResponse(c, includeAgentDetails: true)).ToList();
        var negativeAttention = complaints
            .Where(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Negative &&
                        c.Status != DomainConstants.ComplaintStatuses.Closed &&
                        c.Status != DomainConstants.ComplaintStatuses.Resolved)
            .OrderBy(c => c.SentimentAnalysis!.SentimentScore)
            .Take(8)
            .Select(c => MapToResponse(c, includeAgentDetails: true))
            .ToList();

        return new AdminDashboardDto
        {
            Kpis = kpis,
            SentimentDistribution = distribution,
            ComplaintsByCategory = byCategory,
            SentimentTrends = trends,
            RecentComplaints = recent,
            NegativeAttentionComplaints = negativeAttention
        };
    }

    public async Task<AdminAnalyticsDto> GetAdminAnalyticsAsync()
    {
        int totalCustomers = await _context.Users
            .CountAsync(u => u.Role == DomainConstants.Roles.Customer);
        int totalAgents = await _context.Users
            .CountAsync(u => u.Role == DomainConstants.Roles.Agent);

        var complaints = await _context.Complaints
            .AsNoTracking()
            .Include(c => c.SentimentAnalysis)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        var kpis = BuildKpis(totalCustomers, totalAgents, complaints);
        int total = complaints.Count;
        int resolvedOrClosed = complaints.Count(c =>
            c.Status == DomainConstants.ComplaintStatuses.Resolved ||
            c.Status == DomainConstants.ComplaintStatuses.Closed);

        var emotionGroups = complaints
            .Where(c => c.SentimentAnalysis != null)
            .GroupBy(c => c.SentimentAnalysis!.Emotion)
            .Select(g => new EmotionCountItemDto
            {
                Emotion = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(e => e.Count)
            .ToList();

        return new AdminAnalyticsDto
        {
            Summary = kpis,
            SentimentDistribution = BuildSentimentDistribution(complaints),
            EmotionDistribution = emotionGroups,
            CategoryBreakdown = BuildCategoryBreakdown(complaints),
            DailyTrends = BuildTrends(complaints),
            VoiceSubmissions = complaints.Count(c => c.InputMethod == DomainConstants.InputMethods.Voice),
            TextSubmissions = complaints.Count(c => c.InputMethod == DomainConstants.InputMethods.Text),
            ResolutionRatePercent = total > 0 ? Math.Round(resolvedOrClosed * 100.0 / total, 1) : 0
        };
    }

    public async Task<List<AdminCustomerSummaryDto>> GetAllCustomersAsync()
    {
        var customers = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == DomainConstants.Roles.Customer)
            .Include(u => u.Complaints)
                .ThenInclude(c => c.SentimentAnalysis)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return customers.Select(u =>
        {
            var latest = u.Complaints.OrderByDescending(c => c.CreatedAt).FirstOrDefault();
            return new AdminCustomerSummaryDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                CreatedAt = u.CreatedAt,
                TotalComplaints = u.Complaints.Count,
                PositiveCount = u.Complaints.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Positive),
                NegativeCount = u.Complaints.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Negative),
                NeutralCount = u.Complaints.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Neutral),
                LatestSentiment = latest?.SentimentAnalysis?.Sentiment ?? "N/A",
                LastComplaintAt = latest?.CreatedAt
            };
        }).ToList();
    }

    public async Task<List<AdminAgentSummaryDto>> GetAllAgentsAsync()
    {
        var agents = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == DomainConstants.Roles.Agent)
            .Include(u => u.AssignedComplaints)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return agents.Select(u =>
        {
            var latestUpdated = u.AssignedComplaints
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => (DateTime?)c.UpdatedAt)
                .FirstOrDefault();

            return new AdminAgentSummaryDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                CreatedAt = u.CreatedAt,
                TotalAssigned = u.AssignedComplaints.Count,
                PendingCount = u.AssignedComplaints.Count(c => c.Status == DomainConstants.ComplaintStatuses.Pending),
                InProgressCount = u.AssignedComplaints.Count(c => c.Status == DomainConstants.ComplaintStatuses.InProgress),
                ResolvedCount = u.AssignedComplaints.Count(c =>
                    c.Status == DomainConstants.ComplaintStatuses.Resolved ||
                    c.Status == DomainConstants.ComplaintStatuses.Closed),
                LastActivityAt = latestUpdated
            };
        }).ToList();
    }

    // ==================== AGENT OPERATIONS ====================

    public async Task<AgentDashboardDto> GetAgentDashboardAsync(int agentId)
    {
        var assigned = await _context.Complaints
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.AssignedAgent)
            .Include(c => c.SentimentAnalysis)
            .Where(c => c.AssignedAgentId == agentId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        int availableCount = await _context.Complaints
            .CountAsync(c => c.AssignedAgentId == null &&
                             c.Status != DomainConstants.ComplaintStatuses.Resolved &&
                             c.Status != DomainConstants.ComplaintStatuses.Closed);

        var kpis = new AgentKpiDto
        {
            TotalAssignedComplaints = assigned.Count,
            PendingComplaints = assigned.Count(c => c.Status == DomainConstants.ComplaintStatuses.Pending),
            InProgressComplaints = assigned.Count(c => c.Status == DomainConstants.ComplaintStatuses.InProgress),
            ResolvedComplaints = assigned.Count(c =>
                c.Status == DomainConstants.ComplaintStatuses.Resolved ||
                c.Status == DomainConstants.ComplaintStatuses.Closed),
            HighPriorityComplaints = assigned.Count(c =>
                c.Priority == DomainConstants.Priorities.High &&
                c.Status != DomainConstants.ComplaintStatuses.Resolved &&
                c.Status != DomainConstants.ComplaintStatuses.Closed),
            AvailableUnassignedComplaints = availableCount
        };

        var statusBreakdown = DomainConstants.ComplaintStatuses.All
            .Select(s => new StatusCountItemDto
            {
                Status = s,
                Count = assigned.Count(c => c.Status == s)
            })
            .ToList();

        var priorityBreakdown = DomainConstants.Priorities.All
            .Select(p => new PriorityCountItemDto
            {
                Priority = p,
                Count = assigned.Count(c => c.Priority == p)
            })
            .ToList();

        var highPriorityOpen = assigned
            .Where(c => c.Priority == DomainConstants.Priorities.High &&
                        c.Status != DomainConstants.ComplaintStatuses.Resolved &&
                        c.Status != DomainConstants.ComplaintStatuses.Closed)
            .OrderBy(c => c.CreatedAt)
            .Take(6)
            .Select(c => MapToResponse(c, includeAgentDetails: true))
            .ToList();

        var recentAssigned = assigned
            .Take(6)
            .Select(c => MapToResponse(c, includeAgentDetails: true))
            .ToList();

        return new AgentDashboardDto
        {
            Kpis = kpis,
            StatusBreakdown = statusBreakdown,
            PriorityBreakdown = priorityBreakdown,
            SentimentDistribution = BuildSentimentDistribution(assigned),
            HighPriorityAssigned = highPriorityOpen,
            RecentAssigned = recentAssigned
        };
    }

    public async Task<List<ComplaintResponseDto>> GetAvailableComplaintsAsync(AgentComplaintFilterDto filter)
    {
        var query = _context.Complaints
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.SentimentAnalysis)
            .Where(c => c.AssignedAgentId == null &&
                        c.Status != DomainConstants.ComplaintStatuses.Resolved &&
                        c.Status != DomainConstants.ComplaintStatuses.Closed);

        query = ApplyAgentFilters(query, filter);

        var items = await query
            .OrderByDescending(c => c.Priority == DomainConstants.Priorities.High)
            .ThenByDescending(c => c.Priority == DomainConstants.Priorities.Medium)
            .ThenBy(c => c.CreatedAt)
            .ToListAsync();

        return items.Select(c => MapToResponse(c, includeAgentDetails: true)).ToList();
    }

    public async Task<List<ComplaintResponseDto>> GetAgentAssignedComplaintsAsync(int agentId, AgentComplaintFilterDto filter)
    {
        var query = _context.Complaints
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.AssignedAgent)
            .Include(c => c.SentimentAnalysis)
            .Where(c => c.AssignedAgentId == agentId);

        query = ApplyAgentFilters(query, filter);

        var items = await query
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        return items.Select(c => MapToResponse(c, includeAgentDetails: true)).ToList();
    }

    public async Task<ComplaintResponseDto> GetAgentComplaintByIdAsync(int complaintId, int agentId)
    {
        var complaint = await _context.Complaints
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.AssignedAgent)
            .Include(c => c.SentimentAnalysis)
            .FirstOrDefaultAsync(c => c.Id == complaintId)
            ?? throw new KeyNotFoundException($"Complaint #{complaintId} was not found.");

        if (complaint.AssignedAgentId.HasValue && complaint.AssignedAgentId.Value != agentId)
        {
            throw new UnauthorizedAccessException("This complaint is assigned to another support agent.");
        }

        return MapToResponse(complaint, includeAgentDetails: true);
    }

    public async Task<ComplaintResponseDto> ClaimComplaintAsync(int complaintId, int agentId)
    {
        var agent = await _context.Users.FindAsync(agentId)
            ?? throw new KeyNotFoundException("Agent account not found.");

        if (agent.Role != DomainConstants.Roles.Agent)
        {
            throw new UnauthorizedAccessException("Only support agents can claim complaints.");
        }

        var now = DateTime.UtcNow;

        if (_context.Database.IsRelational())
        {
            // Atomic conditional SQL UPDATE prevents concurrent double-claiming
            int affected = await _context.Complaints
                .Where(c => c.Id == complaintId &&
                            c.AssignedAgentId == null &&
                            c.Status != DomainConstants.ComplaintStatuses.Resolved &&
                            c.Status != DomainConstants.ComplaintStatuses.Closed)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(c => c.AssignedAgentId, agentId)
                    .SetProperty(c => c.UpdatedAt, now));

            if (affected == 0)
            {
                await ThrowClaimConflictOrNotFoundAsync(complaintId);
            }
        }
        else
        {
            var complaint = await _context.Complaints.FirstOrDefaultAsync(c => c.Id == complaintId)
                ?? throw new KeyNotFoundException($"Complaint #{complaintId} was not found.");

            if (complaint.AssignedAgentId.HasValue)
            {
                throw new InvalidOperationException("This complaint has already been claimed by an agent.");
            }
            if (complaint.Status == DomainConstants.ComplaintStatuses.Resolved ||
                complaint.Status == DomainConstants.ComplaintStatuses.Closed)
            {
                throw new InvalidOperationException("Resolved or closed complaints cannot be claimed.");
            }

            complaint.AssignedAgentId = agentId;
            complaint.UpdatedAt = now;
            await _context.SaveChangesAsync();
        }

        var updated = await _context.Complaints
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.AssignedAgent)
            .Include(c => c.SentimentAnalysis)
            .FirstAsync(c => c.Id == complaintId);

        return MapToResponse(updated, includeAgentDetails: true);
    }

    public async Task<ComplaintResponseDto> UpdateAgentComplaintStatusAsync(
        int complaintId,
        int agentId,
        UpdateComplaintStatusDto dto)
    {
        string normalizedStatus = DomainConstants.ComplaintStatuses.All
            .FirstOrDefault(s => s.Equals(dto.Status.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? throw new ArgumentException($"Invalid status. Allowed: {string.Join(", ", DomainConstants.ComplaintStatuses.All)}");

        var complaint = await _context.Complaints
            .Include(c => c.Customer)
            .Include(c => c.AssignedAgent)
            .Include(c => c.SentimentAnalysis)
            .FirstOrDefaultAsync(c => c.Id == complaintId)
            ?? throw new KeyNotFoundException($"Complaint #{complaintId} was not found.");

        if (complaint.AssignedAgentId != agentId)
        {
            throw new UnauthorizedAccessException("You can only update complaints assigned to you.");
        }

        var now = DateTime.UtcNow;

        if (normalizedStatus == DomainConstants.ComplaintStatuses.Resolved)
        {
            string? messageToUse = !string.IsNullOrWhiteSpace(dto.ResolutionMessage)
                ? dto.ResolutionMessage.Trim()
                : complaint.ResolutionMessage;

            if (string.IsNullOrWhiteSpace(messageToUse) || messageToUse.Length < 5)
            {
                throw new ArgumentException("A resolution message (at least 5 characters) is required before marking a complaint as Resolved.");
            }

            complaint.ResolutionMessage = messageToUse;
            complaint.ResolvedAt ??= now;
        }
        else if (!string.IsNullOrWhiteSpace(dto.ResolutionMessage))
        {
            complaint.ResolutionMessage = dto.ResolutionMessage.Trim();
        }

        complaint.Status = normalizedStatus;
        complaint.UpdatedAt = now;

        await _context.SaveChangesAsync();
        return MapToResponse(complaint, includeAgentDetails: true);
    }

    public async Task<ComplaintResponseDto> ResolveComplaintAsync(
        int complaintId,
        int agentId,
        ResolveComplaintDto dto)
    {
        string resolutionMessage = dto.ResolutionMessage?.Trim() ?? string.Empty;
        if (resolutionMessage.Length < 5)
        {
            throw new ArgumentException("A resolution message (at least 5 characters) is required to resolve this complaint.");
        }

        var complaint = await _context.Complaints
            .Include(c => c.Customer)
            .Include(c => c.AssignedAgent)
            .Include(c => c.SentimentAnalysis)
            .FirstOrDefaultAsync(c => c.Id == complaintId)
            ?? throw new KeyNotFoundException($"Complaint #{complaintId} was not found.");

        if (complaint.AssignedAgentId != agentId)
        {
            throw new UnauthorizedAccessException("You can only resolve complaints assigned to you.");
        }

        var now = DateTime.UtcNow;
        complaint.Status = DomainConstants.ComplaintStatuses.Resolved;
        complaint.ResolutionMessage = resolutionMessage;
        complaint.ResolvedAt = now;
        complaint.UpdatedAt = now;

        await _context.SaveChangesAsync();
        return MapToResponse(complaint, includeAgentDetails: true);
    }

    public async Task<AgentProfileDto> GetAgentProfileAsync(int agentId)
    {
        var agent = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == agentId)
            ?? throw new KeyNotFoundException("Agent account not found.");

        var assignedStatuses = await _context.Complaints
            .AsNoTracking()
            .Where(c => c.AssignedAgentId == agentId)
            .Select(c => c.Status)
            .ToListAsync();

        return new AgentProfileDto
        {
            Id = agent.Id,
            FullName = agent.FullName,
            Email = agent.Email,
            PhoneNumber = agent.PhoneNumber,
            Role = agent.Role,
            CreatedAt = agent.CreatedAt,
            AssignedComplaintCount = assignedStatuses.Count,
            PendingComplaintCount = assignedStatuses.Count(s => s == DomainConstants.ComplaintStatuses.Pending),
            InProgressComplaintCount = assignedStatuses.Count(s => s == DomainConstants.ComplaintStatuses.InProgress),
            ResolvedComplaintCount = assignedStatuses.Count(s =>
                s == DomainConstants.ComplaintStatuses.Resolved ||
                s == DomainConstants.ComplaintStatuses.Closed)
        };
    }

    // ==================== HELPERS ====================

    private async Task<int?> SelectLeastLoadedAgentIdAsync()
    {
        var agents = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == DomainConstants.Roles.Agent)
            .Select(u => new
            {
                u.Id,
                ActiveCount = u.AssignedComplaints.Count(c =>
                    c.Status != DomainConstants.ComplaintStatuses.Resolved &&
                    c.Status != DomainConstants.ComplaintStatuses.Closed),
                TotalCount = u.AssignedComplaints.Count
            })
            .ToListAsync();

        return agents
            .OrderBy(a => a.ActiveCount)
            .ThenBy(a => a.TotalCount)
            .ThenBy(a => a.Id)
            .Select(a => (int?)a.Id)
            .FirstOrDefault();
    }

    private async Task ThrowClaimConflictOrNotFoundAsync(int complaintId)
    {
        var existing = await _context.Complaints
            .AsNoTracking()
            .Select(c => new { c.Id, c.AssignedAgentId, c.Status })
            .FirstOrDefaultAsync(c => c.Id == complaintId);

        if (existing is null)
        {
            throw new KeyNotFoundException($"Complaint #{complaintId} was not found.");
        }
        if (existing.AssignedAgentId.HasValue)
        {
            throw new InvalidOperationException("This complaint has already been claimed by an agent.");
        }
        throw new InvalidOperationException("Resolved or closed complaints cannot be claimed.");
    }

    private static IQueryable<Complaint> ApplyAgentFilters(IQueryable<Complaint> query, AgentComplaintFilterDto filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            string status = filter.Status.Trim();
            query = query.Where(c => c.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(filter.Priority))
        {
            string priority = filter.Priority.Trim();
            query = query.Where(c => c.Priority == priority);
        }

        if (!string.IsNullOrWhiteSpace(filter.Sentiment))
        {
            string sentiment = filter.Sentiment.Trim();
            query = query.Where(c => c.SentimentAnalysis != null && c.SentimentAnalysis.Sentiment == sentiment);
        }

        if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            string category = filter.Category.Trim();
            query = query.Where(c => c.ComplaintCategory == category);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            string search = filter.Search.Trim().ToLower();
            bool hasId = int.TryParse(search.TrimStart('#'), out int searchId);

            query = query.Where(c =>
                (hasId && c.Id == searchId) ||
                c.Customer.FullName.ToLower().Contains(search) ||
                c.Customer.Email.ToLower().Contains(search) ||
                c.ComplaintTitle.ToLower().Contains(search) ||
                c.ComplaintDescription.ToLower().Contains(search));
        }

        return query;
    }

    private static AdminKpiDto BuildKpis(int totalCustomers, int totalAgents, List<Complaint> complaints)
    {
        int positive = complaints.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Positive);
        int negative = complaints.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Negative);
        int neutral = complaints.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Neutral);
        var scored = complaints.Where(c => c.SentimentAnalysis != null).ToList();

        return new AdminKpiDto
        {
            TotalCustomers = totalCustomers,
            TotalAgents = totalAgents,
            TotalComplaints = complaints.Count,
            PositiveSentiments = positive,
            NegativeSentiments = negative,
            NeutralSentiments = neutral,
            AverageSentimentScore = scored.Count > 0
                ? Math.Round(scored.Average(c => c.SentimentAnalysis!.SentimentScore), 3)
                : 0,
            PendingComplaints = complaints.Count(c => c.Status == DomainConstants.ComplaintStatuses.Pending),
            ResolvedComplaints = complaints.Count(c =>
                c.Status == DomainConstants.ComplaintStatuses.Resolved ||
                c.Status == DomainConstants.ComplaintStatuses.Closed)
        };
    }

    private static List<SentimentDistributionItemDto> BuildSentimentDistribution(List<Complaint> complaints)
    {
        int total = complaints.Count;
        string[] sentiments = [DomainConstants.Sentiments.Positive, DomainConstants.Sentiments.Negative, DomainConstants.Sentiments.Neutral];

        return sentiments.Select(s =>
        {
            int count = complaints.Count(c => c.SentimentAnalysis?.Sentiment == s);
            return new SentimentDistributionItemDto
            {
                Sentiment = s,
                Count = count,
                Percentage = total > 0 ? Math.Round(count * 100.0 / total, 1) : 0
            };
        }).ToList();
    }

    private static List<CategoryCountItemDto> BuildCategoryBreakdown(List<Complaint> complaints)
    {
        return DomainConstants.ComplaintCategories.All.Select(cat =>
        {
            var group = complaints.Where(c => c.ComplaintCategory == cat).ToList();
            return new CategoryCountItemDto
            {
                Category = cat,
                Total = group.Count,
                Positive = group.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Positive),
                Negative = group.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Negative),
                Neutral = group.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Neutral)
            };
        }).ToList();
    }

    private static List<SentimentTrendPointDto> BuildTrends(List<Complaint> complaints)
    {
        return complaints
            .GroupBy(c => c.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new SentimentTrendPointDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Positive = g.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Positive),
                Negative = g.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Negative),
                Neutral = g.Count(c => c.SentimentAnalysis?.Sentiment == DomainConstants.Sentiments.Neutral),
                Total = g.Count()
            })
            .ToList();
    }

    private static ComplaintResponseDto MapToResponse(Complaint c, bool includeAgentDetails) => new()
    {
        Id = c.Id,
        CustomerId = c.CustomerId,
        CustomerName = c.Customer?.FullName ?? string.Empty,
        CustomerEmail = c.Customer?.Email ?? string.Empty,
        CustomerPhone = c.Customer?.PhoneNumber ?? string.Empty,
        ComplaintTitle = c.ComplaintTitle,
        ComplaintDescription = c.ComplaintDescription,
        ComplaintCategory = c.ComplaintCategory,
        InputMethod = c.InputMethod,
        Transcript = c.Transcript,
        Status = c.Status,
        Priority = c.Priority,
        AssignedAgentId = includeAgentDetails ? c.AssignedAgentId : null,
        AssignedAgentName = includeAgentDetails ? c.AssignedAgent?.FullName : null,
        ResolutionMessage = c.ResolutionMessage,
        ResolvedAt = c.ResolvedAt,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt,
        SentimentAnalysis = c.SentimentAnalysis is null
            ? null
            : new SentimentAnalysisDto
            {
                Id = c.SentimentAnalysis.Id,
                Sentiment = c.SentimentAnalysis.Sentiment,
                Emotion = c.SentimentAnalysis.Emotion,
                SentimentScore = c.SentimentAnalysis.SentimentScore,
                ConfidenceScore = c.SentimentAnalysis.ConfidenceScore,
                ScoreType = "HeuristicLexiconScore",
                IsCalibratedProbability = false,
                Explanation = c.SentimentAnalysis.Explanation,
                AnalyzedAt = c.SentimentAnalysis.AnalyzedAt
            }
    };
}
