import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  CoachingAnalysis, 
  CoachingMemory, 
  GeminiRequest,
  GeminiResponse 
} from '../types';
import { Move } from 'chess.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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

    return `You are an expert chess coach helping a student who is playing as WHITE. Your goal is to help WHITE win the game and improve their chess skills.

IMPORTANT: You are coaching the WHITE pieces. Analyze the position from WHITE's perspective and recommend the best move for WHITE to play.

CURRENT POSITION (FEN): ${fen}

MOVE HISTORY: ${this.formatMoveHistory(moveHistory)}

${lastMove ? `LAST MOVE PLAYED: ${lastMove.san} (${lastMove.from} to ${lastMove.to})` : ''}

${this.formatMemory(memory)}

YOUR ROLE: You are WHITE's coach. Recommend the best move for WHITE that will:
1. Give WHITE the best winning chances
2. Create threats against BLACK
3. Improve WHITE's position
4. Help WHITE learn important chess concepts

Provide a comprehensive coaching analysis in the following JSON format:

{
  "bestMove": "the best move for WHITE in algebraic notation (e.g., Nf3, e4, Qh5)",
  "explanation": "explain why this move is good for WHITE - what threats it creates, what it accomplishes, how it helps WHITE win (2-3 sentences)",
  "positionEvaluation": "evaluate who is better - WHITE or BLACK (e.g., 'White has a strong advantage', 'Position is equal', 'White is winning', 'Black has slight edge but White can fight back')",
  "recommendedContinuation": ["WHITE's next 2-3 moves after this recommended move - the plan for WHITE to follow"],
  "opponentResponseTree": [
    {
      "move": "BLACK's likely response to your recommendation",
      "evaluation": "how good BLACK's response is and how WHITE should continue",
      "probability": "high/medium/low",
      "continuation": ["how WHITE should respond to BLACK's move"]
    }
  ],
  "tacticalAlerts": ["warn WHITE about any threats from BLACK, and point out any tactical opportunities for WHITE to win material or checkmate"],
  "memoryUpdate": {
    "strategicThemes": ["key strategic ideas WHITE should remember"],
    "priorAdvice": ["summary of this coaching advice for WHITE"],
    "tacticalFocus": ["tactical patterns WHITE should watch for in this game"],
    "positionEvolution": [{
      "evaluation": "brief evaluation of WHITE's position"
    }]
  }
}

CRITICAL REMINDERS:
- You are coaching WHITE (the human player)
- Recommend moves that help WHITE win
- Explain how WHITE can create threats against BLACK
- Warn WHITE about BLACK's threats
- Help WHITE understand what to do next

Focus on:
1. Helping WHITE find the strongest moves
2. Explaining WHITE's strategic plans clearly
3. Identifying tactical opportunities for WHITE
4. Warning WHITE about BLACK's threats
5. Teaching WHITE chess principles to improve

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
      bestMove: 'Continue developing',
      explanation: 'Unable to analyze position at this time. Focus on controlling the center, developing your pieces, and castling your king to safety.',
      positionEvaluation: 'Analysis unavailable',
      recommendedContinuation: [],
      opponentResponseTree: [],
      tacticalAlerts: ['AI analysis temporarily unavailable - play solid chess fundamentals'],
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
