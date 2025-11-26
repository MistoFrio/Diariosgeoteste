export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface EquipmentLocation {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  clientId?: string | null;
  clientName?: string | null;
  status: string;
  createdAt: string;
}

export interface WorkDiary {
  id: string;
  clientId: string;
  clientName: string;
  address: string;
  enderecoDetalhado?: {
    estadoId: number;
    estadoNome: string;
    cidadeId: number;
    cidadeNome: string;
    rua: string;
    numero: string;
  };
  team: string;
  type?: 'PCE' | 'PLACA' | 'PIT' | 'PDA';
  date: string;
  startTime: string;
  endTime: string;
  servicesExecuted: string;
  geotestSignature: string;
  geotestSignatureImage?: string;
  responsibleSignature: string;
  observations: string;
  createdBy: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; code?: string; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}