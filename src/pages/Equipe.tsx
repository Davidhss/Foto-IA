import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProfilesDB, sb } from '../lib/supabase';
import type { Profile } from '../types';

export default function Equipe() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create user state
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newRole, setNewRole] = useState('vendedor');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setProfiles(await ProfilesDB.all());
    } catch (e) {
      toast.error('Erro ao carregar equipe');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await ProfilesDB.updateRole(id, role);
      toast.success('Permissão atualizada!');
      setProfiles(p => p.map(x => x.id === id ? { ...x, role: role as any } : x));
    } catch (e) {
      toast.error('Erro ao atualizar permissão');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newNome) return toast.error('Preencha os campos obrigatórios');
    setAdding(true);
    try {
      // Create user via Supabase Admin API or regular signup
      // Note: Regular signUp will log the admin out if email confirmations are off,
      // but in this setup we'll assume the admin uses the Supabase dashboard to create the true auth accounts
      // if they don't want to get logged out. 
      // A better way is using a server-side function, but for now we try to use standard signUp.
      // ACTUALLY: Supabase standard signUp logs the current user out or changes session if auto confirm is on.
      // We will show a warning.
      const { error } = await sb.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: { nome: newNome, role: newRole }
        }
      });
      if (error) throw error;
      toast.success('Usuário criado! Ele precisa confirmar o e-mail (se configurado).');
      setShowAdd(false);
      setNewEmail(''); setNewPassword(''); setNewNome(''); setNewRole('vendedor');
      load();
    } catch (e: any) {
      toast.error('Erro ao criar usuário: ' + e.message);
    }
    setAdding(false);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <header className="page-header flex justify-between items-center">
        <div>
          <h1>Gestão da Equipe</h1>
          <p>Adicione membros e gerencie permissões</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> Novo Membro
        </button>
      </header>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }}
          className="card" style={{ marginBottom: 24 }}
        >
          <h3 className="mb-16">Adicionar Membro</h3>
          <form onSubmit={handleAddUser} className="grid-2">
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input className="form-control" value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="Ex: João Silva" />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input type="email" className="form-control" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="joao@fotoia.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Senha Provisória</label>
              <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo</label>
              <select className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="vendedor">Vendedor (Capta e vende)</option>
                <option value="editor">Editor (Produz as fotos)</option>
                <option value="admin">Administrador (Acesso Total)</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={adding}>
                {adding ? 'Criando...' : 'Criar Conta'}
              </button>
            </div>
          </form>
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--red)', background: 'rgba(255,0,0,0.1)', padding: 12, borderRadius: 8 }}>
            ⚠️ <strong>Atenção:</strong> Ao criar um usuário por aqui, dependendo da configuração do Supabase, você pode ser deslogado (pois a nova sessão substitui a sua). O ideal é criar contas no painel do Supabase.
          </div>
        </motion.div>
      )}

      {loading ? (
        <div>Carregando equipe...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Permissão (Role)</th>
                <th>Cadastrado em</th>
                <th style={{ width: 100 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-12">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <strong>{p.nome}</strong>
                    </div>
                  </td>
                  <td>
                    <select 
                      className="form-control" 
                      style={{ padding: '6px 12px', fontSize: 13, width: 140 }}
                      value={p.role} 
                      onChange={e => handleRoleChange(p.id, e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="editor">Editor</option>
                    </select>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Configurações (em breve)">
                      <UserCog size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
