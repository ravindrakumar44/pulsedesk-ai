using System.Security.Claims;
using HelpdeskSentiment.Api.DTOs;
using HelpdeskSentiment.Api.Interfaces;
using HelpdeskSentiment.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskSentiment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ComplaintsController : ControllerBase
{
    private readonly IComplaintService _complaintService;

    public ComplaintsController(IComplaintService complaintService)
    {
        _complaintService = complaintService;
    }

    [HttpPost]
    [Authorize(Roles = DomainConstants.Roles.Customer)]
    [ProducesResponseType(typeof(ComplaintResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ComplaintResponseDto>> CreateComplaint([FromBody] ComplaintCreateDto dto)
    {
        int customerId = GetCurrentUserId();
        var created = await _complaintService.CreateComplaintAsync(customerId, dto);
        return CreatedAtAction(nameof(GetComplaintById), new { id = created.Id }, created);
    }

    [HttpGet("my")]
    [Authorize(Roles = DomainConstants.Roles.Customer)]
    [ProducesResponseType(typeof(List<ComplaintResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ComplaintResponseDto>>> GetMyComplaints()
    {
        int customerId = GetCurrentUserId();
        var list = await _complaintService.GetCustomerComplaintsAsync(customerId);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = $"{DomainConstants.Roles.Customer},{DomainConstants.Roles.Admin}")]
    [ProducesResponseType(typeof(ComplaintResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ComplaintResponseDto>> GetComplaintById(int id)
    {
        int requesterId = GetCurrentUserId();
        bool isAdmin = User.IsInRole(DomainConstants.Roles.Admin);
        var complaint = await _complaintService.GetComplaintByIdAsync(id, requesterId, isAdmin);
        return Ok(complaint);
    }

    private int GetCurrentUserId()
    {
        string? rawId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(rawId, out int userId))
        {
            throw new UnauthorizedAccessException("Invalid authentication token.");
        }
        return userId;
    }
}
