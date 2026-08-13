import React, { useState } from 'react';
import { getApiProxy } from '../common/helpers';
import * as jsYaml from 'js-yaml';
import { YamlEditor } from '../common/YamlEditor';

const { Box, Typography, Button, TextField, RadioGroup, Radio, FormControlLabel, FormControl, FormLabel, Alert, Divider } =
  (window as any).pluginLib?.MuiCore ?? {};

const GROUP = 'metrics.openmcp.cloud';
const VERSION = 'v1alpha1';

interface DataSinkFormProps {
  onClose: () => void;
  onCreated: () => void;
}

type AuthType = 'none' | 'apiKey' | 'certificate';
type FormStage = 'form' | 'yaml';

function buildYaml(values: any): string {
  const spec: any = {
    connection: { endpoint: values.endpoint },
  };
  if (values.authType === 'apiKey') {
    spec.authentication = {
      apiKey: { secretKeyRef: { name: values.apiKeySecret, key: values.apiKeyKey } },
    };
  } else if (values.authType === 'certificate') {
    spec.authentication = {
      certificate: {
        clientCertSecretKeyRef: { name: values.clientCertSecret, key: values.clientCertKey },
        clientKeySecretKeyRef: { name: values.clientKeySecret, key: values.clientKeyKey },
        ...(values.caCertSecret ? { caCertSecretKeyRef: { name: values.caCertSecret, key: values.caCertKey } } : {}),
      },
    };
  }

  return jsYaml.dump({
    apiVersion: `${GROUP}/${VERSION}`,
    kind: 'DataSink',
    metadata: { name: values.name, namespace: values.namespace },
    spec,
  });
}

export function DataSinkForm({ onClose, onCreated }: DataSinkFormProps) {
  const [stage, setStage] = useState<FormStage>('form');
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [endpoint, setEndpoint] = useState('');
  const [authType, setAuthType] = useState<AuthType>('none');
  const [apiKeySecret, setApiKeySecret] = useState('');
  const [apiKeyKey, setApiKeyKey] = useState('api-token');
  const [clientCertSecret, setClientCertSecret] = useState('');
  const [clientCertKey, setClientCertKey] = useState('tls.crt');
  const [clientKeySecret, setClientKeySecret] = useState('');
  const [clientKeyKey, setClientKeyKey] = useState('tls.key');
  const [caCertSecret, setCaCertSecret] = useState('');
  const [caCertKey, setCaCertKey] = useState('ca.crt');
  const [error, setError] = useState<string | null>(null);

  const values = { name, namespace, endpoint, authType, apiKeySecret, apiKeyKey, clientCertSecret, clientCertKey, clientKeySecret, clientKeyKey, caCertSecret, caCertKey };
  const yamlStr = buildYaml(values);
  const yamlObj = jsYaml.load(yamlStr) as any;

  function validate(): string | null {
    if (!name.trim()) return 'Name is required.';
    if (!namespace.trim()) return 'Namespace is required.';
    if (!endpoint.trim()) return 'Endpoint is required.';
    if (authType === 'apiKey' && (!apiKeySecret.trim() || !apiKeyKey.trim())) return 'API Key secret name and key are required.';
    if (authType === 'certificate' && (!clientCertSecret.trim() || !clientKeySecret.trim())) return 'Client cert and key secret names are required.';
    return null;
  }

  async function handleCreate(obj: any) {
    const ns = obj.metadata?.namespace ?? namespace;
    await getApiProxy().request(
      `/apis/${GROUP}/${VERSION}/namespaces/${ns}/datasinks`,
      { method: 'POST', isJSON: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }
    );
    onCreated();
  }

  function handleReview() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setStage('yaml');
  }

  if (stage === 'yaml') {
    return (
      <Box style={{ height: 500 }}>
        <Box style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button size="small" variant="outlined" onClick={() => setStage('form')}>← Back</Button>
          <Typography variant="subtitle2">Review & Create DataSink</Typography>
        </Box>
        <YamlEditor item={yamlObj} onSave={handleCreate} initialStage="edit" />
      </Box>
    );
  }

  return (
    <Box style={{ padding: 24 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" style={{ marginBottom: 20 }}>
        <Typography variant="h6">Create DataSink</Typography>
        <Button size="small" onClick={onClose}>✕</Button>
      </Box>

      {error && <Alert severity="error" style={{ marginBottom: 16 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box display="flex" style={{ gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <TextField label="Name" value={name} onChange={(e: any) => setName(e.target.value)} size="small" style={{ flex: 1, minWidth: 200 }} required />
        <TextField label="Namespace" value={namespace} onChange={(e: any) => setNamespace(e.target.value)} size="small" style={{ flex: 1, minWidth: 180 }} required />
      </Box>

      <TextField
        label="Endpoint URL"
        value={endpoint}
        onChange={(e: any) => setEndpoint(e.target.value)}
        size="small"
        fullWidth
        style={{ marginBottom: 16 }}
        placeholder="https://tenant.live.dynatrace.com/api/v2/otlp/v1/metrics"
        helperText="Supports http://, https://, grpc://, grpcs://"
        required
      />

      <Divider style={{ marginBottom: 16 }} />

      <FormControl component="fieldset" style={{ marginBottom: 16 }}>
        <FormLabel component="legend" style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Authentication</FormLabel>
        <RadioGroup row value={authType} onChange={(e: any) => setAuthType(e.target.value as AuthType)}>
          <FormControlLabel value="none" control={<Radio size="small" />} label="None" />
          <FormControlLabel value="apiKey" control={<Radio size="small" />} label="API Key" />
          <FormControlLabel value="certificate" control={<Radio size="small" />} label="mTLS Certificate" />
        </RadioGroup>
      </FormControl>

      {authType === 'apiKey' && (
        <Box display="flex" style={{ gap: 12, marginBottom: 16 }}>
          <TextField label="Secret Name" value={apiKeySecret} onChange={(e: any) => setApiKeySecret(e.target.value)} size="small" style={{ flex: 2 }} required />
          <TextField label="Key" value={apiKeyKey} onChange={(e: any) => setApiKeyKey(e.target.value)} size="small" style={{ flex: 1 }} required />
        </Box>
      )}

      {authType === 'certificate' && (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <Box display="flex" style={{ gap: 12 }}>
            <TextField label="Client Cert Secret" value={clientCertSecret} onChange={(e: any) => setClientCertSecret(e.target.value)} size="small" style={{ flex: 2 }} required />
            <TextField label="Key" value={clientCertKey} onChange={(e: any) => setClientCertKey(e.target.value)} size="small" style={{ flex: 1 }} />
          </Box>
          <Box display="flex" style={{ gap: 12 }}>
            <TextField label="Client Key Secret" value={clientKeySecret} onChange={(e: any) => setClientKeySecret(e.target.value)} size="small" style={{ flex: 2 }} required />
            <TextField label="Key" value={clientKeyKey} onChange={(e: any) => setClientKeyKey(e.target.value)} size="small" style={{ flex: 1 }} />
          </Box>
          <Box display="flex" style={{ gap: 12 }}>
            <TextField label="CA Cert Secret (optional)" value={caCertSecret} onChange={(e: any) => setCaCertSecret(e.target.value)} size="small" style={{ flex: 2 }} />
            <TextField label="Key" value={caCertKey} onChange={(e: any) => setCaCertKey(e.target.value)} size="small" style={{ flex: 1 }} />
          </Box>
        </Box>
      )}

      <Box display="flex" justifyContent="flex-end" style={{ gap: 8, marginTop: 8 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleReview} style={{ background: '#1565c0' }}>
          Review YAML →
        </Button>
      </Box>
    </Box>
  );
}
