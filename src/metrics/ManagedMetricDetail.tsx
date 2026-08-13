import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsTable } from '../common/ConditionsTable';
import { YamlEditor } from '../common/YamlEditor';

const { Box, Typography, Tabs, Tab, Chip } = (window as any).pluginLib?.MuiCore ?? {};
const { NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};

export function ManagedMetricDetail({ item }: { item: any }) {
  const [tab, setTab] = useState(0);
  const dimensions: any[] = item.spec?.dimensions ?? [];
  const obs = item.status?.observation ?? {};

  return (
    <Box style={{ padding: 20, minWidth: 480 }}>
      <Typography variant="h6" style={{ marginBottom: 4 }}>{item.metadata?.name}</Typography>
      <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginBottom: 16 }}>
        {item.metadata?.namespace} · metrics.openmcp.cloud/v1alpha1 · ManagedMetric
      </Typography>

      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} style={{ marginBottom: 16, borderBottom: '1px solid #e0e0e0' }}>
        <Tab label="Overview" style={{ fontSize: 12 }} />
        {dimensions.length > 0 && <Tab label={`Dimensions (${dimensions.length})`} style={{ fontSize: 12 }} />}
        <Tab label="Conditions" style={{ fontSize: 12 }} />
        <Tab label="YAML" style={{ fontSize: 12 }} />
      </Tabs>

      {tab === 0 && (
        <NameValueTable rows={[
          { name: 'Ready', value: React.createElement(StatusBadge, { ready: item.status?.ready ?? 'Unknown' }) },
          { name: 'Target GVK', value: React.createElement(GVKChip, { group: item.spec?.target?.group ?? '', version: item.spec?.target?.version ?? '', kind: item.spec?.target?.kind ?? '' }) },
          { name: 'Resource Count', value: React.createElement('span', { style: { fontFamily: 'monospace', fontWeight: 700 } }, obs.resources != null ? String(obs.resources) : '—') },
          { name: 'Last Observed', value: obs.timestamp ? new Date(obs.timestamp).toLocaleString() : '—' },
          { name: 'Interval', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, item.spec?.interval ?? '—') },
          { name: 'DataSink', value: item.spec?.dataSinkRef?.name ? React.createElement(Chip, { label: item.spec.dataSinkRef.name, size: 'small', style: { fontSize: 10, height: 18 } }) : '—' },
        ]} />
      )}

      {tab === 1 && dimensions.length > 0 && (
        <Box>
          <Box style={{ padding: '8px 12px', background: 'rgba(21,101,192,0.06)', borderRadius: 6, marginBottom: 12, fontSize: 12, color: '#555' }}>
            Custom dimensions override the auto-derived Ready/Synced defaults. Only the listed dimensions are exported.
          </Box>
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
              {dimensions.map((d: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>{d.name}</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11, color: '#1565c0' }}>{d.fieldPath}</td>
                  <td style={{ padding: '6px 10px', fontSize: 11 }}>{d.type ?? 'primitive'}</td>
                  <td style={{ padding: '6px 10px', fontSize: 11, color: '#888' }}>{d.default != null ? JSON.stringify(d.default) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {tab === (dimensions.length > 0 ? 2 : 1) && <ConditionsTable conditions={item.status?.conditions ?? []} />}
      {tab === (dimensions.length > 0 ? 3 : 2) && <Box style={{ height: 500 }}><YamlEditor item={item} onSave={async () => {}} readOnly /></Box>}
    </Box>
  );
}
