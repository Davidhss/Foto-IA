export const fmtMoney = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target!.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

export const STATUS_PEDIDO = {
  aguardando:   { label: 'Aguardando',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'   },
  previa:       { label: 'Prévia',        color: '#3b82f6', bg: 'rgba(59,130,246,0.15)'   },
  entregue:     { label: 'Entregue',      color: '#10b981', bg: 'rgba(16,185,129,0.15)'   },
  followup:     { label: 'Follow-up',     color: '#a855f7', bg: 'rgba(168,85,247,0.15)'   },
  demonstracao: { label: 'Demonstração',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'   },
} as const;

export const STATUS_PAG = {
  pago:     { label: 'Pago',     color: '#10b981', bg: 'rgba(16,185,129,0.15)'  },
  pendente: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  cobrar:   { label: 'Cobrar',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
} as const;

export const TIPO_FOTO = {
  padrao:  { label: 'Padrão',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'   },
  premium: { label: 'Premium', color: '#a855f7', bg: 'rgba(168,85,247,0.15)'  },
} as const;
