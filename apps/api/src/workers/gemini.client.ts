import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env';

const MODEL_NAME = 'gemini-2.5-flash';

const JSON_ONLY_INSTRUCTION =
  'IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation. ' +
  'The JSON must have exactly two keys: "sections" (array) and "answerKey" (array).';

let _model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

function getModel(): ReturnType<GoogleGenerativeAI['getGenerativeModel']> {
  if (!_model) {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    _model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }
  return _model;
}

export async function generate(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return text;
}

export async function generateStrict(prompt: string): Promise<string> {
  const strictPrompt = `${JSON_ONLY_INSTRUCTION}\n\n${prompt}`;
  return generate(strictPrompt);
}
