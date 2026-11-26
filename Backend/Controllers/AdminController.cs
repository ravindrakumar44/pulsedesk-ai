using HelpdeskSentiment.Api.DTOs;
using HelpdeskSentiment.Api.Interfaces;
using HelpdeskSentiment.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskSentiment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = DomainConstants.Roles.Admin)]
public class AdminController : ControllerBase
{
    private readonly IComplaintService _complaintService;
    private readonly IAuthService _authService;

    public AdminController(IComplaintService complaintService, IAuthService authService)
    {
        _complaintService = complaintService;
        _authService = authService;
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminDashboardDto>> GetDashboard()
    {
        var dashboard = await _complaintService.GetAdminDashboardAsync();
        return Ok(dashboard);
    }

    [HttpGet("complaints")]
    [ProducesResponseType(typeof(List<ComplaintResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ComplaintResponseDto>>> GetAllComplaints(
        [FromQuery] string? sentiment,
        [FromQuery] string? category,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var filter = new AdminComplaintFilterDto
        {
            Sentiment = sentiment,
            Category = category,
            Status = status,
            Search = search,
            FromDate = fromDate,
            ToDate = toDate
        };

        var complaints = await _complaintService.GetAllComplaintsAsync(filter);
        return Ok(complaints);
    }

    [HttpGet("complaints/{id:int}")]
    [ProducesResponseType(typeof(ComplaintResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ComplaintResponseDto>> GetComplaintById(int id)
    {
        var complaint = await _complaintService.GetComplaintByIdAsync(id, requesterId: 0, isAdmin: true);
        return Ok(complaint);
    }

    [HttpGet("analytics")]
    [ProducesResponseType(typeof(AdminAnalyticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminAnalyticsDto>> GetAnalytics()
    {
        var analytics = await _complaintService.GetAdminAnalyticsAsync();
        return Ok(analytics);
    }

    [HttpGet("customers")]
    [ProducesResponseType(typeof(List<AdminCustomerSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AdminCustomerSummaryDto>>> GetCustomers()
    {
        var customers = await _complaintService.GetAllCustomersAsync();
        return Ok(customers);
    }

    [HttpGet("agents")]
    [ProducesResponseType(typeof(List<AdminAgentSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AdminAgentSummaryDto>>> GetAgents()
    {
        var agents = await _complaintService.GetAllAgentsAsync();
        return Ok(agents);
    }

    /// <summary>
    /// Secure administrative mechanism to provision a new Support Agent account.
    /// </summary>
    [HttpPost("agents")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserProfileDto>> CreateAgent([FromBody] RegisterDto dto)
    {
        var created = await _authService.CreateAgentAsync(dto);
        return Created(string.Empty, created);
    }
}
