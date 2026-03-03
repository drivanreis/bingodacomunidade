import React from 'react';
import { DDD_OPTIONS } from '../../utils/dddUf';
import { sanitizePhoneLocal } from '../../utils/contactValidation';

interface ContactModuleProps {
  ddd: string;
  telefone: string;
  onDddChange: (value: string) => void;
  onTelefoneChange: (value: string, rawValue?: string) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  dddAriaLabel?: string;
  phoneAriaLabel?: string;
}

const ContactModule: React.FC<ContactModuleProps> = ({
  ddd,
  telefone,
  onDddChange,
  onTelefoneChange,
  required = false,
  disabled = false,
  label = 'Telefone (SMS/WhatsApp)',
  dddAriaLabel = 'DDD',
  phoneAriaLabel = 'Telefone (SMS/WhatsApp)',
}) => {
  return (
    <div className="mb-3">
      <label className="form-label">{label}{required ? ' *' : ''}</label>
      <div className="row g-2">
        <div className="col-md-4">
          <select
            className="form-select"
            aria-label={dddAriaLabel}
            value={ddd}
            onChange={(e) => onDddChange(e.target.value)}
            disabled={disabled}
            required={required}
          >
            <option value="">DDD</option>
            {DDD_OPTIONS.map((item) => (
              <option key={item.ddd} value={item.ddd}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-8">
          <input
            type="tel"
            className="form-control"
            aria-label={phoneAriaLabel}
            value={telefone}
            onChange={(e) => onTelefoneChange(sanitizePhoneLocal(e.target.value), e.target.value)}
            placeholder="Número"
            inputMode="numeric"
            disabled={disabled}
            required={required}
          />
        </div>
      </div>
      <small className="text-muted">DDD + telefone local (9 ou 10 dígitos), sem +55.</small>
    </div>
  );
};

export default ContactModule;
