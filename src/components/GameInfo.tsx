import React from 'react';
import { GameState, CoachingMemory } from '../types';
import { Clock, Award, Brain, TrendingUp } from 'lucide-react';

interface GameInfoProps {
  gameState: GameState;
  memory: CoachingMemory;
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState, memory }) => {
  const moveCount = Math.floor(gameState.moveHistory.length / 2) + 1;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {/* Game Status */}
      <div style={{
        padding: '1.25rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Clock size={18} color="var(--color-accent)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Game Status</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Turn:</span>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {gameState.turn === 'w' ? 'White' : 'Black'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Move:</span>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{moveCount}</span>
          </div>
          {gameState.isCheck && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.375rem',
              textAlign: 'center',
            }}>
              <span style={{ color: 'var(--color-error)', fontWeight: 600, fontSize: '0.875rem' }}>
                CHECK!
              </span>
            </div>
          )}
          {gameState.isCheckmate && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '0.375rem',
              textAlign: 'center',
            }}>
              <span style={{ color: 'var(--color-error)', fontWeight: 700, fontSize: '0.875rem' }}>
                CHECKMATE!
              </span>
            </div>
          )}
          {(gameState.isStalemate || gameState.isDraw) && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              borderRadius: '0.375rem',
              textAlign: 'center',
            }}>
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>
                DRAW
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Coaching Memory */}
      {(memory.strategicThemes.length > 0 || memory.tacticalFocus.length > 0) && (
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Brain size={18} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Coaching Memory</h3>
          </div>

          {memory.strategicThemes.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Strategic Themes
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {memory.strategicThemes.slice(-3).map((theme, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.375rem 0.75rem',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {memory.tacticalFocus.length > 0 && (
            <div>
              <h4 style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Tactical Focus
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {memory.tacticalFocus.slice(-3).map((focus, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.375rem 0.75rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      color: 'var(--color-accent)',
                      border: '1px solid var(--color-accent)',
                    }}
                  >
                    {focus}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Advice */}
      {memory.priorAdvice.length > 0 && (
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Award size={18} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Coaching</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {memory.priorAdvice.slice(-3).reverse().map((advice, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  borderLeft: '3px solid var(--color-accent)',
                }}
              >
                {advice}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Position Evolution */}
      {memory.positionEvolution.length > 0 && (
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={18} color="var(--color-success)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Game Progress</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {memory.positionEvolution.length} position{memory.positionEvolution.length !== 1 ? 's' : ''} analyzed
          </p>
        </div>
      )}
    </div>
  );
};

export default GameInfo;
