import { motion, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { fmtMoney } from '../../lib/utils';
import styles from './MetricCard.module.css';

interface Props {
  icon: string;
  label: string;
  value: number;
  color?: string;
  prefix?: string;
  isMoney?: boolean;
  delay?: number;
}

export default function MetricCard({ icon, label, value, color = '#7c3aed', isMoney = false, delay = 0 }: Props) {
  const count = useMotionValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => { count.set(value); }, delay * 200);
    return () => clearTimeout(timeout);
  }, [value, count, delay]);

  return (
    <motion.div
      className={styles.card}
      style={{ '--card-color': color } as React.CSSProperties}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
    >
      <div className={styles.glow} />
      <div className={styles.icon}>{icon}</div>
      <motion.div className={styles.value}>
        {isMoney
          ? <motion.span>{fmtMoney(value)}</motion.span>
          : <motion.span>{value}</motion.span>
        }
      </motion.div>
      <div className={styles.label}>{label}</div>
    </motion.div>
  );
}
