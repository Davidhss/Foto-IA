import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { sb } from '../lib/supabase';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Preencha os campos');
    setLoading(true);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error('Credenciais inválidas');
    } else {
      toast.success('Bem-vindo!');
      navigate('/');
    }
  };

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className={styles.glow} />
        
        <div className={styles.logoWrap}>
          <motion.div 
            className={styles.icon}
            animate={{ scale: [1, 1.1, 1], rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >🔥</motion.div>
          <h2>Foto IA</h2>
          <p>Acesso Restrito da Equipe</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className={`form-control ${styles.input}`}
              placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input 
              type="password" 
              className={`form-control ${styles.input}`}
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          <motion.button 
            type="submit" 
            className={`btn btn-primary ${styles.submit}`}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? '⏳ Autenticando...' : 'Entrar 🔥'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
