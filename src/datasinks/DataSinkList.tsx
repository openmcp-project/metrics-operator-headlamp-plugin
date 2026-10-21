import React from 'react';
import { DataSink } from '../common/Resources';
import { ConditionsBadge, ConditionsTable } from '../common/ConditionsTable';
import { formatAge } from '../common/helpers';
import styles from './DataSinkList.module.css';

const { Box, Typography, Chip, useTheme } = (window as any).pluginLib?.MuiCore ?? {};
const { SectionBox } = (window as any).pluginLib?.CommonComponents ?? {};

const PROTOCOL_COLORS: Record<string, string> = {
  https: '#2e7d32', http: '#e65100', grpcs: '#1565c0', grpc: '#6a1b9a', unknown: '#616161',
};

function ProtocolBadge({ protocol }: { protocol: string }) {
  return (
    <span className={styles.protocolBadge} style={{ background: PROTOCOL_COLORS[protocol] ?? '#616161', color: '#fff' }}>
      {protocol}
    </span>
  );
}

function AuthBadge({ authType }: { authType: 'apiKey' | 'certificate' | 'none' }) {
  const labels = { apiKey: 'API Key', certificate: 'mTLS', none: 'None' };
  const colors = { apiKey: '#1565c0', certificate: '#6a1b9a', none: '#616161' };
  return (
    <Chip
      label={labels[authType]}
      size="small"
      style={{ background: colors[authType], color: '#fff', fontSize: 10, height: 18 }}
    />
  );
}

function launchDetail(item: any) {
  const Activity = (window as any).pluginLib?.Activity;
  if (!Activity) return;
  const { SectionBox: SB, NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};
  Activity.launch({
    id: `datasink-detail:${item.metadata?.namespace}/${item.metadata?.name}`,
    location: 'split-right',
    temporary: true,
    title: item.metadata?.name,
    content: React.createElement(DataSinkDetail, { item }),
  });
}

export default function DataSinkList() {
  const theme = useTheme();
  const [dataSinks] = DataSink.useList() as [any[], any];

  const items = dataSinks?.map((d: any) => d.jsonData ?? d) ?? [];

  return (
    <SectionBox title="Data Sinks" headerProps={{ headerStyle: 'main' }}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow} style={{ borderBottom: `2px solid ${theme.palette.divider}`, background: theme.palette.background.default }}>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Namespace</th>
            <th className={styles.th}>Endpoint</th>
            <th className={styles.th}>Protocol</th>
            <th className={styles.th}>Auth</th>
            <th className={styles.th}>Conditions</th>
            <th className={styles.th}>Age</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => {
            const protocol = inferProtocol(item.spec?.connection?.endpoint ?? '');
            const authType = inferAuth(item.spec?.authentication);
            const conditions = item.status?.conditions ?? [];
            return (
              <tr
                key={`${item.metadata?.namespace}/${item.metadata?.name}`}
                className={styles.row}
                style={{ borderBottom: `1px solid ${theme.palette.divider}` }}
                onClick={() => launchDetail(item)}
              >
                <td className={styles.nameCell} style={{ color: '#1565c0' }}>
                  {item.metadata?.name}
                  {item.metadata?.name === 'default' && (
                    <Chip label="default" size="small" className={styles.defaultChip} style={{ background: '#e3f2fd', color: '#1565c0' }} />
                  )}
                </td>
                <td className={styles.td} style={{ color: theme.palette.text.secondary }}>{item.metadata?.namespace}</td>
                <td className={styles.endpointCell}>
                  {item.spec?.connection?.endpoint ?? '—'}
                </td>
                <td className={styles.badgeCell}><ProtocolBadge protocol={protocol} /></td>
                <td className={styles.badgeCell}><AuthBadge authType={authType} /></td>
                <td className={styles.badgeCell} onClick={e => e.stopPropagation()}>
                  <ConditionsBadge conditions={conditions} />
                </td>
                <td className={styles.ageCell} style={{ color: theme.palette.text.secondary }}>
                  {formatAge(item.metadata?.creationTimestamp)}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className={styles.emptyCell} style={{ color: theme.palette.text.secondary }}>
                No DataSinks found. Create one to start exporting metrics.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </SectionBox>
  );
}

function inferProtocol(endpoint: string): 'http' | 'https' | 'grpc' | 'grpcs' | 'unknown' {
  const e = endpoint.toLowerCase();
  if (e.startsWith('grpcs://')) return 'grpcs';
  if (e.startsWith('grpc://')) return 'grpc';
  if (e.startsWith('https://')) return 'https';
  if (e.startsWith('http://')) return 'http';
  return 'unknown';
}

function inferAuth(auth: any): 'apiKey' | 'certificate' | 'none' {
  if (auth?.apiKey) return 'apiKey';
  if (auth?.certificate) return 'certificate';
  return 'none';
}

// ── Detail panel ──────────────────────────────────────────────────────────────

export function DataSinkDetail({ item }: { item: any }) {
  const { NameValueTable } = (window as any).pluginLib?.CommonComponents ?? {};
  const auth = item.spec?.authentication;
  const authType = inferAuth(auth);

  const authRows = authType === 'apiKey'
    ? [{ name: 'API Key Secret', value: `${auth.apiKey.secretKeyRef.name}[${auth.apiKey.secretKeyRef.key}] 🔒` }]
    : authType === 'certificate'
    ? [
        { name: 'Client Cert', value: `${auth.certificate.clientCertSecretKeyRef.name}[${auth.certificate.clientCertSecretKeyRef.key}] 🔒` },
        { name: 'Client Key', value: `${auth.certificate.clientKeySecretKeyRef.name}[${auth.certificate.clientKeySecretKeyRef.key}] 🔒` },
        ...(auth.certificate.caCertSecretKeyRef ? [{ name: 'CA Cert', value: `${auth.certificate.caCertSecretKeyRef.name}[${auth.certificate.caCertSecretKeyRef.key}] 🔒` }] : []),
      ]
    : [{ name: 'Auth', value: 'None' }];

  return (
    <Box style={{ padding: 24 }}>
      <Typography variant="h6" style={{ marginBottom: 16 }}>{item.metadata?.name}</Typography>
      <NameValueTable rows={[
        { name: 'Namespace', value: item.metadata?.namespace },
        { name: 'Endpoint', value: React.createElement('span', { style: { fontFamily: 'monospace', fontSize: 12 } }, item.spec?.connection?.endpoint) },
        { name: 'Protocol', value: React.createElement(ProtocolBadge, { protocol: inferProtocol(item.spec?.connection?.endpoint ?? '') }) },
        { name: 'Auth Type', value: React.createElement(AuthBadge, { authType }) },
        ...authRows,
        { name: 'Age', value: item.metadata?.creationTimestamp ? new Date(item.metadata.creationTimestamp).toLocaleString() : '—' },
      ]} />
      <Box style={{ marginTop: 24 }}>
        <Typography variant="subtitle2" style={{ marginBottom: 8 }}>Conditions</Typography>
        <ConditionsTable conditions={item.status?.conditions ?? []} />
      </Box>
    </Box>
  );
}
