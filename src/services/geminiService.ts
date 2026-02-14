
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  CoachingAnalysis, 
  CoachingMemory, 
  GeminiRequest,
  GeminiResponse 
} from '../types';
import { Move } from 'chess.js';
import { Chess } from 'chess.js';

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

  private parseFEN(fen: string): string {
    try {
      const game = new Chess(fen);
      const board = game.board();
      
      let boardDescription = 'CURRENT BOARD LAYOUT (White perspective, rank 8 to rank 1):\n\n';
      
      for (let rank = 7; rank >= 0; rank--) {
        boardDescription += `Rank ${rank + 1}: `;
        const pieces = [];
        for (let file = 0; file < 8; file++) {
          const square = board[rank][file];
          if (square) {
            const pieceNames: Record<string, string> = {
              'p': 'pawn', 'n': 'knight', 'b': 'bishop', 
              'r': 'rook', 'q': 'queen', 'k': 'king'
            };
            const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            const color = square.color === 'w' ? 'White' : 'Black';
            const piece = pieceNames[square.type];
            pieces.push(`${color} ${piece} on ${files[file]}${rank + 1}`);
          }
        }
        boardDescription += pieces.length > 0 ? pieces.join(', ') : 'empty';
        boardDescription += '\n';
      }

      // Add legal moves
      const legalMoves = game.moves();
      boardDescription += `\nLEGAL MOVES FOR WHITE: ${legalMoves.join(', ')}`;
      
      return boardDescription;
    } catch (error) {
      return 'Error parsing board position';
    }
  }

  private formatMoveHistory(moves: Move[]): string {
    if (moves.length === 0) return 'Game just started - no moves yet.';
    
    const formatted = [];
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = moves[i].san;
      const blackMove = moves[i + 1]?.san || '';
      formatted.push(`${moveNum}. ${whiteMove}${blackMove ? ' ' + blackMove : ''}`);
    }
    
    return formatted.join(' ');
  }

  private buildPrompt(request: GeminiRequest): string {
    const { fen, moveHistory, memory, lastMove } = request;
    const isOpening = moveHistory.length < 8;
    const boardLayout = this.parseFEN(fen);

    return `You are a chess coach helping a student playing WHITE pieces.

${boardLayout}

FEN NOTATION: ${fen}

GAME MOVES SO FAR: ${this.formatMoveHistory(moveHistory)}

${lastMove ? `BLACK'S LAST MOVE: ${lastMove.san} (moved from ${lastMove.from} to ${lastMove.to})` : 'WHITE moves first'}

TURN TO MOVE: WHITE (your student)

${isOpening ? `
OPENING PHASE - Recommend a strong opening move:
- Control center (e4, d4, c4, Nf3)
- Develop pieces (knights before bishops)
- Prepare castling
- DON'T suggest moves already played (check the move history above)
` : `
ANALYZE THIS POSITION:
- Look at piece placement (see board layout above)
- Find tactical opportunities (forks, pins, skewers, discovered attacks)
- Check for threats from Black
- Consider king safety
- Evaluate pawn structure
`}

IMPORTANT INSTRUCTIONS:
1. Read the board layout above carefully - see where each piece actually is
2. Choose ONE LEGAL MOVE from the legal moves list
3. Make sure you're not suggesting a move that's already been played
4. Explain why this specific move is good in THIS position
5. Consider what Black might do in response

Return ONLY this JSON format (no extra text):

{
  "bestMove": "ONE legal move from the list above (e.g., 'e4', 'Nf3', 'Bb5')",
  "explanation": "${isOpening ? 'Name the opening and explain this move (2-3 sentences)' : 'Explain why this move is best in this specific position (2-3 sentences)'}",
  "positionEvaluation": "Who is better? (e.g., 'Equal', 'White is slightly better', 'Black is winning')",
  "recommendedContinuation": ["Next 2-3 good moves for White"],
  "opponentResponseTree": [
    {
      "move": "Black's most likely response",
      "evaluation": "How good is this for Black?",
      "probability": "high/medium/low",
      "continuation": ["White's best reply"]
    }
  ],
  "tacticalAlerts": ["Any tactics White can use? Any threats from Black to watch out for?"],
  "memoryUpdate": {
    "strategicThemes": ["Key strategic ideas"],
    "priorAdvice": ["Summary of this coaching tip"],
    "tacticalFocus": ["Tactics to remember"],
    "positionEvolution": [{"evaluation": "Position status"}]
  }
}`;
  }

  private parseResponse(responseText: string): CoachingAnalysis | null {
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      if (!parsed.bestMove || !parsed.explanation) {
        console.error('Missing required fields in response:', parsed);
        throw new Error('Missing required fields');
      }

      console.log('✅ AI recommended move:', parsed.bestMove);

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
      console.error('Raw response:', responseText);
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
      console.log('🔍 Analyzing position:', request.fen);
      console.log('📋 Move count:', request.moveHistory.length);
      
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
    
    if (moveCount === 0) {
      return {
        bestMove: 'e4',
        explanation: "King's Pawn Opening - The most popular first move. Controls the center (d5 and f5 squares) and opens lines for your queen and bishop to develop.",
        positionEvaluation: 'Equal starting position',
        recommendedContinuation: ['e5', 'Nf3', 'd4'],
        opponentResponseTree: [
          {
            move: 'e5',
            evaluation: 'Most common reply, also fighting for center',
            probability: 'high',
            continuation: ['Nf3', 'Nc6', 'Bb5']
          }
        ],
        tacticalAlerts: ['This is the start - no immediate tactics, focus on development'],
        memoryUpdate: {},
      };
    }
    
    if (isOpening && moveCount === 2) {
      return {
        bestMove: 'Nf3',
        explanation: "Develop your knight toward the center. This move attacks the e5 pawn, develops a piece, and prepares castling.",
        positionEvaluation: 'Equal position',
        recommendedContinuation: ['Nc6', 'Bb5'],
        opponentResponseTree: [],
        tacticalAlerts: ['Continue developing - aim to castle within the next few moves'],
        memoryUpdate: {},
      };
    }

    return {
      bestMove: 'Continue developing',
      explanation: 'AI unavailable. Follow these principles: 1) Control the center 2) Develop knights and bishops 3) Castle your king 4) Connect your rooks',
      positionEvaluation: 'Analysis unavailable',
      recommendedContinuation: [],
      opponentResponseTree: [],
      tacticalAlerts: ['AI analysis unavailable - play solid chess'],
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
