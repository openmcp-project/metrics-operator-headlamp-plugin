import React, { useState, useEffect } from 'react';
import { fetchApiGroups } from './schemaHelpers';
import { FederatedClusterAccess } from '../../common/Resources';
import styles from './ResourcePicker.module.css';

const { Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Chip, useTheme } =
  (window as any).pluginLib?.MuiCore ?? {};

export interface SelectedGVK {
  group: string;
  version: string;
  kind: string;
  namespaced: boolean;
}

interface Props {
  value: SelectedGVK | null;
  onChange: (gvk: SelectedGVK) => void;
  requireFederatedAccess?: boolean;
  federatedAccessRef?: string;
  onFederatedAccessChange?: (name: string) => void;
}

export function ResourcePicker({ value, onChange, requireFederatedAccess, federatedAccessRef, onFederatedAccessChange }: Props) {
  const theme = useTheme();
  const [apiGroups, setApiGroups] = useState<SelectedGVK[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [federatedAccesses] = (FederatedClusterAccess as any).useList() as [any[], any];

  useEffect(() => {
    fetchApiGroups().then(groups => {
      setApiGroups(groups);
      setLoading(false);
    });
  }, []);

  const groups = Array.from(new Set(apiGroups.map(r => r.group || '(core)'))).sort();

  const filtered = apiGroups.filter(r => {
    if (search && !r.kind.toLowerCase().includes(search.toLowerCase())) return false;
    const g = r.group || '(core)';
    if (groupFilter !== 'all' && g !== groupFilter) return false;
    return true;
  });

  const fedAccessList = (federatedAccesses ?? []).map((f: any) => f.jsonData ?? f);

  return (
    <Box>
      <Typography variant="h6" className={styles.title}>Select target resource type</Typography>
      <Typography variant="body2" color="textSecondary" className={styles.subtitle}>
        Choose the Kubernetes resource kind you want to count or measure.
      </Typography>

      {requireFederatedAccess && (
        <Box className={styles.fedAccessSection}>
          <Typography variant="subtitle2" className={styles.fedAccessLabel}>Federated Cluster Access *</Typography>
          <FormControl size="small" className={styles.fedAccessControl}>
            <InputLabel>FederatedClusterAccess</InputLabel>
            <Select
              value={federatedAccessRef ?? ''}
              label="FederatedClusterAccess"
              onChange={(e: any) => onFederatedAccessChange?.(e.target.value)}>
              {fedAccessList.map((f: any) => (
                <MenuItem key={f.metadata?.name} value={f.metadata?.name}>{f.metadata?.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Box display="flex" className={styles.filterBar}>
        <TextField
          size="small"
          placeholder="Search kind…"
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          className={styles.search}
        />
        <FormControl size="small" className={styles.groupFilter}>
          <InputLabel>API Group</InputLabel>
          <Select value={groupFilter} label="API Group" onChange={(e: any) => setGroupFilter(e.target.value)}>
            <MenuItem value="all">All groups</MenuItem>
            {groups.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box display="flex" alignItems="center" className={styles.loadingBox}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="textSecondary">Loading API resources…</Typography>
        </Box>
      ) : (
        <Box className={styles.tableWrap} style={{ border: `1px solid ${theme.palette.divider}` }}>
          <table className={styles.table}>
            <thead className={styles.thead} style={{ background: theme.palette.background.default }}>
              <tr style={{ borderBottom: `2px solid ${theme.palette.divider}` }}>
                <th className={styles.th}>Kind</th>
                <th className={styles.th}>Group</th>
                <th className={styles.th}>Version</th>
                <th className={styles.th}>Scope</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const selected = value?.group === r.group && value?.version === r.version && value?.kind === r.kind;
                return (
                  <tr
                    key={i}
                    onClick={() => onChange(r)}
                    className={styles.row}
                    style={{
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      background: selected ? 'rgba(21,101,192,0.08)' : undefined,
                    }}>
                    <td className={styles.td} style={{ fontWeight: selected ? 700 : 600, color: selected ? '#1565c0' : undefined }}>{r.kind}</td>
                    <td className={`${styles.td} ${styles.mono}`} style={{ color: theme.palette.text.secondary }}>{r.group || '(core)'}</td>
                    <td className={`${styles.td} ${styles.mono}`}>{r.version}</td>
                    <td className={styles.td}>
                      <Chip label={r.namespaced ? 'Namespaced' : 'Cluster'} size="small"
                        className={styles.chip} style={{ background: r.namespaced ? '#e3f2fd' : '#fce4ec', color: '#1a1a1a' }} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className={styles.emptyCell} style={{ color: theme.palette.text.secondary }}>No resources found.</td></tr>
              )}
            </tbody>
          </table>
        </Box>
      )}

      {value && (
        <Box className={styles.selectedSummary} style={{ background: 'rgba(46,125,50,0.06)' }}>
          Selected: <strong>{value.kind}</strong> · {value.group || 'core'}/{value.version} ·{' '}
          {value.namespaced ? 'Namespaced' : 'Cluster-scoped'}
        </Box>
      )}
    </Box>
  );
}
