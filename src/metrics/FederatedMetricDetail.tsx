import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsTable } from '../common/ConditionsTable';
import { YamlEditor } from '../common/YamlEditor';
import { moColors } from '../common/colors';

const { Box, Typography, Tabs, Tab, Chip } = (window as any).pluginLib?.MuiCore ?? {};
const { NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};

interface Props {
  item: any;
  kind: 'FederatedMetric' | 'FederatedManagedMetric';
}

export function FederatedMetricDetail({ item, kind }: Props) {
  const [tab, setTab] = useState(0);
  const projections: any[] = item.spec?.projections ?? [];
  const obs = item.status?.observation ?? {};
  const isFedManaged = kind === 'FederatedManagedMetric';

  return (
    <Box style={{ padding: 20, minWidth: 480 }}>
      <Typography variant="h6" style={{ marginBottom: 4 }}>{item.metadata?.name}</Typography>
      <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginBottom: 16 }}>
        {item.metadata?.namespace} · metrics.openmcp.cloud/v1alpha1 · {kind}
      </Typography>

      {isFedManaged && (
        <Box style={{ padding: '8px 12px', background: 'rgba(21,101,192,0.06)', borderRadius: 6, marginBottom: 16, fontSize: 12, color: '#1565c0' }}>
          Monitors all Crossplane managed resources across federated clusters.
        </Box>
      )}

      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} style={{ marginBottom: 16, borderBottom: '1px solid #e0e0e0' }}>
        <Tab label="Overview" style={{ fontSize: 12 }} />
        {projections.length > 0 && <Tab label={`Projections (${projections.length})`} style={{ fontSize: 12 }} />}
        <Tab label="Conditions" style={{ fontSize: 12 }} />
        <Tab label="YAML" style={{ fontSize: 12 }} />
      </Tabs>

      {tab === 0 && (
        <Box>
          <NameValueTable rows={[
            { name: 'Ready', value: React.createElement(StatusBadge, { ready: item.status?.ready ?? 'Unknown' }) },
            ...(!isFedManaged ? [{ name: 'Target GVK', value: React.createElement(GVKChip, { group: item.spec?.target?.group ?? '', version: item.spec?.target?.version ?? '', kind: item.spec?.target?.kind ?? '' }) }] : []),
            { name: 'Federated Cluster Access', value: (item.spec?.federateClusterAccessRef ?? item.spec?.federatedClusterAccessRef)?.name ?? '—' },
            { name: 'Interval', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, item.spec?.interval ?? '—') },
            { name: 'DataSink', value: item.spec?.dataSinkRef?.name ? React.createElement(Chip, { label: item.spec.dataSinkRef.name, size: 'small', style: { fontSize: 10, height: 18 } }) : '—' },
            { name: 'Last Reconciled', value: item.status?.lastReconcileTime ? new Date(item.status.lastReconcileTime).toLocaleString() : '—' },
          ]} />
          <Box display="flex" style={{ gap: 16, marginTop: 20 }}>
            {[
              { label: 'Active', value: obs.activeCount ?? 0, color: moColors.ready.bg },
              { label: 'Failed', value: obs.failedCount ?? 0, color: moColors.failed.bg },
              { label: 'Pending', value: obs.pendingCount ?? 0, color: moColors.pending.bg },
            ].map(({ label, value, color }) => (
              <Box key={label} style={{ textAlign: 'center', background: '#fff', border: `2px solid ${color}`, borderRadius: 8, padding: '12px 24px', minWidth: 80 }}>
                <Typography variant="h4" style={{ fontWeight: 700, color, lineHeight: 1 }}>{value}</Typography>
                <Typography variant="caption" color="textSecondary" style={{ fontSize: 10 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {tab === 1 && projections.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#fafafa' }}>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600 }}>Name</th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600 }}>Field Path</th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600 }}>Type</th>
              <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600 }}>Default</th>
            </tr>
          </thead>
          <tbody>
            {projections.map((p: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11, color: '#1565c0' }}>{p.fieldPath}</td>
                <td style={{ padding: '6px 10px', fontSize: 11 }}>{p.type ?? 'primitive'}</td>
                <td style={{ padding: '6px 10px', fontSize: 11, color: '#888' }}>{p.default != null ? JSON.stringify(p.default) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === (projections.length > 0 ? 2 : 1) && <ConditionsTable conditions={item.status?.conditions ?? []} />}
      {tab === (projections.length > 0 ? 3 : 2) && <Box style={{ height: 500 }}><YamlEditor item={item} onSave={async () => {}} readOnly /></Box>}
    </Box>
  );
}
