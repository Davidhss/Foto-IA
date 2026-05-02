export type TipoFoto = 'padrao' | 'premium';
export type StatusPedido = 'aguardando' | 'previa' | 'entregue' | 'followup' | 'demonstracao';
export type StatusPagamento = 'pago' | 'pendente' | 'cobrar';

export interface HistoricoItem {
  status: StatusPedido;
  data: string;
}

export interface Profile {
  id: string;
  nome: string;
  role: 'admin' | 'vendedor' | 'editor';
  createdAt: string;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  qtdFotos: number;
  tipo: TipoFoto;
  statusPedido: StatusPedido;
  statusPagamento: StatusPagamento;
  valorRecebido: number;
  observacao: string;
  dataCadastro: string;
  fotosCliente: string[];
  fotosProntas: string[];
  historico: HistoricoItem[];
  vendedorId?: string;
  editorId?: string;
}

export interface Meta {
  data: string;
  meta: number;
  observacao: string;
  vendedorId: string;
}

export interface Prompt {
  id: string;
  titulo: string;
  texto: string;
  tags: string[];
  imagem: string | null;
  dataCriacao: string;
}

export interface LeadStats {
  total: number;
  vendas: number;
  aguardando: number;
  followUp: number;
  previas: number;
  demonstracao: number;
  entregue: number;
  pendentes: number;
  faturamento: number;
  faturamentoHoje: number;
  vendasHoje: number;
}
