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
    if (moves.length === 0) return 'Game just started - no moves yet.';
    
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
Strategic Themes: ${memory.strategicThemes.join(', ') || 'First game - no themes yet'}
Prior Advice: ${memory.priorAdvice.slice(-3).join(' | ') || 'First analysis'}
Tactical Focus: ${memory.tacticalFocus.join(', ') || 'Watch for tactics'}
    `.trim();
  }

  private buildPrompt(request: GeminiRequest): string {
    const { fen, moveHistory, memory, lastMove } = request;
    const isOpening = moveHistory.length < 8;

    return `You are a chess coach helping a student playing WHITE. Analyze the CURRENT board position and tell WHITE what move to make NOW.

CURRENT BOARD POSITION (FEN): ${fen}

THIS IS THE CURRENT POSITION - READ IT CAREFULLY. Check which pieces are where NOW.

GAME PROGRESS: ${this.formatMoveHistory(moveHistory)}

${lastMove ? `OPPONENT'S LAST MOVE: Black just played ${lastMove.san} (${lastMove.from} → ${lastMove.to})` : 'Game starting - White to move first'}

${this.formatMemory(memory)}

YOUR TASK: Look at the CURRENT position (FEN above) and recommend the BEST NEXT MOVE for White.

${isOpening ? `
OPENING PHASE: This is the opening. Suggest a strong opening move with its name.
Focus on: controlling center (e4, d4), developing pieces (Nf3, Nc3, Bc4, Bf4), preparing castling.
` : `
MIDDLE/ENDGAME: Analyze the current position carefully.
Look for: tactics, threats, piece activity, king safety, pawn structure.
`}

Return your analysis as JSON:

{
  "bestMove": "ONE move in algebraic notation (e.g., 'e4', 'Nf3', 'Qh5+', 'O-O')",
  "explanation": "${isOpening ? 'Name this opening move and explain why it\'s strong (e.g., "King\'s Pawn Opening - controls center and frees bishop and queen")' : 'Explain why this move is best NOW - what does it accomplish? What threats does it create?'}",
  "positionEvaluation": "Who is better after this move? (e.g., 'Equal position', 'White is slightly better', 'White has winning advantage')",
  "recommendedContinuation": ["Next 2-3 moves White should consider after this"],
  "opponentResponseTree": [
    {
      "move": "Most likely Black response",
      "evaluation": "Is this good for Black?",
      "probability": "high/medium/low",
      "continuation": ["How White should respond"]
    }
  ],
  "tacticalAlerts": ["Any immediate threats from Black? Any tactics White can use? (e.g., 'Watch out for Black's pin on f3', 'You can fork the king and rook with Nd5')"],
  "memoryUpdate": {
    "strategicThemes": ["Key ideas from this position"],
    "priorAdvice": ["One-line summary of this advice"],
    "tacticalFocus": ["Patterns to watch for"],
    "positionEvolution": [{
      "evaluation": "Brief position status"
    }]
  }
}

CRITICAL RULES:
1. Recommend only ONE move that White should play RIGHT NOW
2. Make sure this move is LEGAL in the current position
3. Don't repeat moves already played - check the FEN and move history
4. Be specific and practical
5. Focus on what helps White WIN

Return ONLY the JSON, nothing else.`;
  }

  private parseResponse(responseText: string): CoachingAnalysis | null {
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

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
        analysis: this.getFallbackAnalysis(request.moveHistory.length),
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
          analysis: this.getFallbackAnalysis(request.moveHistory.length),
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
        analysis: this.getFallbackAnalysis(request.moveHistory.length),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getFallbackAnalysis(moveCount: number): CoachingAnalysis {
    const isOpening = moveCount < 8;
    
    if (isOpening) {
      return {
        bestMove: moveCount === 0 ? 'e4' : 'Nf3',
        explanation: moveCount === 0 
          ? "King's Pawn Opening (e4) - The most popular opening move. Controls the center and frees your bishop and queen."
          : "Develop your knight to f3 - Controls center squares and prepares castling.",
        positionEvaluation: 'Equal position',
        recommendedContinuation: moveCount === 0 ? ['e5', 'Nf3', 'd4'] : ['d4', 'Bc4'],
        opponentResponseTree: [],
        tacticalAlerts: ['AI analysis temporarily unavailable - follow opening principles'],
        memoryUpdate: {},
      };
    }

    return {
      bestMove: 'Continue developing',
      explanation: 'Unable to analyze. Focus on: 1) Develop all pieces, 2) Control center, 3) Castle your king, 4) Connect your rooks.',
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
