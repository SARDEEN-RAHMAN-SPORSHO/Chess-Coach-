import { create } from 'zustand';
import { Chess, Square } from 'chess.js';
import type { GameStore, GameState, CoachingMemory, CoachingAnalysis, UIState } from '../types';
import { getEngine } from '../services/engineService';
import { getGeminiService } from '../services/geminiService';
import { getDatabaseService } from '../services/databaseService';

const initialMemory: CoachingMemory = {
  strategicThemes: [],
  priorAdvice: [],
  tacticalFocus: [],
  positionEvolution: [],
  lastUpdated: Date.now(),
};

const getGameState = (game: Chess): GameState => ({
  fen: game.fen(),
  pgn: game.pgn(),
  turn: game.turn(),
  isCheck: game.isCheck(),
  isCheckmate: game.isCheckmate(),
  isStalemate: game.isStalemate(),
  isDraw: game.isDraw(),
  isGameOver: game.isGameOver(),
  moveHistory: game.history({ verbose: true }),
});

export const useGameStore = create<GameStore>((set, get) => ({
  game: new Chess(),
  gameState: getGameState(new Chess()),
  memory: initialMemory,
  currentAnalysis: null,
  uiState: {
    isLoading: false,
    isAnalyzing: false,
    isEngineThinking: false,
    error: null,
    notification: null,
  },

  makeMove: async (from: Square, to: Square, promotion?: string) => {
    const { game, memory } = get();

    try {
      // Attempt player move
      const move = game.move({
        from,
        to,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      });

      if (!move) {
        return false;
      }

      // Update game state after player move
      const newGameState = getGameState(game);
      set({
        gameState: newGameState,
        currentAnalysis: null, // Clear old analysis
        uiState: { ...get().uiState, isEngineThinking: true, isAnalyzing: false },
      });

      // Check if game is over after player move
      if (game.isGameOver()) {
        set({
          uiState: {
            ...get().uiState,
            isEngineThinking: false,
            isAnalyzing: false,
            notification: game.isCheckmate()
              ? `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`
              : 'Game over - Draw',
          },
        });
        return true;
      }

      // STEP 1: Get opponent's move (engine)
      const engineService = getEngine();
      const engineMove = await engineService.calculateMove(game.fen(), 3);

      // Make opponent's move
      const opponentMove = game.move({
        from: engineMove.from,
        to: engineMove.to,
        promotion: engineMove.promotion,
      });

      if (!opponentMove) {
        throw new Error('Engine produced invalid move');
      }

      // Update game state after opponent move
      const stateAfterOpponent = getGameState(game);
      set({ 
        gameState: stateAfterOpponent,
        uiState: { ...get().uiState, isEngineThinking: false, isAnalyzing: true },
      });

      // Check if game is over after opponent move
      if (game.isGameOver()) {
        set({
          uiState: {
            ...get().uiState,
            isEngineThinking: false,
            isAnalyzing: false,
            notification: game.isCheckmate()
              ? `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`
              : 'Game over - Draw',
          },
        });
        return true;
      }

      // STEP 2: Now analyze for YOUR next move (after opponent has responded)
      const geminiService = getGeminiService();
      const analysisResult = await geminiService.analyzePosition({
        fen: game.fen(), // Current position after opponent's move
        moveHistory: game.history({ verbose: true }),
        memory,
        lastMove: opponentMove, // Opponent's last move
      });

      // Handle AI analysis
      if (analysisResult.success) {
        const analysis = analysisResult.analysis;
        
        // Update memory with analysis
        const newPositionEvolution = [
          ...memory.positionEvolution,
          {
            turn: Math.floor(game.history().length / 2) + 1,
            fen: game.fen(),
            evaluation: analysis.memoryUpdate.positionEvolution?.[0]?.evaluation || analysis.positionEvaluation || '',
          },
        ].slice(-20);

        const updatedMemory: CoachingMemory = {
          strategicThemes: [
            ...memory.strategicThemes,
            ...(analysis.memoryUpdate.strategicThemes || []),
          ].slice(-10),
          priorAdvice: [
            ...memory.priorAdvice,
            ...(analysis.memoryUpdate.priorAdvice || []),
          ].slice(-15),
          tacticalFocus: [
            ...memory.tacticalFocus,
            ...(analysis.memoryUpdate.tacticalFocus || []),
          ].slice(-10),
          positionEvolution: newPositionEvolution,
          lastUpdated: Date.now(),
        };

        set({
          currentAnalysis: analysis,
          memory: updatedMemory,
        });

        // Save to database
        const dbService = getDatabaseService();
        const userId = localStorage.getItem('userId');
        const gameId = localStorage.getItem('currentGameId');

        if (userId && gameId) {
          dbService.updateGame(gameId, {
            fen: game.fen(),
            pgn: game.pgn(),
            memory: updatedMemory,
          }).catch(console.error);
        }
      }

      set({
        uiState: {
          ...get().uiState,
          isEngineThinking: false,
          isAnalyzing: false,
          error: null,
        },
      });

      return true;
    } catch (error) {
      console.error('Move error:', error);
      set({
        uiState: {
          ...get().uiState,
          isEngineThinking: false,
          isAnalyzing: false,
          error: error instanceof Error ? error.message : 'Failed to make move',
        },
      });
      return false;
    }
  },

  resetGame: () => {
    const newGame = new Chess();
    set({
      game: newGame,
      gameState: getGameState(newGame),
      memory: initialMemory,
      currentAnalysis: null,
      uiState: {
        isLoading: false,
        isAnalyzing: false,
        isEngineThinking: false,
        error: null,
        notification: 'New game started',
      },
    });

    // Get opening suggestions immediately
    setTimeout(() => {
      const geminiService = getGeminiService();
      geminiService.analyzePosition({
        fen: newGame.fen(),
        moveHistory: [],
        memory: initialMemory,
      }).then((result) => {
        if (result.success) {
          set({ currentAnalysis: result.analysis });
        }
      });
    }, 500);
  },

  loadGame: (fen: string, pgn: string, memory: CoachingMemory) => {
    const newGame = new Chess();
    
    try {
      if (fen) {
        newGame.load(fen);
      } else if (pgn) {
        newGame.loadPgn(pgn);
      }

      set({
        game: newGame,
        gameState: getGameState(newGame),
        memory,
        currentAnalysis: null,
        uiState: {
          isLoading: false,
          isAnalyzing: false,
          isEngineThinking: false,
          error: null,
          notification: 'Game loaded',
        },
      });

      // If it's white's turn, get coaching suggestions
      if (newGame.turn() === 'w') {
        setTimeout(() => {
          const geminiService = getGeminiService();
          geminiService.analyzePosition({
            fen: newGame.fen(),
            moveHistory: newGame.history({ verbose: true }),
            memory,
          }).then((result) => {
            if (result.success) {
              set({ currentAnalysis: result.analysis });
            }
          });
        }, 500);
      }
    } catch (error) {
      console.error('Load game error:', error);
      set({
        uiState: {
          ...get().uiState,
          error: 'Failed to load game',
        },
      });
    }
  },

  updateMemory: (update: Partial<CoachingMemory>) => {
    set({
      memory: {
        ...get().memory,
        ...update,
        lastUpdated: Date.now(),
      },
    });
  },

  setAnalysis: (analysis: CoachingAnalysis | null) => {
    set({ currentAnalysis: analysis });
  },

  setUIState: (update: Partial<UIState>) => {
    set({
      uiState: {
        ...get().uiState,
        ...update,
      },
    });
  },
}));
