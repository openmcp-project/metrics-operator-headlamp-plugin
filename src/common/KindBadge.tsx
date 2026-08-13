import React from 'react';
import { moColors } from './colors';

const { Chip } = (window as any).pluginLib?.MuiCore ?? {};

export type MetricKind = 'Metric' | 'ManagedMetric' | 'FederatedMetric' | 'FederatedManagedMetric';

const KIND_LABELS: Record<MetricKind, string> = {
  Metric: 'Metric',
  ManagedMetric: 'Managed',
  FederatedMetric: 'Federated',
  FederatedManagedMetric: 'Fed. Managed',
};

const KIND_COLORS: Record<MetricKind, { bg: string; text: string }> = {
  Metric: moColors.metric,
  ManagedMetric: moColors.managedMetric,
  FederatedMetric: moColors.federatedMetric,
  FederatedManagedMetric: moColors.federatedManaged,
};

interface KindBadgeProps {
  kind: MetricKind | string;
  style?: React.CSSProperties;
}

export function KindBadge({ kind, style }: KindBadgeProps) {
  const label = KIND_LABELS[kind as MetricKind] ?? kind;
  const color = KIND_COLORS[kind as MetricKind] ?? { bg: '#616161', text: '#fff' };

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
