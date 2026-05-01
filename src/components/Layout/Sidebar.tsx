import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Sparkles, ShieldCheck, LogOut } from 'lucide-react';
import { sb } from '../../lib/supabase';
import { useAuth } from '../../App';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/leads',     icon: Users,           label: 'Leads'     },
    { to: '/prompts', icon: Sparkles,        label: 'Biblioteca'},
  ];

  if (profile?.role === 'admin') {
    navItems.push({ to: '/equipe', icon: ShieldCheck, label: 'Equipe' });
  }

  const handleLogout = async () => {
    await sb.auth.signOut();
    navigate('/login');
  };

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
          <span>Foto IA</span>
          <small>{profile ? profile.nome : 'Gestão'}</small>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/dashboard'}>
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
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </motion.div>
            )}
          </NavLink>
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
