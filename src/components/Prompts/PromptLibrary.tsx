import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { PromptsDB } from '../../lib/supabase';
import { fileToBase64 } from '../../lib/utils';
import type { Prompt } from '../../types';
import styles from './PromptCard.module.css';

interface Props {
  prompts: Prompt[];
  loading: boolean;
  onRefresh: () => void;
}

interface ModalState { open: boolean; prompt?: Prompt; }

export default function PromptLibrary({ prompts, loading, onRefresh }: Props) {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('all');
  const [modal, setModal] = useState<ModalState>({ open: false });

  const allTags = [...new Set(prompts.flatMap(p => p.tags))].sort();

  const filtered = prompts.filter(p => {
    if (tag !== 'all' && !p.tags.includes(tag)) return false;
    if (q) {
      const qq = q.toLowerCase();
      return p.titulo.toLowerCase().includes(qq) || p.texto.toLowerCase().includes(qq) || p.tags.join(' ').includes(qq);
    }
    return true;
  });

  const copy = (p: Prompt) => {
    navigator.clipboard.writeText(p.texto)
      .then(() => toast.success('Prompt copiado! 📋'))
      .catch(() => toast.error('Erro ao copiar'));
  };

  const del = async (id: string) => {
    if (!confirm('Excluir este prompt?')) return;
    await PromptsDB.delete(id);
    toast.success('Prompt excluído.');
    onRefresh();
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">✨ Biblioteca de Prompts</div>
          <div className="topbar-sub">{filtered.length} prompts</div>
        </div>
        <motion.button className="btn btn-primary" onClick={() => setModal({ open: true })} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          ➕ Novo Prompt
        </motion.button>
      </div>

      <div className="page">
        {/* Search + tags */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-20">
          <div className="search-wrap mb-16">
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Buscar prompts..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            <button className={`tag-btn ${tag === 'all' ? 'active' : ''}`} onClick={() => setTag('all')}>Todos</button>
            {allTags.map(t => (
              <button key={t} className={`tag-btn ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>{t}</button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="empty-state"><div className="icon">⏳</div><p>Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">✨</div><p>Nenhum prompt encontrado</p></div>
        ) : (
          <div className="grid-auto">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  className={styles.card}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.28 }}
                  whileHover={{ y: -4, transition: { duration: 0.18 } }}
                >
                  {p.imagem
                    ? <img src={p.imagem} className={styles.img} alt={p.titulo} onClick={() => {
                        const lb = document.createElement('div');
                        lb.className = 'lightbox';
                        lb.innerHTML = `<img src="${p.imagem}" alt="">`;
                        lb.onclick = () => lb.remove();
                        document.body.appendChild(lb);
                      }} />
                    : <div className={styles.imgPlaceholder}><span>✨</span></div>
                  }
                  <div className={styles.body}>
                    <div className={styles.titulo}>{p.titulo}</div>
                    <div className={styles.texto}>{p.texto}</div>
                  </div>
                  <div className={styles.footer}>
                    <div className={styles.tags}>{p.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}</div>
                    <div className="flex gap-8">
                      <motion.button className="btn btn-ghost btn-icon btn-sm" onClick={() => copy(p)} title="Copiar" whileTap={{ scale: 0.9 }}>📋</motion.button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal({ open: true, prompt: p })} title="Editar">✏️</button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => del(p.id)} title="Excluir">🗑️</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {modal.open && (
        <PromptModal
          prompt={modal.prompt}
          onClose={() => setModal({ open: false })}
          onSaved={() => { setModal({ open: false }); onRefresh(); }}
        />
      )}
    </>
  );
}

// ===== PROMPT MODAL =====
function PromptModal({ prompt, onClose, onSaved }: { prompt?: Prompt; onClose: () => void; onSaved: () => void }) {
  const [titulo, setTitulo] = useState(prompt?.titulo ?? '');
  const [texto, setTexto] = useState(prompt?.texto ?? '');
  const [tags, setTags] = useState((prompt?.tags ?? []).join(', '));
  const [imagem, setImagem] = useState<string | null>(prompt?.imagem ?? null);
  const [saving, setSaving] = useState(false);

  const handleImg = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setImagem(b64);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !texto.trim()) { toast.error('Título e texto são obrigatórios'); return; }
    setSaving(true);
    const data = { titulo: titulo.trim(), texto: texto.trim(), tags: tags.split(',').map(t => t.trim()).filter(Boolean), imagem };
    try {
      if (prompt) { await PromptsDB.update(prompt.id, data); toast.success('Prompt atualizado!'); }
      else { await PromptsDB.create(data); toast.success('Prompt salvo! ✅'); }
      onSaved();
    } catch { toast.error('Erro ao salvar.'); }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        style={{ position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(8px)' }} />
        <motion.div
          style={{ position:'relative',background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:16,padding:28,width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto' }}
          initial={{ scale: 0.92, y: 22 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-16">
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{prompt ? '✏️ Editar Prompt' : '✨ Novo Prompt'}</h2>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input className="form-control" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nome do prompt" />
            </div>
            <div className="form-group">
              <label className="form-label">Texto do Prompt *</label>
              <textarea className="form-control" rows={5} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Cole o prompt aqui..." />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (separadas por vírgula)</label>
              <input className="form-control" value={tags} onChange={e => setTags(e.target.value)} placeholder="retrato, anime, realista" />
            </div>
            <div className="form-group">
              <label className="form-label">Imagem de Resultado</label>
              <div className="upload-zone" style={{ padding: 16 }}>
                <input type="file" accept="image/*" onChange={handleImg} />
                {imagem
                  ? <img src={imagem} style={{ maxHeight: 120, borderRadius: 8, objectFit: 'cover', width: '100%' }} alt="" />
                  : <><div style={{ fontSize: 24 }}>🖼️</div><p>Clique para adicionar imagem</p></>
                }
              </div>
            </div>
            <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Salvando...' : '💾 Salvar'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
