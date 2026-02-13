import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  children,
  disabled,
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    padding: size === 'small' ? '0.5rem 1rem' : size === 'large' ? '0.875rem 2rem' : '0.75rem 1.5rem',
    fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
    fontWeight: 600,
    borderRadius: '0.5rem',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-accent)',
      color: 'white',
      border: 'none',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-tertiary)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
    },
    danger: {
      backgroundColor: 'var(--color-error)',
      color: 'white',
      border: 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid transparent',
    },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...style,
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
};

export default Button;
