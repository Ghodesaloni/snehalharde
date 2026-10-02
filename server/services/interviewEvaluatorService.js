/**
 * Interview Evaluation & Answer Scoring Service
 * 
 * Implements candidate answer evaluation using Google AI Studio / Gemini API
 * with the required 5-parameter rubric:
 * 
 * 1. Technical correctness: 40%
 * 2. Completeness: 25%
 * 3. Relevance: 15%
 * 4. Problem-solving/reasoning: 15%
 * 5. Communication clarity: 5%
 * 
 * Evaluates the meaning, technical depth, and semantic correctness of answers
 * without requiring exact keyword matching. Supports both technical and subjective
 * questions with the same structured rubric, returning matched_points, missing_points,
 * individual scores, total_score, and constructive feedback.
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
 * Generate contextual expected concepts / rubric for a given question
 */
function generateExpectedRubric(question = "", role = "Software Engineer", context = {}) {
  const qLower = question.toLowerCase();

  if (qLower.includes("introduce") || qLower.includes("background") || qLower.includes("journey")) {
    return {
      type: "subjective_background",
      expectedConcepts: [
        "Concise summary of educational and professional background in software engineering",
        "Key technical competencies, primary languages/frameworks, and domains of interest",
        "Clear professional trajectory, passions, and motivation for the target role"
      ],
      rubricGuidance: "Evaluate self-awareness, relevant technical breadth, narrative structure, and professional communication."
    };
  }

  if (qLower.includes("motivation") || qLower.includes("idea") || qLower.includes("smart house") || qLower.includes("project")) {
    return {
      type: "subjective_project_motivation",
      expectedConcepts: [
        "Clear articulation of the real-world problem being solved and target users",
        "Underlying motivation, innovation, and technical approach to solving the problem",
        "Practical design decisions, tech stack justification, and user impact"
      ],
      rubricGuidance: "Evaluate domain insight, authenticity of project development, purpose-driven engineering, and structured explanation."
    };
  }

  if (qLower.includes("architecture") || qLower.includes("system design") || qLower.includes("tech stack")) {
    return {
      type: "technical_architecture",
      expectedConcepts: [
        "Component separation (client, server, data store, asynchronous workers/queues)",
        "Data flow, API communication protocols (REST/WebSockets/gRPC), and state management",
        "Scalability considerations, database indexing/caching, and architectural trade-offs"
      ],
      rubricGuidance: "Evaluate modularity, correctness of architectural patterns, trade-off analysis, and clarity."
    };
  }

  if (qLower.includes("roadblock") || qLower.includes("challenge") || qLower.includes("bug") || qLower.includes("hurdle")) {
    return {
      type: "problem_solving_debugging",
      expectedConcepts: [
        "Clear problem diagnosis, root cause analysis, and isolation of the bottleneck/bug",
        "Systematic debugging methodology (logging, profiling, tracing, unit reproduction)",
        "Implemented resolution, regression testing, and prevention measures"
      ],
      rubricGuidance: "Evaluate analytical reasoning, troubleshooting methodology, resilience, and actionable learnings."
    };
  }

  if (qLower.includes("testing") || qLower.includes("optimization") || qLower.includes("clean code") || qLower.includes("ci/cd")) {
    return {
      type: "engineering_rigor",
      expectedConcepts: [
        "Automated testing pyramid (unit, integration, end-to-end testing)",
        "Performance optimization (lazy loading, caching, query optimization, profiling)",
        "Maintainability, SOLID principles, code reviews, and CI/CD automation"
      ],
      rubricGuidance: "Evaluate adherence to industry standards, practical engineering hygiene, and systematic code quality."
    };
  }

  // Default technical / domain question
  return {
    type: "technical_domain",
    expectedConcepts: [
      `Accurate understanding of core concepts in ${role}`,
      "Practical implementation details and edge-case handling",
      "Correct terminology, logical reasoning, and clear explanation"
    ],
    rubricGuidance: "Evaluate semantic correctness, conceptual depth, relevance to the question, and clarity."
  };
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
      const isQuestion = text.includes("?") || 
        /^(?:could you|can you|please|walk us through|explain|describe|tell me|how do you|what is|how would you|what was|why did)\b/i.test(text);

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
      if (currentQuestion) {
        currentAnswers.push(text);
      } else {
        pairs.push({
          question: "Candidate Background & Introduction",
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
 * Calculate total score from the 5-parameter rubric
 */
function calculateRubricTotalScore(individualScores = {}) {
  const tc = Number(individualScores.technical_correctness ?? individualScores.technicalCorrectness ?? 0);
  const comp = Number(individualScores.completeness ?? 0);
  const rel = Number(individualScores.relevance ?? 0);
  const ps = Number(individualScores.problem_solving ?? individualScores.problemSolving ?? 0);
  const cc = Number(individualScores.communication_clarity ?? individualScores.communicationClarity ?? 0);

  // Weights: 40% + 25% + 15% + 15% + 5% = 100%
  const total = (tc * 0.40) + (comp * 0.25) + (rel * 0.15) + (ps * 0.15) + (cc * 0.05);
  return Math.max(0, Math.min(100, Math.round(total)));
}

/**
 * Evaluate a single candidate answer algorithmically (deterministic fallback)
 */
function evaluateAnswerAlgorithmically({ question, expectedRubric, candidateAnswer, role = "Software Engineer" }) {
  const ans = String(candidateAnswer || "").trim();
  const wordCount = ans.split(/\s+/).filter(Boolean).length;

  const skipPatterns = [
    /\b(?:move\s+to\s+(?:the\s+)?next\s+question|next\s+question|skip\s+this|pass|i\s+don'?t\s+know|no\s+idea|idk|can\s+we\s+skip)\b/i,
    /^[.\s,x0-9-]{1,5}$/i,
    /^(?:yes|no|ok|okay|yeah|nope|sure)$/i
  ];

  let isSkipped = false;
  for (const pat of skipPatterns) {
    if (pat.test(ans)) {
      isSkipped = true;
      break;
    }
  }

  if (!ans || isSkipped || wordCount < 3) {
    return {
      total_score: isSkipped ? 10 : 0,
      individual_scores: {
        technical_correctness: 0,
        completeness: 0,
        relevance: isSkipped ? 20 : 0,
        problem_solving: 0,
        communication_clarity: isSkipped ? 30 : 10
      },
      matched_points: [],
      missing_points: [
        "Candidate skipped or provided no substantive explanation for this question",
        "Missing domain depth, technical concepts, and implementation details"
      ],
      feedback: isSkipped
        ? "The candidate skipped this question without attempting an explanation."
        : "No answer or insufficient text provided to assess technical competency."
    };
  }

  const techKeywords = [
    "react", "state", "component", "hook", "node", "api", "database", "sql", "query",
    "python", "model", "pipeline", "function", "class", "async", "await", "promise",
    "scalability", "architecture", "microservices", "cache", "redis", "docker", "deploy",
    "testing", "performance", "optimization", "latency", "index", "schema", "table",
    "iot", "arduino", "hardware", "sensor", "automation", "security", "token", "auth",
    "frontend", "backend", "full stack", "git", "ci/cd", "cloud", "aws", "server",
    "modular", "throughput", "concurrency", "trade-off", "debugging", "profiling"
  ];

  const lowerAns = ans.toLowerCase();
  const matchedKeywords = techKeywords.filter(kw => lowerAns.includes(kw));
  const matchedCount = matchedKeywords.length;

  // 1. Technical Correctness (40%)
  let techCorrectness = 45;
  if (wordCount >= 30 && matchedCount >= 3) {
    techCorrectness = Math.min(100, 75 + matchedCount * 5 + (wordCount - 30) * 0.4);
  } else if (wordCount >= 15 && matchedCount >= 1) {
    techCorrectness = Math.min(75, 55 + matchedCount * 6 + (wordCount - 15) * 0.8);
  } else if (wordCount >= 8) {
    techCorrectness = Math.min(50, 30 + wordCount * 1.5);
  } else {
    techCorrectness = 25;
  }

  // 2. Completeness (25%)
  let completeness = 40;
  if (wordCount >= 45) {
    completeness = Math.min(95, 80 + (wordCount - 45) * 0.3);
  } else if (wordCount >= 25) {
    completeness = Math.min(80, 60 + (wordCount - 25) * 1.0);
  } else if (wordCount >= 10) {
    completeness = Math.min(60, 35 + (wordCount - 10) * 1.5);
  } else {
    completeness = 20;
  }

  // 3. Relevance (15%)
  let relevance = 60;
  const qWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const qMatches = qWords.filter(qw => lowerAns.includes(qw)).length;
  if (qMatches >= 2 || matchedCount >= 2) {
    relevance = Math.min(100, 75 + qMatches * 8);
  } else if (qMatches >= 1) {
    relevance = 65;
  } else {
    relevance = 40;
  }

  // 4. Problem-Solving / Reasoning (15%)
  let problemSolving = 50;
  const reasoningMarkers = /\b(?:because|the\s+reason|for\s+example|specifically|trade-off|optimized|solved|in\s+order\s+to|approach|architecture)\b/i;
  if (reasoningMarkers.test(ans) && wordCount >= 25) {
    problemSolving = Math.min(95, 70 + matchedCount * 5);
  } else if (wordCount >= 15) {
    problemSolving = Math.min(70, 50 + matchedCount * 4);
  } else {
    problemSolving = 35;
  }

  // 5. Communication Clarity (5%)
  let communicationClarity = 65;
  if (wordCount >= 20 && !/\b(?:uh+|um+|err+)\b/i.test(ans)) {
    communicationClarity = Math.min(95, 75 + Math.min(20, wordCount * 0.3));
  } else if (wordCount < 10) {
    communicationClarity = 45;
  }

  const individual_scores = {
    technical_correctness: Math.max(0, Math.min(100, Math.round(techCorrectness))),
    completeness: Math.max(0, Math.min(100, Math.round(completeness))),
    relevance: Math.max(0, Math.min(100, Math.round(relevance))),
    problem_solving: Math.max(0, Math.min(100, Math.round(problemSolving))),
    communication_clarity: Math.max(0, Math.min(100, Math.round(communicationClarity)))
  };

  const total_score = calculateRubricTotalScore(individual_scores);

  const matched_points = [];
  if (matchedKeywords.length > 0) {
    matched_points.push(`Demonstrated knowledge of ${matchedKeywords.slice(0, 4).join(", ")}.`);
  }
  if (wordCount >= 25) {
    matched_points.push("Addressed the question with structured narrative and context.");
  }
  if (reasoningMarkers.test(ans)) {
    matched_points.push("Articulated reasoning, design intent, or practical implementation decisions.");
  }
  if (matched_points.length === 0) {
    matched_points.push("Attempted direct response to the interviewer prompt.");
  }

  const missing_points = [];
  if (matchedCount < 2) {
    missing_points.push("Could incorporate more specific technical depth and concrete framework/tooling details.");
  }
  if (wordCount < 25) {
    missing_points.push("Explanation was brief; expanding on architectural trade-offs and edge cases would strengthen the answer.");
  }
  if (!reasoningMarkers.test(ans)) {
    missing_points.push("Could explicitly explain the problem-solving rationale or performance implications.");
  }

  let feedback = "";
  if (total_score >= 80) {
    feedback = "Strong, comprehensive answer demonstrating clear technical competence and well-articulated reasoning.";
  } else if (total_score >= 60) {
    feedback = "Satisfactory answer covering foundational concepts, with opportunity for greater architectural depth.";
  } else {
    feedback = "Answer was incomplete or lacked technical specificity. Needs deeper explanation of core principles.";
  }

  return {
    total_score,
    individual_scores,
    matched_points,
    missing_points,
    feedback
  };
}

/**
 * Send candidate answer, question, and expected rubric to Google Gemini API
 */
async function evaluateSingleAnswerWithGemini({
  question,
  expectedRubric,
  candidateAnswer,
  role = "Software Engineer",
  candidateName = "Candidate"
}) {
  const fallback = evaluateAnswerAlgorithmically({ question, expectedRubric, candidateAnswer, role });

  const ai = getAiClient();
  if (!ai || Date.now() < quotaExhaustedUntil || !candidateAnswer || String(candidateAnswer).trim().length < 4) {
    return fallback;
  }

  const rubric = expectedRubric || generateExpectedRubric(question, role);

  const prompt = `You are a Lead Technical Interviewer and Evaluation Expert for "${role}".
Evaluate the following candidate response to an interview question using the exact evaluation rubric below.

QUESTION:
"${question}"

EXPECTED CONCEPTS / RUBRIC:
- Question Type: ${rubric.type || "technical"}
- Expected Key Points: ${JSON.stringify(rubric.expectedConcepts || [])}
- Guidance: ${rubric.rubricGuidance || "Evaluate semantic meaning and technical correctness."}

CANDIDATE ANSWER / TRANSCRIPT:
"${candidateAnswer}"

EVALUATION RUBRIC & WEIGHTS:
1. Technical correctness (40%): Factual accuracy, domain soundness, correctness of explanations/architecture.
2. Completeness (25%): Thoroughness in addressing the question and covering essential components.
3. Relevance (15%): Direct alignment with what was asked without off-topic deviation.
4. Problem-solving/reasoning (15%): Logical reasoning, trade-offs, structured thinking, and analytical approach.
5. Communication clarity (5%): Articulation, structure, conciseness, and clear vocabulary.

INSTRUCTIONS:
- Do NOT require exact wording or rigid keywords. Evaluate the underlying MEANING, depth, and correctness.
- For subjective questions (e.g. project motivation, background, architectural choices, debugging roadblocks), use the same rubric rather than marking answers simply correct/incorrect.
- Compute "total_score" strictly as: (technical_correctness * 0.40) + (completeness * 0.25) + (relevance * 0.15) + (problem_solving * 0.15) + (communication_clarity * 0.05).
- Provide concise, actionable matched_points, missing_points, and constructive feedback.

Return ONLY a valid JSON object matching this schema:
{
  "total_score": <number 0-100>,
  "individual_scores": {
    "technical_correctness": <number 0-100>,
    "completeness": <number 0-100>,
    "relevance": <number 0-100>,
    "problem_solving": <number 0-100>,
    "communication_clarity": <number 0-100>
  },
  "matched_points": [
    "<string key concept, technology, or insight correctly addressed>"
  ],
  "missing_points": [
    "<string key concept, depth, edge-case, or detail missing or skipped>"
  ],
  "feedback": "<concise 1-2 sentence constructive feedback>"
}`;

  for (const modelName of ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash"]) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed && parsed.individual_scores) {
          const total_score = typeof parsed.total_score === "number"
            ? Math.max(0, Math.min(100, Math.round(parsed.total_score)))
            : calculateRubricTotalScore(parsed.individual_scores);

          return {
            total_score,
            individual_scores: {
              technical_correctness: Math.max(0, Math.min(100, Math.round(parsed.individual_scores.technical_correctness || 0))),
              completeness: Math.max(0, Math.min(100, Math.round(parsed.individual_scores.completeness || 0))),
              relevance: Math.max(0, Math.min(100, Math.round(parsed.individual_scores.relevance || 0))),
              problem_solving: Math.max(0, Math.min(100, Math.round(parsed.individual_scores.problem_solving || 0))),
              communication_clarity: Math.max(0, Math.min(100, Math.round(parsed.individual_scores.communication_clarity || 0)))
            },
            matched_points: Array.isArray(parsed.matched_points) && parsed.matched_points.length > 0 ? parsed.matched_points : fallback.matched_points,
            missing_points: Array.isArray(parsed.missing_points) ? parsed.missing_points : fallback.missing_points,
            feedback: parsed.feedback || fallback.feedback
          };
        }
      }
    } catch (err) {
      if (err.message && (err.message.includes("429") || err.message.includes("quota") || err.message.includes("RESOURCE_EXHAUSTED"))) {
        quotaExhaustedUntil = Date.now() + 60000;
        break;
      }
      console.warn(`[Evaluation-AI] ${modelName} single answer eval notice:`, err.message);
    }
  }

  return fallback;
}

/**
 * Deterministic full interview evaluation based on the 5-parameter rubric
 */
function evaluateTranscriptAlgorithmically(transcript = [], role = "Software Engineer") {
  const pairs = extractQAPairsFromTranscript(transcript);

  if (pairs.length === 0) {
    return {
      overallScore: 60,
      total_score: 60,
      accuracyScore: 60,
      confidenceScore: 60,
      totalQuestions: 0,
      correctAnswersCount: 0,
      partiallyCorrectCount: 0,
      incorrectOrSkippedCount: 0,
      status: "Under Review",
      recommendation: "Interview pending or minimal conversation recorded.",
      evaluationBreakdown: [
        { category: "Technical Correctness", score: 60, weight: "40%" },
        { category: "Completeness", score: 60, weight: "25%" },
        { category: "Relevance", score: 60, weight: "15%" },
        { category: "Problem-Solving & Reasoning", score: 60, weight: "15%" },
        { category: "Communication Clarity", score: 60, weight: "5%" }
      ],
      summaryPoints: [
        { text: "Minimal transcript data available for complete evaluation.", type: "neutral" }
      ],
      qaEvaluations: [],
      question_evaluations: []
    };
  }

  let sumTotal = 0;
  let sumTech = 0;
  let sumComp = 0;
  let sumRel = 0;
  let sumPs = 0;
  let sumCc = 0;
  let correctCount = 0;
  let partialCount = 0;
  let skippedCount = 0;

  const qaEvaluations = pairs.map((pair, idx) => {
    const expectedRubric = generateExpectedRubric(pair.question, role);
    const evalResult = evaluateAnswerAlgorithmically({
      question: pair.question,
      expectedRubric,
      candidateAnswer: pair.combinedAnswer,
      role
    });

    sumTotal += evalResult.total_score;
    sumTech += evalResult.individual_scores.technical_correctness;
    sumComp += evalResult.individual_scores.completeness;
    sumRel += evalResult.individual_scores.relevance;
    sumPs += evalResult.individual_scores.problem_solving;
    sumCc += evalResult.individual_scores.communication_clarity;

    if (evalResult.total_score >= 75) {
      correctCount++;
    } else if (evalResult.total_score >= 50) {
      partialCount++;
    } else {
      skippedCount++;
    }

    return {
      questionIndex: idx + 1,
      question: pair.question,
      answer: pair.combinedAnswer,
      total_score: evalResult.total_score,
      accuracyScore: evalResult.individual_scores.technical_correctness,
      confidenceScore: evalResult.individual_scores.communication_clarity,
      individual_scores: evalResult.individual_scores,
      matched_points: evalResult.matched_points,
      missing_points: evalResult.missing_points,
      feedback: evalResult.feedback,
      verdict: evalResult.total_score >= 75 ? "Correct & Comprehensive" : (evalResult.total_score >= 50 ? "Partially Correct" : "Weak / Incomplete")
    };
  });

  const totalQuestions = pairs.length;
  const avgTotal = totalQuestions > 0 ? Math.round(sumTotal / totalQuestions) : 60;
  const avgTech = totalQuestions > 0 ? Math.round(sumTech / totalQuestions) : 60;
  const avgComp = totalQuestions > 0 ? Math.round(sumComp / totalQuestions) : 60;
  const avgRel = totalQuestions > 0 ? Math.round(sumRel / totalQuestions) : 60;
  const avgPs = totalQuestions > 0 ? Math.round(sumPs / totalQuestions) : 60;
  const avgCc = totalQuestions > 0 ? Math.round(sumCc / totalQuestions) : 60;

  const overallScore = Math.max(10, Math.min(99, avgTotal));

  let status = "Under Review";
  let recommendation = "";

  if (overallScore >= 80) {
    status = "Selected";
    recommendation = `Strong hire recommendation. Candidate answered ${correctCount} of ${totalQuestions} questions with high technical depth, completeness, and structured problem solving.`;
  } else if (overallScore >= 65) {
    status = "Under Review";
    recommendation = `Candidate demonstrated moderate competency (${correctCount} strong, ${partialCount} partial out of ${totalQuestions} questions). Review recommended.`;
  } else {
    status = "Rejected";
    recommendation = `Candidate struggled to meet technical benchmarks (${skippedCount} weak/skipped out of ${totalQuestions} questions). Did not meet passing threshold.`;
  }

  const evaluationBreakdown = [
    { category: "Technical Correctness", score: avgTech, weight: "40%" },
    { category: "Completeness", score: avgComp, weight: "25%" },
    { category: "Relevance", score: avgRel, weight: "15%" },
    { category: "Problem-Solving & Reasoning", score: avgPs, weight: "15%" },
    { category: "Communication Clarity", score: avgCc, weight: "5%" }
  ];

  const summaryPoints = [];
  if (correctCount > 0) {
    summaryPoints.push({
      text: `Answered ${correctCount} of ${totalQuestions} technical questions correctly with relevant domain knowledge.`,
      type: "good"
    });
  }
  if (avgTech >= 75) {
    summaryPoints.push({
      text: `High technical correctness (${avgTech}/100) across domain-specific architectures and principles.`,
      type: "good"
    });
  }
  if (avgCc >= 75) {
    summaryPoints.push({
      text: `High communication clarity (${avgCc}/100) with well-structured explanations.`,
      type: "good"
    });
  } else if (avgCc < 50) {
    summaryPoints.push({
      text: `Communication clarity score (${avgCc}/100) indicates hesitant or unstructured phrasing.`,
      type: "improve"
    });
  }
  if (skippedCount > 0) {
    summaryPoints.push({
      text: `${skippedCount} question(s) were skipped, evasive, or answered with insufficient technical detail.`,
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
    total_score: overallScore,
    accuracyScore: avgTech,
    confidenceScore: avgCc,
    totalQuestions,
    correctAnswersCount: correctCount,
    partiallyCorrectCount: partialCount,
    incorrectOrSkippedCount: skippedCount,
    status,
    recommendation,
    evaluationBreakdown,
    summaryPoints,
    qaEvaluations,
    question_evaluations: qaEvaluations
  };
}

/**
 * Main evaluation entry point - Evaluates candidate interview with Gemini
 * using the 5-parameter rubric for every question and aggregated total
 */
async function evaluateCandidateInterview(candidateData = {}) {
  const transcript = candidateData.transcript || candidateData.transcripts || [];
  const role = candidateData.role || "Software Engineer";
  const candidateName = candidateData.name || candidateData.candidateName || "Candidate";

  const deterministicEval = evaluateTranscriptAlgorithmically(transcript, role);

  if ((!transcript || transcript.length === 0) && candidateData.score !== undefined) {
    return {
      overallScore: candidateData.score,
      total_score: candidateData.score,
      status: candidateData.status || (candidateData.score >= 80 ? "Selected" : "Under Review"),
      recommendation: candidateData.recommendation || `Scored ${candidateData.score}/100 in ${role} assessment.`,
      evaluationBreakdown: candidateData.evaluationBreakdown || deterministicEval.evaluationBreakdown,
      summaryPoints: candidateData.summaryPoints || deterministicEval.summaryPoints,
      qaEvaluations: deterministicEval.qaEvaluations,
      question_evaluations: deterministicEval.question_evaluations
    };
  }

  const ai = getAiClient();
  if (!ai || Date.now() < quotaExhaustedUntil || transcript.length < 2) {
    return deterministicEval;
  }

  const pairs = extractQAPairsFromTranscript(transcript);
  if (pairs.length === 0) {
    return deterministicEval;
  }

  try {
    // Evaluate each question with Gemini asynchronously
    const evaluatedPairs = await Promise.all(
      pairs.map(async (pair, idx) => {
        const rubric = generateExpectedRubric(pair.question, role);
        const evalRes = await evaluateSingleAnswerWithGemini({
          question: pair.question,
          expectedRubric: rubric,
          candidateAnswer: pair.combinedAnswer,
          role,
          candidateName
        });

        return {
          questionIndex: idx + 1,
          question: pair.question,
          answer: pair.combinedAnswer,
          total_score: evalRes.total_score,
          accuracyScore: evalRes.individual_scores.technical_correctness,
          confidenceScore: evalRes.individual_scores.communication_clarity,
          individual_scores: evalRes.individual_scores,
          matched_points: evalRes.matched_points,
          missing_points: evalRes.missing_points,
          feedback: evalRes.feedback,
          verdict: evalRes.total_score >= 75 ? "Correct & Comprehensive" : (evalRes.total_score >= 50 ? "Partially Correct" : "Weak / Incomplete")
        };
      })
    );

    let sumTotal = 0;
    let sumTech = 0;
    let sumComp = 0;
    let sumRel = 0;
    let sumPs = 0;
    let sumCc = 0;
    let correctCount = 0;
    let partialCount = 0;
    let skippedCount = 0;

    for (const ep of evaluatedPairs) {
      sumTotal += ep.total_score;
      sumTech += ep.individual_scores.technical_correctness;
      sumComp += ep.individual_scores.completeness;
      sumRel += ep.individual_scores.relevance;
      sumPs += ep.individual_scores.problem_solving;
      sumCc += ep.individual_scores.communication_clarity;

      if (ep.total_score >= 75) correctCount++;
      else if (ep.total_score >= 50) partialCount++;
      else skippedCount++;
    }

    const totalQuestions = evaluatedPairs.length;
    const avgTotal = totalQuestions > 0 ? Math.round(sumTotal / totalQuestions) : deterministicEval.overallScore;
    const avgTech = totalQuestions > 0 ? Math.round(sumTech / totalQuestions) : deterministicEval.accuracyScore;
    const avgComp = totalQuestions > 0 ? Math.round(sumComp / totalQuestions) : 60;
    const avgRel = totalQuestions > 0 ? Math.round(sumRel / totalQuestions) : 60;
    const avgPs = totalQuestions > 0 ? Math.round(sumPs / totalQuestions) : 60;
    const avgCc = totalQuestions > 0 ? Math.round(sumCc / totalQuestions) : deterministicEval.confidenceScore;

    const overallScore = Math.max(10, Math.min(99, avgTotal));

    let status = "Under Review";
    let recommendation = "";

    if (overallScore >= 80) {
      status = "Selected";
      recommendation = `Strong hire recommendation. Candidate answered ${correctCount} of ${totalQuestions} questions with high technical depth, completeness, and structured problem solving.`;
    } else if (overallScore >= 65) {
      status = "Under Review";
      recommendation = `Candidate demonstrated moderate technical competency (${correctCount} strong, ${partialCount} partial out of ${totalQuestions} questions). Review recommended.`;
    } else {
      status = "Rejected";
      recommendation = `Candidate struggled to meet technical benchmarks (${skippedCount} weak/skipped out of ${totalQuestions} questions). Did not meet passing threshold.`;
    }

    const evaluationBreakdown = [
      { category: "Technical Correctness", score: avgTech, weight: "40%" },
      { category: "Completeness", score: avgComp, weight: "25%" },
      { category: "Relevance", score: avgRel, weight: "15%" },
      { category: "Problem-Solving & Reasoning", score: avgPs, weight: "15%" },
      { category: "Communication Clarity", score: avgCc, weight: "5%" }
    ];

    const summaryPoints = [];
    if (correctCount > 0) {
      summaryPoints.push({
        text: `Answered ${correctCount} of ${totalQuestions} technical questions correctly with relevant domain knowledge.`,
        type: "good"
      });
    }
    if (avgTech >= 75) {
      summaryPoints.push({
        text: `High technical correctness (${avgTech}/100) across domain-specific architectures and principles.`,
        type: "good"
      });
    }
    if (avgCc >= 75) {
      summaryPoints.push({
        text: `High communication clarity (${avgCc}/100) with well-structured explanations.`,
        type: "good"
      });
    } else if (avgCc < 50) {
      summaryPoints.push({
        text: `Communication clarity score (${avgCc}/100) indicates hesitant or unstructured phrasing.`,
        type: "improve"
      });
    }
    if (skippedCount > 0) {
      summaryPoints.push({
        text: `${skippedCount} question(s) were skipped, evasive, or answered with insufficient technical detail.`,
        type: "improve"
      });
    }

    return {
      overallScore,
      total_score: overallScore,
      accuracyScore: avgTech,
      confidenceScore: avgCc,
      totalQuestions,
      correctAnswersCount: correctCount,
      partiallyCorrectCount: partialCount,
      incorrectOrSkippedCount: skippedCount,
      status,
      recommendation,
      evaluationBreakdown,
      summaryPoints,
      qaEvaluations: evaluatedPairs,
      question_evaluations: evaluatedPairs
    };
  } catch (error) {
    if (error.message && (error.message.includes("429") || error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED"))) {
      quotaExhaustedUntil = Date.now() + 60000;
    }
    console.warn("[Evaluator] Error in Gemini interview evaluation, using deterministic fallback:", error.message);
    return deterministicEval;
  }
}

module.exports = {
  generateExpectedRubric,
  calculateRubricTotalScore,
  evaluateSingleAnswerWithGemini,
  evaluateAnswerAlgorithmically,
  extractQAPairsFromTranscript,
  evaluateTranscriptAlgorithmically,
  evaluateCandidateInterview
};
