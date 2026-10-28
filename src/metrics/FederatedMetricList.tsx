import React, { useState } from 'react';
import { FederatedMetric, FederatedManagedMetric } from '../common/Resources';
import { StatusBadge } from '../common/StatusBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsBadge } from '../common/ConditionsTable';
import { formatAge } from '../common/helpers';
import { moColors } from '../common/colors';
import { FederatedMetricDetail } from './FederatedMetricDetail';
import styles from './FederatedMetricList.module.css';

const { Box, TextField, FormControl, InputLabel, Select, MenuItem, Chip, useTheme } =
  (window as any).pluginLib?.MuiCore ?? {};

interface Props {
  kind: 'FederatedMetric' | 'FederatedManagedMetric';
}

export default function FederatedMetricList({ kind }: Props) {
  const theme = useTheme();
  const [federated] = FederatedMetric.useList() as [any[], any];
  const [federatedManaged] = FederatedManagedMetric.useList() as [any[], any];
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const rawItems = kind === 'FederatedMetric'
    ? (federated?.map((m: any) => m.jsonData ?? m) ?? [])
    : (federatedManaged?.map((m: any) => m.jsonData ?? m) ?? []);

  const filtered = rawItems.filter((i: any) => {
    if (filterStatus === 'ready' && i.status?.ready !== 'True') return false;
    if (filterStatus === 'failed' && i.status?.ready !== 'False') return false;
    if (filterStatus === 'unknown' && i.status?.ready !== 'Unknown') return false;
    if (search && !i.metadata?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function launchDetail(item: any) {
    const Activity = (window as any).pluginLib?.Activity;
    if (!Activity) return;
    Activity.launch({
      id: `fed-metric-detail:${item.metadata?.namespace}/${item.metadata?.name}`,
      location: 'split-right',
      temporary: true,
      title: item.metadata?.name,
      content: React.createElement(FederatedMetricDetail, { item, kind }),
    });
  }

  const isFedManaged = kind === 'FederatedManagedMetric';

  return (
    <Box>
      {kind === 'FederatedManagedMetric' && (
        <Box className={styles.banner} style={{ background: 'rgba(21,101,192,0.06)', color: '#1565c0' }}>
          Monitors all Crossplane managed resources across federated clusters. No target GVK required — the operator discovers all resources with the "crossplane" + "managed" categories.
        </Box>
      )}

      <Box className={styles.filterBar}>
        <TextField size="small" placeholder="Search…" value={search} onChange={(e: any) => setSearch(e.target.value)} className={styles.search} />
        <FormControl size="small" className={styles.filterNarrow}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e: any) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="failed">Not Ready</MenuItem>
            <MenuItem value="unknown">Unknown</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow} style={{ borderBottom: `2px solid ${theme.palette.divider}`, background: theme.palette.background.default }}>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Namespace</th>
            {!isFedManaged && <th className={styles.th}>Target GVK</th>}
            <th className={styles.th}>Ready</th>
            <th className={styles.th}>Active</th>
            <th className={styles.th}>Failed</th>
            <th className={styles.th}>Pending</th>
            <th className={styles.th}>DataSink</th>
            <th className={styles.th}>Last Reconciled</th>
            <th className={styles.th}>Conditions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item: any) => {
            const obs = item.status?.observation ?? {};
            return (
              <tr key={`${item.metadata?.namespace}/${item.metadata?.name}`}
                className={styles.row}
                style={{ borderBottom: `1px solid ${theme.palette.divider}` }}
                onClick={() => launchDetail(item)}>
                <td className={`${styles.td} ${styles.nameCell}`} style={{ color: '#1565c0' }}>{item.metadata?.name}</td>
                <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{item.metadata?.namespace}</td>
                {!isFedManaged && <td className={styles.td}><GVKChip group={item.spec?.target?.group ?? ''} version={item.spec?.target?.version ?? ''} kind={item.spec?.target?.kind ?? ''} /></td>}
                <td className={styles.td}><StatusBadge ready={item.status?.ready ?? 'Unknown'} /></td>
                <td className={styles.td}><Chip label={obs.activeCount ?? 0} size="small" style={{ background: moColors.ready.bg, color: '#fff', fontWeight: 700, fontSize: 11, height: 20 }} /></td>
                <td className={styles.td}>{(obs.failedCount ?? 0) > 0 ? <Chip label={obs.failedCount} size="small" style={{ background: moColors.failed.bg, color: '#fff', fontWeight: 700, fontSize: 11, height: 20 }} /> : <span className={styles.zeroCount} style={{ color: theme.palette.text.secondary }}>0</span>}</td>
                <td className={styles.td}>{(obs.pendingCount ?? 0) > 0 ? <Chip label={obs.pendingCount} size="small" style={{ background: moColors.pending.bg, color: '#fff', fontWeight: 700, fontSize: 11, height: 20 }} /> : <span className={styles.zeroCount} style={{ color: theme.palette.text.secondary }}>0</span>}</td>
                <td className={styles.td}>{item.spec?.dataSinkRef?.name ? <Chip label={item.spec.dataSinkRef.name} size="small" style={{ fontSize: 10, height: 18 }} /> : '—'}</td>
                <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{formatAge(item.status?.lastReconcileTime)}</td>
                <td className={styles.td} onClick={e => e.stopPropagation()}><ConditionsBadge conditions={item.status?.conditions ?? []} /></td>
              </tr>
            );
          })}
          {filtered.length === 0 && <tr><td colSpan={isFedManaged ? 9 : 10} className={styles.emptyCell} style={{ color: theme.palette.text.secondary }}>No federated metrics found.</td></tr>}
        </tbody>
      </table>
    </Box>
  );
}
