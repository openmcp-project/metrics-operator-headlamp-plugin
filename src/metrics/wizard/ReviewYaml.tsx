import React, { useState } from 'react';
import { YamlEditor } from '../../common/YamlEditor';
import { getApiProxy, clusterPrefix } from '../../common/helpers';
import type { MetricKind } from './KindSelector';
import type { SelectedGVK } from './ResourcePicker';
import type { MetricFormValues } from './MetricForm';

const { Box, Typography, Alert, CircularProgress, Button } = (window as any).pluginLib?.MuiCore ?? {};

interface Props {
  kind: MetricKind;
  gvk: SelectedGVK | null;
  form: MetricFormValues;
  federatedAccessRef?: string;
  onSuccess: (name: string) => void;
}

function buildManifest(kind: MetricKind, gvk: SelectedGVK | null, form: MetricFormValues, federatedAccessRef?: string): any {
  const base = {
    apiVersion: 'metrics.openmcp.cloud/v1alpha1',
    kind,
    metadata: {
      name: form.name,
      namespace: form.namespace || 'default',
    },
    spec: {} as Record<string, any>,
  };

  if (form.interval) base.spec.interval = form.interval;
  if (form.dataSinkRef) base.spec.dataSinkRef = { name: form.dataSinkRef };

  const hasLabelSel = Object.keys(form.labelSelector).filter(k => k).length > 0;
  const hasFieldSel = Object.keys(form.fieldSelector).filter(k => k).length > 0;
  if (hasLabelSel) {
    base.spec.labelSelector = { matchLabels: Object.fromEntries(Object.entries(form.labelSelector).filter(([k]) => k)) };
  }
  if (hasFieldSel) {
    base.spec.fieldSelector = Object.fromEntries(Object.entries(form.fieldSelector).filter(([k]) => k));
  }

  switch (kind) {
    case 'Metric':
    case 'FederatedMetric':
      if (gvk) {
        base.spec.target = {
          group: gvk.group || '',
          version: gvk.version,
          kind: gvk.kind,
        };
      }
      if (form.projections.length > 0) {
        base.spec.projections = form.projections.map(p => ({
          name: p.name,
          fieldPath: p.fieldPath,
          type: p.type !== 'primitive' ? p.type : undefined,
          default: p.default,
        })).map(p => Object.fromEntries(Object.entries(p).filter(([, v]) => v != null)));
      }
      if (form.valueFrom) {
        base.spec.valueFrom = {
          fieldPath: form.valueFrom.fieldPath,
          type: form.valueFrom.type !== 'integer' ? form.valueFrom.type : undefined,
          aggregation: form.valueFrom.aggregation !== 'sum' ? form.valueFrom.aggregation : undefined,
          default: form.valueFrom.default,
        };
        base.spec.valueFrom = Object.fromEntries(Object.entries(base.spec.valueFrom).filter(([, v]) => v != null));
      }
      if (kind === 'Metric' && form.remoteClusterAccessRef) {
        base.spec.remoteClusterAccessRef = { name: form.remoteClusterAccessRef };
      }
      if (kind === 'FederatedMetric' && federatedAccessRef) {
        base.spec.federatedClusterAccessRef = { name: federatedAccessRef };
      }
      break;

    case 'ManagedMetric':
      if (gvk) {
        base.spec.target = { group: gvk.group || '', version: gvk.version, kind: gvk.kind };
      }
      if (form.projections.length > 0) {
        base.spec.dimensions = form.projections.map(p => ({
          name: p.name,
          fieldPath: p.fieldPath,
          type: p.type !== 'primitive' ? p.type : undefined,
          default: p.default,
        })).map(p => Object.fromEntries(Object.entries(p).filter(([, v]) => v != null)));
      }
      break;

    case 'FederatedManagedMetric':
      if (federatedAccessRef) {
        base.spec.federatedClusterAccessRef = { name: federatedAccessRef };
      }
      break;
  }

  return base;
}

function pluralFor(kind: MetricKind): string {
  const map: Record<MetricKind, string> = {
    Metric: 'metrics',
    ManagedMetric: 'managedmetrics',
    FederatedMetric: 'federatedmetrics',
    FederatedManagedMetric: 'federatedmanagedmetrics',
  };
  return map[kind];
}

export function ReviewYaml({ kind, gvk, form, federatedAccessRef, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const manifest = buildManifest(kind, gvk, form, federatedAccessRef);

  async function handleCreate() {
    setSubmitting(true);
    setError(null);
    const proxy = getApiProxy();
    if (!proxy) { setError('API proxy not available'); setSubmitting(false); return; }
    try {
      const plural = pluralFor(kind);
      const ns = form.namespace || 'default';
      const url = `${clusterPrefix()}/apis/metrics.openmcp.cloud/v1alpha1/namespaces/${ns}/${plural}`;
      await proxy.request(url, { method: 'POST', data: JSON.stringify(manifest) });
      onSuccess(form.name);
    } catch (e: any) {
      setError(e?.message ?? 'Create failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box>
      <Typography variant="h6" style={{ marginBottom: 6 }}>Review &amp; Create</Typography>
      <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16 }}>
        Review the generated manifest. You can edit it directly before creating.
      </Typography>

      {error && <Alert severity="error" style={{ marginBottom: 12 }}>{error}</Alert>}

      <Box style={{ height: 400, border: '1px solid #e0e0e0', borderRadius: 6, overflow: 'hidden' }}>
        <YamlEditor item={manifest} onSave={async () => {}} readOnly={false} initialStage="edit" />
      </Box>

      <Box display="flex" justifyContent="flex-end" style={{ marginTop: 16, gap: 10 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreate}
          disabled={submitting || !form.name || !form.interval}>
          {submitting ? <CircularProgress size={18} style={{ marginRight: 8 }} /> : null}
          Create {kind}
        </Button>
      </Box>
    </Box>
  );
}
