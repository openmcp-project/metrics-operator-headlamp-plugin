import React, { useState } from 'react';
import { RemoteClusterAccess, FederatedClusterAccess } from '../common/Resources';
import { formatAge } from '../common/helpers';
import styles from './ClusterAccessTabs.module.css';

const { Box, Typography, Tabs, Tab, Chip, useTheme } = (window as any).pluginLib?.MuiCore ?? {};
const { SectionBox, NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};

function SecretRef({ name, key }: { name?: string; key?: string }) {
  const theme = useTheme();
  if (!name) return <span style={{ color: theme.palette.text.secondary }}>—</span>;
  return (
    <span className={styles.secretRef}>
      {name}{key ? `[${key}]` : ''} <span style={{ color: theme.palette.text.secondary }}>🔒</span>
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
    <Box className={styles.detailBox}>
      <Typography variant="h6" className={styles.detailTitle}>{item.metadata?.name}</Typography>
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
    ...(spec.kubeConfigPath ? [{ name: 'KubeConfig Path', value: React.createElement('span', { className: styles.monoPlain }, spec.kubeConfigPath) }] : []),
    ...(spec.secretRefPath ? [{ name: 'Secret Ref Path', value: React.createElement('span', { className: styles.monoPlain }, spec.secretRefPath) }] : []),
  ];
  return (
    <Box className={styles.detailBox}>
      <Typography variant="h6" className={styles.detailTitle}>{item.metadata?.name}</Typography>
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
  const theme = useTheme();
  const [remotes] = (RemoteClusterAccess as any).useList() as [any[], any];
  const items = (remotes ?? []).map((r: any) => r.jsonData ?? r);

  return (
    <Box>
      <Box className={styles.infoBanner} style={{ background: 'rgba(21,101,192,0.06)', color: theme.palette.text.secondary }}>
        RemoteClusterAccess grants the operator access to a single remote cluster for collecting metrics.
        Secret values are never shown — only secret names and keys.
      </Box>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow} style={{ borderBottom: `2px solid ${theme.palette.divider}`, background: theme.palette.background.default }}>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Namespace</th>
            <th className={styles.th}>Config Type</th>
            <th className={styles.th}>Secret</th>
            <th className={styles.th}>Age</th>
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
                className={styles.row}
                style={{ borderBottom: `1px solid ${theme.palette.divider}` }}
                onClick={() => launchDetail(item, 'RemoteClusterAccess')}>
                <td className={`${styles.td} ${styles.nameCell}`} style={{ color: '#1565c0' }}>{item.metadata?.name}</td>
                <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{item.metadata?.namespace}</td>
                <td className={styles.td}>
                  <Chip label={hasKubeconfig ? 'kubeconfig' : 'inline'} size="small" className={styles.chip}
                    style={{ background: hasKubeconfig ? '#e8f5e9' : '#fff3e0', color: '#1a1a1a' }} />
                </td>
                <td className={styles.td}><SecretRef name={secretName} key={secretKey} /></td>
                <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{formatAge(item.metadata?.creationTimestamp)}</td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr><td colSpan={5} className={styles.emptyCell} style={{ color: theme.palette.text.secondary }}>No remote cluster accesses found.</td></tr>
          )}
        </tbody>
      </table>
    </Box>
  );
}

function FederatedClusterList() {
  const theme = useTheme();
  const [federated] = (FederatedClusterAccess as any).useList() as [any[], any];
  const items = (federated ?? []).map((f: any) => f.jsonData ?? f);

  return (
    <Box>
      <Box className={styles.infoBanner} style={{ background: 'rgba(106,27,154,0.06)', color: '#6a1b9a' }}>
        FederatedClusterAccess discovers multiple remote clusters via label selectors and powers FederatedMetric collection.
      </Box>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow} style={{ borderBottom: `2px solid ${theme.palette.divider}`, background: theme.palette.background.default }}>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Namespace</th>
            <th className={styles.th}>Target GVK</th>
            <th className={styles.th}>Target Namespace</th>
            <th className={styles.th}>Config</th>
            <th className={styles.th}>Age</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => {
            const spec = item.spec ?? {};
            const target = spec.target;
            return (
              <tr key={`${item.metadata?.namespace}/${item.metadata?.name}`}
                className={styles.row}
                style={{ borderBottom: `1px solid ${theme.palette.divider}` }}
                onClick={() => launchDetail(item, 'FederatedClusterAccess')}>
                <td className={`${styles.td} ${styles.nameCell}`} style={{ color: '#6a1b9a' }}>{item.metadata?.name}</td>
                <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{item.metadata?.namespace}</td>
                <td className={`${styles.td} ${styles.mono}`}>
                  {target ? `${target.group}/${target.version}/${target.kind}` : '—'}
                </td>
                <td className={`${styles.td} ${styles.mono}`}>{spec.namespace ?? '—'}</td>
                <td className={styles.td}>
                  <Chip
                    label={spec.kubeConfigPath ? 'path' : spec.secretRefPath ? 'secret' : '—'}
                    size="small"
                    className={styles.chip} />
                </td>
                <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{formatAge(item.metadata?.creationTimestamp)}</td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr><td colSpan={6} className={styles.emptyCell} style={{ color: theme.palette.text.secondary }}>No federated cluster accesses found.</td></tr>
          )}
        </tbody>
      </table>
    </Box>
  );
}

export default function ClusterAccessTabs() {
  const theme = useTheme();
  const [remotes] = (RemoteClusterAccess as any).useList() as [any[], any];
  const [federated] = (FederatedClusterAccess as any).useList() as [any[], any];
  const [tab, setTab] = useState(0);

  const remoteCount = remotes?.length ?? 0;
  const federatedCount = federated?.length ?? 0;

  return (
    <SectionBox title="Cluster Access" headerProps={{ headerStyle: 'main' }}>
      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} className={styles.tabs} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Tab label={`Remote Cluster Access${remoteCount ? ` (${remoteCount})` : ''}`} className={styles.tab} />
        <Tab label={`Federated Cluster Access${federatedCount ? ` (${federatedCount})` : ''}`} className={styles.tab} />
      </Tabs>
      {tab === 0 && <RemoteClusterList />}
      {tab === 1 && <FederatedClusterList />}
    </SectionBox>
  );
}
