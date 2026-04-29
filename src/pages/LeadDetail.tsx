import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { LeadsDB } from '../lib/supabase';
import { STATUS_PEDIDO, STATUS_PAG, TIPO_FOTO, fmtMoney, fmtDate, fileToBase64 } from '../lib/utils';
import type { Lead } from '../types';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    const data = await LeadsDB.get(id);
    if (!data) { navigate('/leads'); return; }
    setLead(data);
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateStatus = async (field: 'statusPedido' | 'statusPagamento', value: string) => {
    if (!id || !lead) return;
    const updated = await LeadsDB.update(id, { [field]: value });
    setLead(updated);
    toast.success('Status atualizado!');
  };

  const handleUpload = async (files: FileList | null, tipo: 'cliente' | 'prontas') => {
    if (!files || !id) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { toast.error('Apenas imagens'); continue; }
      if (file.size > 10 * 1024 * 1024) { toast.error('Imagem muito grande (máx 10MB)'); continue; }
      const b64 = await fileToBase64(file);
      await LeadsDB.addFoto(id, tipo, b64);
      toast.success('Foto adicionada!');
    }
    refresh();
  };

  const removeFoto = async (tipo: 'cliente' | 'prontas', idx: number) => {
    if (!id) return;
    if (!confirm('Remover esta foto?')) return;
    await LeadsDB.removeFoto(id, tipo, idx);
    toast.success('Foto removida.');
    refresh();
  };

  const openLightbox = (src: string) => {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `<img src="${src}" alt="">`;
    lb.onclick = () => lb.remove();
    document.body.appendChild(lb);
  };

  if (loading) return <div className="empty-state" style={{ marginTop: 120 }}><div className="icon" style={{ fontSize: 48 }}>⏳</div><p>Carregando...</p></div>;
  if (!lead) return null;

  const sp = STATUS_PEDIDO[lead.statusPedido];
  const spag = STATUS_PAG[lead.statusPagamento];
  const stipo = TIPO_FOTO[lead.tipo];

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="flex items-center gap-12">
          <motion.button className="btn btn-ghost btn-sm" onClick={() => navigate('/leads')} whileHover={{ x: -2 }}>← Voltar</motion.button>
          <div>
            <div className="topbar-title">{lead.nome}</div>
            <div className="topbar-sub">Cadastrada em {fmtDate(lead.dataCadastro)}</div>
          </div>
        </div>
        <div className="flex gap-8">
          <span className="badge" style={{ background: stipo.bg, color: stipo.color }}>{stipo.label}</span>
          <span className="badge" style={{ background: sp.bg, color: sp.color }}>{sp.label}</span>
          <span className="badge" style={{ background: spag.bg, color: spag.color }}>{spag.label}</span>
          <a href={`https://wa.me/55${lead.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="btn btn-wa btn-sm">💬 WhatsApp</a>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditOpen(true)}>✏️ Editar</button>
        </div>
      </div>

      <div className="page">
        <div className="grid-2">
          {/* Info + Status */}
          <div>
            <motion.div className="card mb-16" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="section-title mb-16">📋 Informações</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 13 }}>
                {[
                  ['Nome', lead.nome], ['WhatsApp', lead.whatsapp],
                  ['Tipo', stipo.label], ['Qtd. Fotos', String(lead.qtdFotos)],
                  ['Valor Recebido', fmtMoney(lead.valorRecebido)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
                    <div style={{ fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
                {lead.observacao && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Observação</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{lead.observacao}</div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Status controls */}
            <motion.div className="card mb-16" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="section-title mb-16">🎛️ Atualizar Status</div>
              <div className="form-group">
                <label className="form-label">Status do Pedido</label>
                <select className="form-control" value={lead.statusPedido} onChange={e => updateStatus('statusPedido', e.target.value)}>
                  <option value="aguardando">Aguardando</option>
                  <option value="previa">Prévia</option>
                  <option value="entregue">Entregue</option>
                  <option value="followup">Follow-up</option>
                  <option value="demonstracao">Demonstração</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pagamento</label>
                <select className="form-control" value={lead.statusPagamento} onChange={e => updateStatus('statusPagamento', e.target.value)}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cobrar">Cobrar</option>
                </select>
              </div>
            </motion.div>

            {/* Histórico */}
            <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <div className="section-title mb-16">📜 Histórico</div>
              {lead.historico.length === 0
                ? <p style={{ fontSize: 12, color: 'var(--text2)' }}>Sem histórico</p>
                : lead.historico.slice().reverse().map((h, i) => {
                    const s = STATUS_PEDIDO[h.status] || { label: h.status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                        <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{fmtDate(h.data)}</span>
                      </motion.div>
                    );
                  })
              }
            </motion.div>
          </div>

          {/* Photos */}
          <div>
            <PhotoSection
              title="📁 Fotos de Referência (Cliente)"
              fotos={lead.fotosCliente}
              tipo="cliente"
              onUpload={handleUpload}
              onRemove={removeFoto}
              onLightbox={openLightbox}
            />
            <PhotoSection
              title="✅ Fotos Prontas (Entrega)"
              fotos={lead.fotosProntas}
              tipo="prontas"
              onUpload={handleUpload}
              onRemove={removeFoto}
              onLightbox={openLightbox}
            />
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editOpen && (
          <EditModal lead={lead} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); refresh(); }} />
        )}
      </AnimatePresence>
    </>
  );
}

// ===== PHOTO SECTION =====
function PhotoSection({ title, fotos, tipo, onUpload, onRemove, onLightbox }: {
  title: string; fotos: string[]; tipo: 'cliente' | 'prontas';
  onUpload: (files: FileList | null, tipo: 'cliente' | 'prontas') => void;
  onRemove: (tipo: 'cliente' | 'prontas', idx: number) => void;
  onLightbox: (src: string) => void;
}) {
  return (
    <motion.div className="card mb-16" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: tipo === 'cliente' ? 0.1 : 0.18 }}>
      <div className="section-title mb-16">{title}</div>
      <div className="upload-zone" style={{ marginBottom: 12 }}>
        <input type="file" accept="image/*" multiple onChange={e => onUpload(e.target.files, tipo)} />
        <div style={{ fontSize: 22, marginBottom: 4 }}>📤</div>
        <p>Clique ou arraste fotos aqui</p>
      </div>
      {fotos.length > 0 && (
        <div className="photo-grid">
          <AnimatePresence>
            {fotos.map((src, i) => (
              <motion.div key={i} className="photo-thumb"
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                transition={{ delay: i * 0.05 }}>
                <img src={src} alt="" onClick={() => onLightbox(src)} />
                <button className="photo-del" onClick={() => onRemove(tipo, i)}>✕</button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ===== EDIT MODAL =====
function EditModal({ lead, onClose, onSaved }: { lead: Lead; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    nome: lead.nome, whatsapp: lead.whatsapp, qtdFotos: lead.qtdFotos,
    tipo: lead.tipo, valorRecebido: lead.valorRecebido, observacao: lead.observacao,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await LeadsDB.update(lead.id, form);
    toast.success('Lead atualizada! ✅');
    setSaving(false);
    onSaved();
  };

  return (
    <motion.div style={{ position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(8px)' }} />
      <motion.div style={{ position:'relative',background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:16,padding:28,width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto' }}
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-16">
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>✏️ Editar Lead</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Nome</label><input className="form-control" value={form.nome} onChange={e => set('nome', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-control" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Qtd. Fotos</label><input type="number" min={1} className="form-control" value={form.qtdFotos} onChange={e => set('qtdFotos', +e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Tipo</label><select className="form-control" value={form.tipo} onChange={e => set('tipo', e.target.value)}><option value="padrao">Padrão</option><option value="premium">Premium</option></select></div>
          </div>
          <div className="form-group"><label className="form-label">Valor Recebido (R$)</label><input type="number" min={0} step={0.01} className="form-control" value={form.valorRecebido} onChange={e => set('valorRecebido', +e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Observação</label><textarea className="form-control" rows={2} value={form.observacao} onChange={e => set('observacao', e.target.value)} /></div>
          <div className="flex gap-8" style={{ justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <motion.button type="submit" className="btn btn-primary" disabled={saving} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>{saving ? '⏳ Salvando...' : '💾 Salvar'}</motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
