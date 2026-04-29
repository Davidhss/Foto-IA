import { useState, useEffect, useCallback } from 'react';
import { LeadsDB } from '../lib/supabase';
import type { Lead } from '../types';
import LeadTable from '../components/Leads/LeadTable';

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await LeadsDB.all();
    setLeads(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return <LeadTable leads={leads} loading={loading} onRefresh={load} />;
}
