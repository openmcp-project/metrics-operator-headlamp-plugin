import React, { useState } from 'react';
import { ManagedMetric } from '../common/Resources';
import { StatusBadge } from '../common/StatusBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsBadge } from '../common/ConditionsTable';
import { formatAge } from '../common/helpers';
import { ManagedMetricDetail } from './ManagedMetricDetail';
import styles from './ManagedMetricList.module.css';

const { Box, TextField, FormControl, InputLabel, Select, MenuItem, Chip, useTheme } =
  (window as any).pluginLib?.MuiCore ?? {};

export default function ManagedMetricList() {
  const theme = useTheme();
  const [managed] = ManagedMetric.useList() as [any[], any];
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const items = (managed?.map((m: any) => m.jsonData ?? m) ?? []) as any[];
  const filtered = items.filter(i => {
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
      id: `managed-metric-detail:${item.metadata?.namespace}/${item.metadata?.name}`,
      location: 'split-right',
      temporary: true,
      title: item.metadata?.name,
      content: React.createElement(ManagedMetricDetail, { item }),
    });
  }

  return (
    <Box>
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
            <th className={styles.th}>Target GVK</th>
            <th className={styles.th}>Ready</th>
            <th className={styles.th}>Interval</th>
            <th className={styles.th}>Resource Count</th>
            <th className={styles.th}>DataSink</th>
            <th className={styles.th}>Last Observed</th>
            <th className={styles.th}>Conditions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item: any) => (
            <tr key={`${item.metadata?.namespace}/${item.metadata?.name}`}
              className={styles.row}
              style={{ borderBottom: `1px solid ${theme.palette.divider}` }}
              onClick={() => launchDetail(item)}>
              <td className={`${styles.td} ${styles.nameCell}`} style={{ color: '#1565c0' }}>{item.metadata?.name}</td>
              <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{item.metadata?.namespace}</td>
              <td className={styles.td}><GVKChip group={item.spec?.target?.group ?? ''} version={item.spec?.target?.version ?? ''} kind={item.spec?.target?.kind ?? ''} /></td>
              <td className={styles.td}><StatusBadge ready={item.status?.ready ?? 'Unknown'} /></td>
              <td className={`${styles.td} ${styles.mono}`}>{item.spec?.interval ?? '—'}</td>
              <td className={`${styles.td} ${styles.monoBold}`}>
                {item.status?.observation?.resources != null ? item.status.observation.resources : '—'}
              </td>
              <td className={styles.td}>{item.spec?.dataSinkRef?.name ? <Chip label={item.spec.dataSinkRef.name} size="small" style={{ fontSize: 10, height: 18 }} /> : '—'}</td>
              <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{formatAge(item.status?.observation?.timestamp)}</td>
              <td className={styles.td} onClick={e => e.stopPropagation()}><ConditionsBadge conditions={item.status?.conditions ?? []} /></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={9} className={styles.emptyCell} style={{ color: theme.palette.text.secondary }}>No managed metrics found.</td></tr>}
        </tbody>
      </table>
    </Box>
  );
}
