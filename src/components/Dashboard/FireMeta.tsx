import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MetasDB } from '../../lib/supabase';
import { fmtMoney } from '../../lib/utils';
import type { LeadStats } from '../../types';
import styles from './FireMeta.module.css';

interface Props { stats: LeadStats }

interface Particle { id: number; x: number; size: number; color: string; duration: number; delay: number; }

const FIRE_COLORS = ['#ff4500','#ff6a00','#ff8c00','#ffb700','#ffd700','#fff0a0'];

function genParticle(id: number): Particle {
  return {
    id, x: 4 + Math.random() * 92,
    size: 3 + Math.random() * 5,
    color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)],
    duration: 1.5 + Math.random() * 2,
    delay: Math.random() * 0.5,
  };
}

export default function FireMeta({ stats }: Props) {
  const [meta, setMeta] = useState(0);
  const [obs, setObs] = useState('');
  const [inputMeta, setInputMeta] = useState('');
  const [inputObs, setInputObs] = useState('');
  const [saving, setSaving] = useState(false);
  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: 8 }, (_, i) => genParticle(i))
  );
  const pidRef = useRef(9);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    MetasDB.getHoje().then(m => {
      setMeta(m.meta); setObs(m.observacao);
      setInputMeta(String(m.meta || '')); setInputObs(m.observacao);
    });
  }, []);

  const atual = stats.faturamentoHoje;
  const pct = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
  const falta = Math.max(meta - atual, 0);
  const concluida = atual >= meta && meta > 0;

  // Particle interval scales with progress
  const spawnInterval = pct >= 100 ? 130 : pct >= 75 ? 220 : pct >= 50 ? 340 : 520;

  const spawnParticle = useCallback(() => {
    const p = genParticle(pidRef.current++);
    setParticles(prev => [...prev.slice(-24), p]);
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(spawnParticle, spawnInterval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [spawnInterval, spawnParticle]);

  const handleSave = async () => {
    setSaving(true);
    const val = Number(inputMeta) || 0;
    await MetasDB.setHoje(val, inputObs);
    setMeta(val); setObs(inputObs);
    setSaving(false);
  };

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Particles */}
      <div className={styles.particles} aria-hidden>
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              className={styles.particle}
              style={{ left: `${p.x}%`, width: p.size, height: p.size, background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -(80 + Math.random() * 80), opacity: 0, scale: [1, 1.2, 0.6] }}
              exit={{ opacity: 0 }}
              transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
              onAnimationComplete={() => setParticles(prev => prev.filter(x => x.id !== p.id))}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <motion.span
            className={styles.fireIcon}
            animate={{ rotate: [-4, 4, -4], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
          >🔥</motion.span>
          <div>
            <div className={styles.label}>Meta do Dia</div>
            <div className={styles.tagline}>
              {concluida ? '🏆 Meta conquistada! Incrível!' : 'Bora queimar a meta hoje! 🚀'}
            </div>
          </div>
        </div>
        {concluida && (
          <motion.div
            className={styles.conquista}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            🎉 META BATIDA!
          </motion.div>
        )}
      </div>

      {/* Values */}
      <div className={styles.values}>
        <div className={styles.valBlock}>
          <div className={styles.valLabel}>Faturado Hoje</div>
          <motion.div
            className={styles.valBig}
            key={atual}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >{fmtMoney(atual)}</motion.div>
        </div>
        <div className={styles.divider} />
        <div className={styles.valBlock}>
          <div className={styles.valLabel}>Meta</div>
          <div className={`${styles.valBig} ${styles.valGoal}`}>{fmtMoney(meta)}</div>
        </div>
        <motion.div
          className={styles.pctBadge}
          animate={{ scale: concluida ? [1, 1.08, 1] : 1 }}
          transition={{ repeat: concluida ? Infinity : 0, duration: 1.5 }}
        >
          <div className={styles.pctNum}>{Math.round(pct)}%</div>
          <div className={styles.pctSub}>da meta</div>
        </motion.div>
      </div>

      {/* Fire bar */}
      <div className={styles.barWrap}>
        <div className={styles.barTrack}>
          <motion.div
            className={styles.barFill}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pct > 0 ? pct : 0, pct > 0 ? 3 : 0)}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            {pct > 2 && (
              <motion.span
                className={styles.barFlame}
                animate={{ scale: [1, 1.3, 1], rotate: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              >🔥</motion.span>
            )}
          </motion.div>
        </div>
      </div>
      <div className={styles.barInfo}>
        <span>{fmtMoney(atual)} de {fmtMoney(meta)} faturados hoje</span>
        <span className={concluida ? styles.batida : styles.falta}>
          {concluida ? '🎉 Parabéns!' : (meta > 0 ? `Faltam ${fmtMoney(falta)}` : '')}
        </span>
      </div>

      {/* Form */}
      <div className={styles.formRow}>
        <div className={styles.inputWrap}>
          <label className="form-label" style={{ color: 'rgba(255,157,0,0.7)' }}>Meta em Reais (R$)</label>
          <div style={{ position: 'relative' }}>
            <span className={styles.prefix}>R$</span>
            <input
              type="number" min="0" step="0.01" placeholder="Ex: 500"
              className={`form-control ${styles.metaInput}`}
              value={inputMeta}
              onChange={e => setInputMeta(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
        <div style={{ flex: 2 }}>
          <label className="form-label" style={{ color: 'rgba(255,157,0,0.7)' }}>Observação</label>
          <input
            type="text" placeholder="Ex: Focar em premium hoje 🔥"
            className={`form-control ${styles.metaInput}`}
            value={inputObs}
            onChange={e => setInputObs(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <motion.button
            className={`btn ${styles.btnFire}`}
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {saving ? '⏳' : '🔥'} {saving ? 'Salvando...' : 'Definir Meta'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
