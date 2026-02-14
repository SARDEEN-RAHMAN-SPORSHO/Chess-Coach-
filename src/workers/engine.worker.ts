import { Chess } from 'chess.js';
import type { EngineEvaluation, EngineMessage } from '../types';

// Simple chess engine using minimax with alpha-beta pruning
class ChessEngine {
  private readonly PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000,
  };

  private readonly POSITION_WEIGHTS = {
    p: [
      0, 0, 0, 0, 0, 0, 0, 0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
      5, 5, 10, 25, 25, 10, 5, 5,
      0, 0, 0, 20, 20, 0, 0, 0,
      5, -5, -10, 0, 0, -10, -5, 5,
      5, 10, 10, -20, -20, 10, 10, 5,
      0, 0, 0, 0, 0, 0, 0, 0,
    ],
    n: [
      -50, -40, -30, -30, -30, -30, -40, -50,
      -40, -20, 0, 0, 0, 0, -20, -40,
      -30, 0, 10, 15, 15, 10, 0, -30,
      -30, 5, 15, 20, 20, 15, 5, -30,
      -30, 0, 15, 20, 20, 15, 0, -30,
      -30, 5, 10, 15, 15, 10, 5, -30,
      -40, -20, 0, 5, 5, 0, -20, -40,
      -50, -40, -30, -30, -30, -30, -40, -50,
    ],
    b: [
      -20, -10, -10, -10, -10, -10, -10, -20,
      -10, 0, 0, 0, 0, 0, 0, -10,
      -10, 0, 5, 10, 10, 5, 0, -10,
      -10, 5, 5, 10, 10, 5, 5, -10,
      -10, 0, 10, 10, 10, 10, 0, -10,
      -10, 10, 10, 10, 10, 10, 10, -10,
      -10, 5, 0, 0, 0, 0, 5, -10,
      -20, -10, -10, -10, -10, -10, -10, -20,
    ],
    r: [
      0, 0, 0, 0, 0, 0, 0, 0,
      5, 10, 10, 10, 10, 10, 10, 5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      0, 0, 0, 5, 5, 0, 0, 0,
    ],
    q: [
      -20, -10, -10, -5, -5, -10, -10, -20,
      -10, 0, 0, 0, 0, 0, 0, -10,
      -10, 0, 5, 5, 5, 5, 0, -10,
      -5, 0, 5, 5, 5, 5, 0, -5,
      0, 0, 5, 5, 5, 5, 0, -5,
      -10, 5, 5, 5, 5, 5, 0, -10,
      -10, 0, 5, 0, 0, 0, 0, -10,
      -20, -10, -10, -5, -5, -10, -10, -20,
    ],
    k: [
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20,
      -10, -20, -20, -20, -20, -20, -20, -10,
      20, 20, 0, 0, 0, 0, 20, 20,
      20, 30, 10, 0, 0, 10, 30, 20,
    ],
  };

  evaluatePosition(game: Chess): number {
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? -999999 : 999999;
    }
    if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
      return 0;
    }

    let score = 0;
    const board = game.board();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const pieceValue = this.PIECE_VALUES[piece.type];
          const positionIndex = piece.color === 'w' ? row * 8 + col : (7 - row) * 8 + col;
          const positionValue = this.POSITION_WEIGHTS[piece.type][positionIndex];
          
          const value = pieceValue + positionValue;
          score += piece.color === 'w' ? value : -value;
        }
      }
    }

    return score;
  }

  minimax(
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: boolean
  ): number {
    if (depth === 0 || game.isGameOver()) {
      return this.evaluatePosition(game);
    }

    const moves = game.moves({ verbose: true });

    if (maximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of moves) {
        game.move(move);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, false);
        game.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        game.move(move);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, true);
        game.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  findBestMove(fen: string, depth: number = 3): EngineEvaluation | null {
    const game = new Chess(fen);
    const moves = game.moves({ verbose: true });

    if (moves.length === 0) return null;

    let bestMove = moves[0];
    let bestScore = -Infinity;
    const maximizing = game.turn() === 'w';

    for (const move of moves) {
      game.move(move);
      const score = this.minimax(
        game,
        depth - 1,
        -Infinity,
        Infinity,
        !maximizing
      );
      game.undo();

      if (maximizing ? score > bestScore : score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    // Only include promotion if it's a valid promotion piece
    const promotion = bestMove.promotion && ['q', 'r', 'b', 'n'].includes(bestMove.promotion) 
      ? (bestMove.promotion as 'q' | 'r' | 'b' | 'n')
      : undefined;

    return {
      move: {
        from: bestMove.from,
        to: bestMove.to,
        promotion,
      },
      score: bestScore,
      depth,
    };
  }
}

// Worker message handler
const engine = new ChessEngine();

self.addEventListener('message', (event: MessageEvent) => {
  const { type, data } = event.data;

  try {
    if (type === 'calculate') {
      const { fen, depth } = data;
      const evaluation = engine.findBestMove(fen, depth || 3);

      if (evaluation) {
        const message: EngineMessage = {
          type: 'move',
          data: evaluation.move,
        };
        self.postMessage(message);
      } else {
        const message: EngineMessage = {
          type: 'error',
          data: 'No valid moves available',
        };
        self.postMessage(message);
      }
    } else if (type === 'init') {
      const message: EngineMessage = {
        type: 'ready',
      };
      self.postMessage(message);
    }
  } catch (error) {
    const message: EngineMessage = {
      type: 'error',
      data: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(message);
  }
});

// Signal that worker is ready
const readyMessage: EngineMessage = {
  type: 'ready',
};
self.postMessage(readyMessage);

export {};
