import React, { useState, useEffect } from 'react';
import { fetchApiGroups } from './schemaHelpers';
import { FederatedClusterAccess } from '../../common/Resources';

const { Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Chip } =
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

const TH: React.CSSProperties = { padding: '7px 12px', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' };
const TD: React.CSSProperties = { padding: '7px 12px', fontSize: 12, verticalAlign: 'middle' };

export function ResourcePicker({ value, onChange, requireFederatedAccess, federatedAccessRef, onFederatedAccessChange }: Props) {
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
      <Typography variant="h6" style={{ marginBottom: 6 }}>Select target resource type</Typography>
      <Typography variant="body2" color="textSecondary" style={{ marginBottom: 18 }}>
        Choose the Kubernetes resource kind you want to count or measure.
      </Typography>

      {requireFederatedAccess && (
        <Box style={{ marginBottom: 20 }}>
          <Typography variant="subtitle2" style={{ marginBottom: 8 }}>Federated Cluster Access *</Typography>
          <FormControl size="small" style={{ minWidth: 280 }}>
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

      <Box display="flex" style={{ gap: 10, marginBottom: 14 }}>
        <TextField
          size="small"
          placeholder="Search kind…"
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <FormControl size="small" style={{ minWidth: 200 }}>
          <InputLabel>API Group</InputLabel>
          <Select value={groupFilter} label="API Group" onChange={(e: any) => setGroupFilter(e.target.value)}>
            <MenuItem value="all">All groups</MenuItem>
            {groups.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box display="flex" alignItems="center" style={{ gap: 10, padding: 24 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="textSecondary">Loading API resources…</Typography>
        </Box>
      ) : (
        <Box style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 6 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fafafa', zIndex: 1 }}>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={TH}>Kind</th>
                <th style={TH}>Group</th>
                <th style={TH}>Version</th>
                <th style={TH}>Scope</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const selected = value?.group === r.group && value?.version === r.version && value?.kind === r.kind;
                return (
                  <tr
                    key={i}
                    onClick={() => onChange(r)}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      background: selected ? 'rgba(21,101,192,0.08)' : undefined,
                    }}>
                    <td style={{ ...TD, fontWeight: selected ? 700 : 600, color: selected ? '#1565c0' : undefined }}>{r.kind}</td>
                    <td style={{ ...TD, fontFamily: 'monospace', fontSize: 11, color: '#555' }}>{r.group || '(core)'}</td>
                    <td style={{ ...TD, fontFamily: 'monospace', fontSize: 11 }}>{r.version}</td>
                    <td style={TD}>
                      <Chip label={r.namespaced ? 'Namespaced' : 'Cluster'} size="small"
                        style={{ fontSize: 10, height: 18, background: r.namespaced ? '#e3f2fd' : '#fce4ec' }} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No resources found.</td></tr>
              )}
            </tbody>
          </table>
        </Box>
      )}

      {value && (
        <Box style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(46,125,50,0.06)', borderRadius: 6, fontSize: 12 }}>
          Selected: <strong>{value.kind}</strong> · {value.group || 'core'}/{value.version} ·{' '}
          {value.namespaced ? 'Namespaced' : 'Cluster-scoped'}
        </Box>
      )}
    </Box>
  );
}
