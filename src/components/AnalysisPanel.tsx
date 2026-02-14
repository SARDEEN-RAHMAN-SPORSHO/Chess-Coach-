import React from 'react';
import { CoachingAnalysis } from '../types';
import { Lightbulb, AlertTriangle, TrendingUp, Target, Play } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: CoachingAnalysis | null;
  isAnalyzing: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, isAnalyzing }) => {
  if (isAnalyzing) {
    return (
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="pulse" style={{
            width: '12px',
            height: '12px',
            backgroundColor: 'var(--color-accent)',
            borderRadius: '50%',
          }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Analyzing position...
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={{
        padding: '2rem 1.5rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--color-border)',
        textAlign: 'center',
      }}>
        <Play size={48} style={{ 
          margin: '0 auto 1rem',
          color: 'var(--color-text-muted)',
          opacity: 0.5,
        }} />
        <h3 style={{ 
          fontSize: '1.125rem', 
          marginBottom: '0.5rem',
          color: 'var(--color-text-primary)',
        }}>
          Ready to start!
        </h3>
        <p style={{ 
          color: 'var(--color-text-muted)',
          fontSize: '0.875rem',
        }}>
          Make your first move to receive AI coaching
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxHeight: '600px',
      overflowY: 'auto',
    }}>
      {/* Your Best Move */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '0.75rem',
        border: '2px solid var(--color-accent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Target size={20} color="var(--color-accent)" />
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your Best Move
          </h3>
        </div>
        <div style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--color-accent)',
          marginBottom: '0.75rem',
          fontFamily: 'monospace',
        }}>
          {analysis.bestMove}
        </div>
        <p style={{ 
          color: 'var(--color-text-primary)', 
          lineHeight: 1.6,
          fontSize: '0.9375rem',
        }}>
          {analysis.explanation}
        </p>
      </div>

      {/* Position Evaluation */}
      <div style={{
        padding: '1.25rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <TrendingUp size={18} color="var(--color-success)" />
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Position Evaluation</h4>
        </div>
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          fontSize: '0.875rem',
          fontWeight: 500,
        }}>
          {analysis.positionEvaluation}
        </p>
      </div>

      {/* Tactical Alerts */}
      {analysis.tacticalAlerts.length > 0 && (
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-warning)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={18} color="var(--color-warning)" />
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>⚠️ Important Notes</h4>
          </div>
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {analysis.tacticalAlerts.map((alert, index) => (
              <li key={index} style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                marginBottom: index < analysis.tacticalAlerts.length - 1 ? '0.5rem' : 0,
                lineHeight: 1.5,
              }}>
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Your Plan (Continuation) */}
      {analysis.recommendedContinuation.length > 0 && (
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Lightbulb size={18} color="var(--color-accent)" />
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Your Plan (Next Moves)</h4>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}>
            {analysis.recommendedContinuation.map((move, index) => (
              <span key={index} style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}>
                {move}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* What Opponent Might Do */}
      {analysis.opponentResponseTree.length > 0 && (
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
        }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            🎯 Opponent's Likely Responses
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analysis.opponentResponseTree.slice(0, 3).map((response, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: '0.5rem',
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ 
                    fontWeight: 600, 
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    color: 'var(--color-text-primary)',
                  }}>
                    {response.move}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontWeight: 600,
                    backgroundColor: response.probability === 'high' 
                      ? 'rgba(239, 68, 68, 0.2)' 
                      : response.probability === 'medium'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(148, 163, 184, 0.2)',
                    color: response.probability === 'high' 
                      ? 'var(--color-error)' 
                      : response.probability === 'medium'
                      ? 'var(--color-warning)'
                      : 'var(--color-text-muted)',
                  }}>
                    {response.probability}
                  </span>
                </div>
                <p style={{ 
                  fontSize: '0.8125rem', 
                  color: 'var(--color-text-secondary)',
                  marginBottom: response.continuation.length > 0 ? '0.5rem' : 0,
                  lineHeight: 1.5,
                }}>
                  {response.evaluation}
                </p>
                {response.continuation.length > 0 && (
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'monospace',
                  }}>
                    Then: {response.continuation.join(' → ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
