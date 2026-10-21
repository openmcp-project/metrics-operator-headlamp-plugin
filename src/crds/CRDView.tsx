import React, { useState, useEffect } from 'react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { getApiProxy } from '../common/helpers';
import { SchemaPropertyTree } from '../common/CRDSchema';
import { StatusBadge } from '../common/StatusBadge';
import styles from './CRDView.module.css';

const { Box, Typography, Chip, CircularProgress, TextField, Tabs, Tab, MenuItem, Paper, useTheme } =
  (window as any).pluginLib?.MuiCore ?? {};
const { SectionBox, NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};

const OPERATOR_GROUPS = ['.openmcp.cloud', '.open-control-plane.io'];

function isOperatorCRD(crd: any): boolean {
  const group: string = crd.jsonData?.spec?.group ?? crd.spec?.group ?? '';
  return OPERATOR_GROUPS.some(suffix => group.endsWith(suffix));
}

function InstancesList({ crd }: { crd: any }) {
  const theme = useTheme();
  const [instances, setInstances] = useState<any[] | null>(null);
  const spec = crd.jsonData?.spec ?? crd.spec ?? {};
  const group: string = spec.group ?? '';
  const plural: string = spec.names?.plural ?? '';
  const ver: string = spec.versions?.[0]?.name ?? 'v1alpha1';
  const scope: string = spec.scope ?? 'Namespaced';

  useEffect(() => {
    if (!group || !plural) return;
    const path = scope === 'Namespaced'
      ? `/apis/${group}/${ver}/${plural}`
      : `/apis/${group}/${ver}/${plural}`;
    getApiProxy().request(path).then((res: any) => setInstances(res?.items ?? [])).catch(() => setInstances([]));
  }, [crd.metadata?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (instances === null) {
    return <Box display="flex" alignItems="center" className={styles.loadingRow}><CircularProgress size={16} /><Typography variant="body2">Loading…</Typography></Box>;
  }
  if (instances.length === 0) {
    return <Box className={styles.emptyBox}><Typography variant="body2" color="textSecondary">No instances found.</Typography></Box>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.headerRow} style={{ borderBottom: `2px solid ${theme.palette.divider}`, background: theme.palette.background.default }}>
          <th className={styles.thInstances}>Name</th>
          {scope === 'Namespaced' && <th className={styles.thInstances}>Namespace</th>}
          <th className={styles.thInstances}>Ready</th>
          <th className={styles.thInstances}>Conditions</th>
          <th className={styles.thInstances}>Age</th>
        </tr>
      </thead>
      <tbody>
        {instances.map((inst: any, i: number) => (
          <tr key={i} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
            <td className={styles.tdName}>{inst.metadata?.name}</td>
            {scope === 'Namespaced' && <td className={styles.tdSecondary} style={{ color: theme.palette.text.secondary }}>{inst.metadata?.namespace}</td>}
            <td className={styles.tdCell}><StatusBadge ready={inst.status?.ready ?? 'Unknown'} /></td>
            <td className={styles.tdMeta} style={{ color: theme.palette.text.secondary }}>
              {(inst.status?.conditions ?? []).length || '—'}
            </td>
            <td className={styles.tdMeta} style={{ color: theme.palette.text.secondary }}>
              {inst.metadata?.creationTimestamp ? new Date(inst.metadata.creationTimestamp).toLocaleDateString() : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CRDDetailView({ crd }: { crd: any }) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const spec = crd.jsonData?.spec ?? crd.spec ?? {};
  const kind: string = spec.names?.kind ?? crd.metadata?.name ?? '';
  const group: string = spec.group ?? '';
  const scope: string = spec.scope ?? 'Cluster';
  const versions: any[] = spec.versions ?? [];
  const topVersion = versions[0]?.name ?? 'v1alpha1';
  const openAPISchema = versions[0]?.schema?.openAPIV3Schema ?? null;
  const plural: string = spec.names?.plural ?? '';

  return (
    <Box className={styles.detailRoot}>
      <Typography variant="h6" className={styles.title}>{kind}</Typography>
      <Typography variant="caption" color="textSecondary" className={styles.subtitle}>
        {group} · {topVersion} · {scope}
      </Typography>

      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} className={styles.tabs} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Tab label="Overview" className={styles.tab} />
        <Tab label="Instances" className={styles.tab} />
        <Tab label="Schema" className={styles.tab} />
      </Tabs>

      {tab === 0 && (
        <NameValueTable rows={[
          { name: 'Kind', value: kind },
          { name: 'Group', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, group) },
          { name: 'Versions', value: versions.map((v: any) => v.name).join(', ') },
          { name: 'Plural', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, plural) },
          { name: 'Scope', value: React.createElement(Chip, { label: scope, size: 'small', className: styles.scopeChip, style: { background: scope === 'Namespaced' ? '#e3f2fd' : '#fce4ec', color: '#1a1a1a' } }) },
          ...(openAPISchema?.description ? [{ name: 'Description', value: openAPISchema.description }] : []),
        ]} />
      )}

      {tab === 1 && <InstancesList crd={crd} />}

      {tab === 2 && (
        openAPISchema
          ? React.createElement(SchemaPropertyTree, { schema: openAPISchema, required: openAPISchema.required ?? [] })
          : React.createElement(Typography, { variant: 'body2', color: 'textSecondary' }, 'No schema available.')
      )}
    </Box>
  );
}

function openCRDDetail(crd: any) {
  const Activity = (window as any).pluginLib?.Activity;
  if (!Activity?.launch) return;
  const kind: string = crd.jsonData?.spec?.names?.kind ?? crd.spec?.names?.kind ?? crd.metadata?.name ?? '';
  Activity.launch({
    id: `mo-crd-detail:${crd.metadata?.name ?? kind}`,
    location: 'split-right',
    temporary: true,
    title: `CRD · ${kind}`,
    content: React.createElement(CRDDetailView, { crd }),
  });
}

export default function CRDView() {
  const theme = useTheme();
  const [allCrds] = (K8s.ResourceClasses.CustomResourceDefinition as any).useList() as [any[], any];
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  const operatorCrds = (allCrds ?? []).filter(isOperatorCRD);

  const apiGroups = Array.from(
    new Set(operatorCrds.map((c: any) => c.jsonData?.spec?.group ?? c.spec?.group ?? ''))
  ).sort();

  const filtered = operatorCrds.filter((crd: any) => {
    const spec = crd.jsonData?.spec ?? crd.spec ?? {};
    const kind: string = spec.names?.kind ?? '';
    const group: string = spec.group ?? '';
    const scope: string = spec.scope ?? '';
    if (search && !kind.toLowerCase().includes(search.toLowerCase()) && !group.toLowerCase().includes(search.toLowerCase())) return false;
    if (scopeFilter !== 'all' && scope !== scopeFilter) return false;
    if (groupFilter !== 'all' && group !== groupFilter) return false;
    return true;
  }).sort((a: any, b: any) => {
    const ka: string = a.jsonData?.spec?.names?.kind ?? a.spec?.names?.kind ?? '';
    const kb: string = b.jsonData?.spec?.names?.kind ?? b.spec?.names?.kind ?? '';
    return ka.localeCompare(kb);
  });

  const byGroup = filtered.reduce((acc: Record<string, any[]>, crd: any) => {
    const g: string = crd.jsonData?.spec?.group ?? crd.spec?.group ?? '—';
    if (!acc[g]) acc[g] = [];
    acc[g].push(crd);
    return acc;
  }, {});

  if (!allCrds) {
    return (
      <Box display="flex" alignItems="center" className={styles.loadingMain}>
        <CircularProgress size={20} /><Typography>Loading CRDs…</Typography>
      </Box>
    );
  }

  return (
    <SectionBox title="CRDs" headerProps={{ headerStyle: 'main' }}>
      <Box display="flex" className={styles.filterBar}>
        <TextField size="small" placeholder="Search kind or group…" value={search}
          onChange={(e: any) => setSearch(e.target.value)} className={styles.searchField} />
        <TextField select size="small" value={scopeFilter}
          onChange={(e: any) => setScopeFilter(e.target.value)} className={styles.scopeField}>
          <MenuItem value="all">All scopes</MenuItem>
          <MenuItem value="Cluster">Cluster</MenuItem>
          <MenuItem value="Namespaced">Namespaced</MenuItem>
        </TextField>
        <TextField select size="small" value={groupFilter}
          onChange={(e: any) => setGroupFilter(e.target.value)} className={styles.groupField}>
          <MenuItem value="all">All groups</MenuItem>
          {apiGroups.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
        </TextField>
        <Box className={styles.countWrap}>
          <Chip label={`${filtered.length} CRDs`} size="small" className={styles.countChip} />
        </Box>
      </Box>

      {filtered.length === 0 ? (
        <Typography color="textSecondary">No CRDs found for {OPERATOR_GROUPS.join(', ')} groups.</Typography>
      ) : (
        Object.entries(byGroup).sort(([a], [b]) => a.localeCompare(b)).map(([group, crds]) => (
          <Box key={group} className={styles.groupSection}>
            <Typography variant="subtitle2" className={styles.groupLabel} style={{ color: theme.palette.text.secondary }}>
              {group}
              <Chip label={(crds as any[]).length} size="small" className={styles.groupCountChip} />
            </Typography>
            <Paper elevation={1}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.headerRow} style={{ borderBottom: `2px solid ${theme.palette.divider}`, background: theme.palette.background.default }}>
                    <th className={styles.listTh}>Kind</th>
                    <th className={styles.listTh}>Version</th>
                    <th className={styles.listTh}>Scope</th>
                    <th className={styles.listTh}>Plural</th>
                  </tr>
                </thead>
                <tbody>
                  {(crds as any[]).map((crd: any) => {
                    const spec = crd.jsonData?.spec ?? crd.spec ?? {};
                    const kind: string = spec.names?.kind ?? '';
                    const scope: string = spec.scope ?? '';
                    const topVer: string = spec.versions?.[0]?.name ?? '';
                    const plural: string = spec.names?.plural ?? '';
                    return (
                      <tr key={crd.metadata?.name} className={styles.row} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}
                        onClick={() => openCRDDetail(crd)}>
                        <td className={styles.listTdKind} style={{ color: '#1565c0' }}>{kind}</td>
                        <td className={styles.listTdMono}>{topVer}</td>
                        <td className={styles.listTdCell}>
                          <Chip label={scope} size="small" className={styles.scopeChip} style={{ background: scope === 'Namespaced' ? '#e3f2fd' : '#fce4ec', color: '#1a1a1a' }} />
                        </td>
                        <td className={styles.listTdMono} style={{ color: theme.palette.text.secondary }}>{plural}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Paper>
          </Box>
        ))
      )}
    </SectionBox>
  );
}
