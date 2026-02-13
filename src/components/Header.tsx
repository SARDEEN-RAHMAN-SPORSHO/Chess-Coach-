import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, RotateCcw, Save } from 'lucide-react';
import Button from './Button';

interface HeaderProps {
  onNewGame: () => void;
  onSaveGame: () => void;
  isSaving: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNewGame, onSaveGame, isSaving }) => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header style={{
      backgroundColor: 'var(--color-bg-secondary)',
      borderBottom: '1px solid var(--color-border)',
      padding: '1rem 0',
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>
            ♟️ Chess Coach
          </h1>
          {user && (
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.25rem',
            }}>
              {user.displayName || user.email}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button
            variant="secondary"
            size="small"
            onClick={onSaveGame}
            isLoading={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={16} />
            Save
          </Button>

          <Button
            variant="secondary"
            size="small"
            onClick={onNewGame}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} />
            New Game
          </Button>

          <Button
            variant="ghost"
            size="small"
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
