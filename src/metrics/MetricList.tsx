import React, { useState } from 'react';
import { Metric } from '../common/Resources';
import { StatusBadge } from '../common/StatusBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsBadge } from '../common/ConditionsTable';
import { formatAge, formatValue } from '../common/helpers';
import { MetricDetail } from './MetricDetail';

const { Box, TextField, FormControl, InputLabel, Select, MenuItem, Chip } =
  (window as any).pluginLib?.MuiCore ?? {};

const TH: React.CSSProperties = { padding: '8px 12px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' };
const TD: React.CSSProperties = { padding: '8px 12px', fontSize: 12, verticalAlign: 'middle' };

export default function MetricList() {
  const [metrics] = Metric.useList() as [any[], any];
  const [search, setSearch] = useState('');
  const [filterNs, setFilterNs] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDs, setFilterDs] = useState('all');

  const items = (metrics?.map((m: any) => m.jsonData ?? m) ?? []) as any[];

  const namespaces = Array.from(new Set(items.map(i => i.metadata?.namespace).filter(Boolean))).sort() as string[];
  const sinks = Array.from(new Set(items.map(i => i.spec?.dataSinkRef?.name).filter(Boolean))).sort() as string[];

  const filtered = items.filter(i => {
    if (filterNs !== 'all' && i.metadata?.namespace !== filterNs) return false;
    if (filterStatus === 'ready' && i.status?.ready !== 'True') return false;
    if (filterStatus === 'failed' && i.status?.ready !== 'False') return false;
    if (filterStatus === 'unknown' && i.status?.ready !== 'Unknown') return false;
    if (filterDs !== 'all' && i.spec?.dataSinkRef?.name !== filterDs) return false;
    if (search && !i.metadata?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function launchDetail(item: any) {
    const Activity = (window as any).pluginLib?.Activity;
    if (!Activity) return;
    Activity.launch({
      id: `metric-detail:${item.metadata?.namespace}/${item.metadata?.name}`,
      location: 'split-right',
      temporary: true,
      title: item.metadata?.name,
      content: React.createElement(MetricDetail, { item }),
    });
  }

  return (
    <Box>
      <Box display="flex" style={{ gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search…" value={search} onChange={(e: any) => setSearch(e.target.value)} style={{ minWidth: 180 }} />
        {namespaces.length > 1 && (
          <FormControl size="small" style={{ minWidth: 150 }}>
            <InputLabel>Namespace</InputLabel>
            <Select value={filterNs} label="Namespace" onChange={(e: any) => setFilterNs(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              {namespaces.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        <FormControl size="small" style={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e: any) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="failed">Not Ready</MenuItem>
            <MenuItem value="unknown">Unknown</MenuItem>
          </Select>
        </FormControl>
        {sinks.length > 1 && (
          <FormControl size="small" style={{ minWidth: 150 }}>
            <InputLabel>DataSink</InputLabel>
            <Select value={filterDs} label="DataSink" onChange={(e: any) => setFilterDs(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              {sinks.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </Box>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#fafafa' }}>
            <th style={TH}>Name</th>
            <th style={TH}>Namespace</th>
            <th style={TH}>Target GVK</th>
            <th style={TH}>Ready</th>
            <th style={TH}>Interval</th>
            <th style={TH}>Value</th>
            <th style={TH}>DataSink</th>
            <th style={TH}>Last Observed</th>
            <th style={TH}>Conditions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item: any) => (
            <tr key={`${item.metadata?.namespace}/${item.metadata?.name}`}
              style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
              onClick={() => launchDetail(item)}>
              <td style={{ ...TD, fontWeight: 600, color: '#1565c0' }}>{item.metadata?.name}</td>
              <td style={{ ...TD, color: '#555' }}>{item.metadata?.namespace}</td>
              <td style={TD}><GVKChip group={item.spec?.target?.group ?? ''} version={item.spec?.target?.version ?? ''} kind={item.spec?.target?.kind ?? ''} /></td>
              <td style={TD}><StatusBadge ready={item.status?.ready ?? 'Unknown'} /></td>
              <td style={{ ...TD, fontFamily: 'monospace' }}>{item.spec?.interval ?? '—'}</td>
              <td style={{ ...TD, fontFamily: 'monospace' }}>{formatValue(item.status?.observation?.latestValue)}</td>
              <td style={TD}>{item.spec?.dataSinkRef?.name ? <Chip label={item.spec.dataSinkRef.name} size="small" style={{ fontSize: 10, height: 18 }} /> : '—'}</td>
              <td style={{ ...TD, color: '#888' }}>{formatAge(item.status?.observation?.timestamp)}</td>
              <td style={TD} onClick={e => e.stopPropagation()}><ConditionsBadge conditions={item.status?.conditions ?? []} /></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No metrics found.</td></tr>}
        </tbody>
      </table>
    </Box>
  );
}
