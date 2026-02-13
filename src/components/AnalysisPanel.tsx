import React from 'react';
import { CoachingAnalysis } from '../types';
import { Lightbulb, AlertTriangle, TrendingUp, Target } from 'lucide-react';

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
            AI Coach is analyzing...
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--color-border)',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Make a move to receive AI coaching
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
      {/* Best Move Recommendation */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '0.75rem',
        border: '2px solid var(--color-accent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Target size={20} color="var(--color-accent)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recommended Move</h3>
        </div>
        <p style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-accent)',
          marginBottom: '0.5rem',
        }}>
          {analysis.bestMove}
        </p>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
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
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
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
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tactical Alerts</h4>
          </div>
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {analysis.tacticalAlerts.map((alert, index) => (
              <li key={index} style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
              }}>
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Continuation */}
      {analysis.recommendedContinuation.length > 0 && (
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Lightbulb size={18} color="var(--color-accent)" />
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Recommended Continuation</h4>
          </div>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          }}>
            {analysis.recommendedContinuation.join(' → ')}
          </p>
        </div>
      )}

      {/* Opponent Responses */}
      {analysis.opponentResponseTree.length > 0 && (
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
        }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Likely Opponent Responses
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analysis.opponentResponseTree.map((response, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: '0.5rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {response.move}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: response.probability === 'high' ? 'var(--color-success)' :
                           response.probability === 'medium' ? 'var(--color-warning)' :
                           'var(--color-text-muted)',
                  }}>
                    {response.probability} probability
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                  {response.evaluation}
                </p>
                {response.continuation.length > 0 && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    fontFamily: 'monospace',
                  }}>
                    {response.continuation.join(' ')}
                  </p>
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
