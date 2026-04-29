import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { sb, AuthDB } from './lib/supabase';
import type { Profile } from './types';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Prompts from './pages/Prompts';
import Equipe from './pages/Equipe';
import Login from './pages/Login';
import './styles/global.css';

// Contexto de Autenticação
interface AuthContextType {
  session: any;
  profile: Profile | null;
  loading: boolean;
}
const AuthContext = createContext<AuthContextType>({ session: null, profile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳ Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        AuthDB.getProfile(session.user.id).then(p => {
          setProfile(p);
          setLoading(false);
        }).catch(err => {
          console.error("Erro ao carregar perfil:", err);
          setLoading(false);
        });
      }
      else setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        AuthDB.getProfile(session.user.id).then(p => {
          setProfile(p);
          setLoading(false);
        }).catch(err => {
          console.error("Erro ao carregar perfil onAuthChange:", err);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
          <Route path="/prompts" element={<ProtectedRoute><Prompts /></ProtectedRoute>} />
          <Route path="/equipe" element={<ProtectedRoute adminOnly><Equipe /></ProtectedRoute>} />
        </Routes>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg2)',
              color: 'var(--text)',
              border: '1px solid var(--border2)',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
            },
            duration: 3500,
          }}
        />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
