import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { sb, AuthDB, TeamsDB, ProfilesDB } from './lib/supabase';
import type { Profile, Team } from './types';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Prompts from './pages/Prompts';
import Equipe from './pages/Equipe';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Analytics from './pages/Analytics';
import Ranking from './pages/Ranking';
import './styles/global.css';

// Contexto de Autenticação
interface AuthContextType {
  session: any;
  profile: Profile | null;
  loading: boolean;
  team: Team | null;
  teamMemberIds: string[];
  teamProfiles: Profile[];
  reloadTeam: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>({
  session: null, profile: null, loading: true,
  team: null, teamMemberIds: [], teamProfiles: [],
  reloadTeam: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳ Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [teamProfiles, setTeamProfiles] = useState<Profile[]>([]);

  const loadTeam = async () => {
    try {
      const result = await TeamsDB.getMyTeam();
      if (result) {
        setTeam(result.team);
        setTeamMemberIds(result.memberIds);
        const profs = await ProfilesDB.byTeam(result.team.id);
        setTeamProfiles(profs);
      } else {
        setTeam(null);
        setTeamMemberIds([]);
        setTeamProfiles([]);
      }
    } catch (e) {
      console.error('Erro ao carregar time:', e);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const p = await AuthDB.getProfile(userId);
      setProfile(p);
      setLoading(false);
      if (p) await loadTeam();
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setTeam(null);
        setTeamMemberIds([]);
        setTeamProfiles([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, team, teamMemberIds, teamProfiles, reloadTeam: loadTeam }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
          <Route path="/prompts" element={<ProtectedRoute><Prompts /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
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
