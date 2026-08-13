import { describe, it, expect } from 'vitest';
import { getProposals, GENERIC_PROPOSALS } from '../metrics/wizard/proposals';

describe('getProposals', () => {
  it('returns Pod proposals for core v1 Pod', () => {
    const proposals = getProposals('', 'v1', 'Pod');
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals.some(p => p.id === 'pod-count-all')).toBe(true);
  });

  it('returns Deployment proposals', () => {
    const proposals = getProposals('apps', 'v1', 'Deployment');
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals.some(p => p.id === 'deployment-available')).toBe(true);
  });

  it('returns PVC proposals', () => {
    const proposals = getProposals('', 'v1', 'PersistentVolumeClaim');
    expect(proposals.some(p => p.id === 'pvc-count-bound')).toBe(true);
  });

  it('returns Job proposals', () => {
    const proposals = getProposals('batch', 'v1', 'Job');
    expect(proposals.length).toBeGreaterThan(0);
  });

  it('returns empty array for unknown GVK', () => {
    expect(getProposals('example.com', 'v1', 'MyCustomResource')).toHaveLength(0);
  });
});

describe('GENERIC_PROPOSALS', () => {
  it('includes a count-all proposal', () => {
    expect(GENERIC_PROPOSALS.some(p => p.id === 'generic-count-all')).toBe(true);
  });

  it('includes a ready-count proposal', () => {
    expect(GENERIC_PROPOSALS.some(p => p.id === 'generic-count-ready')).toBe(true);
  });
});

describe('proposal structure', () => {
  it('deployment-replicas has valueFrom', () => {
    const props = getProposals('apps', 'v1', 'Deployment');
    const p = props.find(p => p.id === 'deployment-replicas');
    expect(p?.valueFrom).toBeDefined();
    expect(p?.valueFrom?.fieldPath).toBe('status.availableReplicas');
  });

  it('pod-by-namespace has cardinality warning', () => {
    const props = getProposals('', 'v1', 'Pod');
    const p = props.find(p => p.id === 'pod-by-namespace');
    expect(p?.cardinalityWarning).toBeTruthy();
  });

  it('deployment-by-label has cardinality warning', () => {
    const props = getProposals('apps', 'v1', 'Deployment');
    const p = props.find(p => p.id === 'deployment-by-label');
    expect(p?.cardinalityWarning).toBeTruthy();
  });
});
