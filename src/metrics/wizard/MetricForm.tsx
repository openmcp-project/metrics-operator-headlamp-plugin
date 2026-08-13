import React, { useState, useEffect } from 'react';
import { DataSink, RemoteClusterAccess } from '../../common/Resources';
import { isValidDuration } from '../../common/helpers';
import { fetchCRDSchema, extractFieldPaths, FieldSuggestion } from './schemaHelpers';
import type { MetricKind } from './KindSelector';
import type { SelectedGVK } from './ResourcePicker';
import type { DimensionConfig, ValueFromConfig } from './proposals';

const {
  Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem,
  Button, IconButton, Accordion, AccordionSummary, AccordionDetails,
  Alert, Chip, Tooltip,
} = (window as any).pluginLib?.MuiCore ?? {};

export interface MetricFormValues {
  name: string;
  namespace: string;
  interval: string;
  dataSinkRef: string;
  labelSelector: Record<string, string>;
  fieldSelector: Record<string, string>;
  projections: DimensionConfig[];
  valueFrom: ValueFromConfig | null;
  remoteClusterAccessRef: string;
}

interface Props {
  kind: MetricKind;
  gvk: SelectedGVK | null;
  value: MetricFormValues;
  onChange: (v: MetricFormValues) => void;
}

function kv(obj: Record<string, string>): Array<[string, string]> {
  return Object.entries(obj);
}

function KeyValueEditor({ label, value, onChange }: { label: string; value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const pairs = kv(value);

  function update(idx: number, k: string, v: string) {
    const next = [...pairs];
    next[idx] = [k, v];
    onChange(Object.fromEntries(next));
  }

  function remove(idx: number) {
    const next = pairs.filter((_, i) => i !== idx);
    onChange(Object.fromEntries(next));
  }

  return (
    <Box>
      <Typography variant="caption" style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>{label}</Typography>
      {pairs.map(([k, v], i) => (
        <Box key={i} display="flex" style={{ gap: 8, marginBottom: 6, alignItems: 'center' }}>
          <TextField size="small" placeholder="key" value={k} onChange={(e: any) => update(i, e.target.value, v)} style={{ flex: 1 }} />
          <TextField size="small" placeholder="value" value={v} onChange={(e: any) => update(i, k, e.target.value)} style={{ flex: 1 }} />
          <IconButton size="small" onClick={() => remove(i)} style={{ color: '#c62828' }}>✕</IconButton>
        </Box>
      ))}
      <Button size="small" variant="outlined" onClick={() => onChange({ ...value, '': '' })} style={{ fontSize: 11, marginTop: 2 }}>
        + Add
      </Button>
    </Box>
  );
}

function FieldPathInput({ value, onChange, suggestions }: { value: string; onChange: (v: string) => void; suggestions: FieldSuggestion[] }) {
  const [open, setOpen] = useState(false);
  const filtered = value ? suggestions.filter(s => s.path.toLowerCase().includes(value.toLowerCase())).slice(0, 8) : [];

  return (
    <Box style={{ position: 'relative' }}>
      <TextField
        size="small"
        fullWidth
        placeholder="e.g. status.phase"
        value={value}
        onChange={(e: any) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        style={{ fontFamily: 'monospace' }}
      />
      {open && filtered.length > 0 && (
        <Box style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: '1px solid #e0e0e0', borderRadius: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto',
        }}>
          {filtered.map(s => (
            <Box
              key={s.path}
              onMouseDown={() => { onChange(s.path); setOpen(false); }}
              style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
              onMouseEnter={(e: any) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e: any) => e.currentTarget.style.background = ''}>
              <span style={{ fontWeight: 600 }}>{s.path}</span>
              <span style={{ color: '#888', marginLeft: 8, fontSize: 11 }}>{s.type}</span>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function DimensionsEditor({ value, onChange, suggestions, label = 'Projections / Dimensions' }: {
  value: DimensionConfig[];
  onChange: (v: DimensionConfig[]) => void;
  suggestions: FieldSuggestion[];
  label?: string;
}) {
  const hasHighCard = value.some(d => d.type === 'map' || d.type === 'slice');

  function update(idx: number, patch: Partial<DimensionConfig>) {
    const next = value.map((d, i) => i === idx ? { ...d, ...patch } : d);
    onChange(next);
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function add() {
    onChange([...value, { name: '', fieldPath: '', type: 'primitive' }]);
  }

  return (
    <Box>
      <Typography variant="caption" style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>{label}</Typography>
      {hasHighCard && (
        <Alert severity="warning" style={{ fontSize: 11, marginBottom: 8, padding: '4px 10px' }}>
          <strong>High cardinality warning:</strong> Dimensions of type <code>map</code> or <code>slice</code> export JSON strings and create one OTLP time series per unique value combination. Use these types only when cardinality is bounded.
        </Alert>
      )}
      {value.length === 0 && (
        <Typography variant="caption" color="textSecondary" style={{ fontSize: 11, fontStyle: 'italic' }}>No dimensions defined — the metric will count resources without extra labels.</Typography>
      )}
      {value.map((dim, i) => (
        <Box key={i} style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: '10px 12px', marginBottom: 8, background: '#fafafa' }}>
          <Box display="flex" style={{ gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <TextField size="small" placeholder="name" label="Name" value={dim.name}
              onChange={(e: any) => update(i, { name: e.target.value })} style={{ flex: 1 }} />
            <Box style={{ flex: 2 }}>
              <Typography variant="caption" style={{ fontSize: 10, marginBottom: 2, display: 'block' }}>Field Path (JSONPath)</Typography>
              <FieldPathInput value={dim.fieldPath} onChange={fp => update(i, { fieldPath: fp })} suggestions={suggestions} />
            </Box>
            <FormControl size="small" style={{ minWidth: 110 }}>
              <InputLabel>Type</InputLabel>
              <Select value={dim.type} label="Type" onChange={(e: any) => update(i, { type: e.target.value })}>
                <MenuItem value="primitive">primitive</MenuItem>
                <MenuItem value="map">map</MenuItem>
                <MenuItem value="slice">slice</MenuItem>
                <MenuItem value="timestamp">timestamp</MenuItem>
              </Select>
            </FormControl>
            <IconButton size="small" onClick={() => remove(i)} style={{ color: '#c62828', marginTop: 2 }}>✕</IconButton>
          </Box>
          {(dim.type === 'map' || dim.type === 'slice') && (
            <Chip label="High cardinality" size="small" style={{ background: '#fff3e0', color: '#e65100', fontSize: 10, height: 18, marginBottom: 4 }} />
          )}
        </Box>
      ))}
      <Button size="small" variant="outlined" onClick={add} style={{ marginTop: 4, fontSize: 11 }}>+ Add dimension</Button>
    </Box>
  );
}

function ValueFromEditor({ value, onChange, suggestions }: { value: ValueFromConfig | null; onChange: (v: ValueFromConfig | null) => void; suggestions: FieldSuggestion[] }) {
  const enabled = value !== null;

  function enable() {
    onChange({ fieldPath: '', type: 'integer', aggregation: 'sum' });
  }

  function disable() {
    onChange(null);
  }

  function update(patch: Partial<ValueFromConfig>) {
    if (value) onChange({ ...value, ...patch });
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" style={{ gap: 10, marginBottom: enabled ? 12 : 0 }}>
        <Typography variant="caption" style={{ fontWeight: 600 }}>Value Extraction (valueFrom)</Typography>
        <Button size="small" variant={enabled ? 'outlined' : 'contained'} onClick={enabled ? disable : enable} style={{ fontSize: 11 }}>
          {enabled ? 'Disable' : 'Enable'}
        </Button>
      </Box>
      {!enabled && (
        <Typography variant="caption" color="textSecondary" style={{ fontSize: 11 }}>
          When disabled, the metric value is the count of matching resources. Enable to extract a numeric field from resources.
        </Typography>
      )}
      {enabled && value && (
        <Box style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 10 }}>
          <Box>
            <Typography variant="caption" style={{ fontSize: 10, marginBottom: 2, display: 'block' }}>Field Path</Typography>
            <FieldPathInput value={value.fieldPath} onChange={fp => update({ fieldPath: fp })} suggestions={suggestions} />
          </Box>
          <FormControl size="small">
            <InputLabel>Type</InputLabel>
            <Select value={value.type} label="Type" onChange={(e: any) => update({ type: e.target.value })}>
              <MenuItem value="integer">integer</MenuItem>
              <MenuItem value="timestamp">timestamp</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Aggregation</InputLabel>
            <Select value={value.aggregation} label="Aggregation" onChange={(e: any) => update({ aggregation: e.target.value })}>
              <MenuItem value="sum">sum</MenuItem>
              <MenuItem value="max">max</MenuItem>
              <MenuItem value="min">min</MenuItem>
              <MenuItem value="mean">mean</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}
    </Box>
  );
}

export function MetricForm({ kind, gvk, value, onChange }: Props) {
  const [dataSinks] = (DataSink as any).useList() as [any[], any];
  const [remoteAccesses] = (RemoteClusterAccess as any).useList() as [any[], any];
  const [schemaSuggestions, setSchemaSuggestions] = useState<FieldSuggestion[]>([]);

  useEffect(() => {
    if (!gvk) return;
    fetchCRDSchema(gvk.group, gvk.version, gvk.kind).then(schema => {
      setSchemaSuggestions(extractFieldPaths(schema ?? {}));
    });
  }, [gvk?.group, gvk?.version, gvk?.kind]);

  const sinkItems = (dataSinks ?? []).map((d: any) => d.jsonData ?? d);
  const accessItems = (remoteAccesses ?? []).map((r: any) => r.jsonData ?? r);

  function set<K extends keyof MetricFormValues>(key: K, val: MetricFormValues[K]) {
    onChange({ ...value, [key]: val });
  }

  const intervalError = value.interval && !isValidDuration(value.interval);

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Typography variant="h6">Configure metric</Typography>

      {/* Basic */}
      <Box style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <TextField size="small" label="Name *" value={value.name} onChange={(e: any) => set('name', e.target.value)} />
        <TextField size="small" label="Namespace" value={value.namespace} onChange={(e: any) => set('namespace', e.target.value)} />
      </Box>
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <TextField
          size="small"
          label="Interval *"
          placeholder="10m"
          value={value.interval}
          onChange={(e: any) => set('interval', e.target.value)}
          error={!!intervalError}
          helperText={intervalError ? 'Must be a valid duration, e.g. 30s, 5m, 1h' : 'Scrape interval (e.g. 30s, 5m)'}
        />
        <FormControl size="small">
          <InputLabel>DataSink</InputLabel>
          <Select value={value.dataSinkRef} label="DataSink" onChange={(e: any) => set('dataSinkRef', e.target.value)}>
            <MenuItem value="">— none —</MenuItem>
            {sinkItems.map((s: any) => (
              <MenuItem key={s.metadata?.name} value={s.metadata?.name}>{s.metadata?.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Selectors */}
      <Accordion defaultExpanded={false}>
        <AccordionSummary>
          <Typography variant="subtitle2">Selectors</Typography>
          {(Object.keys(value.labelSelector).length > 0 || Object.keys(value.fieldSelector).length > 0) && (
            <Chip label={`${Object.keys(value.labelSelector).length + Object.keys(value.fieldSelector).length} active`}
              size="small" style={{ marginLeft: 8, fontSize: 10, height: 18 }} />
          )}
        </AccordionSummary>
        <AccordionDetails>
          <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <KeyValueEditor label="Label Selector" value={value.labelSelector} onChange={v => set('labelSelector', v)} />
            <KeyValueEditor label="Field Selector" value={value.fieldSelector} onChange={v => set('fieldSelector', v)} />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Projections */}
      {(kind === 'Metric' || kind === 'FederatedMetric') && (
        <Accordion defaultExpanded={value.projections.length > 0}>
          <AccordionSummary>
            <Typography variant="subtitle2">Projections / Dimensions</Typography>
            {value.projections.length > 0 && <Chip label={value.projections.length} size="small" style={{ marginLeft: 8, fontSize: 10, height: 18 }} />}
          </AccordionSummary>
          <AccordionDetails>
            <DimensionsEditor value={value.projections} onChange={v => set('projections', v)} suggestions={schemaSuggestions} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* ManagedMetric custom dimensions */}
      {kind === 'ManagedMetric' && (
        <Accordion defaultExpanded={value.projections.length > 0}>
          <AccordionSummary>
            <Typography variant="subtitle2">Custom Dimensions <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(overrides auto-derived Ready/Synced)</span></Typography>
          </AccordionSummary>
          <AccordionDetails>
            <DimensionsEditor value={value.projections} onChange={v => set('projections', v)} suggestions={schemaSuggestions} label="Dimensions" />
          </AccordionDetails>
        </Accordion>
      )}

      {/* valueFrom */}
      {(kind === 'Metric' || kind === 'FederatedMetric') && (
        <Accordion defaultExpanded={value.valueFrom !== null}>
          <AccordionSummary>
            <Typography variant="subtitle2">Value Extraction (valueFrom)</Typography>
            {value.valueFrom && <Chip label="enabled" size="small" color="primary" style={{ marginLeft: 8, fontSize: 10, height: 18 }} />}
          </AccordionSummary>
          <AccordionDetails>
            <ValueFromEditor value={value.valueFrom} onChange={v => set('valueFrom', v)} suggestions={schemaSuggestions} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Remote cluster (Metric only) */}
      {kind === 'Metric' && (
        <Accordion defaultExpanded={!!value.remoteClusterAccessRef}>
          <AccordionSummary>
            <Typography variant="subtitle2">Remote Cluster (optional)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl size="small" style={{ minWidth: 260 }}>
              <InputLabel>RemoteClusterAccess</InputLabel>
              <Select value={value.remoteClusterAccessRef} label="RemoteClusterAccess"
                onChange={(e: any) => set('remoteClusterAccessRef', e.target.value)}>
                <MenuItem value="">— none —</MenuItem>
                {accessItems.map((a: any) => (
                  <MenuItem key={a.metadata?.name} value={a.metadata?.name}>{a.metadata?.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 6, fontSize: 11 }}>
              When set, the operator collects this metric from the remote cluster instead of the local one.
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}
