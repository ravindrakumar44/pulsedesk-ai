using System.Security.Claims;
using HelpdeskSentiment.Api.DTOs;
using HelpdeskSentiment.Api.Interfaces;
using HelpdeskSentiment.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskSentiment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = DomainConstants.Roles.Agent)]
public class AgentController : ControllerBase
{
    private readonly IComplaintService _complaintService;

    public AgentController(IComplaintService complaintService)
    {
        _complaintService = complaintService;
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AgentDashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AgentDashboardDto>> GetDashboard()
    {
        int agentId = GetCurrentAgentId();
        var dashboard = await _complaintService.GetAgentDashboardAsync(agentId);
        return Ok(dashboard);
    }

    [HttpGet("available-complaints")]
    [ProducesResponseType(typeof(List<ComplaintResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ComplaintResponseDto>>> GetAvailableComplaints(
        [FromQuery] string? priority,
        [FromQuery] string? sentiment,
        [FromQuery] string? category,
        [FromQuery] string? search)
    {
        var filter = new AgentComplaintFilterDto
        {
            Priority = priority,
            Sentiment = sentiment,
            Category = category,
            Search = search
        };
        var items = await _complaintService.GetAvailableComplaintsAsync(filter);
        return Ok(items);
    }

    [HttpGet("my-complaints")]
    [ProducesResponseType(typeof(List<ComplaintResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ComplaintResponseDto>>> GetMyAssignedComplaints(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] string? sentiment,
        [FromQuery] string? category,
        [FromQuery] string? search)
    {
        int agentId = GetCurrentAgentId();
        var filter = new AgentComplaintFilterDto
        {
            Status = status,
            Priority = priority,
            Sentiment = sentiment,
            Category = category,
            Search = search
        };
        var items = await _complaintService.GetAgentAssignedComplaintsAsync(agentId, filter);
        return Ok(items);
    }

    [HttpGet("complaints/{id:int}")]
    [ProducesResponseType(typeof(ComplaintResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ComplaintResponseDto>> GetComplaintById(int id)
    {
        int agentId = GetCurrentAgentId();
        var complaint = await _complaintService.GetAgentComplaintByIdAsync(id, agentId);
        return Ok(complaint);
    }

    [HttpPost("complaints/{id:int}/claim")]
    [ProducesResponseType(typeof(ComplaintResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ComplaintResponseDto>> ClaimComplaint(int id)
    {
        int agentId = GetCurrentAgentId();
        var claimed = await _complaintService.ClaimComplaintAsync(id, agentId);
        return Ok(claimed);
    }

    [HttpPut("complaints/{id:int}/status")]
    [ProducesResponseType(typeof(ComplaintResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ComplaintResponseDto>> UpdateStatus(
        int id,
        [FromBody] UpdateComplaintStatusDto dto)
    {
        int agentId = GetCurrentAgentId();
        var updated = await _complaintService.UpdateAgentComplaintStatusAsync(id, agentId, dto);
        return Ok(updated);
    }

    [HttpPost("complaints/{id:int}/resolve")]
    [ProducesResponseType(typeof(ComplaintResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ComplaintResponseDto>> ResolveComplaint(
        int id,
        [FromBody] ResolveComplaintDto dto)
    {
        int agentId = GetCurrentAgentId();
        var resolved = await _complaintService.ResolveComplaintAsync(id, agentId, dto);
        return Ok(resolved);
    }

    [HttpGet("profile")]
    [ProducesResponseType(typeof(AgentProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AgentProfileDto>> GetProfile()
    {
        int agentId = GetCurrentAgentId();
        var profile = await _complaintService.GetAgentProfileAsync(agentId);
        return Ok(profile);
    }

    private int GetCurrentAgentId()
    {
        string? rawId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(rawId, out int agentId))
        {
            throw new UnauthorizedAccessException("Invalid authentication token.");
        }
        return agentId;
    }
}
