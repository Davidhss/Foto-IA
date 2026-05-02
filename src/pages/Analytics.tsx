import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { LeadsDB } from '../lib/supabase';
import { fmtMoney } from '../lib/utils';
import type { Lead } from '../types';
import { useAuth } from '../App';

type Period = 'today' | '7d' | '30d' | 'month' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje', '7d': '7 dias', '30d': '30 dias', month: 'Este mês', all: 'Tudo',
};

const COLORS = {
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  teal: '#14b8a6',
  pink: '#ec4899',
  orange: '#f97316',
};

const PIE_COLORS = [COLORS.purple, COLORS.blue, COLORS.green, COLORS.amber, COLORS.red];

const CustomTooltip = ({ active, payload, label, isMoney }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      {label && <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || 'var(--text)', fontWeight: 600 }}>
          {p.name ? `${p.name}: ` : ''}{isMoney ? fmtMoney(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color?: string }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color || 'var(--accent)', borderRadius: '14px 14px 0 0' }} />
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || 'var(--text)', lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </motion.div>
  );
}

function ChartCard({ title, children, span2 = false }: { title: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ gridColumn: span2 ? '1 / -1' : undefined }}
    >
      <div className="section-title" style={{ marginBottom: 20 }}>{title}</div>
      {children}
    </motion.div>
  );
}

// Helper: get date string yyyy-mm-dd
const dateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Helper: short label dd/MM
const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

// Helper: month label mm/yyyy
const monthLabel = (iso: string) => {
  const [y, m] = iso.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
};

export default function Analytics() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const { teamMemberIds } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const memberFilter = teamMemberIds.length > 0 ? teamMemberIds : undefined;
        const all = await LeadsDB.allLean(memberFilter);
        setLeads(all);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [teamMemberIds]);

  const filteredLeads = useMemo(() => {
    const now = new Date();
    if (period === 'all') return leads;
    const cutoff = new Date();
    if (period === 'today') { cutoff.setHours(0, 0, 0, 0); }
    else if (period === '7d') { cutoff.setDate(now.getDate() - 7); }
    else if (period === '30d') { cutoff.setDate(now.getDate() - 30); }
    else if (period === 'month') { cutoff.setDate(1); cutoff.setHours(0, 0, 0, 0); }
    return leads.filter(l => l.dataCadastro && new Date(l.dataCadastro) >= cutoff);
  }, [leads, period]);

  // ---- KPIs ----
  const kpis = useMemo(() => {
    const paid = filteredLeads.filter(l => l.statusPagamento === 'pago');
    const revenue = paid.reduce((s, l) => s + l.valorRecebido, 0);
    const avgTicket = paid.length > 0 ? revenue / paid.length : 0;
    const convRate = filteredLeads.length > 0 ? (paid.length / filteredLeads.length * 100) : 0;
    const premium = filteredLeads.filter(l => l.tipo === 'premium').length;
    const premiumPct = filteredLeads.length > 0 ? (premium / filteredLeads.length * 100) : 0;
    return { revenue, avgTicket, convRate, total: filteredLeads.length, paid: paid.length, premium, premiumPct };
  }, [filteredLeads]);

  // ---- Revenue by Day ----
  const revenueByDay = useMemo(() => {
    const days = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : period === 'month' ? 31 : 60;
    const map: Record<string, number> = {};
    filteredLeads
      .filter(l => l.statusPagamento === 'pago' && l.dataCadastro)
      .forEach(l => {
        const d = dateStr(new Date(l.dataCadastro));
        map[d] = (map[d] || 0) + l.valorRecebido;
      });
    const result = [];
    for (let i = Math.min(days, 60); i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateStr(d);
      result.push({ date: shortDate(key), value: map[key] || 0, fullDate: key });
    }
    return result;
  }, [filteredLeads, period]);

  // ---- Leads by Status (Pie) ----
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => { map[l.statusPedido] = (map[l.statusPedido] || 0) + 1; });
    const labels: Record<string, string> = { aguardando: 'Aguardando', previa: 'Prévia', entregue: 'Entregue', followup: 'Follow-up', demonstracao: 'Demonstração' };
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [filteredLeads]);

  // ---- Payment Status (Pie) ----
  const pagamentoData = useMemo(() => {
    const map: Record<string, number> = { pago: 0, pendente: 0, cobrar: 0 };
    filteredLeads.forEach(l => { map[l.statusPagamento] = (map[l.statusPagamento] || 0) + 1; });
    return [
      { name: 'Pago', value: map.pago, color: COLORS.green },
      { name: 'Pendente', value: map.pendente, color: COLORS.amber },
      { name: 'Cobrar', value: map.cobrar, color: COLORS.red },
    ].filter(d => d.value > 0);
  }, [filteredLeads]);

  // ---- Tipo Foto (Bar) ----
  const tipoData = useMemo(() => {
    const padrao = filteredLeads.filter(l => l.tipo === 'padrao');
    const premium = filteredLeads.filter(l => l.tipo === 'premium');
    return [
      { name: 'Padrão',  qtd: padrao.length,  faturamento: padrao.filter(l => l.statusPagamento === 'pago').reduce((s, l) => s + l.valorRecebido, 0) },
      { name: 'Premium', qtd: premium.length, faturamento: premium.filter(l => l.statusPagamento === 'pago').reduce((s, l) => s + l.valorRecebido, 0) },
    ];
  }, [filteredLeads]);

  // ---- Weekly evolution ----
  const weeklyData = useMemo(() => {
    const weeks: { label: string; leads: number; vendas: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date();
      start.setDate(start.getDate() - w * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const wLeads = leads.filter(l => {
        if (!l.dataCadastro) return false;
        const d = new Date(l.dataCadastro);
        return d >= start && d < end;
      });
      weeks.push({
        label: `Sem ${8 - w}`,
        leads: wLeads.length,
        vendas: wLeads.filter(l => l.statusPagamento === 'pago').length,
      });
    }
    return weeks;
  }, [leads]);

  // ---- Monthly comparison ----
  const monthlyData = useMemo(() => {
    const map: Record<string, { revenue: number; leads: number }> = {};
    leads.forEach(l => {
      if (!l.dataCadastro) return;
      const d = new Date(l.dataCadastro);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { revenue: 0, leads: 0 };
      map[key].leads++;
      if (l.statusPagamento === 'pago') map[key].revenue += l.valorRecebido;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([k, v]) => ({ month: monthLabel(k), ...v }));
  }, [leads]);

  // ---- Funil ----
  const funnelData = useMemo(() => {
    const total = filteredLeads.length;
    return [
      { name: 'Total Leads',   value: total,                                                   fill: COLORS.blue },
      { name: 'Demonstração',  value: filteredLeads.filter(l => l.statusPedido === 'demonstracao').length, fill: COLORS.teal },
      { name: 'Prévia Enviada', value: filteredLeads.filter(l => l.statusPedido === 'previa').length, fill: COLORS.purple },
      { name: 'Entregue',      value: filteredLeads.filter(l => l.statusPedido === 'entregue').length, fill: COLORS.amber },
      { name: 'Pago ✓',       value: filteredLeads.filter(l => l.statusPagamento === 'pago').length, fill: COLORS.green },
    ];
  }, [filteredLeads]);

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state" style={{ marginTop: 80 }}>
          <div className="icon" style={{ fontSize: 48 }}>⏳</div>
          <p>Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">📊 Analytics</div>
          <div className="topbar-sub">Visão completa do negócio</div>
        </div>
        <div className="flex gap-8">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="btn btn-sm"
              style={{
                background: period === p ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--bg3)',
                color: period === p ? '#fff' : 'var(--text2)',
                border: period === p ? 'none' : '1px solid var(--border)',
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI Cards */}
        <div className="grid-4">
          <StatCard icon="💰" label="Faturamento" value={fmtMoney(kpis.revenue)} color={COLORS.green} />
          <StatCard icon="🎯" label="Ticket Médio" value={fmtMoney(kpis.avgTicket)} color={COLORS.purple} />
          <StatCard icon="📈" label="Taxa de Conversão" value={`${kpis.convRate.toFixed(1)}%`} sub={`${kpis.paid} pagos / ${kpis.total} leads`} color={COLORS.blue} />
          <StatCard icon="⭐" label="Premium" value={`${kpis.premiumPct.toFixed(0)}%`} sub={`${kpis.premium} pedidos premium`} color={COLORS.amber} />
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <ChartCard title="💸 Faturamento por Dia">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueByDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip isMoney />} />
                <Area type="monotone" dataKey="value" name="Faturamento" stroke={COLORS.green} strokeWidth={2} fill="url(#gradGreen)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="📋 Status dos Leads">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid-2">
          <ChartCard title="📸 Padrão vs Premium">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tipoData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
                <Bar dataKey="qtd" name="Qtd Leads" fill={COLORS.blue} radius={[6, 6, 0, 0]} />
                <Bar dataKey="faturamento" name="Faturado (R$)" fill={COLORS.purple} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="💳 Status de Pagamento">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pagamentoData} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="value">
                  {pagamentoData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 3 */}
        <div className="grid-2">
          <ChartCard title="📅 Evolução Semanal de Leads">
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
                <Line type="monotone" dataKey="leads" name="Leads" stroke={COLORS.blue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="vendas" name="Vendas" stroke={COLORS.green} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="🗓️ Comparativo Mensal">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip isMoney />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
                <Bar dataKey="leads" name="Leads" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Faturamento" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Funil */}
        <ChartCard title="🔽 Funil de Vendas (Pipeline)">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 180 }}>
            {funnelData.map((d, i) => {
              const maxVal = funnelData[0].value || 1;
              const pct = (d.value / maxVal) * 100;
              const barHeight = Math.max(pct * 1.5, d.value > 0 ? 20 : 0);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: d.fill }}>{d.value}</div>
                  <div style={{ width: '100%', height: barHeight, background: d.fill, borderRadius: '6px 6px 0 0', opacity: 0.85, transition: 'height 0.6s ease', minHeight: d.value > 0 ? 8 : 0 }} />
                  <div style={{ fontSize: 10, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.3 }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{maxVal > 0 ? `${((d.value / maxVal) * 100).toFixed(0)}%` : '0%'}</div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Bottom row: summary table */}
        <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>📋 Resumo Executivo do Período</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { label: 'Total de Leads', value: kpis.total.toString(), icon: '👥' },
              { label: 'Leads Pagos', value: kpis.paid.toString(), icon: '✅' },
              { label: 'A Cobrar / Pendente', value: filteredLeads.filter(l => ['pendente', 'cobrar'].includes(l.statusPagamento)).length.toString(), icon: '⚠️' },
              { label: 'Em Follow-up', value: filteredLeads.filter(l => l.statusPedido === 'followup').length.toString(), icon: '🔄' },
              { label: 'Aguardando', value: filteredLeads.filter(l => l.statusPedido === 'aguardando').length.toString(), icon: '⏳' },
              { label: 'Demonstrações', value: filteredLeads.filter(l => l.statusPedido === 'demonstracao').length.toString(), icon: '📸' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{item.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </>
  );
}
