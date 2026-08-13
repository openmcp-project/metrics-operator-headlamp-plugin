import React from 'react';
import { formatGVK } from './helpers';

interface GVKChipProps {
  group: string;
  version: string;
  kind: string;
  style?: React.CSSProperties;
}

export function GVKChip({ group, version, kind, style }: GVKChipProps) {
  const text = formatGVK(group, version, kind);
  if (text === '—') return <span style={{ color: '#888' }}>—</span>;

  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'monospace',
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 4,
      background: 'rgba(21,101,192,0.08)',
      color: '#1565c0',
      border: '1px solid rgba(21,101,192,0.2)',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {text}
    </span>
  );
}
