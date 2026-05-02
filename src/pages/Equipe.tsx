import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UserCog, BarChart2, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { ProfilesDB, LeadsDB, sb } from '../lib/supabase';
import { fmtMoney, fmtDate, STATUS_PEDIDO } from '../lib/utils';
import type { Profile, Lead } from '../types';
import { useAuth } from '../App';

type Tab = 'gestao' | 'desempenho';
type Period = 'today' | '7d' | '30d' | 'month' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje', '7d': '7 dias', '30d': '30 dias', month: 'Este mês', all: 'Tudo',
};

const dateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const shortDate = (iso: string) => { const [,m,d] = iso.split('-'); return `${d}/${m}`; };

export default function Equipe() {
  const { profile, team, teamProfiles, reloadTeam } = useAuth();
  const [tab, setTab] = useState<Tab>('gestao');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Gestão state
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newRole, setNewRole] = useState('vendedor');
  const [adding, setAdding] = useState(false);

  // Desempenho state
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [memberLeads, setMemberLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [period, setPeriod] = useState<Period>('month');

  const load = async () => {
    setLoading(true);
    try { setProfiles(await ProfilesDB.all()); }
    catch { toast.error('Erro ao carregar equipe'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // When member selected, load their leads
  useEffect(() => {
    if (!selectedMember) return;
    (async () => {
      setLoadingLeads(true);
      try {
        const all = await LeadsDB.allLean([selectedMember.id]);
        setMemberLeads(all);
      } catch { toast.error('Erro ao carregar leads'); }
      setLoadingLeads(false);
    })();
  }, [selectedMember]);

  const filteredLeads = useMemo(() => {
    const now = new Date();
    if (period === 'all') return memberLeads;
    const cutoff = new Date();
    if (period === 'today') cutoff.setHours(0,0,0,0);
    else if (period === '7d') cutoff.setDate(now.getDate()-7);
    else if (period === '30d') cutoff.setDate(now.getDate()-30);
    else if (period === 'month') { cutoff.setDate(1); cutoff.setHours(0,0,0,0); }
    return memberLeads.filter(l => l.dataCadastro && new Date(l.dataCadastro) >= cutoff);
  }, [memberLeads, period]);

  const memberStats = useMemo(() => {
    const paid = filteredLeads.filter(l => l.statusPagamento === 'pago');
    const revenue = paid.reduce((s,l) => s + l.valorRecebido, 0);
    return {
      total: filteredLeads.length,
      paid: paid.length,
      revenue,
      avgTicket: paid.length > 0 ? revenue / paid.length : 0,
      convRate: filteredLeads.length > 0 ? (paid.length / filteredLeads.length * 100) : 0,
      pending: filteredLeads.filter(l => ['pendente','cobrar'].includes(l.statusPagamento)).length,
    };
  }, [filteredLeads]);

  const revenueByDay = useMemo(() => {
    const days = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : period === 'month' ? 31 : 60;
    const map: Record<string, number> = {};
    filteredLeads.filter(l => l.statusPagamento === 'pago' && l.dataCadastro).forEach(l => {
      const d = dateStr(new Date(l.dataCadastro));
      map[d] = (map[d] || 0) + l.valorRecebido;
    });
    const result = [];
    for (let i = Math.min(days, 60); i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = dateStr(d);
      result.push({ date: shortDate(key), value: map[key] || 0 });
    }
    return result;
  }, [filteredLeads, period]);

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await ProfilesDB.updateRole(id, role);
      toast.success('Permissão atualizada!');
      setProfiles(p => p.map(x => x.id === id ? { ...x, role: role as any } : x));
    } catch { toast.error('Erro ao atualizar permissão'); }
  };

  const handleAddToTeam = async (profileId: string) => {
    if (!team) { toast.error('Nenhum time configurado'); return; }
    try {
      await ProfilesDB.updateTeam(profileId, team.id);
      toast.success('Membro adicionado ao time!');
      await reloadTeam();
      load();
    } catch { toast.error('Erro ao adicionar ao time'); }
  };

  const handleRemoveFromTeam = async (profileId: string) => {
    try {
      await ProfilesDB.updateTeam(profileId, null);
      toast.success('Membro removido do time');
      await reloadTeam();
      load();
    } catch { toast.error('Erro ao remover do time'); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newNome) return toast.error('Preencha os campos obrigatórios');
    setAdding(true);
    try {
      const { error } = await sb.auth.signUp({
        email: newEmail, password: newPassword,
        options: { data: { nome: newNome, role: newRole, team_id: team?.id } },
      });
      if (error) throw error;
      toast.success('Usuário criado! Confirme o e-mail se necessário.');
      setShowAdd(false); setNewEmail(''); setNewPassword(''); setNewNome(''); setNewRole('vendedor');
      load();
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    setAdding(false);
  };

  const teamMemberSet = new Set(teamProfiles.map(p => p.id));

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      {/* Header */}
      <header style={{ padding: '0 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            Equipe {team ? `— ${team.name}` : ''}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Gerencie membros, permissões e desempenho individual</p>
        </div>
        {tab === 'gestao' && (
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} /> Novo Membro
          </button>
        )}
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 24 }}>
        {([['gestao', Users, 'Gestão'], ['desempenho', BarChart2, 'Desempenho']] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
              border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .18s',
              background: tab === key ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'transparent',
              color: tab === key ? '#fff' : 'var(--text2)',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ===== TAB: GESTÃO ===== */}
      {tab === 'gestao' && (
        <>
          {/* Add user form */}
          <AnimatePresence>
            {showAdd && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16 }}>Adicionar Membro</h3>
                <form onSubmit={handleAddUser} className="grid-2">
                  <div className="form-group"><label className="form-label">Nome Completo</label><input className="form-control" value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="Ex: João Silva" /></div>
                  <div className="form-group"><label className="form-label">E-mail</label><input type="email" className="form-control" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="joao@fotoia.com" /></div>
                  <div className="form-group"><label className="form-label">Senha Provisória</label><input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" /></div>
                  <div className="form-group">
                    <label className="form-label">Cargo</label>
                    <select className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)}>
                      <option value="vendedor">Vendedor</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={adding}>{adding ? 'Criando...' : 'Criar Conta'}</button>
                  </div>
                </form>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--red)', background: 'rgba(255,0,0,0.08)', padding: 10, borderRadius: 8 }}>
                  ⚠️ Ao criar usuário aqui você pode ser deslogado. Prefira criar no painel do Supabase.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Members table */}
          {loading ? <div style={{ color: 'var(--text2)' }}>Carregando...</div> : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Membro</th>
                    <th>Cargo</th>
                    <th>Cadastrado</th>
                    <th>Time</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => {
                    const inTeam = teamMemberSet.has(p.id);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="flex items-center gap-12">
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--accent2)' }}>
                              {p.nome.charAt(0).toUpperCase()}
                            </div>
                            <strong>{p.nome}</strong>
                          </div>
                        </td>
                        <td>
                          <select className="form-control" style={{ padding: '5px 10px', fontSize: 12, width: 130 }} value={p.role} onChange={e => handleRoleChange(p.id, e.target.value)}>
                            <option value="admin">Admin</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="editor">Editor</option>
                          </select>
                        </td>
                        <td style={{ color: 'var(--text2)', fontSize: 12 }}>{fmtDate(p.createdAt)}</td>
                        <td>
                          {inTeam
                            ? <span className="badge" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--green)' }}>✓ No time</span>
                            : <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>Fora do time</span>}
                        </td>
                        <td>
                          <div className="flex gap-8">
                            {!inTeam ? (
                              <button className="btn btn-sm btn-ghost" onClick={() => handleAddToTeam(p.id)}>+ Time</button>
                            ) : profile?.id !== p.id ? (
                              <button className="btn btn-sm btn-danger" onClick={() => handleRemoveFromTeam(p.id)}>Remover</button>
                            ) : null}
                            <button className="btn btn-ghost btn-icon btn-sm" title="Detalhes" onClick={() => { setSelectedMember(p); setTab('desempenho'); }}>
                              <UserCog size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== TAB: DESEMPENHO ===== */}
      {tab === 'desempenho' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Member selector + Period */}
          <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 200, flex: 1 }}>
              <label className="form-label">Selecionar Membro</label>
              <select className="form-control" value={selectedMember?.id || ''} onChange={e => {
                const found = teamProfiles.find(p => p.id === e.target.value) || profiles.find(p => p.id === e.target.value);
                setSelectedMember(found || null);
              }}>
                <option value="">-- Escolha um membro --</option>
                {(teamProfiles.length > 0 ? teamProfiles : profiles).map(p => (
                  <option key={p.id} value={p.id}>{p.nome} ({p.role})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className="btn btn-sm"
                  style={{ background: period === p ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--bg3)', color: period === p ? '#fff' : 'var(--text2)', border: period === p ? 'none' : '1px solid var(--border)' }}>
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {!selectedMember ? (
            <div className="empty-state">
              <div className="icon">👆</div>
              <p>Selecione um membro para ver o desempenho</p>
            </div>
          ) : loadingLeads ? (
            <div className="empty-state"><div className="icon">⏳</div><p>Carregando dados...</p></div>
          ) : (
            <>
              {/* Member KPIs */}
              <div className="grid-4">
                {[
                  { icon: '💰', label: 'Faturamento', value: fmtMoney(memberStats.revenue), color: '#10b981' },
                  { icon: '✅', label: 'Vendas Pagas', value: memberStats.paid.toString(), color: '#10b981' },
                  { icon: '📈', label: 'Conversão', value: `${memberStats.convRate.toFixed(1)}%`, color: '#3b82f6' },
                  { icon: '🎯', label: 'Ticket Médio', value: fmtMoney(memberStats.avgTicket), color: '#a855f7' },
                ].map((kpi, i) => (
                  <motion.div key={kpi.label} className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: kpi.color, borderRadius: '14px 14px 0 0' }} />
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{kpi.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, marginBottom: 3 }}>{kpi.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{kpi.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Revenue chart */}
              <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="section-title" style={{ marginBottom: 16 }}>
                  📊 Faturamento de {selectedMember.nome} — {PERIOD_LABELS[period]}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueByDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gradMember" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`} />
                    <Tooltip formatter={(v: any) => fmtMoney(v)} contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} fill="url(#gradMember)" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Leads table */}
              <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="section-header">
                  <div className="section-title">📋 Histórico de Leads ({filteredLeads.length})</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--green)' }}>{memberStats.paid} pagos</span>
                    <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--red)' }}>{memberStats.pending} pendentes</span>
                  </div>
                </div>
                {filteredLeads.length === 0 ? (
                  <div className="empty-state" style={{ padding: 32 }}><p>Nenhum lead no período</p></div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Nome</th><th>Status Pedido</th><th>Pagamento</th><th>Valor</th><th>Data</th></tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((l, i) => {
                          const sp = STATUS_PEDIDO[l.statusPedido];
                          const pagColor = l.statusPagamento === 'pago' ? 'var(--green)' : l.statusPagamento === 'cobrar' ? 'var(--red)' : 'var(--yellow)';
                          const pagLabel = { pago: 'Pago', pendente: 'Pendente', cobrar: 'Cobrar' }[l.statusPagamento];
                          return (
                            <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                              <td style={{ fontWeight: 600 }}>{l.nome}</td>
                              <td><span className="badge" style={{ background: sp.bg, color: sp.color }}>{sp.label}</span></td>
                              <td><span className="badge" style={{ background: `${pagColor}22`, color: pagColor }}>{pagLabel}</span></td>
                              <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtMoney(l.valorRecebido)}</td>
                              <td style={{ color: 'var(--text2)', fontSize: 12 }}>{fmtDate(l.dataCadastro)}</td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
