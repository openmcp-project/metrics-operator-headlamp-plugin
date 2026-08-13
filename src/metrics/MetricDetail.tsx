import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsTable } from '../common/ConditionsTable';
import { YamlEditor } from '../common/YamlEditor';

const { Box, Typography, Tabs, Tab, Chip, Divider } = (window as any).pluginLib?.MuiCore ?? {};
const { NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};

export function MetricDetail({ item }: { item: any }) {
  const [tab, setTab] = useState(0);

  const projections: any[] = item.spec?.projections ?? [];
  const valueFrom = item.spec?.valueFrom;
  const obs = item.status?.observation ?? {};

  return (
    <Box style={{ padding: 20, minWidth: 480 }}>
      <Typography variant="h6" style={{ marginBottom: 4 }}>{item.metadata?.name}</Typography>
      <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginBottom: 16 }}>
        {item.metadata?.namespace} · metrics.openmcp.cloud/v1alpha1 · Metric
      </Typography>

      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} style={{ marginBottom: 16, borderBottom: '1px solid #e0e0e0' }}>
        <Tab label="Overview" style={{ fontSize: 12 }} />
        <Tab label="Observation" style={{ fontSize: 12 }} />
        {projections.length > 0 && <Tab label={`Projections (${projections.length})`} style={{ fontSize: 12 }} />}
        <Tab label="Conditions" style={{ fontSize: 12 }} />
        <Tab label="YAML" style={{ fontSize: 12 }} />
      </Tabs>

      {tab === 0 && (
        <NameValueTable rows={[
          { name: 'Ready', value: React.createElement(StatusBadge, { ready: item.status?.ready ?? 'Unknown' }) },
          { name: 'Target GVK', value: React.createElement(GVKChip, { group: item.spec?.target?.group ?? '', version: item.spec?.target?.version ?? '', kind: item.spec?.target?.kind ?? '' }) },
          { name: 'Interval', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, item.spec?.interval ?? '—') },
          { name: 'DataSink', value: item.spec?.dataSinkRef?.name ? React.createElement(Chip, { label: item.spec.dataSinkRef.name, size: 'small', style: { fontSize: 10, height: 18 } }) : '—' },
          ...(item.spec?.remoteClusterAccessRef ? [{ name: 'Remote Cluster', value: item.spec.remoteClusterAccessRef.name }] : []),
          { name: 'Namespace', value: item.metadata?.namespace },
          { name: 'Created', value: item.metadata?.creationTimestamp ? new Date(item.metadata.creationTimestamp).toLocaleString() : '—' },
        ]} />
      )}

      {tab === 1 && (
        <Box>
          <NameValueTable rows={[
            { name: 'Latest Value', value: React.createElement('span', { style: { fontFamily: 'monospace', fontWeight: 600 } }, obs.latestValue ?? '—') },
            { name: 'Timestamp', value: obs.timestamp ? new Date(obs.timestamp).toLocaleString() : '—' },
            ...(valueFrom ? [
              { name: 'Value Field Path', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, valueFrom.fieldPath ?? '—') },
              { name: 'Value Type', value: valueFrom.type ?? 'integer' },
              { name: 'Aggregation', value: valueFrom.aggregation ?? 'sum' },
            ] : []),
          ]} />
          {obs.dimensions?.length > 0 && (
            <Box style={{ marginTop: 16 }}>
              <Typography variant="subtitle2" style={{ marginBottom: 8 }}>Dimensions</Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#fafafa' }}>
                    <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600 }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {obs.dimensions.map((d: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11 }}>{d.name}</td>
                      <td style={{ padding: '6px 10px', fontSize: 11 }}>{JSON.stringify(d.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Box>
      )}

      {tab === 2 && projections.length > 0 && (
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

      {tab === (projections.length > 0 ? 3 : 2) && (
        <ConditionsTable conditions={item.status?.conditions ?? []} />
      )}

      {tab === (projections.length > 0 ? 4 : 3) && (
        <Box style={{ height: 500 }}>
          <YamlEditor item={item} onSave={async () => {}} readOnly />
        </Box>
      )}
    </Box>
  );
}
