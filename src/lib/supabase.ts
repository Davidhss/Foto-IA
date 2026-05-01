import { createClient } from '@supabase/supabase-js';
import type { Lead, Meta, Prompt, LeadStats, Profile } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== AUTH & PROFILES =====
export const AuthDB = {
  async getSession() {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error) throw error;
    return session;
  },
  async getProfile(userId?: string): Promise<Profile | null> {
    const uid = userId || (await this.getSession())?.user.id;
    if (!uid) return null;
    const { data, error } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) throw error;
    return data ? { id: data.id, nome: data.nome, role: data.role, createdAt: data.created_at } : null;
  },
  async signOut() {
    await sb.auth.signOut();
  }
};

export const ProfilesDB = {
  async all(): Promise<Profile[]> {
    const { data, error } = await sb.from('profiles').select('*').order('nome');
    if (error) throw error;
    return (data || []).map(r => ({ id: r.id, nome: r.nome, role: r.role, createdAt: r.created_at }));
  },
  async updateRole(id: string, role: string) {
    const { error } = await sb.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;
  }
};

// ===== MAPPERS =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToLead(r: any): Lead {
  return {
    id: r.id,
    nome: r.nome,
    whatsapp: r.whatsapp,
    qtdFotos: r.qtd_fotos,
    tipo: r.tipo,
    statusPedido: r.status_pedido,
    statusPagamento: r.status_pagamento,
    valorRecebido: Number(r.valor_recebido) || 0,
    observacao: r.observacao || '',
    dataCadastro: r.data_cadastro,
    fotosCliente: r.fotos_cliente || [],
    fotosProntas: r.fotos_prontas || [],
    historico: r.historico || [],
    vendedorId: r.vendedor_id,
    editorId: r.editor_id,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function leadToRow(d: Partial<Lead>): Record<string, any> {
  const row: Record<string, any> = {};
  if (d.nome !== undefined) row.nome = d.nome;
  if (d.whatsapp !== undefined) row.whatsapp = d.whatsapp;
  if (d.qtdFotos !== undefined) row.qtd_fotos = d.qtdFotos;
  if (d.tipo !== undefined) row.tipo = d.tipo;
  if (d.statusPedido !== undefined) row.status_pedido = d.statusPedido;
  if (d.statusPagamento !== undefined) row.status_pagamento = d.statusPagamento;
  if (d.valorRecebido !== undefined) row.valor_recebido = d.valorRecebido;
  if (d.observacao !== undefined) row.observacao = d.observacao;
  if (d.fotosCliente !== undefined) row.fotos_cliente = d.fotosCliente;
  if (d.fotosProntas !== undefined) row.fotos_prontas = d.fotosProntas;
  if (d.historico !== undefined) row.historico = d.historico;
  if (d.vendedorId !== undefined) row.vendedor_id = d.vendedorId;
  if (d.editorId !== undefined) row.editor_id = d.editorId;
  return row;
}

const todayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ===== LEADS =====
export const LeadsDB = {
  async all(): Promise<Lead[]> {
    const { data, error } = await sb.from('leads').select('*').order('data_cadastro', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToLead);
  },

  // Versão leve para o Dashboard: omite fotos (base64 pesado) que não são necessárias lá
  async allLean(): Promise<Lead[]> {
    const cols = 'id,nome,whatsapp,qtd_fotos,tipo,status_pedido,status_pagamento,valor_recebido,observacao,data_cadastro,historico,vendedor_id,editor_id';
    const { data, error } = await sb.from('leads').select(cols).order('data_cadastro', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({ ...rowToLead(r), fotosCliente: [], fotosProntas: [] }));
  },

  async get(id: string): Promise<Lead | null> {
    const { data, error } = await sb.from('leads').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToLead(data) : null;
  },

  async create(d: Omit<Lead, 'id' | 'dataCadastro' | 'fotosCliente' | 'fotosProntas' | 'historico'>): Promise<Lead> {
    // If vendedorId is not set, set it to the logged in user
    if (!d.vendedorId) {
      const session = await AuthDB.getSession();
      if (session) d.vendedorId = session.user.id;
    }
    const row = {
      ...leadToRow(d),
      historico: [{ status: d.statusPedido, data: new Date().toISOString() }],
      fotos_cliente: [],
      fotos_prontas: [],
    };
    const { data, error } = await sb.from('leads').insert(row).select().single();
    if (error) throw error;
    return rowToLead(data);
  },

  async update(id: string, d: Partial<Lead>): Promise<Lead> {
    const row = leadToRow(d);
    if (d.statusPedido) {
      const current = await this.get(id);
      if (current && current.statusPedido !== d.statusPedido) {
        row.historico = [...(current.historico || []), { status: d.statusPedido, data: new Date().toISOString() }];
      }
    }
    const { data, error } = await sb.from('leads').update(row).eq('id', id).select().single();
    if (error) throw error;
    return rowToLead(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await sb.from('leads').delete().eq('id', id);
    if (error) throw error;
  },

  async addFoto(id: string, tipo: 'cliente' | 'prontas', base64: string): Promise<void> {
    const lead = await this.get(id);
    if (!lead) return;
    const key = tipo === 'cliente' ? 'fotos_cliente' : 'fotos_prontas';
    const current = tipo === 'cliente' ? lead.fotosCliente : lead.fotosProntas;
    const { error } = await sb.from('leads').update({ [key]: [...current, base64] }).eq('id', id);
    if (error) throw error;
  },

  async removeFoto(id: string, tipo: 'cliente' | 'prontas', idx: number): Promise<void> {
    const lead = await this.get(id);
    if (!lead) return;
    const key = tipo === 'cliente' ? 'fotos_cliente' : 'fotos_prontas';
    const current = [...(tipo === 'cliente' ? lead.fotosCliente : lead.fotosProntas)];
    current.splice(idx, 1);
    const { error } = await sb.from('leads').update({ [key]: current }).eq('id', id);
    if (error) throw error;
  },

  async stats(leads?: Lead[]): Promise<LeadStats> {
    const all = leads ?? await this.all();
    const t = todayStr();
    const todayLeads = all.filter(l => {
      if (!l.dataCadastro) return false;
      const d = new Date(l.dataCadastro);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const lDate = `${year}-${month}-${day}`;
      return lDate === t;
    });
    return {
      total: all.length,
      vendas: all.filter(l => l.statusPagamento === 'pago').length,
      aguardando: all.filter(l => l.statusPedido === 'aguardando').length,
      followUp: all.filter(l => l.statusPedido === 'followup').length,
      previas: all.filter(l => l.statusPedido === 'previa').length,
      demonstracao: all.filter(l => l.statusPedido === 'demonstracao').length,
      entregue: all.filter(l => l.statusPedido === 'entregue').length,
      pendentes: all.filter(l => ['pendente','cobrar'].includes(l.statusPagamento)).length,
      faturamento: all.filter(l => l.statusPagamento === 'pago').reduce((s,l) => s + l.valorRecebido, 0),
      faturamentoHoje: todayLeads.filter(l => l.statusPagamento === 'pago').reduce((s,l) => s + l.valorRecebido, 0),
      vendasHoje: todayLeads.filter(l => l.statusPagamento === 'pago').length,
    };
  }
};

// ===== METAS =====
export const MetasDB = {
  async getHoje(): Promise<Meta> {
    const session = await AuthDB.getSession();
    if (!session) return { data: todayStr(), meta: 0, observacao: '', vendedorId: '' };
    const uid = session.user.id;
    const { data, error } = await sb.from('metas')
      .select('*').eq('data', todayStr()).eq('vendedor_id', uid).maybeSingle();
    if (error) throw error;
    return data 
      ? { data: data.data, meta: data.meta, observacao: data.observacao, vendedorId: data.vendedor_id }
      : { data: todayStr(), meta: 0, observacao: '', vendedorId: uid };
  },
  async setHoje(meta: number, observacao: string): Promise<void> {
    const session = await AuthDB.getSession();
    if (!session) return;
    const uid = session.user.id;
    const { error } = await sb.from('metas')
      .upsert({ data: todayStr(), meta, observacao, vendedor_id: uid }, { onConflict: 'data,vendedor_id' });
    if (error) throw error;
  },
};

// ===== PROMPTS =====
export const PromptsDB = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _from(r: any): Prompt {
    return { id: r.id, titulo: r.titulo, texto: r.texto, tags: r.tags || [], imagem: r.imagem, dataCriacao: r.data_criacao };
  },
  async all(): Promise<Prompt[]> {
    const { data, error } = await sb.from('prompts').select('*').order('data_criacao', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => this._from(r));
  },
  async get(id: string): Promise<Prompt | null> {
    const { data, error } = await sb.from('prompts').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? this._from(data) : null;
  },
  async create(d: Omit<Prompt, 'id' | 'dataCriacao'>): Promise<Prompt> {
    const { data, error } = await sb.from('prompts').insert({ titulo: d.titulo, texto: d.texto, tags: d.tags, imagem: d.imagem }).select().single();
    if (error) throw error;
    return this._from(data);
  },
  async update(id: string, d: Partial<Omit<Prompt, 'id' | 'dataCriacao'>>): Promise<Prompt> {
    const { data, error } = await sb.from('prompts').update(d).eq('id', id).select().single();
    if (error) throw error;
    return this._from(data);
  },
  async delete(id: string): Promise<void> {
    const { error } = await sb.from('prompts').delete().eq('id', id);
    if (error) throw error;
  },
};
