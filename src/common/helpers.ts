import { K8s } from '@kinvolk/headlamp-plugin/lib';

// ── ApiProxy ──────────────────────────────────────────────────────────────────

export function getApiProxy(): any {
  return (K8s as any).ApiProxy ?? (window as any).pluginLib?.ApiProxy;
}

// ── Cluster-aware routing ─────────────────────────────────────────────────────

export function clusterPrefix(): string {
  const base = (window as any).headlampBaseUrl ?? '';
  const pathname =
    base && window.location.pathname.startsWith(base)
      ? window.location.pathname.slice(base.length)
      : window.location.pathname;
  const match = pathname.match(/^(\/c\/[^/]+)/);
  return match?.[1] ?? '';
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatAge(timestamp: string | null | undefined): string {
  if (!timestamp) return '—';
  const diff = Date.now() - new Date(timestamp).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return String(value);
}

export function formatGVK(g: string, v: string, k: string): string {
  if (!g && !v && !k) return '—';
  const group = g ? `${g}/` : '';
  return `${group}${v}/${k}`;
}

// ── Duration validation ───────────────────────────────────────────────────────

const DURATION_RE = /^(\d+[smhd])+$/;
export function isValidDuration(s: string): boolean {
  return DURATION_RE.test(s.trim());
}

// ── Condition helpers ─────────────────────────────────────────────────────────

export function getCondition(conditions: any[], type: string): any | undefined {
  return conditions?.find((c: any) => c.type === type);
}

export function isConditionTrue(conditions: any[], type: string): boolean {
  return getCondition(conditions, type)?.status === 'True';
}

export function conditionSummary(conditions: any[]): string {
  if (!conditions?.length) return 'No conditions';
  const failed = conditions.filter((c: any) => c.status === 'False');
  if (failed.length === 0) return 'OK';
  const messages = failed.map((c: any) => c.message ?? c.type).filter(Boolean);
  return messages.join('; ');
}

// ── Ready string helpers ──────────────────────────────────────────────────────

export function readyLabel(ready: string): string {
  if (ready === 'True') return 'Ready';
  if (ready === 'False') return 'Not Ready';
  return 'Unknown';
}
