import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, LogOut } from 'lucide-react';
import { sb } from '../../lib/supabase';
import { useAuth } from '../../App';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const mainNav = [
    { to: '/dashboard', emoji: '🏠', label: 'Dashboard' },
    { to: '/leads',     emoji: '👥', label: 'Leads'     },
    { to: '/prompts',   emoji: '✨', label: 'Biblioteca' },
  ];

  const analyticsNav = [
    { to: '/analytics', emoji: '📊', label: 'Analytics' },
    { to: '/ranking',   emoji: '🏆', label: 'Ranking'   },
  ];

  const handleLogout = async () => {
    await sb.auth.signOut();
    navigate('/login');
  };

  const NavItem = ({ to, label, children, end }: { to: string; label: string; children: React.ReactNode; end?: boolean }) => (
    <NavLink key={to} to={to} end={end}>
      {({ isActive }) => (
        <motion.div
          className={`${styles.navItem} ${isActive ? styles.active : ''}`}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
        >
          {isActive && (
            <motion.div
              className={styles.activePill}
              layoutId="active-pill"
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            />
          )}
          {children}
          <span>{label}</span>
        </motion.div>
      )}
    </NavLink>
  );

  return (
    <motion.aside
      className={styles.sidebar}
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className={styles.logo}>
        <motion.div
          className={styles.logoIcon}
          animate={{ rotate: [0, -5, 5, -3, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          📸
        </motion.div>
        <div className={styles.logoText}>
          <span>Photo<span style={{ color: '#a855f7' }}>.IA</span></span>
          <small>{profile ? profile.nome : 'Gestão'}</small>
        </div>
      </div>

      <nav className={styles.nav}>
        {mainNav.map(({ to, emoji, label }) => (
          <NavItem key={to} to={to} label={label} end={to === '/dashboard'}>
            <span style={{ fontSize: 17, lineHeight: 1 }}>{emoji}</span>
          </NavItem>
        ))}

        {profile?.role === 'admin' && (
          <NavItem to="/equipe" label="Equipe">
            <ShieldCheck size={18} strokeWidth={1.8} />
          </NavItem>
        )}

        <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px' }} />
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text3)', padding: '0 12px 6px' }}>
          Inteligência
        </div>

        {analyticsNav.map(({ to, emoji, label }) => (
          <NavItem key={to} to={to} label={label}>
            <span style={{ fontSize: 17, lineHeight: 1 }}>{emoji}</span>
          </NavItem>
        ))}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <button className={styles.navItem} onClick={handleLogout} style={{ width: '100%', background: 'transparent', border: 'none' }}>
          <LogOut size={18} strokeWidth={1.8} color="var(--red)" />
          <span style={{ color: 'var(--red)' }}>Sair</span>
        </button>
      </div>
    </motion.aside>
  );
}
