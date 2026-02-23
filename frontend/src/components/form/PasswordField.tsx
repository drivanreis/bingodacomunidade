import React from 'react';

interface PasswordFieldProps {
  id?: string;
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  show: boolean;
  onToggleShow: () => void;
  containerStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  hint?: string;
}

export default function PasswordField({
  id,
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  show,
  onToggleShow,
  containerStyle,
  inputStyle,
  buttonStyle,
  hint,
}: PasswordFieldProps) {
  const inputId = id || name;

  return (
    <div style={containerStyle}>
      <label htmlFor={inputId} style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
        {label}{required ? ' *' : ''}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={onToggleShow}
          style={buttonStyle}
          aria-label={`Mostrar/ocultar ${label.toLowerCase()}`}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
      {hint && (
        <small style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
          {hint}
        </small>
      )}
    </div>
  );
}
