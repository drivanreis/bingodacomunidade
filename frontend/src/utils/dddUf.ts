export interface DddOption {
  ddd: string;
  uf: string;
  label: string;
}

export interface UfOption {
  uf: string;
  nome: string;
  label: string;
}

const UF_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

const DDD_UF_MAP: Record<string, string> = {
  '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
  '21': 'RJ', '22': 'RJ', '24': 'RJ',
  '27': 'ES', '28': 'ES',
  '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
  '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
  '47': 'SC', '48': 'SC', '49': 'SC',
  '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
  '61': 'DF',
  '62': 'GO', '64': 'GO',
  '63': 'TO',
  '65': 'MT', '66': 'MT',
  '67': 'MS',
  '68': 'AC',
  '69': 'RO',
  '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
  '79': 'SE',
  '81': 'PE', '87': 'PE',
  '82': 'AL',
  '83': 'PB',
  '84': 'RN',
  '85': 'CE', '88': 'CE',
  '86': 'PI', '89': 'PI',
  '91': 'PA', '93': 'PA', '94': 'PA',
  '92': 'AM', '97': 'AM',
  '95': 'RR',
  '96': 'AP',
  '98': 'MA', '99': 'MA',
};

const CPF_REGION_UFS: Record<string, string[]> = {
  '0': ['RS'],
  '1': ['DF', 'GO', 'MS', 'MT', 'TO'],
  '2': ['AC', 'AM', 'AP', 'PA', 'RO', 'RR'],
  '3': ['CE', 'MA', 'PI'],
  '4': ['AL', 'PB', 'PE', 'RN'],
  '5': ['BA', 'SE'],
  '6': ['MG'],
  '7': ['ES', 'RJ'],
  '8': ['SP'],
  '9': ['PR', 'SC'],
};

export const DDD_OPTIONS: DddOption[] = Object.entries(DDD_UF_MAP)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([ddd, uf]) => ({
    ddd,
    uf,
    label: `${ddd} - ${UF_NAMES[uf] || uf} (${uf})`,
  }));

export const UF_OPTIONS: UfOption[] = Array.from(new Set(Object.values(DDD_UF_MAP)))
  .sort((a, b) => (UF_NAMES[a] || a).localeCompare(UF_NAMES[b] || b, 'pt-BR'))
  .map((uf) => ({
    uf,
    nome: UF_NAMES[uf] || uf,
    label: `${UF_NAMES[uf] || uf} (${uf})`,
  }));

export const isValidBrazilDdd = (ddd: string): boolean => {
  return Boolean(DDD_UF_MAP[ddd]);
};

export const getUfByDdd = (ddd: string): string | null => {
  return DDD_UF_MAP[ddd] || null;
};

export const getCpfFiscalRegionUfs = (cpf: string): string[] | null => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    return null;
  }
  const regiao = cpfLimpo[8];
  return CPF_REGION_UFS[regiao] || null;
};

export const getDddCpfMismatchWarning = (ddd: string, cpf: string): string | null => {
  const ufDdd = getUfByDdd(ddd);
  const regioesCpf = getCpfFiscalRegionUfs(cpf);

  if (!ufDdd || !regioesCpf) {
    return null;
  }

  if (regioesCpf.includes(ufDdd)) {
    return null;
  }

  return `DDD ${ddd} (${ufDdd}) não corresponde à região fiscal do CPF (${regioesCpf.join(', ')}). Confirme os dados com a administração paroquial.`;
};
