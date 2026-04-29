import { useState, useEffect, useCallback } from 'react';
import { PromptsDB } from '../lib/supabase';
import type { Prompt } from '../types';
import PromptLibrary from '../components/Prompts/PromptLibrary';

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await PromptsDB.all();
    setPrompts(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return <PromptLibrary prompts={prompts} loading={loading} onRefresh={load} />;
}
