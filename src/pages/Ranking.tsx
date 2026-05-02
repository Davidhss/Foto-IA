import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { LeadsDB } from '../lib/supabase';
import { fmtMoney } from '../lib/utils';
import type { Lead, Profile } from '../types';
import { useAuth } from '../App';

type Period = 'today' | 'week' | 'month' | 'all' | 'custom';
const PERIOD_LABELS: Record<string, string> = {
  today: 'Hoje', week: 'Esta Semana', month: 'Este Mês', all: 'Tudo', custom: 'Período',
};

interface SellerRank {
  profile: Profile;
  totalLeads: number;
  totalSales: number;
  revenue: number;
  avgTicket: number;
  convRate: number;
  leads: Lead[];
}

const MEDAL = ['👑', '🥈', '🥉'];
const RANK_COLORS = ['#fbbf24', '#94a3b8', '#b45309', '#7c3aed', '#3b82f6', '#10b981'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      {label && <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.fill || 'var(--text)', fontWeight: 600 }}>
          {fmtMoney(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function Ranking() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const { teamMemberIds, teamProfiles } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const memberFilter = teamMemberIds.length > 0 ? teamMemberIds : undefined;
        const all = await LeadsDB.allLean(memberFilter);
        setLeads(all);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [teamMemberIds]);

  const filteredLeads = useMemo(() => {
    let cutoff: Date | null = null;
    let endDate: Date | null = null;

    if (period === 'today') { cutoff = new Date(); cutoff.setHours(0, 0, 0, 0); }
    else if (period === 'week') { cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7); }
    else if (period === 'month') { cutoff = new Date(); cutoff.setDate(1); cutoff.setHours(0, 0, 0, 0); }
    else if (period === 'custom' && customFrom) {
      cutoff = new Date(customFrom + 'T00:00:00');
      if (customTo) { endDate = new Date(customTo + 'T23:59:59'); }
    }

    return leads.filter(l => {
      if (!l.dataCadastro) return false;
      const d = new Date(l.dataCadastro);
      if (cutoff && d < cutoff) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [leads, period, customFrom, customTo]);

  const ranking: SellerRank[] = useMemo(() => {
    const sellers = teamProfiles.filter(p => p.role === 'vendedor' || p.role === 'admin');
    const allProfiles = sellers.length > 0 ? sellers : teamProfiles;

    return allProfiles.map(p => {
      const pLeads = filteredLeads.filter(l => l.vendedorId === p.id);
      const paid = pLeads.filter(l => l.statusPagamento === 'pago');
      const revenue = paid.reduce((s, l) => s + l.valorRecebido, 0);
      return {
        profile: p,
        totalLeads: pLeads.length,
        totalSales: paid.length,
        revenue,
        avgTicket: paid.length > 0 ? revenue / paid.length : 0,
        convRate: pLeads.length > 0 ? (paid.length / pLeads.length * 100) : 0,
        leads: pLeads,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [filteredLeads, teamProfiles]);

  const king = ranking[0];
  const barData = ranking.map(r => ({ name: r.profile.nome.split(' ')[0], revenue: r.revenue, rank: ranking.indexOf(r) }));

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state" style={{ marginTop: 80 }}>
          <div className="icon" style={{ fontSize: 48 }}>⏳</div>
          <p>Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">🏆 Ranking da Equipe</div>
          <div className="topbar-sub">Quem está dominando as vendas?</div>
        </div>
        <div className="flex gap-8 items-center" style={{ flexWrap: 'wrap' }}>
          {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([p, label]) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); if (p === 'custom') setShowCustom(true); else setShowCustom(false); }}
              className="btn btn-sm"
              style={{
                background: period === p ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--bg3)',
                color: period === p ? '#fff' : 'var(--text2)',
                border: period === p ? 'none' : '1px solid var(--border)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Custom date range */}
        <AnimatePresence>
          {showCustom && (
            <motion.div
              className="card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}
            >
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="form-label">De</label>
                <input type="date" className="form-control" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="form-label">Até</label>
                <input type="date" className="form-control" value={customTo} onChange={e => setCustomTo(e.target.value)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {ranking.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>Nenhum dado disponível no período selecionado</p>
          </div>
        ) : (
          <>
            {/* King of Sales banner */}
            {king && king.revenue > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(217,119,6,0.15))',
                  border: '1px solid rgba(251,191,36,0.3)',
                  borderRadius: 16,
                  padding: '28px 32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                }}
              >
                <motion.div
                  style={{ fontSize: 60, lineHeight: 1 }}
                  animate={{ rotate: [-8, 8, -5, 5, 0], y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                >
                  👑
                </motion.div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>
                    Rei das Vendas — {PERIOD_LABELS[period]}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fef3c7', lineHeight: 1.1, marginBottom: 8 }}>
                    {king.profile.nome}
                  </div>
                  <div style={{ color: 'var(--text2)', fontSize: 13 }}>
                    Chorem, perdedores! O top 1 está destruindo nas vendas. Quem vai ter coragem de superar?
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fbbf24' }}>{fmtMoney(king.revenue)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>faturado</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginTop: 4 }}>{king.totalSales} vendas</div>
                </div>
              </motion.div>
            )}

            {/* Chart + Table row */}
            <div className="grid-2">
              {/* Bar chart */}
              <motion.div className="card" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }}>
                <div className="section-title" style={{ marginBottom: 20 }}>📊 Faturamento por Vendedor</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                      {barData.map((_, i) => <Cell key={i} fill={RANK_COLORS[i % RANK_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Summary cards for top 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ranking.slice(0, 3).map((r, i) => (
                  <motion.div
                    key={r.profile.id}
                    className="card"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{ padding: '16px 20px', border: i === 0 ? '1px solid rgba(251,191,36,0.3)' : undefined }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-12">
                        <div style={{ fontSize: 26, lineHeight: 1 }}>{MEDAL[i] || `${i + 1}º`}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{r.profile.nome}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.totalLeads} leads · {r.convRate.toFixed(0)}% conv.</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: RANK_COLORS[i] }}>{fmtMoney(r.revenue)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>ticket: {fmtMoney(r.avgTicket)}</div>
                      </div>
                    </div>
                    {/* mini progress bar */}
                    <div className="progress-bar" style={{ marginTop: 10 }}>
                      <div className="progress-fill" style={{ width: `${king.revenue > 0 ? (r.revenue / king.revenue * 100) : 0}%`, background: RANK_COLORS[i] }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Full ranking table */}
            <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>📋 Tabela Completa de Ranking</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Vendedor</th>
                      <th>Leads Captados</th>
                      <th>Vendas Pagas</th>
                      <th>Faturamento</th>
                      <th>Ticket Médio</th>
                      <th>Conversão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r, i) => (
                      <motion.tr
                        key={r.profile.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <td>
                          <span style={{ fontSize: i < 3 ? 18 : 13, fontWeight: 'bold', color: RANK_COLORS[i] }}>
                            {MEDAL[i] || `${i + 1}º`}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-8">
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: `${RANK_COLORS[i]}22`,
                              border: `2px solid ${RANK_COLORS[i]}55`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: 13, color: RANK_COLORS[i],
                            }}>
                              {r.profile.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{r.profile.nome}</div>
                              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize' }}>{r.profile.role}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{r.totalLeads}</td>
                        <td><span style={{ color: 'var(--green)', fontWeight: 700 }}>{r.totalSales}</span></td>
                        <td style={{ fontWeight: 800, color: RANK_COLORS[i] }}>{fmtMoney(r.revenue)}</td>
                        <td style={{ color: 'var(--text2)' }}>{fmtMoney(r.avgTicket)}</td>
                        <td>
                          <div className="flex items-center gap-8">
                            <div className="progress-bar" style={{ width: 60, display: 'inline-block' }}>
                              <div className="progress-fill" style={{ width: `${r.convRate}%`, background: r.convRate >= 50 ? 'var(--green)' : r.convRate >= 25 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{r.convRate.toFixed(0)}%</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </>
  );
}
