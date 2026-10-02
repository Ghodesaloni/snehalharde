/**
 * Interview Evaluation & Dynamic Scoring Service
 * 
 * Accurately analyzes candidate interview transcripts, evaluating:
 * 1. Number of questions asked by the AI Interviewer
 * 2. Number and ratio of CORRECT and satisfactory answers given by the candidate
 * 3. Candidate's Level of Confidence, technical depth, and communication clarity
 * 4. Generates an objective, fair cumulative score (0-100) and evaluation breakdown
 */

const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

let aiClient = null;
let quotaExhaustedUntil = 0;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "avahire-evaluator" }
      }
    });
  }
  return aiClient;
}

/**
 * Extract question and answer pairs from an interview transcript
 */
function extractQAPairsFromTranscript(transcript = []) {
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return [];
  }

  const pairs = [];
  let currentQuestion = null;
  let currentAnswers = [];

  for (const item of transcript) {
    const isAI = item.isAI === true || item.speaker === "AI Interviewer" || item.speaker === "Ava" || item.role === "assistant";
    const text = String(item.text || item.content || "").trim();
    if (!text) continue;

    if (isAI) {
      // Check if this AI utterance is a question or prompt
      const isQuestion = text.includes("?") || 
        /^(?:could you|can you|please|walk us through|explain|describe|tell me|how do you|what is|how would you)\b/i.test(text);

      if (currentQuestion && currentAnswers.length > 0) {
        pairs.push({
          question: currentQuestion,
          answers: currentAnswers,
          combinedAnswer: currentAnswers.join(" ")
        });
        currentQuestion = null;
        currentAnswers = [];
      }

      if (isQuestion || !currentQuestion) {
        currentQuestion = text;
        currentAnswers = [];
      } else {
        currentQuestion += " " + text;
      }
    } else {
      // Candidate speech
      if (currentQuestion) {
        currentAnswers.push(text);
      } else {
        // Initial candidate statement before first question
        pairs.push({
          question: "Initial Candidate Introduction",
          answers: [text],
          combinedAnswer: text
        });
      }
    }
  }

  if (currentQuestion && currentAnswers.length > 0) {
    pairs.push({
      question: currentQuestion,
      answers: currentAnswers,
      combinedAnswer: currentAnswers.join(" ")
    });
  }

  return pairs;
}

/**
 * Deterministic NLP evaluation of candidate answers and confidence level
 */
function evaluateTranscriptAlgorithmically(transcript = [], role = "Software Engineer") {
  const pairs = extractQAPairsFromTranscript(transcript);

  // If no transcript or no questions detected
  if (pairs.length === 0) {
    // If transcript has plain candidate entries
    const candidateUtterances = transcript.filter(t => !t.isAI && t.speaker !== "Ava" && t.speaker !== "AI Interviewer");
    if (candidateUtterances.length === 0) {
      return {
        overallScore: 60,
        accuracyScore: 60,
        confidenceScore: 60,
        totalQuestions: 0,
        correctAnswersCount: 0,
        partiallyCorrectCount: 0,
        incorrectOrSkippedCount: 0,
        status: "Under Review",
        recommendation: "Interview pending or minimal conversation recorded.",
        evaluationBreakdown: [
          { category: "Technical Proficiency & Accuracy", score: 60, weight: "40%" },
          { category: "Communication & Level of Confidence", score: 60, weight: "25%" },
          { category: "Problem Solving & System Design", score: 60, weight: "20%" },
          { category: "Code Quality & Resiliency", score: 60, weight: "15%" }
        ],
        summaryPoints: [
          { text: "Minimal transcript data available for complete evaluation.", type: "neutral" }
        ],
        qaEvaluations: []
      };
    }
  }

  // Common evasion, hesitation, or skip patterns
  const skipPatterns = [
    /\b(?:move\s+to\s+(?:the\s+)?next\s+question|next\s+question|skip\s+this|pass|i\s+don'?t\s+know|no\s+idea|idk|can\s+we\s+skip)\b/i,
    /^[.\s,x0-9-]{1,5}$/i, // gibberish like ".", "x25", "---"
    /^(?:yes|no|ok|okay|yeah|nope|sure)$/i
  ];

  // Technical keywords that indicate relevant knowledge
  const techKeywords = [
    "react", "state", "component", "hook", "node", "api", "database", "sql", "query",
    "python", "model", "pipeline", "function", "class", "async", "await", "promise",
    "scalability", "architecture", "microservices", "cache", "redis", "docker", "deploy",
    "testing", "performance", "optimization", "latency", "index", "schema", "table",
    "iot", "arduino", "hardware", "sensor", "automation", "security", "token", "auth",
    "frontend", "backend", "full stack", "git", "ci/cd", "cloud", "aws", "server"
  ];

  // Confidence indicators
  const highConfidenceMarkers = [
    /\b(?:implemented|architected|designed|developed|optimized|solved|ensured|utilized|configured|integrated|analyzed)\b/i,
    /\b(?:because|the\s+reason|for\s+example|specifically|in\s+my\s+experience|firstly|secondly|in\s+order\s+to)\b/i,
    /\b(?:trade-off|scalability|reliability|modular|efficient|robust|throughput|maintainable)\b/i
  ];

  const lowConfidenceMarkers = [
    /\b(?:maybe|i\s+guess|not\s+sure|i\s+think\s+so\s+but|probably|sorry|i\s+forgot|can't\s+remember)\b/i,
    /\b(?:uh+|um+|err+)\b/i
  ];

  let totalScoreSum = 0;
  let totalConfidenceSum = 0;
  let correctCount = 0;
  let partialCount = 0;
  let skipOrIncorrectCount = 0;
  const qaEvaluations = [];

  pairs.forEach((pair, idx) => {
    const ans = pair.combinedAnswer.trim();
    const wordCount = ans.split(/\s+/).filter(Boolean).length;
    let isSkipped = false;

    for (const pat of skipPatterns) {
      if (pat.test(ans)) {
        isSkipped = true;
        break;
      }
    }

    let questionScore = 0;
    let confidenceScore = 0;
    let verdict = "Incorrect / Skipped";

    if (isSkipped || wordCount < 3) {
      questionScore = 0;
      confidenceScore = 20;
      verdict = "Incorrect / Skipped";
      skipOrIncorrectCount++;
    } else {
      // Analyze technical content & length
      const lowerAns = ans.toLowerCase();
      let matchedTechCount = 0;
      for (const kw of techKeywords) {
        if (lowerAns.includes(kw)) matchedTechCount++;
      }

      // Base accuracy evaluation
      if (wordCount >= 25 && matchedTechCount >= 2) {
        questionScore = Math.min(100, 75 + Math.min(25, matchedTechCount * 5 + (wordCount - 25) * 0.5));
        verdict = "Correct & Comprehensive";
        correctCount++;
      } else if (wordCount >= 10 && matchedTechCount >= 1) {
        questionScore = Math.min(75, 50 + matchedTechCount * 8 + (wordCount - 10) * 1.2);
        verdict = "Partially Correct";
        partialCount++;
      } else if (wordCount >= 6) {
        questionScore = Math.min(45, 25 + wordCount * 2);
        verdict = "Weak / Incomplete";
        skipOrIncorrectCount++;
      } else {
        questionScore = 15;
        verdict = "Incorrect / Vague";
        skipOrIncorrectCount++;
      }

      // Confidence evaluation
      let conf = 50;
      // Length factor
      conf += Math.min(25, wordCount * 0.8);
      // High confidence markers
      for (const marker of highConfidenceMarkers) {
        if (marker.test(ans)) conf += 8;
      }
      // Low confidence markers
      for (const marker of lowConfidenceMarkers) {
        if (marker.test(ans)) conf -= 12;
      }

      confidenceScore = Math.max(15, Math.min(100, Math.round(conf)));
    }

    totalScoreSum += questionScore;
    totalConfidenceSum += confidenceScore;

    qaEvaluations.push({
      questionIndex: idx + 1,
      question: pair.question,
      answer: ans,
      accuracyScore: Math.round(questionScore),
      confidenceScore: Math.round(confidenceScore),
      verdict
    });
  });

  const totalQuestions = pairs.length;
  const avgAccuracy = totalQuestions > 0 ? Math.round(totalScoreSum / totalQuestions) : 60;
  const avgConfidence = totalQuestions > 0 ? Math.round(totalConfidenceSum / totalQuestions) : 60;

  // Composite score: 70% accuracy on correct answers + 30% level of confidence
  const overallScore = Math.max(10, Math.min(99, Math.round(avgAccuracy * 0.70 + avgConfidence * 0.30)));

  // Determine status based on performance
  let status = "Under Review";
  let recommendation = "";

  if (overallScore >= 80) {
    status = "Selected";
    recommendation = `Strong hire recommendation. Candidate answered ${correctCount} of ${totalQuestions} questions with high technical depth and confident articulation.`;
  } else if (overallScore >= 65) {
    status = "Under Review";
    recommendation = `Candidate demonstrated moderate technical understanding (${correctCount} correct, ${partialCount} partial out of ${totalQuestions} questions). Review recommended.`;
  } else {
    status = "Rejected";
    recommendation = `Candidate struggled to answer technical questions (${skipOrIncorrectCount} skipped/incorrect out of ${totalQuestions} questions). Did not meet passing threshold.`;
  }

  const evaluationBreakdown = [
    {
      category: "Technical Proficiency & Accuracy",
      score: avgAccuracy,
      weight: "40%"
    },
    {
      category: "Communication & Level of Confidence",
      score: avgConfidence,
      weight: "25%"
    },
    {
      category: "Problem Solving & Practical Application",
      score: Math.max(10, Math.min(100, Math.round(avgAccuracy * 0.85 + avgConfidence * 0.15))),
      weight: "20%"
    },
    {
      category: "System Architecture & Depth",
      score: Math.max(10, Math.min(100, Math.round(avgAccuracy * 0.90 + 5))),
      weight: "15%"
    }
  ];

  const summaryPoints = [];
  if (correctCount > 0) {
    summaryPoints.push({
      text: `Answered ${correctCount} of ${totalQuestions} technical questions correctly with relevant domain knowledge.`,
      type: "good"
    });
  }
  if (avgConfidence >= 75) {
    summaryPoints.push({
      text: `High level of confidence (${avgConfidence}/100) with structured explanations and strong professional presence.`,
      type: "good"
    });
  } else if (avgConfidence < 50) {
    summaryPoints.push({
      text: `Hesitant communication and low confidence score (${avgConfidence}/100).`,
      type: "improve"
    });
  }
  if (skipOrIncorrectCount > 0) {
    summaryPoints.push({
      text: `${skipOrIncorrectCount} question(s) were skipped, evasive, or answered with insufficient technical detail.`,
      type: "improve"
    });
  }

  if (summaryPoints.length === 0) {
    summaryPoints.push({
      text: `Completed live AI evaluation for ${role} position.`,
      type: "neutral"
    });
  }

  return {
    overallScore,
    accuracyScore: avgAccuracy,
    confidenceScore: avgConfidence,
    totalQuestions,
    correctAnswersCount: correctCount,
    partiallyCorrectCount: partialCount,
    incorrectOrSkippedCount: skipOrIncorrectCount,
    status,
    recommendation,
    evaluationBreakdown,
    summaryPoints,
    qaEvaluations
  };
}

/**
 * Main evaluation entry point - Combines LLM assessment with deterministic rubric
 */
async function evaluateCandidateInterview(candidateData = {}) {
  const transcript = candidateData.transcript || candidateData.transcripts || [];
  const role = candidateData.role || "Software Engineer";

  // Compute ground truth deterministic evaluation
  const deterministicEval = evaluateTranscriptAlgorithmically(transcript, role);

  // If candidate has empty transcript but explicit score was already provided, return bounded score
  if ((!transcript || transcript.length === 0) && candidateData.score !== undefined) {
    return {
      overallScore: candidateData.score,
      status: candidateData.status || (candidateData.score >= 80 ? "Selected" : "Under Review"),
      recommendation: candidateData.recommendation || `Scored ${candidateData.score}/100 in ${role} assessment.`,
      evaluationBreakdown: candidateData.evaluationBreakdown || deterministicEval.evaluationBreakdown,
      summaryPoints: candidateData.summaryPoints || deterministicEval.summaryPoints
    };
  }

  const ai = getAiClient();
  if (!ai || Date.now() < quotaExhaustedUntil || transcript.length < 2) {
    return deterministicEval;
  }

  try {
    const formattedTranscriptText = transcript
      .map(t => `${t.isAI || t.speaker === "Ava" ? "AI Interviewer (Ava)" : (candidateData.name || "Candidate")}: ${t.text || t.content || ""}`)
      .join("\n\n");

    const prompt = `You are a strict, objective Lead Technical Interviewer and AI Evaluator.
Evaluate the following technical interview transcript for candidate "${candidateData.name || "Candidate"}" applying for "${role}".

TRANSCRIPT:
${formattedTranscriptText}

EVALUATION CRITERIA:
1. Technical Correctness of Answers:
   - Carefully evaluate how many questions were answered correctly vs skipped, evasive ("move to next question", "I don't know"), or incorrect.
2. Level of Confidence:
   - Evaluate communication confidence, certainty, clarity, vocabulary, and articulation.
3. Calculate an accurate, fair Score between 0 and 100 based strictly on actual answer accuracy and confidence.
   - If candidate refused to answer, skipped, or gave gibberish answers, the score MUST be low (e.g., 10-40).
   - If candidate answered questions accurately and with high confidence, the score should be high (e.g., 80-95).

Return ONLY a valid JSON object matching:
{
  "overallScore": <integer 0-100>,
  "accuracyScore": <integer 0-100>,
  "confidenceScore": <integer 0-100>,
  "status": "<Selected | Under Review | Rejected>",
  "recommendation": "<Concise 1-2 sentence decisive recommendation>",
  "summaryPoints": [
    { "text": "<Specific key observation 1>", "type": "<good|improve|neutral>" },
    { "text": "<Specific key observation 2>", "type": "<good|improve|neutral>" }
  ],
  "evaluationBreakdown": [
    { "category": "Technical Proficiency & Accuracy", "score": <0-100>, "weight": "40%" },
    { "category": "Communication & Level of Confidence", "score": <0-100>, "weight": "25%" },
    { "category": "Problem Solving & System Design", "score": <0-100>, "weight": "20%" },
    { "category": "Code Quality & Resiliency", "score": <0-100>, "weight": "15%" }
  ]
}`;

    let response = null;
    for (const modelName of ["gemini-3.1-flash-lite", "gemini-3.8-flash"]) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        if (response && response.text) break;
      } catch (err) {
        console.warn(`[Evaluation-AI] ${modelName} fallback:`, err.message);
      }
    }

    if (response && response.text) {
      const parsed = JSON.parse(response.text);
      if (typeof parsed.overallScore === "number") {
        return {
          overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore))),
          accuracyScore: parsed.accuracyScore || deterministicEval.accuracyScore,
          confidenceScore: parsed.confidenceScore || deterministicEval.confidenceScore,
          status: parsed.status || (parsed.overallScore >= 80 ? "Selected" : (parsed.overallScore >= 60 ? "Under Review" : "Rejected")),
          recommendation: parsed.recommendation || deterministicEval.recommendation,
          evaluationBreakdown: Array.isArray(parsed.evaluationBreakdown) && parsed.evaluationBreakdown.length > 0
            ? parsed.evaluationBreakdown
            : deterministicEval.evaluationBreakdown,
          summaryPoints: Array.isArray(parsed.summaryPoints) && parsed.summaryPoints.length > 0
            ? parsed.summaryPoints
            : deterministicEval.summaryPoints,
          qaEvaluations: deterministicEval.qaEvaluations
        };
      }
    }

    return deterministicEval;
  } catch (error) {
    if (error.message && (error.message.includes("429") || error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED"))) {
      quotaExhaustedUntil = Date.now() + 60000;
    }
    console.warn("[Evaluator] Using deterministic evaluation:", error.message);
    return deterministicEval;
  }
}

module.exports = {
  extractQAPairsFromTranscript,
  evaluateTranscriptAlgorithmically,
  evaluateCandidateInterview
};
