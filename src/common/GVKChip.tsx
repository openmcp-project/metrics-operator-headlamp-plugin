import React from 'react';
import { formatGVK } from './helpers';
import styles from './GVKChip.module.css';

const { useTheme } = (window as any).pluginLib?.MuiCore ?? {};

interface GVKChipProps {
  group: string;
  version: string;
  kind: string;
  style?: React.CSSProperties;
}

export function GVKChip({ group, version, kind, style }: GVKChipProps) {
  const theme = useTheme();
  const text = formatGVK(group, version, kind);
  if (text === '—') return <span style={{ color: theme.palette.text.secondary }}>—</span>;

  return (
    <span className={styles.chip} style={{
      background: 'rgba(21,101,192,0.08)',
      color: '#1565c0',
      border: '1px solid rgba(21,101,192,0.2)',
      ...style,
    }}>
      {text}
    </span>
  );
}
