import React, { useState, useEffect } from 'react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { getApiProxy } from '../common/helpers';
import { SchemaPropertyTree, scaffoldFromSchema } from '../common/CRDSchema';
import { YamlEditor } from '../common/YamlEditor';
import { StatusBadge } from '../common/StatusBadge';
import { ConditionsTable } from '../common/ConditionsTable';
import * as jsYaml from 'js-yaml';

const { Box, Typography, Chip, CircularProgress, TextField, Tabs, Tab, MenuItem, Paper } =
  (window as any).pluginLib?.MuiCore ?? {};
const { SectionBox, NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};

const OPERATOR_GROUPS = ['.openmcp.cloud', '.open-control-plane.io'];

function isOperatorCRD(crd: any): boolean {
  const group: string = crd.jsonData?.spec?.group ?? crd.spec?.group ?? '';
  return OPERATOR_GROUPS.some(suffix => group.endsWith(suffix));
}

function InstancesList({ crd }: { crd: any }) {
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
    return <Box display="flex" alignItems="center" style={{ gap: 10, padding: 24 }}><CircularProgress size={16} /><Typography variant="body2">Loading…</Typography></Box>;
  }
  if (instances.length === 0) {
    return <Box style={{ padding: 24 }}><Typography variant="body2" color="textSecondary">No instances found.</Typography></Box>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#fafafa' }}>
          <th style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600 }}>Name</th>
          {scope === 'Namespaced' && <th style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600 }}>Namespace</th>}
          <th style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600 }}>Ready</th>
          <th style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600 }}>Conditions</th>
          <th style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600 }}>Age</th>
        </tr>
      </thead>
      <tbody>
        {instances.map((inst: any, i: number) => (
          <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
            <td style={{ padding: '7px 12px', fontWeight: 600, fontSize: 12 }}>{inst.metadata?.name}</td>
            {scope === 'Namespaced' && <td style={{ padding: '7px 12px', fontSize: 12, color: '#555' }}>{inst.metadata?.namespace}</td>}
            <td style={{ padding: '7px 12px' }}><StatusBadge ready={inst.status?.ready ?? 'Unknown'} /></td>
            <td style={{ padding: '7px 12px', fontSize: 11, color: '#888' }}>
              {(inst.status?.conditions ?? []).length || '—'}
            </td>
            <td style={{ padding: '7px 12px', fontSize: 11, color: '#888' }}>
              {inst.metadata?.creationTimestamp ? new Date(inst.metadata.creationTimestamp).toLocaleDateString() : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CRDDetailView({ crd }: { crd: any }) {
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
    <Box style={{ padding: 20 }}>
      <Typography variant="h6" style={{ marginBottom: 4 }}>{kind}</Typography>
      <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginBottom: 16 }}>
        {group} · {topVersion} · {scope}
      </Typography>

      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} style={{ marginBottom: 16, borderBottom: '1px solid #e0e0e0' }}>
        <Tab label="Overview" style={{ fontSize: 12 }} />
        <Tab label="Instances" style={{ fontSize: 12 }} />
        <Tab label="Schema" style={{ fontSize: 12 }} />
        <Tab label="Create" style={{ fontSize: 12 }} />
      </Tabs>

      {tab === 0 && (
        <NameValueTable rows={[
          { name: 'Kind', value: kind },
          { name: 'Group', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, group) },
          { name: 'Versions', value: versions.map((v: any) => v.name).join(', ') },
          { name: 'Plural', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, plural) },
          { name: 'Scope', value: React.createElement(Chip, { label: scope, size: 'small', style: { background: scope === 'Namespaced' ? '#e3f2fd' : '#fce4ec', fontSize: 10, height: 18 } }) },
          ...(openAPISchema?.description ? [{ name: 'Description', value: openAPISchema.description }] : []),
        ]} />
      )}

      {tab === 1 && <InstancesList crd={crd} />}

      {tab === 2 && (
        openAPISchema
          ? React.createElement(SchemaPropertyTree, { schema: openAPISchema, required: openAPISchema.required ?? [] })
          : React.createElement(Typography, { variant: 'body2', color: 'textSecondary' }, 'No schema available.')
      )}

      {tab === 3 && (
        <Box style={{ height: 500 }}>
          <YamlEditor
            initialStage="edit"
            schema={openAPISchema ?? undefined}
            item={jsYaml.load(scaffoldFromSchema(kind, group, topVersion, openAPISchema))}
            onSave={async (obj: any) => {
              const ns: string = obj.metadata?.namespace ?? 'default';
              const nsPath = scope === 'Namespaced' ? `namespaces/${ns}/` : '';
              await getApiProxy().request(
                `/apis/${group}/${topVersion}/${nsPath}${plural}`,
                { method: 'POST', data: JSON.stringify(obj) }
              );
              setTab(1);
            }}
          />
        </Box>
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
      <Box display="flex" alignItems="center" style={{ gap: 10, padding: 32 }}>
        <CircularProgress size={20} /><Typography>Loading CRDs…</Typography>
      </Box>
    );
  }

  return (
    <SectionBox title="CRDs" headerProps={{ headerStyle: 'main' }}>
      <Box display="flex" style={{ gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search kind or group…" value={search}
          onChange={(e: any) => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        <TextField select size="small" value={scopeFilter}
          onChange={(e: any) => setScopeFilter(e.target.value)} style={{ minWidth: 140 }}>
          <MenuItem value="all">All scopes</MenuItem>
          <MenuItem value="Cluster">Cluster</MenuItem>
          <MenuItem value="Namespaced">Namespaced</MenuItem>
        </TextField>
        <TextField select size="small" value={groupFilter}
          onChange={(e: any) => setGroupFilter(e.target.value)} style={{ minWidth: 220 }}>
          <MenuItem value="all">All groups</MenuItem>
          {apiGroups.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
        </TextField>
        <Box style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <Chip label={`${filtered.length} CRDs`} size="small" style={{ fontSize: 11 }} />
        </Box>
      </Box>

      {filtered.length === 0 ? (
        <Typography color="textSecondary">No CRDs found for {OPERATOR_GROUPS.join(', ')} groups.</Typography>
      ) : (
        Object.entries(byGroup).sort(([a], [b]) => a.localeCompare(b)).map(([group, crds]) => (
          <Box key={group} style={{ marginBottom: 16 }}>
            <Typography variant="subtitle2" style={{ marginBottom: 6, color: '#555', fontFamily: 'monospace', fontSize: 12 }}>
              {group}
              <Chip label={(crds as any[]).length} size="small" style={{ marginLeft: 8, fontSize: 10, height: 18 }} />
            </Typography>
            <Paper elevation={1}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#fafafa' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 11 }}>Kind</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 11 }}>Version</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 11 }}>Scope</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 11 }}>Plural</th>
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
                      <tr key={crd.metadata?.name} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                        onClick={() => openCRDDetail(crd)}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12, color: '#1565c0' }}>{kind}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11 }}>{topVer}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <Chip label={scope} size="small" style={{ background: scope === 'Namespaced' ? '#e3f2fd' : '#fce4ec', fontSize: 10, height: 18 }} />
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: '#555' }}>{plural}</td>
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
