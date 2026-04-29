import { useState, useEffect, useCallback } from 'react';
import { LeadsDB } from '../lib/supabase';
import type { Lead } from '../types';
import LeadTable from '../components/Leads/LeadTable';
import { useAuth } from '../App';

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    let data = await LeadsDB.all();
    if (profile.role !== 'admin') {
      data = data.filter(l => l.vendedorId === profile.id || l.editorId === profile.id);
    }
    setLeads(data);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  return <LeadTable leads={leads} loading={loading} onRefresh={load} />;
}
