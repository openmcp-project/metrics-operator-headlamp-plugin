// Metrics Operator status color tokens — single source of truth

export const moColors = {
  ready:    { bg: '#2e7d32', text: '#fff', faint: 'rgba(46,125,50,0.08)'  },
  failed:   { bg: '#c62828', text: '#fff', faint: 'rgba(198,40,40,0.06)'  },
  pending:  { bg: '#e65100', text: '#fff', faint: 'rgba(230,81,0,0.08)'   },
  unknown:  { bg: '#616161', text: '#fff', faint: 'rgba(97,97,97,0.08)'   },
  active:   { bg: '#1565c0', text: '#fff', faint: 'rgba(21,101,192,0.08)' },

  // Kind-specific colors for KindBadge
  metric:             { bg: '#1565c0', text: '#fff' },
  managedMetric:      { bg: '#00695c', text: '#fff' },
  federatedMetric:    { bg: '#6a1b9a', text: '#fff' },
  federatedManaged:   { bg: '#4a148c', text: '#fff' },
  dataSink:           { bg: '#bf360c', text: '#fff' },
  clusterAccess:      { bg: '#37474f', text: '#fff' },
};

export function readyColor(ready: string): { bg: string; text: string } {
  if (ready === 'True') return moColors.ready;
  if (ready === 'False') return moColors.failed;
  return moColors.unknown;
}

export function phaseColor(phase: string): { bg: string; text: string } {
  const p = phase?.toLowerCase();
  if (p === 'ready' || p === 'running') return moColors.ready;
  if (p === 'failed' || p === 'error') return moColors.failed;
  if (p === 'pending' || p === 'progressing') return moColors.pending;
  return moColors.unknown;
}
