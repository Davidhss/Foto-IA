import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LeadsDB, ProfilesDB } from '../lib/supabase';
import { STATUS_PEDIDO, TIPO_FOTO, fmtMoney } from '../lib/utils';
import type { Lead, LeadStats, Profile } from '../types';
import FireMeta from '../components/Dashboard/FireMeta';
import MetricCard from '../components/Dashboard/MetricCard';
import { useAuth } from '../App';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    total: 0, vendas: 0, aguardando: 0, followUp: 0,
    previas: 0, demonstracao: 0, entregue: 0, pendentes: 0,
    faturamento: 0, faturamentoHoje: 0, vendasHoje: 0,
  });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        // Busca leads (sem fotos) e profiles em paralelo para economizar tempo
        const [all, profs] = await Promise.all([
          LeadsDB.allLean(),
          ProfilesDB.all(),
        ]);
        setLeads(all);
        setProfiles(profs);
        setStats(await LeadsDB.stats(all));
      } catch (e) {
        console.error("Dashboard error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const metrics1 = [
    { icon: '💰', label: 'Faturado Hoje', value: stats.faturamentoHoje, color: '#10b981', isMoney: true },
    { icon: '✅', label: 'Vendas Hoje', value: stats.vendasHoje, color: '#10b981' },
    { icon: '⏳', label: 'Aguardando Entrega', value: stats.aguardando, color: '#f59e0b' },
    { icon: '💳', label: 'A Cobrar / Pendente', value: stats.pendentes, color: '#ef4444' },
  ];
  const metrics2 = [
    { icon: '🔄', label: 'Follow-up', value: stats.followUp, color: '#a855f7' },
    { icon: '👀', label: 'Prévias', value: stats.previas, color: '#3b82f6' },
    { icon: '📸', label: 'Demonstrações', value: stats.demonstracao, color: '#94a3b8' },
    { icon: '📊', label: 'Fat. Total Geral', value: stats.faturamento, color: '#7c3aed', isMoney: true },
  ];

  const demos = leads.filter(l => l.statusPedido === 'demonstracao');
  const recents = leads.slice(0, 8);

  // Leaderboard (now public)
  const leaderboard = profiles.filter(p => p.role === 'vendedor').map(p => {
    const pLeads = leads.filter(l => l.vendedorId === p.id);
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const fatHoje = pLeads.filter(l => {
      if (l.statusPagamento !== 'pago' || !l.dataCadastro) return false;
      const ld = new Date(l.dataCadastro);
      const lDate = `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
      return lDate === todayStr;
    }).reduce((s,l) => s + l.valorRecebido, 0);
    return { ...p, fatHoje, totalVendas: pLeads.length };
  }).sort((a,b) => b.fatHoje - a.fatHoje);

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">📊 Dashboard</div>
          <div className="topbar-sub" style={{ textTransform: 'capitalize' }}>{todayLabel}</div>
        </div>
        <motion.button className="btn btn-primary" onClick={() => navigate('/leads')} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          ➕ Nova Lead
        </motion.button>
      </div>

      <div className="page">
        {loading ? (
          <div className="empty-state" style={{ marginTop: 80 }}>
            <div className="icon" style={{ fontSize: 48 }}>⏳</div>
            <p>Carregando dashboard...</p>
          </div>
        ) : !profile ? (
          <div className="card mt-20" style={{ padding: 40, textAlign: 'center' }}>
            <h2 style={{ color: 'var(--red)', marginBottom: 16 }}>⚠️ Banco de Dados Incompleto</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 24 }}>O seu usuário fez login, mas as tabelas de segurança (perfis) não foram encontradas ou não foi possível carregar seu perfil.</p>
            <p><strong>Passo obrigatório:</strong> Vá no painel do Supabase, abra o <b>SQL Editor</b> e rode todo o conteúdo do arquivo <code>setup-equipe.sql</code>.</p>
          </div>
        ) : (
          <>
            {profile.role !== 'admin' && <FireMeta stats={stats} />}

            {/* Metrics Row 1 */}
            <div className="grid-4 mb-20">
              {metrics1.map((m, i) => (
                <MetricCard key={m.label} {...m} delay={i} />
              ))}
            </div>

            {/* Metrics Row 2 */}
            <div className="grid-4 mb-20">
              {metrics2.map((m, i) => (
                <MetricCard key={m.label} {...m} delay={i + 4} />
              ))}
            </div>

            <div className="grid-2">
              {/* Recent leads table */}
              <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <div className="section-header">
                  <div className="section-title">🕐 Leads Recentes</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leads')}>Ver todas →</button>
                </div>
                {recents.length === 0
                  ? <div className="empty-state" style={{ padding: 32 }}><p>Nenhuma lead ainda</p></div>
                  : (
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Nome</th><th>Tipo</th><th>Status</th><th>Valor</th></tr></thead>
                        <tbody>
                          {recents.map((l, i) => {
                            const sp = STATUS_PEDIDO[l.statusPedido];
                            const stipo = TIPO_FOTO[l.tipo];
                            return (
                              <motion.tr key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                                <td style={{ fontWeight: 600 }}>{l.nome}</td>
                                <td><span className="badge" style={{ background: stipo.bg, color: stipo.color }}>{stipo.label}</span></td>
                                <td><span className="badge" style={{ background: sp.bg, color: sp.color }}>{sp.label}</span></td>
                                <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtMoney(l.valorRecebido)}</td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              </motion.div>

              {/* Demo leads */}
              <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                <div className="section-header">
                  <div className="section-title">📸 Aguardando Demonstração</div>
                  <span className="badge" style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}>{demos.length}</span>
                </div>
                {demos.length === 0
                  ? <div className="empty-state" style={{ padding: 32 }}><p>Nenhuma demonstração pendente</p></div>
                  : demos.map(l => (
                    <motion.div key={l.id} className="card" style={{ marginBottom: 10, cursor: 'pointer', padding: '12px 14px' }}
                      onClick={() => navigate(`/leads/${l.id}`)}
                      whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{l.nome}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{l.whatsapp} · {l.qtdFotos} fotos</div>
                        </div>
                        <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                          className="btn btn-wa btn-sm" onClick={e => e.stopPropagation()}>💬 WA</a>
                      </div>
                    </motion.div>
                  ))
                }
              </motion.div>
            </div>

              <motion.div className="card mt-20" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="section-header">
                  <div className="section-title">🏆 Ranking de Vendas da Equipe (Hoje)</div>
                </div>
                {leaderboard.length === 0 ? (
                  <div className="empty-state" style={{ padding: 32 }}><p>Nenhum vendedor cadastrado</p></div>
                ) : (
                  <>
                    {leaderboard[0] && leaderboard[0].fatHoje > 0 && (
                      <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(217,119,6,0.2))', border: '1px solid rgba(251,191,36,0.3)', padding: 24, borderRadius: 12, marginBottom: 20, textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
                        <h3 style={{ color: '#fbbf24', fontSize: 24, marginBottom: 8 }}>Rei das Vendas: {leaderboard[0].nome}!</h3>
                        <p style={{ color: 'var(--text)', fontSize: 16 }}>Chorem, perdedores! O top 1 está amassando nas vendas. Quem vai ter coragem de passar ele?</p>
                      </div>
                    )}
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Vendedor</th>
                            <th>Leads Captados</th>
                            <th>Faturado Hoje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboard.map((v, i) => (
                            <tr key={v.id}>
                              <td style={{ fontWeight: 'bold', fontSize: i === 0 ? 18 : 14, color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'inherit' }}>
                                {i === 0 ? '👑 1º' : `${i + 1}º`}
                              </td>
                              <td style={{ fontWeight: 600 }}>{v.nome}</td>
                              <td>{v.totalVendas}</td>
                              <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtMoney(v.fatHoje)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </motion.div>
          </>
        )}
      </div>
    </>
  );
}
