import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { getAuthService } from './services/authService';
import AuthPage from './components/AuthPage';
import GamePage from './components/GamePage';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    const authService = getAuthService();
    
    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [setUser]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--color-bg-primary)',
      }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="app">
      {isAuthenticated ? <GamePage /> : <AuthPage />}
    </div>
  );
}

export default App;
