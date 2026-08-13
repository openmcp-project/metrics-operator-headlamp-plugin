import React, { useState } from 'react';
import { FederatedMetric, FederatedManagedMetric } from '../common/Resources';
import { StatusBadge } from '../common/StatusBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsBadge } from '../common/ConditionsTable';
import { formatAge } from '../common/helpers';
import { moColors } from '../common/colors';
import { FederatedMetricDetail } from './FederatedMetricDetail';

const { Box, TextField, FormControl, InputLabel, Select, MenuItem, Chip } =
  (window as any).pluginLib?.MuiCore ?? {};

const TH: React.CSSProperties = { padding: '8px 12px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' };
const TD: React.CSSProperties = { padding: '8px 12px', fontSize: 12, verticalAlign: 'middle' };

interface Props {
  kind: 'FederatedMetric' | 'FederatedManagedMetric';
}

export default function FederatedMetricList({ kind }: Props) {
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
        <Box style={{ padding: '10px 14px', background: 'rgba(21,101,192,0.06)', borderRadius: 6, marginBottom: 14, fontSize: 12, color: '#1565c0' }}>
          Monitors all Crossplane managed resources across federated clusters. No target GVK required — the operator discovers all resources with the "crossplane" + "managed" categories.
        </Box>
      )}

      <Box display="flex" style={{ gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search…" value={search} onChange={(e: any) => setSearch(e.target.value)} style={{ minWidth: 180 }} />
        <FormControl size="small" style={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e: any) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="failed">Not Ready</MenuItem>
            <MenuItem value="unknown">Unknown</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#fafafa' }}>
            <th style={TH}>Name</th>
            <th style={TH}>Namespace</th>
            {!isFedManaged && <th style={TH}>Target GVK</th>}
            <th style={TH}>Ready</th>
            <th style={TH}>Active</th>
            <th style={TH}>Failed</th>
            <th style={TH}>Pending</th>
            <th style={TH}>DataSink</th>
            <th style={TH}>Last Reconciled</th>
            <th style={TH}>Conditions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item: any) => {
            const obs = item.status?.observation ?? {};
            return (
              <tr key={`${item.metadata?.namespace}/${item.metadata?.name}`}
                style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                onClick={() => launchDetail(item)}>
                <td style={{ ...TD, fontWeight: 600, color: '#1565c0' }}>{item.metadata?.name}</td>
                <td style={{ ...TD, color: '#555' }}>{item.metadata?.namespace}</td>
                {!isFedManaged && <td style={TD}><GVKChip group={item.spec?.target?.group ?? ''} version={item.spec?.target?.version ?? ''} kind={item.spec?.target?.kind ?? ''} /></td>}
                <td style={TD}><StatusBadge ready={item.status?.ready ?? 'Unknown'} /></td>
                <td style={TD}><Chip label={obs.activeCount ?? 0} size="small" style={{ background: moColors.ready.bg, color: '#fff', fontWeight: 700, fontSize: 11, height: 20 }} /></td>
                <td style={TD}>{(obs.failedCount ?? 0) > 0 ? <Chip label={obs.failedCount} size="small" style={{ background: moColors.failed.bg, color: '#fff', fontWeight: 700, fontSize: 11, height: 20 }} /> : <span style={{ color: '#888', fontSize: 12 }}>0</span>}</td>
                <td style={TD}>{(obs.pendingCount ?? 0) > 0 ? <Chip label={obs.pendingCount} size="small" style={{ background: moColors.pending.bg, color: '#fff', fontWeight: 700, fontSize: 11, height: 20 }} /> : <span style={{ color: '#888', fontSize: 12 }}>0</span>}</td>
                <td style={TD}>{item.spec?.dataSinkRef?.name ? <Chip label={item.spec.dataSinkRef.name} size="small" style={{ fontSize: 10, height: 18 }} /> : '—'}</td>
                <td style={{ ...TD, color: '#888' }}>{formatAge(item.status?.lastReconcileTime)}</td>
                <td style={TD} onClick={e => e.stopPropagation()}><ConditionsBadge conditions={item.status?.conditions ?? []} /></td>
              </tr>
            );
          })}
          {filtered.length === 0 && <tr><td colSpan={isFedManaged ? 9 : 10} style={{ padding: 32, textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No federated metrics found.</td></tr>}
        </tbody>
      </table>
    </Box>
  );
}
