using System.Text.RegularExpressions;
using HelpdeskSentiment.Api.Interfaces;
using HelpdeskSentiment.Api.Models;

namespace HelpdeskSentiment.Api.Services;

/// <summary>
/// Modular lexicon- and rule-based NLP sentiment and emotion analyzer.
/// Supports English and Hindi/Hinglish helpdesk feedback with negation,
/// intensifier, contrast-clause, and emphasis handling.
/// Produces an explainable heuristic SentimentScore in [-1.0, +1.0] and leaves
/// ConfidenceScore null so heuristic scores are never confused with calibrated ML probabilities.
/// </summary>
public partial class SentimentAnalysisService : ISentimentAnalysisService
{
    private sealed record LexiconEntry(double Weight, string Emotion);

    private static readonly Dictionary<string, LexiconEntry> PhraseLexicon = new(StringComparer.OrdinalIgnoreCase)
    {
        ["not working"] = new(-0.80, DomainConstants.Emotions.Frustrated),
        ["doesn't work"] = new(-0.80, DomainConstants.Emotions.Frustrated),
        ["does not work"] = new(-0.80, DomainConstants.Emotions.Frustrated),
        ["stopped working"] = new(-0.85, DomainConstants.Emotions.Frustrated),
        ["not resolved"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["not helpful"] = new(-0.75, DomainConstants.Emotions.Disappointed),
        ["not satisfied"] = new(-0.75, DomainConstants.Emotions.Disappointed),
        ["never received"] = new(-0.75, DomainConstants.Emotions.Disappointed),
        ["no response"] = new(-0.80, DomainConstants.Emotions.Frustrated),
        ["no reply"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["fed up"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["sick of"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["tired of"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["waste of time"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["waste of money"] = new(-0.90, DomainConstants.Emotions.Angry),
        ["consumer court"] = new(-0.95, DomainConstants.Emotions.Angry),
        ["again and again"] = new(-0.65, DomainConstants.Emotions.Frustrated),
        ["multiple times"] = new(-0.55, DomainConstants.Emotions.Frustrated),
        ["keeps disconnecting"] = new(-0.80, DomainConstants.Emotions.Frustrated),
        ["keeps failing"] = new(-0.80, DomainConstants.Emotions.Frustrated),
        ["expected better"] = new(-0.65, DomainConstants.Emotions.Disappointed),
        ["let down"] = new(-0.70, DomainConstants.Emotions.Disappointed),
        ["thank you"] = new(0.80, DomainConstants.Emotions.Happy),
        ["works great"] = new(0.85, DomainConstants.Emotions.Happy),
        ["works fine"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["works well"] = new(0.75, DomainConstants.Emotions.Satisfied),
        ["well done"] = new(0.80, DomainConstants.Emotions.Happy),
        ["very helpful"] = new(0.85, DomainConstants.Emotions.Satisfied),
        ["quick resolution"] = new(0.85, DomainConstants.Emotions.Satisfied),
        ["काम नहीं"] = new(-0.80, DomainConstants.Emotions.Frustrated),
        ["नहीं चल"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["बहुत खराब"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["बहुत अच्छा"] = new(0.85, DomainConstants.Emotions.Happy),
        ["धन्यवाद"] = new(0.80, DomainConstants.Emotions.Happy)
    };

    private static readonly Dictionary<string, LexiconEntry> WordLexicon = new(StringComparer.OrdinalIgnoreCase)
    {
        // Positive - Happy
        ["happy"] = new(0.80, DomainConstants.Emotions.Happy),
        ["delighted"] = new(0.90, DomainConstants.Emotions.Happy),
        ["thrilled"] = new(0.90, DomainConstants.Emotions.Happy),
        ["excited"] = new(0.80, DomainConstants.Emotions.Happy),
        ["amazing"] = new(0.85, DomainConstants.Emotions.Happy),
        ["awesome"] = new(0.85, DomainConstants.Emotions.Happy),
        ["excellent"] = new(0.90, DomainConstants.Emotions.Happy),
        ["fantastic"] = new(0.90, DomainConstants.Emotions.Happy),
        ["wonderful"] = new(0.85, DomainConstants.Emotions.Happy),
        ["brilliant"] = new(0.85, DomainConstants.Emotions.Happy),
        ["outstanding"] = new(0.90, DomainConstants.Emotions.Happy),
        ["superb"] = new(0.85, DomainConstants.Emotions.Happy),
        ["love"] = new(0.80, DomainConstants.Emotions.Happy),
        ["loved"] = new(0.80, DomainConstants.Emotions.Happy),
        ["great"] = new(0.75, DomainConstants.Emotions.Happy),
        ["best"] = new(0.80, DomainConstants.Emotions.Happy),
        ["thanks"] = new(0.70, DomainConstants.Emotions.Happy),
        ["thankful"] = new(0.75, DomainConstants.Emotions.Happy),
        ["grateful"] = new(0.80, DomainConstants.Emotions.Happy),
        ["impressed"] = new(0.80, DomainConstants.Emotions.Happy),
        ["glad"] = new(0.70, DomainConstants.Emotions.Happy),
        ["cheerful"] = new(0.75, DomainConstants.Emotions.Happy),

        // Positive - Satisfied
        ["satisfied"] = new(0.75, DomainConstants.Emotions.Satisfied),
        ["helpful"] = new(0.70, DomainConstants.Emotions.Satisfied),
        ["resolved"] = new(0.75, DomainConstants.Emotions.Satisfied),
        ["fixed"] = new(0.70, DomainConstants.Emotions.Satisfied),
        ["solved"] = new(0.70, DomainConstants.Emotions.Satisfied),
        ["polite"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["professional"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["responsive"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["smooth"] = new(0.60, DomainConstants.Emotions.Satisfied),
        ["reliable"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["efficient"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["quick"] = new(0.55, DomainConstants.Emotions.Satisfied),
        ["fast"] = new(0.55, DomainConstants.Emotions.Satisfied),
        ["prompt"] = new(0.60, DomainConstants.Emotions.Satisfied),
        ["appreciate"] = new(0.70, DomainConstants.Emotions.Satisfied),
        ["appreciated"] = new(0.70, DomainConstants.Emotions.Satisfied),
        ["cooperative"] = new(0.60, DomainConstants.Emotions.Satisfied),
        ["supportive"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["good"] = new(0.60, DomainConstants.Emotions.Satisfied),
        ["nice"] = new(0.55, DomainConstants.Emotions.Satisfied),
        ["pleasant"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["working"] = new(0.40, DomainConstants.Emotions.Satisfied),
        ["fine"] = new(0.45, DomainConstants.Emotions.Satisfied),
        ["clear"] = new(0.40, DomainConstants.Emotions.Satisfied),

        // Negative - Angry
        ["angry"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["furious"] = new(-0.95, DomainConstants.Emotions.Angry),
        ["outraged"] = new(-0.95, DomainConstants.Emotions.Angry),
        ["outrageous"] = new(-0.90, DomainConstants.Emotions.Angry),
        ["unacceptable"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["ridiculous"] = new(-0.80, DomainConstants.Emotions.Angry),
        ["scam"] = new(-0.95, DomainConstants.Emotions.Angry),
        ["fraud"] = new(-0.95, DomainConstants.Emotions.Angry),
        ["cheating"] = new(-0.90, DomainConstants.Emotions.Angry),
        ["cheat"] = new(-0.90, DomainConstants.Emotions.Angry),
        ["pathetic"] = new(-0.90, DomainConstants.Emotions.Angry),
        ["worst"] = new(-0.90, DomainConstants.Emotions.Angry),
        ["terrible"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["horrible"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["awful"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["useless"] = new(-0.80, DomainConstants.Emotions.Angry),
        ["garbage"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["trash"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["disgusted"] = new(-0.90, DomainConstants.Emotions.Angry),
        ["rude"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["abusive"] = new(-0.95, DomainConstants.Emotions.Angry),
        ["arrogant"] = new(-0.80, DomainConstants.Emotions.Angry),
        ["shouted"] = new(-0.80, DomainConstants.Emotions.Angry),
        ["hate"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["nonsense"] = new(-0.75, DomainConstants.Emotions.Angry),
        ["unprofessional"] = new(-0.75, DomainConstants.Emotions.Angry),

        // Negative - Frustrated
        ["frustrated"] = new(-0.80, DomainConstants.Emotions.Frustrated),
        ["frustrating"] = new(-0.80, DomainConstants.Emotions.Frustrated),
        ["annoying"] = new(-0.70, DomainConstants.Emotions.Frustrated),
        ["annoyed"] = new(-0.70, DomainConstants.Emotions.Frustrated),
        ["irritating"] = new(-0.70, DomainConstants.Emotions.Frustrated),
        ["irritated"] = new(-0.70, DomainConstants.Emotions.Frustrated),
        ["stuck"] = new(-0.60, DomainConstants.Emotions.Frustrated),
        ["broken"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["crashing"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["crashed"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["slow"] = new(-0.55, DomainConstants.Emotions.Frustrated),
        ["lagging"] = new(-0.65, DomainConstants.Emotions.Frustrated),
        ["buffering"] = new(-0.60, DomainConstants.Emotions.Frustrated),
        ["disconnecting"] = new(-0.70, DomainConstants.Emotions.Frustrated),
        ["disconnected"] = new(-0.65, DomainConstants.Emotions.Frustrated),
        ["downtime"] = new(-0.70, DomainConstants.Emotions.Frustrated),
        ["outage"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["error"] = new(-0.55, DomainConstants.Emotions.Frustrated),
        ["errors"] = new(-0.60, DomainConstants.Emotions.Frustrated),
        ["failed"] = new(-0.70, DomainConstants.Emotions.Frustrated),
        ["failing"] = new(-0.70, DomainConstants.Emotions.Frustrated),
        ["failure"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["unable"] = new(-0.55, DomainConstants.Emotions.Frustrated),
        ["impossible"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["waiting"] = new(-0.45, DomainConstants.Emotions.Frustrated),
        ["ignored"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["blocked"] = new(-0.65, DomainConstants.Emotions.Frustrated),
        ["frozen"] = new(-0.60, DomainConstants.Emotions.Frustrated),
        ["unresponsive"] = new(-0.75, DomainConstants.Emotions.Frustrated),

        // Negative - Disappointed
        ["disappointed"] = new(-0.75, DomainConstants.Emotions.Disappointed),
        ["disappointing"] = new(-0.75, DomainConstants.Emotions.Disappointed),
        ["regret"] = new(-0.70, DomainConstants.Emotions.Disappointed),
        ["unhappy"] = new(-0.75, DomainConstants.Emotions.Disappointed),
        ["dissatisfied"] = new(-0.80, DomainConstants.Emotions.Disappointed),
        ["poor"] = new(-0.65, DomainConstants.Emotions.Disappointed),
        ["bad"] = new(-0.65, DomainConstants.Emotions.Disappointed),
        ["subpar"] = new(-0.65, DomainConstants.Emotions.Disappointed),
        ["mediocre"] = new(-0.55, DomainConstants.Emotions.Disappointed),
        ["weak"] = new(-0.50, DomainConstants.Emotions.Disappointed),
        ["unsatisfactory"] = new(-0.75, DomainConstants.Emotions.Disappointed),
        ["delayed"] = new(-0.60, DomainConstants.Emotions.Disappointed),
        ["delay"] = new(-0.55, DomainConstants.Emotions.Disappointed),
        ["late"] = new(-0.50, DomainConstants.Emotions.Disappointed),
        ["missed"] = new(-0.55, DomainConstants.Emotions.Disappointed),
        ["wrong"] = new(-0.60, DomainConstants.Emotions.Disappointed),
        ["defective"] = new(-0.80, DomainConstants.Emotions.Disappointed),
        ["damaged"] = new(-0.80, DomainConstants.Emotions.Disappointed),
        ["missing"] = new(-0.55, DomainConstants.Emotions.Disappointed),
        ["overcharged"] = new(-0.80, DomainConstants.Emotions.Disappointed),
        ["deducted"] = new(-0.50, DomainConstants.Emotions.Disappointed),
        ["refund"] = new(-0.35, DomainConstants.Emotions.Disappointed),
        ["issue"] = new(-0.35, DomainConstants.Emotions.Disappointed),
        ["issues"] = new(-0.40, DomainConstants.Emotions.Disappointed),
        ["problem"] = new(-0.40, DomainConstants.Emotions.Disappointed),
        ["problems"] = new(-0.45, DomainConstants.Emotions.Disappointed),
        ["trouble"] = new(-0.45, DomainConstants.Emotions.Disappointed),
        ["complaint"] = new(-0.35, DomainConstants.Emotions.Disappointed),

        // Hindi (Devanagari) & Hinglish support for hi-IN voice input
        ["खुश"] = new(0.85, DomainConstants.Emotions.Happy),
        ["संतुष्ट"] = new(0.80, DomainConstants.Emotions.Satisfied),
        ["बढ़िया"] = new(0.80, DomainConstants.Emotions.Happy),
        ["अच्छा"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["अच्छी"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["शानदार"] = new(0.85, DomainConstants.Emotions.Happy),
        ["बेहतरीन"] = new(0.85, DomainConstants.Emotions.Happy),
        ["शुक्रिया"] = new(0.80, DomainConstants.Emotions.Happy),
        ["मदद"] = new(0.45, DomainConstants.Emotions.Satisfied),
        ["गुस्सा"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["नाराज"] = new(-0.80, DomainConstants.Emotions.Angry),
        ["नाराज़"] = new(-0.80, DomainConstants.Emotions.Angry),
        ["परेशान"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["तंग"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["निराश"] = new(-0.75, DomainConstants.Emotions.Disappointed),
        ["खराब"] = new(-0.75, DomainConstants.Emotions.Disappointed),
        ["बेकार"] = new(-0.80, DomainConstants.Emotions.Angry),
        ["घटिया"] = new(-0.90, DomainConstants.Emotions.Angry),
        ["बकवास"] = new(-0.85, DomainConstants.Emotions.Angry),
        ["समस्या"] = new(-0.45, DomainConstants.Emotions.Frustrated),
        ["दिक्कत"] = new(-0.50, DomainConstants.Emotions.Frustrated),
        ["धीमा"] = new(-0.55, DomainConstants.Emotions.Frustrated),
        ["बंद"] = new(-0.55, DomainConstants.Emotions.Frustrated),
        ["देरी"] = new(-0.55, DomainConstants.Emotions.Disappointed),
        ["dhanyawad"] = new(0.80, DomainConstants.Emotions.Happy),
        ["shukriya"] = new(0.80, DomainConstants.Emotions.Happy),
        ["achha"] = new(0.65, DomainConstants.Emotions.Satisfied),
        ["badiya"] = new(0.75, DomainConstants.Emotions.Happy),
        ["kharab"] = new(-0.75, DomainConstants.Emotions.Disappointed),
        ["bekar"] = new(-0.80, DomainConstants.Emotions.Angry),
        ["pareshan"] = new(-0.75, DomainConstants.Emotions.Frustrated),
        ["gussa"] = new(-0.85, DomainConstants.Emotions.Angry)
    };

    private static readonly HashSet<string> NegationWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "not", "never", "no", "dont", "don't", "didnt", "didn't", "doesnt", "doesn't",
        "isnt", "isn't", "wasnt", "wasn't", "arent", "aren't", "cant", "can't", "cannot",
        "couldnt", "couldn't", "wont", "won't", "hardly", "barely", "neither", "nor",
        "without", "नहीं", "मत", "ना", "nahi"
    };

    private static readonly Dictionary<string, double> Intensifiers = new(StringComparer.OrdinalIgnoreCase)
    {
        ["very"] = 1.35,
        ["extremely"] = 1.50,
        ["really"] = 1.30,
        ["totally"] = 1.40,
        ["completely"] = 1.45,
        ["absolutely"] = 1.45,
        ["utterly"] = 1.45,
        ["highly"] = 1.35,
        ["super"] = 1.35,
        ["terribly"] = 1.40,
        ["severely"] = 1.40,
        ["constantly"] = 1.35,
        ["repeatedly"] = 1.35,
        ["always"] = 1.25,
        ["so"] = 1.25,
        ["too"] = 1.25,
        ["बहुत"] = 1.40,
        ["काफी"] = 1.30,
        ["बेहद"] = 1.45,
        ["एकदम"] = 1.35,
        ["bahut"] = 1.35
    };

    private static readonly Dictionary<string, double> Mitigators = new(StringComparer.OrdinalIgnoreCase)
    {
        ["slightly"] = 0.60,
        ["somewhat"] = 0.65,
        ["mildly"] = 0.60,
        ["little"] = 0.65,
        ["bit"] = 0.65,
        ["थोड़ा"] = 0.65,
        ["thoda"] = 0.65
    };

    private static readonly HashSet<string> ContrastWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "but", "however", "although", "yet", "though", "लेकिन", "पर", "मगर"
    };

    [GeneratedRegex(@"[\p{L}\p{M}0-9']+")]
    private static partial Regex TokenRegex();

    public SentimentAnalysisResult Analyze(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new SentimentAnalysisResult
            {
                Sentiment = DomainConstants.Sentiments.Neutral,
                Emotion = DomainConstants.Emotions.Neutral,
                SentimentScore = 0.0,
                ConfidenceScore = null,
                Explanation = "Empty or whitespace-only text defaulted to Neutral with heuristic score 0.0000."
            };
        }

        string normalized = text.Trim();
        string lowerText = normalized.ToLowerInvariant();

        double totalWeightedScore = 0.0;
        var emotionScores = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase)
        {
            [DomainConstants.Emotions.Happy] = 0,
            [DomainConstants.Emotions.Satisfied] = 0,
            [DomainConstants.Emotions.Angry] = 0,
            [DomainConstants.Emotions.Frustrated] = 0,
            [DomainConstants.Emotions.Disappointed] = 0
        };

        var matchedCues = new List<string>();
        var modifiersApplied = new List<string>();

        // 1. Scan multi-word phrases first and track covered ranges so single words aren't double-counted excessively
        var coveredPhraseTokens = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (phrase, entry) in PhraseLexicon)
        {
            if (lowerText.Contains(phrase, StringComparison.Ordinal))
            {
                totalWeightedScore += entry.Weight;
                emotionScores[entry.Emotion] = emotionScores.GetValueOrDefault(entry.Emotion) + Math.Abs(entry.Weight);
                matchedCues.Add($"'{phrase}' ({entry.Weight:+0.00;-0.00}, {entry.Emotion})");

                foreach (var pt in phrase.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                {
                    coveredPhraseTokens.Add(pt);
                }
            }
        }

        // 2. Token-level scoring with negation, intensifiers, mitigators, caps, and contrast clauses
        var rawTokens = TokenRegex().Matches(normalized).Select(m => m.Value).ToList();
        bool afterContrast = false;

        for (int i = 0; i < rawTokens.Count; i++)
        {
            string rawToken = rawTokens[i];
            string token = rawToken.ToLowerInvariant();

            if (ContrastWords.Contains(token))
            {
                afterContrast = true;
                modifiersApplied.Add($"contrast clause after '{token}' (1.25x)");
                continue;
            }

            if (coveredPhraseTokens.Contains(token))
            {
                continue;
            }

            if (!WordLexicon.TryGetValue(token, out var entry))
            {
                continue;
            }

            double weight = entry.Weight;
            string emotion = entry.Emotion;

            // Check preceding 1..3 tokens for negation or intensifiers/mitigators
            bool negated = false;
            double multiplier = 1.0;

            int windowStart = Math.Max(0, i - 3);
            for (int j = i - 1; j >= windowStart; j--)
            {
                string prev = rawTokens[j].ToLowerInvariant();
                if (ContrastWords.Contains(prev))
                {
                    break;
                }

                if (NegationWords.Contains(prev))
                {
                    negated = true;
                    modifiersApplied.Add($"negation '{prev}' before '{token}'");
                }
                else if (Intensifiers.TryGetValue(prev, out double boost))
                {
                    multiplier = Math.Max(multiplier, boost);
                    modifiersApplied.Add($"intensifier '{prev}' ({boost:0.00}x)");
                }
                else if (Mitigators.TryGetValue(prev, out double damp))
                {
                    multiplier = Math.Min(multiplier, damp);
                    modifiersApplied.Add($"mitigator '{prev}' ({damp:0.00}x)");
                }
            }

            // All-caps emphasis for ASCII words length >= 3
            if (rawToken.Length >= 3 && rawToken.Any(char.IsLetter) && rawToken == rawToken.ToUpperInvariant() && rawToken != rawToken.ToLowerInvariant())
            {
                multiplier *= 1.20;
                modifiersApplied.Add($"uppercase emphasis '{rawToken}'");
            }

            if (afterContrast)
            {
                multiplier *= 1.25;
            }

            if (negated)
            {
                weight = -weight * 0.85;
                emotion = weight >= 0
                    ? DomainConstants.Emotions.Satisfied
                    : DomainConstants.Emotions.Disappointed;
            }

            double finalContribution = weight * multiplier;
            totalWeightedScore += finalContribution;
            emotionScores[emotion] = emotionScores.GetValueOrDefault(emotion) + Math.Abs(finalContribution);
            matchedCues.Add($"'{token}' ({finalContribution:+0.00;-0.00}, {emotion})");
        }

        // 3. Exclamation mark emphasis
        int exclamationCount = normalized.Count(c => c == '!');
        if (exclamationCount > 0 && Math.Abs(totalWeightedScore) > 0.01)
        {
            double boost = Math.Min(1.20, 1.0 + exclamationCount * 0.06);
            totalWeightedScore *= boost;
            modifiersApplied.Add($"punctuation emphasis ({exclamationCount}x '!')");
        }

        // 4. Smoothly normalize into [-1.0, +1.0]
        double normalizedScore = Math.Round(Math.Tanh(totalWeightedScore / 1.8), 4);

        string sentiment;
        if (normalizedScore >= 0.15)
        {
            sentiment = DomainConstants.Sentiments.Positive;
        }
        else if (normalizedScore <= -0.15)
        {
            sentiment = DomainConstants.Sentiments.Negative;
        }
        else
        {
            sentiment = DomainConstants.Sentiments.Neutral;
        }

        // 5. Choose emotion consistent with final sentiment
        string detectedEmotion = DomainConstants.Emotions.Neutral;
        if (sentiment == DomainConstants.Sentiments.Positive)
        {
            var happyScore = emotionScores.GetValueOrDefault(DomainConstants.Emotions.Happy);
            var satisfiedScore = emotionScores.GetValueOrDefault(DomainConstants.Emotions.Satisfied);
            detectedEmotion = happyScore >= satisfiedScore
                ? DomainConstants.Emotions.Happy
                : DomainConstants.Emotions.Satisfied;
        }
        else if (sentiment == DomainConstants.Sentiments.Negative)
        {
            var negativeCandidates = new[]
            {
                DomainConstants.Emotions.Angry,
                DomainConstants.Emotions.Frustrated,
                DomainConstants.Emotions.Disappointed
            };
            detectedEmotion = negativeCandidates
                .OrderByDescending(e => emotionScores.GetValueOrDefault(e))
                .First();

            if (emotionScores.GetValueOrDefault(detectedEmotion) <= 0)
            {
                detectedEmotion = DomainConstants.Emotions.Disappointed;
            }
        }

        string cuesText = matchedCues.Count > 0
            ? $"Matched cues: {string.Join(", ", matchedCues.Take(8))}."
            : "No strong sentiment keywords detected; treated as neutral factual text.";

        string modText = modifiersApplied.Count > 0
            ? $" Modifiers: {string.Join("; ", modifiersApplied.Distinct().Take(5))}."
            : string.Empty;

        string explanation =
            $"Classified as {sentiment} ({detectedEmotion}) with heuristic lexicon score {normalizedScore:+0.0000;-0.0000;0.0000} " +
            $"(ConfidenceScore is null because this rule-based heuristic does not emit a calibrated probability). {cuesText}{modText}";

        return new SentimentAnalysisResult
        {
            Sentiment = sentiment,
            Emotion = detectedEmotion,
            SentimentScore = normalizedScore,
            ConfidenceScore = null,
            ScoreType = "HeuristicLexiconScore",
            IsCalibratedProbability = false,
            Explanation = explanation
        };
    }
}
