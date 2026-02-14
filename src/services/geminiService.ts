import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  CoachingAnalysis, 
  CoachingMemory, 
  GeminiRequest,
  GeminiResponse 
} from '../types';
import { Move } from 'chess.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export class GeminiService {
  private ai: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized = false;

  constructor() {
    if (!API_KEY) {
      console.warn('Gemini API key not found');
      return;
    }

    try {
      this.ai = new GoogleGenerativeAI(API_KEY);
      this.model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Gemini:', error);
    }
  }

  private formatMoveHistory(moves: Move[]): string {
    if (moves.length === 0) return 'No moves yet.';
    
    return moves
      .map((move, index) => {
        const moveNumber = Math.floor(index / 2) + 1;
        const isWhite = index % 2 === 0;
        return isWhite 
          ? `${moveNumber}. ${move.san}` 
          : `${move.san}`;
      })
      .join(' ');
  }

  private formatMemory(memory: CoachingMemory): string {
    return `
COACHING MEMORY:
Strategic Themes: ${memory.strategicThemes.join(', ') || 'None yet'}
Prior Advice: ${memory.priorAdvice.slice(-3).join(' | ') || 'None yet'}
Tactical Focus: ${memory.tacticalFocus.join(', ') || 'None yet'}
Position History: ${memory.positionEvolution.length} positions tracked
Last Updated: ${new Date(memory.lastUpdated).toLocaleTimeString()}
    `.trim();
  }

  private buildPrompt(request: GeminiRequest): string {
    const { fen, moveHistory, memory, lastMove } = request;

    return `You are an expert chess coach analyzing a game in real-time. Provide strategic guidance to help the player improve.

CURRENT POSITION (FEN): ${fen}

MOVE HISTORY: ${this.formatMoveHistory(moveHistory)}

${lastMove ? `LAST MOVE: ${lastMove.san} (${lastMove.from} to ${lastMove.to})` : ''}

${this.formatMemory(memory)}

Provide a comprehensive coaching analysis in the following JSON format:

{
  "bestMove": "recommended move in algebraic notation (e.g., Nf3, e4)",
  "explanation": "clear explanation of why this move is strong (2-3 sentences)",
  "positionEvaluation": "brief evaluation of the position (e.g., 'White has slight advantage', 'Equal position', 'Black is winning')",
  "recommendedContinuation": ["next 2-3 moves after your recommendation"],
  "opponentResponseTree": [
    {
      "move": "likely opponent response",
      "evaluation": "how good this response is",
      "probability": "high/medium/low",
      "continuation": ["possible next moves"]
    }
  ],
  "tacticalAlerts": ["specific tactical threats or opportunities to note"],
  "memoryUpdate": {
    "strategicThemes": ["key themes to remember from this position"],
    "priorAdvice": ["summary of this coaching moment"],
    "tacticalFocus": ["tactical patterns to watch for"],
    "positionEvolution": [{
      "evaluation": "brief position summary"
    }]
  }
}

Focus on:
1. Practical, actionable advice
2. Explaining strategic concepts clearly
3. Identifying tactical opportunities
4. Building on previous coaching points
5. Helping the player understand patterns

Return ONLY valid JSON, no additional text.`;
  }

  private parseResponse(responseText: string): CoachingAnalysis | null {
    try {
      // Remove markdown code blocks if present
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      // Validate required fields
      if (!parsed.bestMove || !parsed.explanation) {
        throw new Error('Missing required fields');
      }

      return {
        bestMove: parsed.bestMove,
        explanation: parsed.explanation,
        positionEvaluation: parsed.positionEvaluation || 'Position unclear',
        recommendedContinuation: parsed.recommendedContinuation || [],
        opponentResponseTree: parsed.opponentResponseTree || [],
        tacticalAlerts: parsed.tacticalAlerts || [],
        memoryUpdate: parsed.memoryUpdate || {},
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return null;
    }
  }

  async analyzePosition(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.isInitialized || !this.model) {
      return {
        analysis: this.getFallbackAnalysis(),
        success: false,
        error: 'Gemini service not initialized',
      };
    }

    try {
      const prompt = this.buildPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const analysis = this.parseResponse(text);

      if (!analysis) {
        return {
          analysis: this.getFallbackAnalysis(),
          success: false,
          error: 'Failed to parse response',
        };
      }

      return {
        analysis,
        success: true,
      };
    } catch (error) {
      console.error('Gemini analysis error:', error);
      return {
        analysis: this.getFallbackAnalysis(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getFallbackAnalysis(): CoachingAnalysis {
    return {
      bestMove: 'Continue playing',
      explanation: 'Unable to analyze position at this time. Focus on controlling the center and developing your pieces.',
      positionEvaluation: 'Analysis unavailable',
      recommendedContinuation: [],
      opponentResponseTree: [],
      tacticalAlerts: ['AI analysis temporarily unavailable'],
      memoryUpdate: {},
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.isInitialized || !this.model) return false;

    try {
      const result = await this.model.generateContent('Say "ready"');
      const response = await result.response;
      return !!response.text();
    } catch {
      return false;
    }
  }
}

// Singleton instance
let geminiInstance: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
  if (!geminiInstance) {
    geminiInstance = new GeminiService();
  }
  return geminiInstance;
};
