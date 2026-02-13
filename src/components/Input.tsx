import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    backgroundColor: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    border: `2px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
    borderRadius: '0.5rem',
    transition: 'border-color 0.2s',
    ...style,
  };

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}
        >
          {label}
        </label>
      )}
      <input
        style={inputStyles}
        {...props}
      />
      {error && (
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
