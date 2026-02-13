import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type = 'info',
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  const colors = {
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'var(--color-success)',
      text: 'var(--color-success)',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'var(--color-error)',
      text: 'var(--color-error)',
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'var(--color-accent)',
      text: 'var(--color-accent)',
    },
  };

  const style = colors[type];

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        maxWidth: '400px',
        padding: '1rem',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <div style={{ color: style.text }}>
        {icons[type]}
      </div>
      <p style={{
        flex: 1,
        fontSize: '0.875rem',
        color: 'var(--color-text-primary)',
      }}>
        {message}
      </p>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          padding: '0.25rem',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Notification;
