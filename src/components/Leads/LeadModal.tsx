import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { LeadsDB, ProfilesDB } from '../../lib/supabase';
import type { Lead, Profile, TipoFoto, StatusPedido, StatusPagamento } from '../../types';
import { useAuth } from '../../App';

interface Props {
  open: boolean;
  lead?: Lead;
  onClose: () => void;
  onSaved: () => void;
}

type FormState = {
  nome: string; whatsapp: string; qtdFotos: number;
  tipo: TipoFoto; statusPedido: StatusPedido; statusPagamento: StatusPagamento;
  valorRecebido: number; observacao: string; vendedorId: string; editorId: string;
};

const defaultForm: FormState = {
  nome: '', whatsapp: '', qtdFotos: 1, tipo: 'padrao',
  statusPedido: 'aguardando', statusPagamento: 'pendente',
  valorRecebido: 0, observacao: '', vendedorId: '', editorId: ''
};

export default function LeadModal({ open, lead, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { profile: currentUser } = useAuth();
  const isEdit = !!lead;

  useEffect(() => {
    if (open) {
      ProfilesDB.all().then(setProfiles).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (lead) {
      setForm({ 
        nome: lead.nome, whatsapp: lead.whatsapp, qtdFotos: lead.qtdFotos, tipo: lead.tipo,
        statusPedido: lead.statusPedido, statusPagamento: lead.statusPagamento,
        valorRecebido: lead.valorRecebido, observacao: lead.observacao,
        vendedorId: lead.vendedorId || '', editorId: lead.editorId || ''
      });
    } else {
      setForm({ ...defaultForm, vendedorId: currentUser?.id || '' });
    }
  }, [lead, open, currentUser]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.whatsapp.trim()) {
      toast.error('Nome e WhatsApp são obrigatórios'); return;
    }
    setSaving(true);
    try {
      const dataToSave: any = { ...form };
      if (!dataToSave.vendedorId) delete dataToSave.vendedorId;
      if (!dataToSave.editorId) delete dataToSave.editorId;

      if (isEdit && lead) { await LeadsDB.update(lead.id, dataToSave); toast.success('Lead atualizada! ✅'); }
      else { await LeadsDB.create(dataToSave); toast.success('Lead cadastrada! 🎉'); }
      onSaved();
    } catch { toast.error('Erro ao salvar.'); }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={{ position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)' }} />
          <motion.div
            style={{ position:'relative',background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:16,padding:28,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto' }}
            initial={{ scale: 0.93, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-16">
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? '✏️ Editar Lead' : '➕ Nova Lead'}</h2>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-control" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Ana Silva" />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp *</label>
                  <input className="form-control" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Qtd. de Fotos</label>
                  <input type="number" className="form-control" min={1} value={form.qtdFotos} onChange={e => set('qtdFotos', +e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-control" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                    <option value="padrao">Padrão</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status do Pedido</label>
                  <select className="form-control" value={form.statusPedido} onChange={e => set('statusPedido', e.target.value)}>
                    <option value="aguardando">Aguardando</option>
                    <option value="previa">Prévia</option>
                    <option value="entregue">Entregue</option>
                    <option value="followup">Follow-up</option>
                    <option value="demonstracao">Demonstração</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pagamento</label>
                  <select className="form-control" value={form.statusPagamento} onChange={e => set('statusPagamento', e.target.value)}>
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="cobrar">Cobrar</option>
                  </select>
                </div>
              </div>
              
              <div className="grid-2" style={{ marginTop: 12, marginBottom: 12, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px dashed var(--border2)' }}>
                <div className="form-group mb-0">
                  <label className="form-label" style={{ color: 'var(--text2)' }}>👤 Vendedor Responsável</label>
                  <select className="form-control" value={form.vendedorId} onChange={e => set('vendedorId', e.target.value)}>
                    <option value="">Não atribuído</option>
                    {profiles.filter(p => p.role !== 'editor').map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label" style={{ color: 'var(--text2)' }}>🎨 Editor Responsável</label>
                  <select className="form-control" value={form.editorId} onChange={e => set('editorId', e.target.value)}>
                    <option value="">Não atribuído</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Valor Recebido (R$)</label>
                <input type="number" className="form-control" min={0} step={0.01} value={form.valorRecebido} onChange={e => set('valorRecebido', +e.target.value)} placeholder="0,00" />
              </div>
              <div className="form-group">
                <label className="form-label">Observação</label>
                <textarea className="form-control" rows={2} value={form.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Notas adicionais..." />
              </div>
              <div className="flex gap-8" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                <motion.button type="submit" className="btn btn-primary" disabled={saving}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  {saving ? '⏳ Salvando...' : '💾 Salvar Lead'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
