import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsTable } from '../common/ConditionsTable';
import { YamlEditor } from '../common/YamlEditor';
import styles from './MetricDetail.module.css';

const { Box, Typography, Tabs, Tab, Chip, Divider, useTheme } = (window as any).pluginLib?.MuiCore ?? {};
const { NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};

export function MetricDetail({ item }: { item: any }) {
  const theme = useTheme();
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

      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} className={styles.tabs} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Tab label="Overview" className={styles.tab} />
        <Tab label="Observation" className={styles.tab} />
        {projections.length > 0 && <Tab label={`Projections (${projections.length})`} className={styles.tab} />}
        <Tab label="Conditions" className={styles.tab} />
        <Tab label="YAML" className={styles.tab} />
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
            <Box className={styles.dimensionsSection}>
              <Typography variant="subtitle2" className={styles.sectionLabel}>Dimensions</Typography>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.headerRow} style={{ borderBottom: `2px solid ${theme.palette.divider}`, background: theme.palette.background.default }}>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {obs.dimensions.map((d: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <td className={`${styles.td} ${styles.mono}`}>{d.name}</td>
                      <td className={styles.td}>{JSON.stringify(d.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Box>
      )}

      {tab === 2 && projections.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow} style={{ borderBottom: `2px solid ${theme.palette.divider}`, background: theme.palette.background.default }}>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Field Path</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Default</th>
            </tr>
          </thead>
          <tbody>
            {projections.map((p: any, i: number) => (
              <tr key={i} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                <td className={`${styles.td} ${styles.mono}`} style={{ fontWeight: 600 }}>{p.name}</td>
                <td className={`${styles.td} ${styles.mono}`} style={{ color: '#1565c0' }}>{p.fieldPath}</td>
                <td className={styles.td}>{p.type ?? 'primitive'}</td>
                <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{p.default != null ? JSON.stringify(p.default) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === (projections.length > 0 ? 3 : 2) && (
        <ConditionsTable conditions={item.status?.conditions ?? []} />
      )}

      {tab === (projections.length > 0 ? 4 : 3) && (
        <Box className={styles.yamlPane}>
          <YamlEditor item={item} onSave={async () => {}} readOnly />
        </Box>
      )}
    </Box>
  );
}
