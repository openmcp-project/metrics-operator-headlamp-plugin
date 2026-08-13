import React, { useState } from 'react';
import { KindSelector, MetricKind } from './KindSelector';
import { ResourcePicker, SelectedGVK } from './ResourcePicker';
import { SmartProposals } from './SmartProposals';
import { MetricForm, MetricFormValues } from './MetricForm';
import { ReviewYaml } from './ReviewYaml';
import { ProposalConfig } from './proposals';

const { Box, Typography, Stepper, Step, StepLabel, Button, Alert } = (window as any).pluginLib?.MuiCore ?? {};

const STEPS_WITH_TARGET = ['Select Kind', 'Target Resource', 'Proposals', 'Configure', 'Review'];
const STEPS_NO_TARGET   = ['Select Kind', 'Configure', 'Review'];

function defaultForm(kind: MetricKind): MetricFormValues {
  return {
    name: '',
    namespace: 'default',
    interval: '10m',
    dataSinkRef: '',
    labelSelector: {},
    fieldSelector: {},
    projections: [],
    valueFrom: null,
    remoteClusterAccessRef: '',
  };
}

function autoName(kind: MetricKind, gvk: SelectedGVK | null): string {
  const k = kind.toLowerCase().replace('metric', '').replace('federated', 'fed-').replace('managed', 'managed-') || 'metric';
  const t = gvk ? `-${gvk.kind.toLowerCase()}` : '';
  return `${k}${t}-count`.replace(/--+/g, '-').replace(/^-|-$/g, '');
}

function needsTarget(kind: MetricKind): boolean {
  return kind === 'Metric' || kind === 'FederatedMetric' || kind === 'ManagedMetric';
}

interface MetricWizardProps {
  initialKind?: string;
  onClose?: () => void;
}

export function MetricWizard({ initialKind }: MetricWizardProps = {}) {
  const [kind, setKind] = useState<MetricKind>((initialKind as MetricKind) ?? 'Metric');
  const [gvk, setGvk] = useState<SelectedGVK | null>(null);
  const [federatedAccessRef, setFederatedAccessRef] = useState('');
  const [form, setForm] = useState<MetricFormValues>(defaultForm('Metric'));
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);

  const hasTarget = needsTarget(kind);
  const steps = hasTarget ? STEPS_WITH_TARGET : STEPS_NO_TARGET;

  function applyProposal(p: ProposalConfig) {
    setForm(prev => ({
      ...prev,
      name: prev.name || autoName(kind, gvk),
      interval: p.interval ?? prev.interval,
      labelSelector: p.labelSelector ?? prev.labelSelector,
      fieldSelector: p.fieldSelector ?? prev.fieldSelector,
      projections: p.projections ?? prev.projections,
      valueFrom: p.valueFrom ?? prev.valueFrom,
    }));
    setStep(s => s + 1);
  }

  function handleKindChange(k: MetricKind) {
    setKind(k);
    setGvk(null);
    setForm(f => ({ ...defaultForm(k), name: autoName(k, null) }));
    setStep(0);
  }

  function next() {
    if (step === 0 && hasTarget && !gvk) { setStep(1); return; }
    if (!form.name && gvk) {
      setForm(f => ({ ...f, name: f.name || autoName(kind, gvk) }));
    }
    setStep(s => s + 1);
  }

  function back() { setStep(s => Math.max(0, s - 1)); }

  function canNext(): boolean {
    const label = steps[step];
    if (label === 'Select Kind') return true;
    if (label === 'Target Resource') return !!gvk && (kind !== 'FederatedMetric' || !!federatedAccessRef);
    if (label === 'Proposals') return true;
    if (label === 'Configure') return !!form.name && !!form.interval;
    return true;
  }

  if (success) {
    return (
      <Box style={{ padding: 32 }}>
        <Alert severity="success" style={{ marginBottom: 16 }}>
          <strong>{success}</strong> created successfully!
        </Alert>
        <Button variant="contained" onClick={() => { setSuccess(null); setStep(0); setForm(defaultForm(kind)); setGvk(null); }}>
          Create another
        </Button>
      </Box>
    );
  }

  return (
    <Box style={{ padding: 24 }}>
      <Typography variant="h5" style={{ marginBottom: 20, fontWeight: 700 }}>Create Metric</Typography>

      <Stepper activeStep={step} style={{ marginBottom: 28 }}>
        {steps.map((label: string) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box style={{ minHeight: 340 }}>
        {/* Step 0: Kind */}
        {step === 0 && (
          <KindSelector value={kind} onChange={handleKindChange} />
        )}

        {/* Step 1 (with target): Resource Picker */}
        {step === 1 && hasTarget && (
          <ResourcePicker
            value={gvk}
            onChange={g => { setGvk(g); if (!form.name) setForm(f => ({ ...f, name: autoName(kind, g) })); }}
            requireFederatedAccess={kind === 'FederatedMetric'}
            federatedAccessRef={federatedAccessRef}
            onFederatedAccessChange={setFederatedAccessRef}
          />
        )}

        {/* Step 2 (with target): Proposals */}
        {step === 2 && hasTarget && gvk && (
          <SmartProposals
            gvk={gvk}
            onSelect={applyProposal}
            onSkip={() => setStep(s => s + 1)}
          />
        )}

        {/* Configure step */}
        {steps[step] === 'Configure' && (
          <MetricForm kind={kind} gvk={gvk} value={form} onChange={setForm} />
        )}

        {/* Review step */}
        {steps[step] === 'Review' && (
          <ReviewYaml
            kind={kind}
            gvk={gvk}
            form={form}
            federatedAccessRef={federatedAccessRef}
            onSuccess={name => setSuccess(name)}
          />
        )}
      </Box>

      {/* Navigation — hide on Proposals step (it has its own buttons) and Review */}
      {steps[step] !== 'Proposals' && steps[step] !== 'Review' && (
        <Box display="flex" justifyContent="space-between" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={back} disabled={step === 0} variant="outlined">Back</Button>
          <Button onClick={next} variant="contained" disabled={!canNext()}>
            {step === steps.length - 2 ? 'Review' : 'Next'}
          </Button>
        </Box>
      )}

      {steps[step] === 'Review' && (
        <Box display="flex" style={{ marginTop: 12 }}>
          <Button onClick={back} variant="outlined">Back</Button>
        </Box>
      )}
    </Box>
  );
}
