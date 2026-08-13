import React, { useState } from 'react';
import { RemoteClusterAccess, FederatedClusterAccess } from '../common/Resources';
import { formatAge } from '../common/helpers';

const { Box, Typography, Tabs, Tab, Chip } = (window as any).pluginLib?.MuiCore ?? {};
const { SectionBox, NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};

const TH: React.CSSProperties = { padding: '8px 12px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' };
const TD: React.CSSProperties = { padding: '8px 12px', fontSize: 12, verticalAlign: 'middle' };

function SecretRef({ name, key }: { name?: string; key?: string }) {
  if (!name) return <span style={{ color: '#888' }}>—</span>;
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
      {name}{key ? `[${key}]` : ''} <span style={{ color: '#888' }}>🔒</span>
    </span>
  );
}

function RemoteClusterDetail({ item }: { item: any }) {
  const spec = item.spec ?? {};
  const rows = [
    { name: 'Name', value: item.metadata?.name },
    { name: 'Namespace', value: item.metadata?.namespace },
    { name: 'Created', value: item.metadata?.creationTimestamp ? new Date(item.metadata.creationTimestamp).toLocaleString() : '—' },
    { name: 'Config Type', value: spec.kubeConfigSecretRef ? 'kubeconfig secret' : spec.remoteClusterConfig ? 'inline cluster config' : '—' },
    ...(spec.kubeConfigSecretRef ? [
      { name: 'KubeConfig Secret', value: React.createElement(SecretRef, { name: spec.kubeConfigSecretRef.name, key: spec.kubeConfigSecretRef.key }) },
    ] : []),
    ...(spec.remoteClusterConfig?.bearerTokenSecretKeyRef ? [
      { name: 'Token Secret', value: React.createElement(SecretRef, { name: spec.remoteClusterConfig.bearerTokenSecretKeyRef.name, key: spec.remoteClusterConfig.bearerTokenSecretKeyRef.key }) },
    ] : []),
  ];
  return (
    <Box style={{ padding: 20 }}>
      <Typography variant="h6" style={{ marginBottom: 16 }}>{item.metadata?.name}</Typography>
      <NameValueTable rows={rows} />
    </Box>
  );
}

function FederatedClusterDetail({ item }: { item: any }) {
  const spec = item.spec ?? {};
  const rows = [
    { name: 'Name', value: item.metadata?.name },
    { name: 'Namespace', value: item.metadata?.namespace },
    { name: 'Created', value: item.metadata?.creationTimestamp ? new Date(item.metadata.creationTimestamp).toLocaleString() : '—' },
    { name: 'Target GVK', value: spec.target ? `${spec.target.group}/${spec.target.version}/${spec.target.kind}` : '—' },
    { name: 'Target Namespace', value: spec.namespace ?? '—' },
    ...(spec.kubeConfigPath ? [{ name: 'KubeConfig Path', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, spec.kubeConfigPath) }] : []),
    ...(spec.secretRefPath ? [{ name: 'Secret Ref Path', value: React.createElement('span', { style: { fontFamily: 'monospace' } }, spec.secretRefPath) }] : []),
  ];
  return (
    <Box style={{ padding: 20 }}>
      <Typography variant="h6" style={{ marginBottom: 16 }}>{item.metadata?.name}</Typography>
      <NameValueTable rows={rows} />
    </Box>
  );
}

function launchDetail(item: any, kind: 'RemoteClusterAccess' | 'FederatedClusterAccess') {
  const Activity = (window as any).pluginLib?.Activity;
  if (!Activity) return;
  Activity.launch({
    id: `cluster-access-detail:${item.metadata?.namespace}/${item.metadata?.name}`,
    location: 'split-right',
    temporary: true,
    title: item.metadata?.name,
    content: kind === 'RemoteClusterAccess'
      ? React.createElement(RemoteClusterDetail, { item })
      : React.createElement(FederatedClusterDetail, { item }),
  });
}

function RemoteClusterList() {
  const [remotes] = (RemoteClusterAccess as any).useList() as [any[], any];
  const items = (remotes ?? []).map((r: any) => r.jsonData ?? r);

  return (
    <Box>
      <Box style={{ padding: '8px 12px', background: 'rgba(21,101,192,0.06)', borderRadius: 6, marginBottom: 14, fontSize: 12, color: '#555' }}>
        RemoteClusterAccess grants the operator access to a single remote cluster for collecting metrics.
        Secret values are never shown — only secret names and keys.
      </Box>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#fafafa' }}>
            <th style={TH}>Name</th>
            <th style={TH}>Namespace</th>
            <th style={TH}>Config Type</th>
            <th style={TH}>Secret</th>
            <th style={TH}>Age</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => {
            const spec = item.spec ?? {};
            const hasKubeconfig = !!spec.kubeConfigSecretRef;
            const secretName = spec.kubeConfigSecretRef?.name ?? spec.remoteClusterConfig?.bearerTokenSecretKeyRef?.name;
            const secretKey = spec.kubeConfigSecretRef?.key ?? spec.remoteClusterConfig?.bearerTokenSecretKeyRef?.key;
            return (
              <tr key={`${item.metadata?.namespace}/${item.metadata?.name}`}
                style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                onClick={() => launchDetail(item, 'RemoteClusterAccess')}>
                <td style={{ ...TD, fontWeight: 600, color: '#1565c0' }}>{item.metadata?.name}</td>
                <td style={{ ...TD, color: '#555' }}>{item.metadata?.namespace}</td>
                <td style={TD}>
                  <Chip label={hasKubeconfig ? 'kubeconfig' : 'inline'} size="small"
                    style={{ fontSize: 10, height: 18, background: hasKubeconfig ? '#e8f5e9' : '#fff3e0' }} />
                </td>
                <td style={TD}><SecretRef name={secretName} key={secretKey} /></td>
                <td style={{ ...TD, color: '#888' }}>{formatAge(item.metadata?.creationTimestamp)}</td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No remote cluster accesses found.</td></tr>
          )}
        </tbody>
      </table>
    </Box>
  );
}

function FederatedClusterList() {
  const [federated] = (FederatedClusterAccess as any).useList() as [any[], any];
  const items = (federated ?? []).map((f: any) => f.jsonData ?? f);

  return (
    <Box>
      <Box style={{ padding: '8px 12px', background: 'rgba(106,27,154,0.06)', borderRadius: 6, marginBottom: 14, fontSize: 12, color: '#6a1b9a' }}>
        FederatedClusterAccess discovers multiple remote clusters via label selectors and powers FederatedMetric collection.
      </Box>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left', background: '#fafafa' }}>
            <th style={TH}>Name</th>
            <th style={TH}>Namespace</th>
            <th style={TH}>Target GVK</th>
            <th style={TH}>Target Namespace</th>
            <th style={TH}>Config</th>
            <th style={TH}>Age</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => {
            const spec = item.spec ?? {};
            const target = spec.target;
            return (
              <tr key={`${item.metadata?.namespace}/${item.metadata?.name}`}
                style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                onClick={() => launchDetail(item, 'FederatedClusterAccess')}>
                <td style={{ ...TD, fontWeight: 600, color: '#6a1b9a' }}>{item.metadata?.name}</td>
                <td style={{ ...TD, color: '#555' }}>{item.metadata?.namespace}</td>
                <td style={{ ...TD, fontFamily: 'monospace', fontSize: 11 }}>
                  {target ? `${target.group}/${target.version}/${target.kind}` : '—'}
                </td>
                <td style={{ ...TD, fontFamily: 'monospace', fontSize: 11 }}>{spec.namespace ?? '—'}</td>
                <td style={TD}>
                  <Chip
                    label={spec.kubeConfigPath ? 'path' : spec.secretRefPath ? 'secret' : '—'}
                    size="small"
                    style={{ fontSize: 10, height: 18 }} />
                </td>
                <td style={{ ...TD, color: '#888' }}>{formatAge(item.metadata?.creationTimestamp)}</td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No federated cluster accesses found.</td></tr>
          )}
        </tbody>
      </table>
    </Box>
  );
}

export default function ClusterAccessTabs() {
  const [remotes] = (RemoteClusterAccess as any).useList() as [any[], any];
  const [federated] = (FederatedClusterAccess as any).useList() as [any[], any];
  const [tab, setTab] = useState(0);

  const remoteCount = remotes?.length ?? 0;
  const federatedCount = federated?.length ?? 0;

  return (
    <SectionBox title="Cluster Access" headerProps={{ headerStyle: 'main' }}>
      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} style={{ marginBottom: 16, borderBottom: '1px solid #e0e0e0' }}>
        <Tab label={`Remote Cluster Access${remoteCount ? ` (${remoteCount})` : ''}`} style={{ fontSize: 13 }} />
        <Tab label={`Federated Cluster Access${federatedCount ? ` (${federatedCount})` : ''}`} style={{ fontSize: 13 }} />
      </Tabs>
      {tab === 0 && <RemoteClusterList />}
      {tab === 1 && <FederatedClusterList />}
    </SectionBox>
  );
}
