using HelpdeskSentiment.Api.Models;

namespace HelpdeskSentiment.Api.Interfaces;

public interface ISentimentAnalysisService
{
    SentimentAnalysisResult Analyze(string text);
}

public class SentimentAnalysisResult
{
    public string Sentiment { get; set; } = DomainConstants.Sentiments.Neutral;
    public string Emotion { get; set; } = DomainConstants.Emotions.Neutral;
    public double SentimentScore { get; set; }
    public double? ConfidenceScore { get; set; }
    public string ScoreType { get; set; } = "HeuristicLexiconScore";
    public bool IsCalibratedProbability { get; set; } = false;
    public string Explanation { get; set; } = string.Empty;
}
