import { K8s } from '@kinvolk/headlamp-plugin/lib';

// makeKubeObject was removed from K8s in Headlamp v0.39+.
const makeKubeObject: (name: string) => any =
  (K8s as any).makeKubeObject ??
  (() => Object.getPrototypeOf(K8s.ResourceClasses.CustomResourceDefinition));

const GROUP = 'metrics.openmcp.cloud';
const VERSION = 'v1alpha1';

// ── Metric ────────────────────────────────────────────────────────────────────

export class Metric extends makeKubeObject('Metric') {
  static apiVersion = `${GROUP}/${VERSION}`;
  static kind = 'Metric';
  static apiName = 'metrics';
  static isNamespaced = true;

  get spec(): any { return this.jsonData.spec; }
  get status(): any { return this.jsonData.status; }

  get ready(): string { return this.status?.ready ?? 'Unknown'; }
  get latestValue(): string | null { return this.status?.observation?.latestValue ?? null; }
  get observationTimestamp(): string | null { return this.status?.observation?.timestamp ?? null; }
  get conditions(): any[] { return this.status?.conditions ?? []; }
  get targetGVK(): { group: string; version: string; kind: string } {
    return this.spec?.target ?? { group: '', version: '', kind: '' };
  }
  get dataSinkRef(): string | null { return this.spec?.dataSinkRef?.name ?? null; }
  get interval(): string { return this.spec?.interval ?? '10m'; }
}

// ── ManagedMetric ─────────────────────────────────────────────────────────────

export class ManagedMetric extends makeKubeObject('ManagedMetric') {
  static apiVersion = `${GROUP}/${VERSION}`;
  static kind = 'ManagedMetric';
  static apiName = 'managedmetrics';
  static isNamespaced = true;

  get spec(): any { return this.jsonData.spec; }
  get status(): any { return this.jsonData.status; }

  get ready(): string { return this.status?.ready ?? 'Unknown'; }
  get resourceCount(): number | null { return this.status?.observation?.resources ?? null; }
  get observationTimestamp(): string | null { return this.status?.observation?.timestamp ?? null; }
  get conditions(): any[] { return this.status?.conditions ?? []; }
  get targetGVK(): { group: string; version: string; kind: string } {
    return this.spec?.target ?? { group: '', version: '', kind: '' };
  }
  get dataSinkRef(): string | null { return this.spec?.dataSinkRef?.name ?? null; }
  get interval(): string { return this.spec?.interval ?? '10m'; }
}

// ── FederatedMetric ───────────────────────────────────────────────────────────

export class FederatedMetric extends makeKubeObject('FederatedMetric') {
  static apiVersion = `${GROUP}/${VERSION}`;
  static kind = 'FederatedMetric';
  static apiName = 'federatedmetrics';
  static isNamespaced = true;

  get spec(): any { return this.jsonData.spec; }
  get status(): any { return this.jsonData.status; }

  get ready(): string { return this.status?.ready ?? 'Unknown'; }
  get activeCount(): number { return this.status?.observation?.activeCount ?? 0; }
  get failedCount(): number { return this.status?.observation?.failedCount ?? 0; }
  get pendingCount(): number { return this.status?.observation?.pendingCount ?? 0; }
  get lastReconcileTime(): string | null { return this.status?.lastReconcileTime ?? null; }
  get conditions(): any[] { return this.status?.conditions ?? []; }
  get targetGVK(): { group: string; version: string; kind: string } {
    return this.spec?.target ?? { group: '', version: '', kind: '' };
  }
  get dataSinkRef(): string | null { return this.spec?.dataSinkRef?.name ?? null; }
  get interval(): string { return this.spec?.interval ?? '10m'; }
  get federatedClusterAccessRef(): string | null { return this.spec?.federateClusterAccessRef?.name ?? null; }
}

// ── FederatedManagedMetric ────────────────────────────────────────────────────

export class FederatedManagedMetric extends makeKubeObject('FederatedManagedMetric') {
  static apiVersion = `${GROUP}/${VERSION}`;
  static kind = 'FederatedManagedMetric';
  static apiName = 'federatedmanagedmetrics';
  static isNamespaced = true;

  get spec(): any { return this.jsonData.spec; }
  get status(): any { return this.jsonData.status; }

  get ready(): string { return this.status?.ready ?? 'Unknown'; }
  get activeCount(): number { return this.status?.observation?.activeCount ?? 0; }
  get failedCount(): number { return this.status?.observation?.failedCount ?? 0; }
  get pendingCount(): number { return this.status?.observation?.pendingCount ?? 0; }
  get lastReconcileTime(): string | null { return this.status?.lastReconcileTime ?? null; }
  get conditions(): any[] { return this.status?.conditions ?? []; }
  get dataSinkRef(): string | null { return this.spec?.dataSinkRef?.name ?? null; }
  get interval(): string { return this.spec?.interval ?? '10m'; }
  get federatedClusterAccessRef(): string | null { return this.spec?.federatedClusterAccessRef?.name ?? null; }
}

// ── DataSink ──────────────────────────────────────────────────────────────────

export class DataSink extends makeKubeObject('DataSink') {
  static apiVersion = `${GROUP}/${VERSION}`;
  static kind = 'DataSink';
  static apiName = 'datasinks';
  static isNamespaced = true;

  get spec(): any { return this.jsonData.spec; }
  get status(): any { return this.jsonData.status; }

  get endpoint(): string { return this.spec?.connection?.endpoint ?? ''; }
  get conditions(): any[] { return this.status?.conditions ?? []; }

  get authType(): 'apiKey' | 'certificate' | 'none' {
    if (this.spec?.authentication?.apiKey) return 'apiKey';
    if (this.spec?.authentication?.certificate) return 'certificate';
    return 'none';
  }

  get protocol(): 'http' | 'https' | 'grpc' | 'grpcs' | 'unknown' {
    const ep = this.endpoint.toLowerCase();
    if (ep.startsWith('grpcs://')) return 'grpcs';
    if (ep.startsWith('grpc://')) return 'grpc';
    if (ep.startsWith('https://')) return 'https';
    if (ep.startsWith('http://')) return 'http';
    return 'unknown';
  }
}

// ── RemoteClusterAccess ───────────────────────────────────────────────────────

export class RemoteClusterAccess extends makeKubeObject('RemoteClusterAccess') {
  static apiVersion = `${GROUP}/${VERSION}`;
  static kind = 'RemoteClusterAccess';
  static apiName = 'remoteclusteraccesses';
  static isNamespaced = true;

  get spec(): any { return this.jsonData.spec; }

  get authMethod(): 'serviceAccount' | 'kubeconfig' | 'unknown' {
    if (this.spec?.remoteClusterConfig) return 'serviceAccount';
    if (this.spec?.kubeConfigSecretRef) return 'kubeconfig';
    return 'unknown';
  }
}

// ── FederatedClusterAccess ────────────────────────────────────────────────────

export class FederatedClusterAccess extends makeKubeObject('FederatedClusterAccess') {
  static apiVersion = `${GROUP}/${VERSION}`;
  static kind = 'FederatedClusterAccess';
  static apiName = 'federatedclusteraccesses';
  static isNamespaced = true;

  get spec(): any { return this.jsonData.spec; }

  get discoveryKind(): string { return this.spec?.target?.kind ?? ''; }
  get accessMethod(): 'kubeConfigPath' | 'secretRefPath' | 'unknown' {
    if (this.spec?.kubeConfigPath) return 'kubeConfigPath';
    if (this.spec?.secretRefPath) return 'secretRefPath';
    return 'unknown';
  }
}

// ── MetricsOperator (service-provider) ───────────────────────────────────────

export class MetricsOperator extends makeKubeObject('MetricsOperator') {
  static apiVersion = 'metrics.services.open-control-plane.io/v1alpha1';
  static kind = 'MetricsOperator';
  static apiName = 'metricsoperators';
  static isNamespaced = true;

  get spec(): any { return this.jsonData.spec; }
  get status(): any { return this.jsonData.status; }
  get phase(): string { return this.status?.phase ?? 'Unknown'; }
  get version(): string { return this.spec?.version ?? ''; }
  get conditions(): any[] { return this.status?.conditions ?? []; }
  get resources(): any[] { return this.status?.resources ?? []; }
}

// ── ProviderConfig (service-provider, cluster-scoped) ─────────────────────────

export class ProviderConfig extends makeKubeObject('ProviderConfig') {
  static apiVersion = 'metrics.services.open-control-plane.io/v1alpha1';
  static kind = 'ProviderConfig';
  static apiName = 'providerconfigs';
  static isNamespaced = false;

  get spec(): any { return this.jsonData.spec; }
  get versions(): any[] { return this.spec?.versions ?? []; }
}
