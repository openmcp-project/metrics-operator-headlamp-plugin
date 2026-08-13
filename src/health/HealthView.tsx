import React, { useEffect, useMemo, useState } from 'react';
import { Metric, ManagedMetric, FederatedMetric, FederatedManagedMetric, DataSink } from '../common/Resources';
import { StatusBadge } from '../common/StatusBadge';
import { KindBadge } from '../common/KindBadge';
import { GVKChip } from '../common/GVKChip';
import { ConditionsBadge, ConditionsTable } from '../common/ConditionsTable';
import { formatAge, formatValue } from '../common/helpers';
import { moColors } from '../common/colors';

const { Box, Typography, Chip, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, Tooltip } =
  (window as any).pluginLib?.MuiCore ?? {};
const { SectionBox } = (window as any).pluginLib?.CommonComponents ?? {};

// ── Types ─────────────────────────────────────────────────────────────────────

type MetricKind = 'Metric' | 'ManagedMetric' | 'FederatedMetric' | 'FederatedManagedMetric';
type GroupBy = 'none' | 'namespace' | 'type' | 'datasink';
type SortField = 'name' | 'namespace' | 'lastObserved' | 'value' | 'status';

interface FlatItem {
  kind: MetricKind;
  name: string;
  namespace: string;
  targetGroup: string;
  targetVersion: string;
  targetKind: string;
  ready: string;
  value: string | null;
  activeCount?: number;
  failedCount?: number;
  pendingCount?: number;
  lastObserved: string | null;
  dataSink: string | null;
  conditions: any[];
  raw: any;
}

// ── Flatten all metric kinds into uniform rows ─────────────────────────────────

function flattenMetrics(
  metrics: any[], managed: any[], federated: any[], federatedManaged: any[]
): FlatItem[] {
  const rows: FlatItem[] = [];

  for (const m of metrics ?? []) {
    rows.push({
      kind: 'Metric', name: m.metadata?.name ?? '', namespace: m.metadata?.namespace ?? '',
      targetGroup: m.spec?.target?.group ?? '', targetVersion: m.spec?.target?.version ?? '',
      targetKind: m.spec?.target?.kind ?? '',
      ready: m.status?.ready ?? 'Unknown',
      value: m.status?.observation?.latestValue ?? null,
      lastObserved: m.status?.observation?.timestamp ?? null,
      dataSink: m.spec?.dataSinkRef?.name ?? null,
      conditions: m.status?.conditions ?? [], raw: m,
    });
  }
  for (const m of managed ?? []) {
    rows.push({
      kind: 'ManagedMetric', name: m.metadata?.name ?? '', namespace: m.metadata?.namespace ?? '',
      targetGroup: m.spec?.target?.group ?? '', targetVersion: m.spec?.target?.version ?? '',
      targetKind: m.spec?.target?.kind ?? '',
      ready: m.status?.ready ?? 'Unknown',
      value: m.status?.observation?.resources != null ? String(m.status.observation.resources) : null,
      lastObserved: m.status?.observation?.timestamp ?? null,
      dataSink: m.spec?.dataSinkRef?.name ?? null,
      conditions: m.status?.conditions ?? [], raw: m,
    });
  }
  for (const m of federated ?? []) {
    rows.push({
      kind: 'FederatedMetric', name: m.metadata?.name ?? '', namespace: m.metadata?.namespace ?? '',
      targetGroup: m.spec?.target?.group ?? '', targetVersion: m.spec?.target?.version ?? '',
      targetKind: m.spec?.target?.kind ?? '',
      ready: m.status?.ready ?? 'Unknown',
      value: null,
      activeCount: m.status?.observation?.activeCount ?? 0,
      failedCount: m.status?.observation?.failedCount ?? 0,
      pendingCount: m.status?.observation?.pendingCount ?? 0,
      lastObserved: m.status?.lastReconcileTime ?? null,
      dataSink: m.spec?.dataSinkRef?.name ?? null,
      conditions: m.status?.conditions ?? [], raw: m,
    });
  }
  for (const m of federatedManaged ?? []) {
    rows.push({
      kind: 'FederatedManagedMetric', name: m.metadata?.name ?? '', namespace: m.metadata?.namespace ?? '',
      targetGroup: '', targetVersion: '', targetKind: '(all managed)',
      ready: m.status?.ready ?? 'Unknown',
      value: null,
      activeCount: m.status?.observation?.activeCount ?? 0,
      failedCount: m.status?.observation?.failedCount ?? 0,
      pendingCount: m.status?.observation?.pendingCount ?? 0,
      lastObserved: m.status?.lastReconcileTime ?? null,
      dataSink: m.spec?.dataSinkRef?.name ?? null,
      conditions: m.status?.conditions ?? [], raw: m,
    });
  }
  return rows;
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <Box style={{
      background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8,
      padding: '16px 24px', minWidth: 140, flex: 1,
      borderTop: `3px solid ${color}`,
    }}>
      <Typography variant="h4" style={{ fontWeight: 700, color, lineHeight: 1 }}>{value}</Typography>
      <Typography variant="caption" color="textSecondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
        {label}
      </Typography>
    </Box>
  );
}

// ── FederatedCounts mini-display ──────────────────────────────────────────────

function FedCounts({ active, failed, pending }: { active: number; failed: number; pending: number }) {
  return (
    <Box display="inline-flex" alignItems="center" style={{ gap: 6 }}>
      <Chip label={`▲ ${active}`} size="small" style={{ background: moColors.ready.bg, color: '#fff', fontSize: 10, height: 18 }} />
      {failed > 0 && <Chip label={`✕ ${failed}`} size="small" style={{ background: moColors.failed.bg, color: '#fff', fontSize: 10, height: 18 }} />}
      {pending > 0 && <Chip label={`◌ ${pending}`} size="small" style={{ background: moColors.pending.bg, color: '#fff', fontSize: 10, height: 18 }} />}
    </Box>
  );
}

// ── Inline conditions expander ────────────────────────────────────────────────

function InlineConditions({ item }: { item: FlatItem }) {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <ConditionsBadge conditions={item.conditions} onClick={() => setOpen(o => !o)} />
      {open && (
        <Box style={{ marginTop: 8, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
          <ConditionsTable conditions={item.conditions} />
        </Box>
      )}
    </Box>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

const TH_STYLE: React.CSSProperties = { padding: '8px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
const TD_STYLE: React.CSSProperties = { padding: '8px 12px', fontSize: 12, verticalAlign: 'middle' };

function SortIcon({ field, sort, dir }: { field: SortField; sort: SortField; dir: 'asc' | 'desc' }) {
  if (sort !== field) return <span style={{ color: '#ccc' }}> ↕</span>;
  return <span style={{ color: '#1565c0' }}>{dir === 'asc' ? ' ↑' : ' ↓'}</span>;
}

interface TableProps {
  items: FlatItem[];
  sort: SortField;
  dir: 'asc' | 'desc';
  onSort: (f: SortField) => void;
}

function MetricsTable({ items, sort, dir, onSort }: TableProps) {
  function launchDetail(item: FlatItem) {
    const Activity = (window as any).pluginLib?.Activity;
    if (!Activity) return;
    Activity.launch({
      id: `metric-detail:${item.namespace}/${item.name}`,
      location: 'split-right',
      temporary: true,
      title: item.name,
      content: React.createElement(MetricDetailPanel, { item }),
    });
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#fafafa' }}>
          <th style={TH_STYLE}>Type</th>
          <th style={TH_STYLE} onClick={() => onSort('name')}>Name <SortIcon field="name" sort={sort} dir={dir} /></th>
          <th style={TH_STYLE} onClick={() => onSort('namespace')}>Namespace <SortIcon field="namespace" sort={sort} dir={dir} /></th>
          <th style={TH_STYLE}>Target GVK</th>
          <th style={TH_STYLE} onClick={() => onSort('status')}>Ready <SortIcon field="status" sort={sort} dir={dir} /></th>
          <th style={TH_STYLE} onClick={() => onSort('value')}>Value / Counts <SortIcon field="value" sort={sort} dir={dir} /></th>
          <th style={TH_STYLE} onClick={() => onSort('lastObserved')}>Last Observed <SortIcon field="lastObserved" sort={sort} dir={dir} /></th>
          <th style={TH_STYLE}>DataSink</th>
          <th style={TH_STYLE}>Conditions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <React.Fragment key={`${item.kind}-${item.namespace}-${item.name}`}>
            <tr
              style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
              onClick={() => launchDetail(item)}
            >
              <td style={TD_STYLE}><KindBadge kind={item.kind} /></td>
              <td style={{ ...TD_STYLE, fontWeight: 600, color: '#1565c0' }}>{item.name}</td>
              <td style={{ ...TD_STYLE, color: '#555' }}>{item.namespace}</td>
              <td style={TD_STYLE}>
                {item.targetKind === '(all managed)'
                  ? <span style={{ color: '#888', fontStyle: 'italic', fontSize: 11 }}>all managed</span>
                  : <GVKChip group={item.targetGroup} version={item.targetVersion} kind={item.targetKind} />
                }
              </td>
              <td style={TD_STYLE}><StatusBadge ready={item.ready} /></td>
              <td style={TD_STYLE}>
                {item.activeCount !== undefined
                  ? <FedCounts active={item.activeCount} failed={item.failedCount ?? 0} pending={item.pendingCount ?? 0} />
                  : <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatValue(item.value)}</span>
                }
              </td>
              <td style={{ ...TD_STYLE, color: '#888', whiteSpace: 'nowrap' }}>{formatAge(item.lastObserved)}</td>
              <td style={TD_STYLE}>
                {item.dataSink
                  ? <Chip label={item.dataSink} size="small" style={{ fontSize: 10, height: 18 }} />
                  : <span style={{ color: '#888' }}>—</span>
                }
              </td>
              <td style={TD_STYLE} onClick={e => e.stopPropagation()}>
                <InlineConditions item={item} />
              </td>
            </tr>
          </React.Fragment>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
              No metrics match the current filters.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ── Detail panel (opened via Activity) ───────────────────────────────────────

function MetricDetailPanel({ item }: { item: FlatItem }) {
  const { SectionBox: SB, NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};
  return (
    <Box style={{ padding: 24 }}>
      <Typography variant="h6" style={{ marginBottom: 16 }}>{item.name}</Typography>
      <NameValueTable rows={[
        { name: 'Kind', value: React.createElement(KindBadge, { kind: item.kind }) },
        { name: 'Namespace', value: item.namespace },
        { name: 'Target GVK', value: React.createElement(GVKChip, { group: item.targetGroup, version: item.targetVersion, kind: item.targetKind }) },
        { name: 'Ready', value: React.createElement(StatusBadge, { ready: item.ready }) },
        { name: 'DataSink', value: item.dataSink ?? '—' },
        { name: 'Last Observed', value: item.lastObserved ? new Date(item.lastObserved).toLocaleString() : '—' },
        ...(item.value != null ? [{ name: 'Latest Value', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, item.value) }] : []),
        ...(item.activeCount !== undefined ? [
          { name: 'Active Count', value: String(item.activeCount) },
          { name: 'Failed Count', value: String(item.failedCount ?? 0) },
          { name: 'Pending Count', value: String(item.pendingCount ?? 0) },
        ] : []),
      ]} />
      <Box style={{ marginTop: 24 }}>
        <Typography variant="subtitle2" style={{ marginBottom: 8 }}>Conditions</Typography>
        <ConditionsTable conditions={item.conditions} />
      </Box>
    </Box>
  );
}

// ── Group label row ───────────────────────────────────────────────────────────

function GroupHeaderRow({ label, count }: { label: string; count: number }) {
  return (
    <tr>
      <td colSpan={9} style={{ padding: '10px 12px', background: '#f5f5f5', fontWeight: 700, fontSize: 12, color: '#333', borderBottom: '1px solid #e0e0e0' }}>
        {label} <span style={{ fontWeight: 400, color: '#888' }}>({count})</span>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HealthView() {
  const [metrics] = Metric.useList() as [any[], any];
  const [managed] = ManagedMetric.useList() as [any[], any];
  const [federated] = FederatedMetric.useList() as [any[], any];
  const [federatedManaged] = FederatedManagedMetric.useList() as [any[], any];
  const [dataSinks] = DataSink.useList() as [any[], any];

  const [search, setSearch] = useState('');
  const [filterKind, setFilterKind] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDataSink, setFilterDataSink] = useState('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [sort, setSort] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const allItems = useMemo(() =>
    flattenMetrics(
      metrics?.map((m: any) => m.jsonData ?? m) ?? [],
      managed?.map((m: any) => m.jsonData ?? m) ?? [],
      federated?.map((m: any) => m.jsonData ?? m) ?? [],
      federatedManaged?.map((m: any) => m.jsonData ?? m) ?? [],
    ), [metrics, managed, federated, federatedManaged]);

  // Stat counts
  const totalCount = allItems.length;
  const readyCount = allItems.filter(i => i.ready === 'True').length;
  const failedCount = allItems.filter(i => i.ready === 'False' || i.ready === 'Unknown').length;
  const dataSinkItems = dataSinks?.map((d: any) => d.jsonData ?? d) ?? [];
  const dsHealthy = dataSinkItems.filter((d: any) => d.status?.conditions?.some((c: any) => c.type === 'Available' && c.status === 'True')).length;

  // DataSink options for filter
  const dataSinkNames = useMemo(() => {
    const names = new Set<string>(allItems.map(i => i.dataSink).filter(Boolean) as string[]);
    return Array.from(names).sort();
  }, [allItems]);

  // Filter
  const filtered = useMemo(() => {
    let rows = allItems;
    if (filterKind !== 'all') rows = rows.filter(r => r.kind === filterKind);
    if (filterStatus === 'ready') rows = rows.filter(r => r.ready === 'True');
    if (filterStatus === 'failed') rows = rows.filter(r => r.ready === 'False');
    if (filterStatus === 'unknown') rows = rows.filter(r => r.ready === 'Unknown');
    if (filterDataSink !== 'all') rows = rows.filter(r => r.dataSink === filterDataSink);
    if (search) rows = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    return rows;
  }, [allItems, filterKind, filterStatus, filterDataSink, search]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string, bv: string;
      if (sort === 'name') { av = a.name; bv = b.name; }
      else if (sort === 'namespace') { av = a.namespace; bv = b.namespace; }
      else if (sort === 'status') { av = a.ready; bv = b.ready; }
      else if (sort === 'value') { av = a.value ?? ''; bv = b.value ?? ''; }
      else { av = a.lastObserved ?? ''; bv = b.lastObserved ?? ''; }
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sort, sortDir]);

  function handleSort(field: SortField) {
    if (sort === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setSortDir('asc'); }
  }

  // Group
  function getGroupKey(item: FlatItem): string {
    if (groupBy === 'namespace') return item.namespace || '(no namespace)';
    if (groupBy === 'type') return item.kind;
    if (groupBy === 'datasink') return item.dataSink || '(no datasink)';
    return '';
  }

  const groups: Array<{ label: string; items: FlatItem[] }> = useMemo(() => {
    if (groupBy === 'none') return [{ label: '', items: sorted }];
    const map = new Map<string, FlatItem[]>();
    for (const item of sorted) {
      const key = getGroupKey(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items })).sort((a, b) => a.label.localeCompare(b.label));
  }, [sorted, groupBy]);

  return (
    <SectionBox title="Health" headerProps={{ headerStyle: 'main' }}>
      {/* Stat tiles */}
      <Box display="flex" style={{ gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatTile label="Total Metrics" value={totalCount} color="#1565c0" />
        <StatTile label="Ready" value={readyCount} color={moColors.ready.bg} />
        <StatTile label="Not Ready / Unknown" value={failedCount} color={moColors.failed.bg} />
        <StatTile label={`DataSinks (healthy)`} value={`${dsHealthy}/${dataSinkItems.length}`} color={moColors.active.bg} />
      </Box>

      {/* Filter bar */}
      <Box display="flex" alignItems="center" style={{ gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name…"
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <FormControl size="small" style={{ minWidth: 160 }}>
          <InputLabel>Type</InputLabel>
          <Select value={filterKind} label="Type" onChange={(e: any) => setFilterKind(e.target.value)}>
            <MenuItem value="all">All types</MenuItem>
            <MenuItem value="Metric">Metric</MenuItem>
            <MenuItem value="ManagedMetric">Managed Metric</MenuItem>
            <MenuItem value="FederatedMetric">Federated Metric</MenuItem>
            <MenuItem value="FederatedManagedMetric">Fed. Managed Metric</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" style={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e: any) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="ready">Ready</MenuItem>
            <MenuItem value="failed">Not Ready</MenuItem>
            <MenuItem value="unknown">Unknown</MenuItem>
          </Select>
        </FormControl>
        {dataSinkNames.length > 0 && (
          <FormControl size="small" style={{ minWidth: 160 }}>
            <InputLabel>DataSink</InputLabel>
            <Select value={filterDataSink} label="DataSink" onChange={(e: any) => setFilterDataSink(e.target.value)}>
              <MenuItem value="all">All datasinks</MenuItem>
              {dataSinkNames.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        <Box style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Typography variant="caption" color="textSecondary">Group by:</Typography>
          {(['none', 'namespace', 'type', 'datasink'] as GroupBy[]).map(g => (
            <Chip
              key={g}
              label={g === 'none' ? 'Flat' : g === 'type' ? 'Type' : g === 'datasink' ? 'DataSink' : 'Namespace'}
              size="small"
              clickable
              onClick={() => setGroupBy(g)}
              style={{
                fontWeight: groupBy === g ? 700 : 400,
                background: groupBy === g ? '#1565c0' : undefined,
                color: groupBy === g ? '#fff' : undefined,
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Table */}
      <Box style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#fafafa' }}>
              <th style={TH_STYLE}>Type</th>
              <th style={TH_STYLE} onClick={() => handleSort('name')}>Name <SortIcon field="name" sort={sort} dir={sortDir} /></th>
              <th style={TH_STYLE} onClick={() => handleSort('namespace')}>Namespace <SortIcon field="namespace" sort={sort} dir={sortDir} /></th>
              <th style={TH_STYLE}>Target GVK</th>
              <th style={TH_STYLE} onClick={() => handleSort('status')}>Ready <SortIcon field="status" sort={sort} dir={sortDir} /></th>
              <th style={TH_STYLE} onClick={() => handleSort('value')}>Value / Counts <SortIcon field="value" sort={sort} dir={sortDir} /></th>
              <th style={TH_STYLE} onClick={() => handleSort('lastObserved')}>Last Observed <SortIcon field="lastObserved" sort={sort} dir={sortDir} /></th>
              <th style={TH_STYLE}>DataSink</th>
              <th style={TH_STYLE}>Conditions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(({ label, items }) => (
              <React.Fragment key={label || '__flat'}>
                {label && <GroupHeaderRow label={label} count={items.length} />}
                {items.map(item => (
                  <HealthRow key={`${item.kind}-${item.namespace}-${item.name}`} item={item} />
                ))}
              </React.Fragment>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                  No metrics match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Box>
    </SectionBox>
  );
}

// ── Individual row (with inline conditions expander) ──────────────────────────

function HealthRow({ item }: { item: FlatItem }) {
  const [condOpen, setCondOpen] = useState(false);

  function launchDetail() {
    const Activity = (window as any).pluginLib?.Activity;
    if (!Activity) return;
    Activity.launch({
      id: `metric-detail:${item.namespace}/${item.name}`,
      location: 'split-right',
      temporary: true,
      title: item.name,
      content: React.createElement(MetricDetailPanel, { item }),
    });
  }

  return (
    <>
      <tr style={{ borderBottom: condOpen ? 'none' : '1px solid #f0f0f0', cursor: 'pointer' }} onClick={launchDetail}>
        <td style={TD_STYLE}><KindBadge kind={item.kind} /></td>
        <td style={{ ...TD_STYLE, fontWeight: 600, color: '#1565c0' }}>{item.name}</td>
        <td style={{ ...TD_STYLE, color: '#555' }}>{item.namespace}</td>
        <td style={TD_STYLE}>
          {item.targetKind === '(all managed)'
            ? <span style={{ color: '#888', fontStyle: 'italic', fontSize: 11 }}>all managed</span>
            : <GVKChip group={item.targetGroup} version={item.targetVersion} kind={item.targetKind} />
          }
        </td>
        <td style={TD_STYLE}><StatusBadge ready={item.ready} /></td>
        <td style={TD_STYLE}>
          {item.activeCount !== undefined
            ? <FedCounts active={item.activeCount} failed={item.failedCount ?? 0} pending={item.pendingCount ?? 0} />
            : <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatValue(item.value)}</span>
          }
        </td>
        <td style={{ ...TD_STYLE, color: '#888', whiteSpace: 'nowrap' }}>{formatAge(item.lastObserved)}</td>
        <td style={TD_STYLE}>
          {item.dataSink
            ? <Chip label={item.dataSink} size="small" style={{ fontSize: 10, height: 18 }} />
            : <span style={{ color: '#888' }}>—</span>
          }
        </td>
        <td style={TD_STYLE} onClick={e => e.stopPropagation()}>
          <ConditionsBadge conditions={item.conditions} onClick={() => setCondOpen(o => !o)} />
        </td>
      </tr>
      {condOpen && (
        <tr>
          <td colSpan={9} style={{ padding: '0 12px 12px', background: '#fafcff', borderBottom: '1px solid #f0f0f0' }}>
            <ConditionsTable conditions={item.conditions} />
          </td>
        </tr>
      )}
    </>
  );
}
