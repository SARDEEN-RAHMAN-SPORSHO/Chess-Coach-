import React, { useEffect, useState, useCallback } from 'react';
import { Square } from 'chess.js';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { getDatabaseService } from '../services/databaseService';
import Header from './Header';
import ChessBoard from './ChessBoard';
import AnalysisPanel from './AnalysisPanel';
import GameInfo from './GameInfo';
import Notification from './Notification';
import LoadingSpinner from './LoadingSpinner';

const GamePage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    gameState,
    memory,
    currentAnalysis,
    uiState,
    makeMove,
    resetGame,
    loadGame,
    setUIState,
  } = useGameStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const dbService = getDatabaseService();

  // Load active game on mount
  useEffect(() => {
    const loadActiveGame = async () => {
      if (!user) return;

      try {
        const activeGame = await dbService.getActiveGame(user.uid);
        
        if (activeGame) {
          loadGame(activeGame.fen, activeGame.pgn, activeGame.memory);
          localStorage.setItem('currentGameId', activeGame.gameId);
          setNotification({
            message: 'Game loaded successfully',
            type: 'success',
          });
        } else {
          // Create new game if no active game
          const gameId = await dbService.createNewGame(user.uid);
          localStorage.setItem('currentGameId', gameId);
        }
      } catch (error) {
        console.error('Error loading game:', error);
        setNotification({
          message: 'Failed to load game',
          type: 'error',
        });
      } finally {
        setIsLoadingGame(false);
      }
    };

    loadActiveGame();
  }, [user, loadGame, dbService]);

  // Show notification for game state changes
  useEffect(() => {
    if (uiState.notification) {
      setNotification({
        message: uiState.notification,
        type: 'info',
      });
      // Clear notification from store after showing
      setTimeout(() => {
        setUIState({ notification: null });
      }, 100);
    }
  }, [uiState.notification, setUIState]);

  // Show error notifications
  useEffect(() => {
    if (uiState.error) {
      setNotification({
        message: uiState.error,
        type: 'error',
      });
      // Clear error from store after showing
      setTimeout(() => {
        setUIState({ error: null });
      }, 100);
    }
  }, [uiState.error, setUIState]);

  const handlePieceDrop = useCallback(
    async (sourceSquare: Square, targetSquare: Square): Promise<boolean> => {
      // Check if it's white's turn (player's turn)
      if (gameState.turn !== 'w') {
        return false;
      }

      const success = await makeMove(sourceSquare, targetSquare);
      return success;
    },
    [gameState.turn, makeMove]
  );

  const handleNewGame = useCallback(async () => {
    if (!user) return;

    if (!window.confirm('Start a new game? Current game will be saved.')) {
      return;
    }

    try {
      // Save current game before starting new one
      const currentGameId = localStorage.getItem('currentGameId');
      if (currentGameId) {
        await dbService.updateGame(currentGameId, {
          fen: gameState.fen,
          pgn: gameState.pgn,
          memory,
          isActive: false,
        });
      }

      // Create new game
      const newGameId = await dbService.createNewGame(user.uid);
      localStorage.setItem('currentGameId', newGameId);

      // Reset game state
      resetGame();

      setNotification({
        message: 'New game started',
        type: 'success',
      });
    } catch (error) {
      console.error('Error starting new game:', error);
      setNotification({
        message: 'Failed to start new game',
        type: 'error',
      });
    }
  }, [user, gameState, memory, resetGame, dbService]);

  const handleSaveGame = useCallback(async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const gameId = localStorage.getItem('currentGameId');
      if (!gameId) {
        throw new Error('No active game');
      }

      await dbService.updateGame(gameId, {
        fen: gameState.fen,
        pgn: gameState.pgn,
        memory,
        isActive: true,
      });

      setNotification({
        message: 'Game saved successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving game:', error);
      setNotification({
        message: 'Failed to save game',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, gameState, memory, dbService]);

  // Only allow white pieces to be dragged (player plays white)
  const isDraggablePiece = useCallback(
    ({ piece }: { piece: string }) => {
      return piece[0] === 'w' && gameState.turn === 'w' && !gameState.isGameOver;
    },
    [gameState.turn, gameState.isGameOver]
  );

  if (isLoadingGame) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-primary)',
      }}>
        <LoadingSpinner size="large" message="Loading game..." />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Header
        onNewGame={handleNewGame}
        onSaveGame={handleSaveGame}
        isSaving={isSaving}
      />

      <main className="container" style={{
        flex: 1,
        padding: '2rem 1rem',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          {/* Left Column: Game Info */}
          <div style={{
            order: window.innerWidth < 768 ? 2 : 1,
          }}>
            <GameInfo gameState={gameState} memory={memory} />
          </div>

          {/* Center Column: Chess Board */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            order: 1,
          }}>
            <ChessBoard
              position={gameState.fen}
              onPieceDrop={handlePieceDrop}
              boardOrientation="white"
              isDraggablePiece={isDraggablePiece}
            />

            {uiState.isEngineThinking && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--color-border)',
              }}>
                <LoadingSpinner size="small" />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Opponent is thinking...
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Analysis Panel */}
          <div style={{
            order: window.innerWidth < 768 ? 3 : 3,
          }}>
            <AnalysisPanel
              analysis={currentAnalysis}
              isAnalyzing={uiState.isAnalyzing}
            />
          </div>
        </div>
      </main>

      {/* Notifications */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default GamePage;
