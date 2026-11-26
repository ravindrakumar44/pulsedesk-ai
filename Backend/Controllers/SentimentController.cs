using HelpdeskSentiment.Api.DTOs;
using HelpdeskSentiment.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpdeskSentiment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SentimentController : ControllerBase
{
    private readonly ISentimentAnalysisService _sentimentService;

    public SentimentController(ISentimentAnalysisService sentimentService)
    {
        _sentimentService = sentimentService;
    }

    /// <summary>
    /// Preview sentiment analysis on arbitrary complaint text without saving a record.
    /// Useful for API testing and live diagnostics.
    /// </summary>
    [HttpPost("analyze")]
    [Authorize]
    [ProducesResponseType(typeof(SentimentAnalysisResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<SentimentAnalysisResult> AnalyzeText([FromBody] AnalyzeSentimentRequestDto dto)
    {
        var result = _sentimentService.Analyze(dto.Text);
        return Ok(result);
    }
}
