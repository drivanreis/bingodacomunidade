import api from './api';

const SERVER_TIME_ENDPOINT = '/info/time';
const TIMEZONE = 'America/Fortaleza';

let offsetMs = 0;

export type ServerTimePayload = {
  now: string;
  timezone: string;
  epoch_ms: string;
};

const formatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIMEZONE,
});

export const syncServerTime = async (): Promise<void> => {
  const response = await api.get<ServerTimePayload>(SERVER_TIME_ENDPOINT);
  const serverMs = Number(response.data.epoch_ms) || new Date(response.data.now).getTime();
  offsetMs = serverMs - Date.now();
};

export const getServerNow = (): Date => {
  return new Date(Date.now() + offsetMs);
};

export const formatServerDateTime = (isoString?: string): string => {
  if (!isoString) {
    return '—';
  }

  try {
    const parsed = new Date(isoString);
    return formatter.format(parsed);
  } catch (error) {
    console.error('Erro ao formatar data do servidor:', error);
    return isoString;
  }
};

export const getTimeOffset = (): number => offsetMs;
