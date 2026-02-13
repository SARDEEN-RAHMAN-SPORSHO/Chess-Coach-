import React, { useState } from 'react';
import { getAuthService } from '../services/authService';
import Button from './Button';
import Input from './Input';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const authService = getAuthService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await authService.signIn(email, password);
      } else {
        await authService.signUp(email, password, displayName || undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: 'var(--color-text-primary)',
          }}>
            ♟️ Chess Coach
          </h1>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
          }}>
            AI-powered chess training platform
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {!isLogin && (
            <Input
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-error)',
              borderRadius: '0.5rem',
              color: 'var(--color-error)',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="large"
            isLoading={isLoading}
            style={{ marginTop: '0.5rem' }}
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
        }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'var(--color-bg-tertiary)',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Features:</strong>
          </p>
          <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
            <li>Real-time AI coaching</li>
            <li>Strategic analysis</li>
            <li>Tactical recommendations</li>
            <li>Game memory & progress tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
