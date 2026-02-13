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

      // Update game state
      const newGameState = getGameState(game);
      set({
        gameState: newGameState,
        uiState: { ...get().uiState, isEngineThinking: true, isAnalyzing: true },
      });

      // Check if game is over
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

      // Parallel execution: Engine move + AI analysis
      const engineService = getEngine();
      const geminiService = getGeminiService();

      const [engineMoveResult, analysisResult] = await Promise.allSettled([
        // Engine calculates opponent move
        engineService.calculateMove(game.fen(), 3),
        
        // AI analyzes position
        geminiService.analyzePosition({
          fen: game.fen(),
          moveHistory: game.history({ verbose: true }),
          memory,
          lastMove: move,
        }),
      ]);

      // Handle engine move
      if (engineMoveResult.status === 'fulfilled') {
        const engineMove = engineMoveResult.value;
        const opponentMove = game.move({
          from: engineMove.from,
          to: engineMove.to,
          promotion: engineMove.promotion,
        });

        if (opponentMove) {
          const updatedGameState = getGameState(game);
          set({ gameState: updatedGameState });

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
        }
      }

      // Handle AI analysis
      if (analysisResult.status === 'fulfilled' && analysisResult.value.success) {
        const analysis = analysisResult.value.analysis;
        
        // Update memory with analysis
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
          positionEvolution: [
            ...memory.positionEvolution,
            {
              turn: Math.floor(game.history().length / 2) + 1,
              fen: game.fen(),
              evaluation: analysis.memoryUpdate.positionEvolution?.evaluation || '',
            },
          ].slice(-20),
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
