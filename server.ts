import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-Side Gemini AI Initialization helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: AI-Powered Question Generation
app.post('/api/ai/generate-questions', async (req, res) => {
  try {
    const { topicName, subjectName, targetDifficulty = 500, count = 3, focusConcepts } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. AI generation is currently in offline fallback mode.',
        isFallback: true,
      });
    }

    const tier = targetDifficulty < 350 ? 'Novice' : targetDifficulty < 550 ? 'Intermediate' : targetDifficulty < 700 ? 'Proficient' : targetDifficulty < 850 ? 'Advanced' : 'Master';

    const prompt = `You are an expert psychometric item writer and domain educator.
Generate ${count} calibrated, high-quality multiple choice question(s) for the topic "${topicName}" in the subject "${subjectName}".
Target difficulty rating: ${targetDifficulty} out of 1000 (${tier} level).
${focusConcepts ? `Special focus concepts: ${focusConcepts}` : ''}

Calibration Guide for Difficulty (0-1000):
- 100-350 (Novice): Direct recall, foundational definitions, single-step computation.
- 350-550 (Intermediate): 2-step reasoning, straightforward application of formulas or concepts.
- 550-700 (Proficient): Multi-step problem solving, synthesis, edge cases, deeper conceptual understanding.
- 700-850 (Advanced): Complex analytical problem solving, non-trivial deductions, cross-concept combinations.
- 850-1000 (Master): Rigorous theoretical proofs, deceptive distractors, deep domain mastery.

Ensure each question has:
- 4 clear options (ids 'a', 'b', 'c', 'd') with plausible, thoughtful distractors reflecting common student misconceptions.
- Exactly one unequivocally correct option.
- Detailed step-by-step conceptual explanation.
- Helpful 1-sentence Socratic hint that guides without giving away the answer.
- Accurate calibrated difficulty score within ±40 of ${targetDifficulty}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: 'The question text or problem statement' },
              codeSnippet: { type: Type.STRING, description: 'Optional code block or formula if relevant' },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: 'Option identifier (a, b, c, or d)' },
                    text: { type: Type.STRING, description: 'Option display text' },
                  },
                  required: ['id', 'text'],
                },
              },
              correctOptionId: { type: Type.STRING, description: 'The id of the correct option (a, b, c, or d)' },
              explanation: { type: Type.STRING, description: 'Thorough explanation of why the correct answer is right and why distractors are wrong' },
              hint: { type: Type.STRING, description: 'A helpful conceptual hint' },
              difficulty: { type: Type.INTEGER, description: 'Calibrated difficulty between 0 and 1000' },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Sub-topic conceptual tags',
              },
            },
            required: ['text', 'options', 'correctOptionId', 'explanation', 'hint', 'difficulty'],
          },
        },
      },
    });

    const questions = JSON.parse(response.text || '[]');
    res.json({ questions });
  } catch (error: any) {
    console.error('Error generating questions with Gemini:', error);
    res.status(500).json({ error: error.message || 'Failed to generate questions' });
  }
});

// Endpoint: AI Question Explanation & Socratic Guidance
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { questionText, options, correctOptionId, selectedOptionId, topicName } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured.',
        isFallback: true,
      });
    }

    const prompt = `You are a world-class tutor in "${topicName}".
Provide a clear, pedagogical breakdown of the following question:

Question: ${questionText}
Options: ${JSON.stringify(options)}
Correct Option ID: ${correctOptionId}
${selectedOptionId ? `The student selected option ID: ${selectedOptionId}` : ''}

Break down your response into:
1. "stepByStep": Array of 2 to 4 clear logical steps to reach the correct answer.
2. "keyTakeaway": A memorable 1-2 sentence core mental model rule.
3. "misconceptionAnalysis": If a student picked the wrong option, why is that an intuitive mistake and how to avoid it?
4. "socraticFollowUp": A quick thought-provoking follow-up question to cement their learning.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stepByStep: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            keyTakeaway: { type: Type.STRING },
            misconceptionAnalysis: { type: Type.STRING },
            socraticFollowUp: { type: Type.STRING },
          },
          required: ['stepByStep', 'keyTakeaway', 'misconceptionAnalysis', 'socraticFollowUp'],
        },
      },
    });

    const explanationData = JSON.parse(response.text || '{}');
    res.json(explanationData);
  } catch (error: any) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: error.message || 'Failed to generate explanation' });
  }
});

// Endpoint: AI Learning-Gap Identification & Personalized Practice Plan
app.post('/api/ai/diagnose-gaps', async (req, res) => {
  try {
    const { learnerName, subjectName, abilityScore, answers, topicMasteries } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured.',
        isFallback: true,
      });
    }

    const prompt = `You are an adaptive educational psychometrician and personalized learning coach.
Analyze the test session results for learner "${learnerName}" in subject "${subjectName}".
Learner Ability Rating: ${abilityScore} / 1000.

Topic Masteries:
${JSON.stringify(topicMasteries, null, 2)}

Session Question History:
${JSON.stringify(
  answers.map((a: any) => ({
    topic: a.topicName,
    difficulty: a.difficulty,
    isCorrect: a.isCorrect,
    timeSpentSec: Math.round(a.timeSpentMs / 1000),
    questionPreview: a.question?.text?.substring(0, 80) || '',
  })),
  null,
  2
)}

Provide an insightful diagnostic evaluation:
1. Executive summary of learner performance and speed-accuracy trade-offs.
2. 2-3 specific strengths with topic evidence.
3. 2-3 identified conceptual bottlenecks or root learning gaps (e.g. struggles when fractions involve cross-multiplication under time pressure).
4. 3 actionable, prioritized learning recommendations.
5. A 3-step targeted remediation drill plan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            remediationPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  recommendedFocus: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                },
                required: ['step', 'topic', 'recommendedFocus', 'estimatedMinutes'],
              },
            },
          },
          required: ['summary', 'strengths', 'weaknesses', 'recommendedActions', 'remediationPlan'],
        },
      },
    });

    const diagnostic = JSON.parse(response.text || '{}');
    res.json(diagnostic);
  } catch (error: any) {
    console.error('Error diagnosing gaps:', error);
    res.status(500).json({ error: error.message || 'Failed to diagnose gaps' });
  }
});

// Endpoint: AI Question Difficulty Classifier
app.post('/api/ai/classify', async (req, res) => {
  try {
    const { questionText, subjectName = 'General' } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured.',
        isFallback: true,
      });
    }

    const prompt = `Analyze this question in ${subjectName} and classify its psychometric difficulty:
Question: "${questionText}"

Return estimated difficulty score (0-1000), difficulty tier (Novice/Intermediate/Proficient/Advanced/Master), Bloom's taxonomy cognitive level (Remember/Understand/Apply/Analyze/Evaluate/Create), and prerequisite concepts.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedDifficulty: { type: Type.INTEGER },
            difficultyTier: { type: Type.STRING },
            bloomsTaxonomy: { type: Type.STRING },
            prerequisiteConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING },
          },
          required: ['estimatedDifficulty', 'difficultyTier', 'bloomsTaxonomy', 'prerequisiteConcepts', 'reasoning'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (error: any) {
    console.error('Error classifying difficulty:', error);
    res.status(500).json({ error: error.message || 'Failed to classify difficulty' });
  }
});

// Endpoint: AI-Powered Full Question Bank Batch Generation
app.post('/api/ai/generate-bank', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        isFallback: true,
      });
    }

    const { count = 12 } = req.body;

    const prompt = `You are an elite psychometric test designer.
Generate ${count} completely novel, diverse, and rigorous multiple choice questions for an adaptive learning platform.
Spread the questions evenly across:
1. Mathematics (topics: 'math_fractions' Fractions & Ratios, 'math_algebra' Algebra & Equations, 'math_geometry' Geometry & Trigonometry, 'math_statistics' Statistics & Probability, 'math_calculus' Calculus Basics). Subject ID: 'math', Subject Name: 'Mathematics'.
2. Computer Science (topics: 'cs_dsa' Data Structures, 'cs_algorithms' Algorithms & Big-O, 'cs_databases' Databases & SQL, 'cs_systems' Systems & Networks). Subject ID: 'cs', Subject Name: 'Computer Science'.
3. Natural Sciences (topics: 'sci_physics' Physics & Mechanics, 'sci_chemistry' Chemistry & Reactions, 'sci_biology' Biology & Genetics). Subject ID: 'science', Subject Name: 'Natural Sciences'.

Span the difficulties from Novice (150-349), Intermediate (350-549), Proficient (550-699), Advanced (700-849), to Master (850-980).
Ensure distinct question texts, mathematically correct calculations, 4 options ('a', 'b', 'c', 'd'), clear explanation, and a helpful hint.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subjectId: { type: Type.STRING, description: 'math, cs, or science' },
              topicId: { type: Type.STRING, description: 'specific topic id like math_algebra, cs_dsa, sci_physics' },
              topicName: { type: Type.STRING, description: 'human readable topic name' },
              difficulty: { type: Type.INTEGER, description: 'calibrated difficulty score from 100 to 1000' },
              text: { type: Type.STRING, description: 'the complete question problem statement' },
              codeSnippet: { type: Type.STRING, description: 'optional code snippet or equation' },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: 'a, b, c, or d' },
                    text: { type: Type.STRING, description: 'option text' },
                  },
                  required: ['id', 'text'],
                },
              },
              correctOptionId: { type: Type.STRING, description: 'the correct option id: a, b, c, or d' },
              explanation: { type: Type.STRING, description: 'in-depth pedagogical explanation' },
              hint: { type: Type.STRING, description: '1-sentence conceptual hint' },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['subjectId', 'topicId', 'topicName', 'difficulty', 'text', 'options', 'correctOptionId', 'explanation', 'hint'],
          },
        },
      },
    });

    const questions = JSON.parse(response.text || '[]');
    res.json({ questions });
  } catch (error: any) {
    console.error('Error generating question bank:', error);
    res.status(500).json({ error: error.message || 'Failed to generate bank' });
  }
});

// Setup Vite middleware / Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Adaptive Quiz Engine server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
