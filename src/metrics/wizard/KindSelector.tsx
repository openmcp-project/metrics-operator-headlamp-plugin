import React from 'react';
import { moColors } from '../../common/colors';

const { Box, Typography, Radio, RadioGroup, FormControlLabel } = (window as any).pluginLib?.MuiCore ?? {};

export type MetricKind = 'Metric' | 'ManagedMetric' | 'FederatedMetric' | 'FederatedManagedMetric';

interface KindCardProps {
  kind: MetricKind;
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  features: string[];
  color: string;
}

function KindCard({ kind, selected, onSelect, title, description, features, color }: KindCardProps) {
  return (
    <Box
      onClick={onSelect}
      style={{
        border: `2px solid ${selected ? color : '#e0e0e0'}`,
        borderRadius: 8,
        padding: '14px 16px',
        cursor: 'pointer',
        background: selected ? `rgba(${hexToRgb(color)}, 0.05)` : '#fff',
        transition: 'border-color 0.15s, background 0.15s',
        flex: 1,
        minWidth: 200,
      }}>
      <Box display="flex" alignItems="center" style={{ gap: 10, marginBottom: 8 }}>
        <Radio
          checked={selected}
          onChange={onSelect}
          size="small"
          style={{ padding: 0, color }}
          onClick={(e: any) => e.stopPropagation()}
        />
        <Box
          style={{
            background: color,
            color: '#fff',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'monospace',
          }}>
          {kind}
        </Box>
      </Box>
      <Typography variant="subtitle2" style={{ marginBottom: 4, fontWeight: 700 }}>{title}</Typography>
      <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, marginBottom: 10 }}>
        {description}
      </Typography>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#555' }}>
        {features.map(f => <li key={f} style={{ marginBottom: 2 }}>{f}</li>)}
      </ul>
    </Box>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

interface Props {
  value: MetricKind;
  onChange: (kind: MetricKind) => void;
}

export function KindSelector({ value, onChange }: Props) {
  const kinds: Array<{
    kind: MetricKind;
    title: string;
    description: string;
    features: string[];
    color: string;
  }> = [
    {
      kind: 'Metric',
      title: 'Metric',
      description: 'Count or measure any Kubernetes resource by GVK on the local cluster.',
      features: [
        'Any GVK target (built-in or CRD)',
        'Label & field selectors',
        'Custom projections (dimensions)',
        'Value extraction via JSONPath',
        'Optional remote cluster',
      ],
      color: moColors.metric.bg,
    },
    {
      kind: 'ManagedMetric',
      title: 'Managed Metric',
      description: 'Specialized for Crossplane managed resources — auto-derives Ready & Synced dimensions.',
      features: [
        'Targets Crossplane managed resources',
        'Automatic Ready/Synced dimensions',
        'Custom dimension overrides',
        'Resource count observation',
      ],
      color: moColors.managedMetric.bg,
    },
    {
      kind: 'FederatedMetric',
      title: 'Federated Metric',
      description: 'Same as Metric but spans all clusters via a FederatedClusterAccess.',
      features: [
        'Multi-cluster aggregation',
        'Active / Failed / Pending counts',
        'Requires FederatedClusterAccess',
        'Projections & valueFrom supported',
      ],
      color: moColors.federatedMetric.bg,
    },
    {
      kind: 'FederatedManagedMetric',
      title: 'Federated Managed',
      description: 'Monitors all Crossplane managed resources across every federated cluster — no GVK target needed.',
      features: [
        'All clusters via FederatedClusterAccess',
        'No target GVK configuration',
        'Counts all Crossplane managed resources',
      ],
      color: moColors.federatedManaged.bg,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" style={{ marginBottom: 6 }}>Select metric kind</Typography>
      <Typography variant="body2" color="textSecondary" style={{ marginBottom: 18 }}>
        Choose the type of metric you want to create. Each kind is suited for different target scopes.
      </Typography>
      <Box display="flex" style={{ gap: 12, flexWrap: 'wrap' }}>
        {kinds.map(k => (
          <KindCard key={k.kind} {...k} selected={value === k.kind} onSelect={() => onChange(k.kind)} />
        ))}
      </Box>
    </Box>
  );
}
