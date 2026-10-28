import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsTable } from '../common/ConditionsTable';
import { YamlEditor } from '../common/YamlEditor';
import styles from './ManagedMetricDetail.module.css';

const { Box, Typography, Tabs, Tab, Chip, useTheme } = (window as any).pluginLib?.MuiCore ?? {};
const { NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};

export function ManagedMetricDetail({ item }: { item: any }) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const dimensions: any[] = item.spec?.dimensions ?? [];
  const obs = item.status?.observation ?? {};

  return (
    <Box style={{ padding: 20, minWidth: 480 }}>
      <Typography variant="h6" style={{ marginBottom: 4 }}>{item.metadata?.name}</Typography>
      <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginBottom: 16 }}>
        {item.metadata?.namespace} · metrics.openmcp.cloud/v1alpha1 · ManagedMetric
      </Typography>

      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} className={styles.tabs} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Tab label="Overview" className={styles.tab} />
        {dimensions.length > 0 && <Tab label={`Dimensions (${dimensions.length})`} className={styles.tab} />}
        <Tab label="Conditions" className={styles.tab} />
        <Tab label="YAML" className={styles.tab} />
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
          <Box className={styles.infoBanner} style={{ background: 'rgba(21,101,192,0.06)', color: theme.palette.text.secondary }}>
            Custom dimensions override the auto-derived Ready/Synced defaults. Only the listed dimensions are exported.
          </Box>
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
              {dimensions.map((d: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <td className={`${styles.td} ${styles.mono}`} style={{ fontWeight: 600 }}>{d.name}</td>
                  <td className={`${styles.td} ${styles.mono}`} style={{ color: '#1565c0' }}>{d.fieldPath}</td>
                  <td className={styles.td}>{d.type ?? 'primitive'}</td>
                  <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{d.default != null ? JSON.stringify(d.default) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {tab === (dimensions.length > 0 ? 2 : 1) && <ConditionsTable conditions={item.status?.conditions ?? []} />}
      {tab === (dimensions.length > 0 ? 3 : 2) && <Box className={styles.yamlPane}><YamlEditor item={item} onSave={async () => {}} readOnly /></Box>}
    </Box>
  );
}
