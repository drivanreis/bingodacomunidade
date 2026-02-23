import React from 'react';

interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  hint?: string;
}

export default function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  disabled,
  style,
  inputStyle,
  hint,
}: TextFieldProps) {
  return (
    <div style={style}>
      <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
        {label}{required ? ' *' : ''}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={inputStyle}
      />
      {hint && (
        <small style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', lineHeight: '1.4' }}>
          {hint}
        </small>
      )}
    </div>
  );
}
