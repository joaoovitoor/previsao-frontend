export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  role: 'admin' | 'operador';
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  estoqueminimo: number;
  estoqueideal: number;
  saldo: number;
  providencia: string;
  created_at: string;
  updated_at: string;
}

export interface Movimentacao {
  id: string;
  produto_id: string;
  produto_nome: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  usuario_id: string | null;
  created_at: string;
  saldo_atual?: number;
}

export interface AuthResponse {
  access_token: string;
  usuario: Pick<Usuario, 'id' | 'nome' | 'email' | 'cpf' | 'role'>;
}
