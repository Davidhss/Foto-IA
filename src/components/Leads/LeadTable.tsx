import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LeadsDB } from '../../lib/supabase';
import { STATUS_PEDIDO, STATUS_PAG, TIPO_FOTO, fmtMoney, fmtDate } from '../../lib/utils';
import type { Lead, StatusPedido, StatusPagamento, TipoFoto } from '../../types';
import LeadModal from './LeadModal';

interface Props { leads: Lead[]; loading: boolean; onRefresh: () => void; }

type FilterPedido = StatusPedido | 'all';
type FilterPag = StatusPagamento | 'all';
type FilterTipo = TipoFoto | 'all';

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.25 } }),
};

export default function LeadTable({ leads, loading, onRefresh }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [fp, setFp] = useState<FilterPedido>('all');
  const [fpag, setFpag] = useState<FilterPag>('all');
  const [ftipo, setFtipo] = useState<FilterTipo>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | undefined>();

  const filtered = leads.filter(l => {
    if (fp !== 'all' && l.statusPedido !== fp) return false;
    if (fpag !== 'all' && l.statusPagamento !== fpag) return false;
    if (ftipo !== 'all' && l.tipo !== ftipo) return false;
    if (q) {
      const qq = q.toLowerCase();
      if (!l.nome.toLowerCase().includes(qq) && !l.whatsapp.includes(qq)) return false;
    }
    return true;
  });

  const openNew = () => { setEditLead(undefined); setModalOpen(true); };
  const openEdit = (l: Lead, e: React.MouseEvent) => { e.stopPropagation(); setEditLead(l); setModalOpen(true); };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Excluir esta lead?')) return;
    await LeadsDB.delete(id);
    toast.success('Lead excluída.');
    onRefresh();
  };

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">👥 Leads</div>
          <div className="topbar-sub">{filtered.length} leads encontradas</div>
        </div>
        <motion.button className="btn btn-primary" onClick={openNew} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          ➕ Nova Lead
        </motion.button>
      </div>

      <div className="page">
        {/* Filters */}
        <motion.div
          className="card mb-16"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <div className="search-wrap" style={{ flex: 2, minWidth: 180 }}>
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Buscar nome ou WhatsApp..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="form-control" style={{ flex: 1, minWidth: 130 }} value={fp} onChange={e => setFp(e.target.value as FilterPedido)}>
            <option value="all">Todos os status</option>
            {Object.entries(STATUS_PEDIDO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="form-control" style={{ flex: 1, minWidth: 130 }} value={fpag} onChange={e => setFpag(e.target.value as FilterPag)}>
            <option value="all">Todo pagamento</option>
            {Object.entries(STATUS_PAG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="form-control" style={{ flex: 1, minWidth: 110 }} value={ftipo} onChange={e => setFtipo(e.target.value as FilterTipo)}>
            <option value="all">Todos os tipos</option>
            {Object.entries(TIPO_FOTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </motion.div>

        {/* Table */}
        {loading ? (
          <div className="empty-state"><div className="icon">⏳</div><p>Carregando leads...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><p>Nenhuma lead encontrada</p></div>
        ) : (
          <motion.div className="table-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th><th>WhatsApp</th><th>Tipo</th><th>Fotos</th>
                  <th>Status</th><th>Pagamento</th><th>Valor</th><th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((l, i) => {
                    const sp = STATUS_PEDIDO[l.statusPedido];
                    const spag = STATUS_PAG[l.statusPagamento];
                    const stipo = TIPO_FOTO[l.tipo];
                    return (
                      <motion.tr
                        key={l.id}
                        custom={i} variants={rowVariants} initial="hidden" animate="visible"
                        onClick={() => navigate(`/leads/${l.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div style={{ fontWeight: 600 }}>{l.nome}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{fmtDate(l.dataCadastro)}</div>
                        </td>
                        <td>
                          <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ color: 'var(--green)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
                          >💬 {l.whatsapp}</a>
                        </td>
                        <td><span className="badge" style={{ background: stipo.bg, color: stipo.color }}>{stipo.label}</span></td>
                        <td style={{ fontWeight: 700, textAlign: 'center' }}>{l.qtdFotos}</td>
                        <td><span className="badge" style={{ background: sp.bg, color: sp.color }}>{sp.label}</span></td>
                        <td><span className="badge" style={{ background: spag.bg, color: spag.color }}>{spag.label}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtMoney(l.valorRecebido)}</td>
                        <td>
                          <div className="flex gap-8" onClick={e => e.stopPropagation()}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={e => openEdit(l, e)} title="Editar">✏️</button>
                            <button className="btn btn-danger btn-icon btn-sm" onClick={e => handleDelete(l.id, e)} title="Excluir">🗑️</button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      <LeadModal
        open={modalOpen}
        lead={editLead}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); onRefresh(); }}
      />
    </>
  );
}
