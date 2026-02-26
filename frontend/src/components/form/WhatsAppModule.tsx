import React from 'react';
import ContactModule from './ContactModule';

interface WhatsAppModuleProps {
  ddd: string;
  telefone: string;
  onDddChange: (value: string) => void;
  onTelefoneChange: (value: string, rawValue?: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const WhatsAppModule: React.FC<WhatsAppModuleProps> = (props) => {
  return <ContactModule {...props} label="WhatsApp" dddAriaLabel="Código WhatsApp" phoneAriaLabel="WhatsApp" />;
};

export default WhatsAppModule;
