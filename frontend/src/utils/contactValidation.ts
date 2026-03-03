import { isValidBrazilDdd } from './dddUf';

export const sanitizePhoneLocal = (value: string): string => value.replace(/\D/g, '').slice(0, 10);

export const buildBrazilContact = (ddd: string, telefone: string): string =>
  `${ddd.replace(/\D/g, '').slice(0, 2)}${sanitizePhoneLocal(telefone)}`;

export const isBrazilContactValid = (ddd: string, telefone: string): boolean => {
  const telefoneLimpo = sanitizePhoneLocal(telefone);
  return isValidBrazilDdd(ddd) && /^\d{9,10}$/.test(telefoneLimpo);
};
