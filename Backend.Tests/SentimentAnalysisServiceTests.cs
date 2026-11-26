using HelpdeskSentiment.Api.Models;
using HelpdeskSentiment.Api.Services;
using Xunit;

namespace HelpdeskSentiment.Tests;

public class SentimentAnalysisServiceTests
{
    private readonly SentimentAnalysisService _service = new();

    [Fact]
    public void Analyze_PositiveHappyFeedback_ReturnsPositiveAndHappy()
    {
        var result = _service.Analyze(
            "Thank you so much! Your support agent was amazing, very helpful, and resolved my issue quickly!");

        Assert.Equal(DomainConstants.Sentiments.Positive, result.Sentiment);
        Assert.Contains(result.Emotion, new[] { DomainConstants.Emotions.Happy, DomainConstants.Emotions.Satisfied });
        Assert.True(result.SentimentScore > 0.4, $"Expected strong positive score, got {result.SentimentScore}");
        Assert.Null(result.ConfidenceScore);
        Assert.False(result.IsCalibratedProbability);
        Assert.Equal("HeuristicLexiconScore", result.ScoreType);
        Assert.False(string.IsNullOrWhiteSpace(result.Explanation));
    }

    [Fact]
    public void Analyze_AngryComplaint_ReturnsNegativeAndAngry()
    {
        var result = _service.Analyze(
            "This is the WORST service ever! Completely unacceptable scam and rude staff. I am furious!");

        Assert.Equal(DomainConstants.Sentiments.Negative, result.Sentiment);
        Assert.Equal(DomainConstants.Emotions.Angry, result.Emotion);
        Assert.True(result.SentimentScore < -0.5, $"Expected strong negative score, got {result.SentimentScore}");
        Assert.Null(result.ConfidenceScore);
    }

    [Fact]
    public void Analyze_FrustratedTechnicalComplaint_ReturnsNegativeAndFrustrated()
    {
        var result = _service.Analyze(
            "My broadband keeps disconnecting again and again. The connection is broken and slow, no response for days.");

        Assert.Equal(DomainConstants.Sentiments.Negative, result.Sentiment);
        Assert.Equal(DomainConstants.Emotions.Frustrated, result.Emotion);
        Assert.True(result.SentimentScore < -0.3, $"Expected negative score, got {result.SentimentScore}");
    }

    [Fact]
    public void Analyze_NeutralFactualRequest_ReturnsNeutral()
    {
        var result = _service.Analyze(
            "I would like to update my registered billing email address on the customer portal for next month.");

        Assert.Equal(DomainConstants.Sentiments.Neutral, result.Sentiment);
        Assert.Equal(DomainConstants.Emotions.Neutral, result.Emotion);
        Assert.InRange(result.SentimentScore, -0.1499, 0.1499);
    }

    [Fact]
    public void Analyze_NegatedPositivePhrase_FlipsToNegative()
    {
        var result = _service.Analyze("I am not happy and not satisfied with the support call.");

        Assert.Equal(DomainConstants.Sentiments.Negative, result.Sentiment);
        Assert.True(result.SentimentScore < 0, $"Expected negative score after negation, got {result.SentimentScore}");
        Assert.Contains("negation", result.Explanation, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Analyze_ContrastClause_WeightsAfterButMoreStrongly()
    {
        var result = _service.Analyze(
            "The agent was polite, but the router is still completely broken and useless.");

        Assert.Equal(DomainConstants.Sentiments.Negative, result.Sentiment);
        Assert.True(result.SentimentScore < -0.2);
    }

    [Fact]
    public void Analyze_HindiInput_DetectsSentimentAccurately()
    {
        var negativeHindi = _service.Analyze("मेरा इंटरनेट बहुत खराब है और मैं बहुत परेशान हूं।");
        var positiveHindi = _service.Analyze("बहुत अच्छा सपोर्ट और धन्यवाद, मैं संतुष्ट हूं।");

        Assert.Equal(DomainConstants.Sentiments.Negative, negativeHindi.Sentiment);
        Assert.Equal(DomainConstants.Sentiments.Positive, positiveHindi.Sentiment);
    }
}
