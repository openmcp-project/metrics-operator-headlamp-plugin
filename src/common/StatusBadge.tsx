import React from 'react';
import { readyColor, phaseColor } from './colors';
import { readyLabel } from './helpers';

const { Chip } = (window as any).pluginLib?.MuiCore ?? {};

interface StatusBadgeProps {
  ready?: string;
  phase?: string;
  style?: React.CSSProperties;
}

export function StatusBadge({ ready, phase, style }: StatusBadgeProps) {
  let label: string;
  let color: { bg: string; text: string };

  if (ready !== undefined) {
    label = readyLabel(ready);
    color = readyColor(ready);
  } else if (phase !== undefined) {
    label = phase || 'Unknown';
    color = phaseColor(phase);
  } else {
    return null;
  }

  return (
    <Chip
      label={label}
      size="small"
      style={{
        background: color.bg,
        color: color.text,
        fontWeight: 600,
        fontSize: 11,
        height: 22,
        ...style,
      }}
    />
  );
}
