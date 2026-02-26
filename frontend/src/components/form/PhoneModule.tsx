import React from 'react';
import ContactModule from './ContactModule';

interface PhoneModuleProps {
  ddd: string;
  telefone: string;
  onDddChange: (value: string) => void;
  onTelefoneChange: (value: string, rawValue?: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const PhoneModule: React.FC<PhoneModuleProps> = (props) => {
  return <ContactModule {...props} label="Telefone (SMS/WhatsApp)" dddAriaLabel="DDD Telefone" phoneAriaLabel="Telefone (SMS/WhatsApp)" />;
};

export default PhoneModule;
