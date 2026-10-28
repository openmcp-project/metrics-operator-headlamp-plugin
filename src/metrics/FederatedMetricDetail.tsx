import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsTable } from '../common/ConditionsTable';
import { YamlEditor } from '../common/YamlEditor';
import { moColors } from '../common/colors';
import styles from './FederatedMetricDetail.module.css';

const { Box, Typography, Tabs, Tab, Chip, useTheme } = (window as any).pluginLib?.MuiCore ?? {};
const { NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};

interface Props {
  item: any;
  kind: 'FederatedMetric' | 'FederatedManagedMetric';
}

export function FederatedMetricDetail({ item, kind }: Props) {
  const theme = useTheme();
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
        <Box className={styles.infoBanner} style={{ background: 'rgba(21,101,192,0.06)', color: '#1565c0' }}>
          Monitors all Crossplane managed resources across federated clusters.
        </Box>
      )}

      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} className={styles.tabs} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Tab label="Overview" className={styles.tab} />
        {projections.length > 0 && <Tab label={`Projections (${projections.length})`} className={styles.tab} />}
        <Tab label="Conditions" className={styles.tab} />
        <Tab label="YAML" className={styles.tab} />
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
          <Box className={styles.statCardRow}>
            {[
              { label: 'Active', value: obs.activeCount ?? 0, color: moColors.ready.bg },
              { label: 'Failed', value: obs.failedCount ?? 0, color: moColors.failed.bg },
              { label: 'Pending', value: obs.pendingCount ?? 0, color: moColors.pending.bg },
            ].map(({ label, value, color }) => (
              <Box key={label} className={styles.statCard} style={{ background: theme.palette.background.paper, border: `2px solid ${color}` }}>
                <Typography variant="h4" className={styles.statValue} style={{ color }}>{value}</Typography>
                <Typography variant="caption" color="textSecondary" className={styles.statLabel}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {tab === 1 && projections.length > 0 && (
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

      {tab === (projections.length > 0 ? 2 : 1) && <ConditionsTable conditions={item.status?.conditions ?? []} />}
      {tab === (projections.length > 0 ? 3 : 2) && <Box className={styles.yamlPane}><YamlEditor item={item} onSave={async () => {}} readOnly /></Box>}
    </Box>
  );
}
