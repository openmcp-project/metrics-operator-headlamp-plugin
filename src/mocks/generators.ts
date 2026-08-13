// Mock data generators for metrics-operator plugin

export type HealthState = 'ready' | 'failed' | 'unknown';

export function makeConditions(state: HealthState) {
  if (state === 'ready') return [
    { type: 'Available', status: 'True', reason: 'MonitoringActive', lastTransitionTime: '2024-03-01T10:00:00Z' },
    { type: 'Ready', status: 'True', reason: 'MonitoringActive', lastTransitionTime: '2024-03-01T10:00:00Z' },
  ];
  if (state === 'failed') return [
    { type: 'Available', status: 'False', reason: 'SendMetricFailed', message: 'datasink endpoint unreachable: connection refused', lastTransitionTime: '2024-03-05T08:00:00Z' },
    { type: 'Ready', status: 'False', reason: 'ErrorDetected', message: 'metric collection failed', lastTransitionTime: '2024-03-05T08:00:00Z' },
  ];
  return [];
}

export interface MetricSpec {
  name: string;
  namespace?: string;
  group?: string;
  version?: string;
  kind?: string;
  interval?: string;
  dataSink?: string;
  health?: HealthState;
  value?: string;
}

export function makeMetric(spec: MetricSpec): any {
  const { name, namespace = 'default', group = '', version = 'v1', kind = 'Pod', interval = '1m', dataSink = 'default', health = 'ready', value } = spec;
  return {
    apiVersion: 'metrics.openmcp.cloud/v1alpha1',
    kind: 'Metric',
    metadata: { name, namespace, uid: `uid-${name}`, creationTimestamp: '2024-03-01T10:00:00Z' },
    spec: {
      target: { group, version, kind },
      interval,
      dataSinkRef: { name: dataSink },
    },
    status: {
      ready: health === 'ready' ? 'True' : health === 'failed' ? 'False' : 'Unknown',
      observation: {
        latestValue: health === 'ready' ? (value ?? String(Math.floor(Math.random() * 50 + 1))) : null,
        timestamp: health === 'ready' ? '2024-03-10T12:00:00Z' : null,
      },
      conditions: makeConditions(health),
    },
  };
}

export function makeManagedMetric(spec: {
  name: string; namespace?: string; group: string; version?: string; kind: string;
  interval?: string; dataSink?: string; health?: HealthState; count?: number;
}): any {
  const { name, namespace = 'default', group, version = 'v1beta1', kind, interval = '1m', dataSink = 'default', health = 'ready', count } = spec;
  return {
    apiVersion: 'metrics.openmcp.cloud/v1alpha1',
    kind: 'ManagedMetric',
    metadata: { name, namespace, uid: `uid-mm-${name}`, creationTimestamp: '2024-03-01T10:00:00Z' },
    spec: { target: { group, version, kind }, interval, dataSinkRef: { name: dataSink } },
    status: {
      ready: health === 'ready' ? 'True' : health === 'failed' ? 'False' : 'Unknown',
      observation: {
        resources: health === 'ready' ? (count ?? Math.floor(Math.random() * 30 + 1)) : null,
        timestamp: health === 'ready' ? '2024-03-10T12:00:00Z' : null,
      },
      conditions: makeConditions(health),
    },
  };
}

export function makeFederatedMetric(spec: {
  name: string; namespace?: string; group: string; version?: string; kind: string;
  dataSink?: string; health?: HealthState; active?: number; failed?: number; pending?: number;
}): any {
  const { name, namespace = 'default', group, version = 'v1', kind, dataSink = 'default', health = 'ready', active = 10, failed = 0, pending = 0 } = spec;
  return {
    apiVersion: 'metrics.openmcp.cloud/v1alpha1',
    kind: 'FederatedMetric',
    metadata: { name, namespace, uid: `uid-fm-${name}`, creationTimestamp: '2024-03-01T10:00:00Z' },
    spec: {
      target: { group, version, kind },
      interval: '1m',
      federateClusterAccessRef: { name: 'federated-access', namespace },
      dataSinkRef: { name: dataSink },
    },
    status: {
      ready: health === 'ready' ? 'True' : health === 'failed' ? 'False' : 'Unknown',
      observation: { activeCount: active, failedCount: failed, pendingCount: pending },
      lastReconcileTime: '2024-03-10T12:00:00Z',
      conditions: makeConditions(health),
    },
  };
}

const NAMESPACES = ['default', 'production', 'staging', 'platform'];
const KINDS = [
  { group: '', version: 'v1', kind: 'Pod' },
  { group: '', version: 'v1', kind: 'PersistentVolumeClaim' },
  { group: 'apps', version: 'v1', kind: 'Deployment' },
  { group: 'batch', version: 'v1', kind: 'Job' },
];

/** Small: ~6 metrics, 2 namespaces, 1 datasink */
export function smallLandscape() {
  return {
    metrics: KINDS.slice(0, 3).map((k, i) => makeMetric({
      name: `${k.kind.toLowerCase()}-count`,
      namespace: NAMESPACES[i % 2],
      ...k,
      health: i === 1 ? 'failed' : 'ready',
    })),
    managedMetrics: [
      makeManagedMetric({ name: 'helm-releases', group: 'helm.crossplane.io', kind: 'Release', count: 8 }),
    ],
    federatedMetrics: [
      makeFederatedMetric({ name: 'xplane-providers', group: 'pkg.crossplane.io', kind: 'Provider', active: 10, failed: 1 }),
    ],
    federatedManagedMetrics: [
      { apiVersion: 'metrics.openmcp.cloud/v1alpha1', kind: 'FederatedManagedMetric', metadata: { name: 'all-managed', namespace: 'default', uid: 'uid-fmm-all', creationTimestamp: '2024-03-01T10:00:00Z' }, spec: { interval: '5m', federatedClusterAccessRef: { name: 'federated-access', namespace: 'default' }, dataSinkRef: { name: 'default' } }, status: { ready: 'True', observation: { activeCount: 87, failedCount: 5, pendingCount: 3 }, lastReconcileTime: '2024-03-10T12:00:00Z', conditions: makeConditions('ready') } },
    ],
  };
}

/** Medium: ~15 metrics, 3 namespaces, 2 datasinks */
export function mediumLandscape() {
  const { metrics: smallMetrics, managedMetrics: smallManaged } = smallLandscape();
  const extra = KINDS.map((k, i) => makeMetric({
    name: `${k.kind.toLowerCase()}-prod`,
    namespace: NAMESPACES[i % NAMESPACES.length],
    ...k,
    dataSink: i % 2 === 0 ? 'default' : 'dynatrace',
    health: i === 2 ? 'failed' : 'ready',
  }));
  return {
    metrics: [...smallMetrics, ...extra],
    managedMetrics: [
      ...smallManaged,
      makeManagedMetric({ name: 's3-buckets', group: 's3.aws.upbound.io', kind: 'Bucket', count: 23, dataSink: 'dynatrace' }),
      makeManagedMetric({ name: 'rds-instances', group: 'rds.aws.upbound.io', kind: 'Instance', count: 6, health: 'unknown' }),
    ],
    federatedMetrics: smallLandscape().federatedMetrics,
    federatedManagedMetrics: smallLandscape().federatedManagedMetrics,
  };
}

/** Large: ~30+ metrics, 4 namespaces, multiple datasinks */
export function largeLandscape() {
  const { metrics: medMetrics, managedMetrics: medManaged } = mediumLandscape();
  const states: HealthState[] = ['ready', 'ready', 'ready', 'failed', 'unknown'];
  const bulk = Array.from({ length: 15 }, (_, i) => {
    const k = KINDS[i % KINDS.length];
    return makeMetric({
      name: `${k.kind.toLowerCase()}-bulk-${String(i + 1).padStart(3, '0')}`,
      namespace: NAMESPACES[i % NAMESPACES.length],
      ...k,
      dataSink: ['default', 'dynatrace', 'grpc-sink'][i % 3],
      health: states[i % states.length],
    });
  });
  return {
    metrics: [...medMetrics, ...bulk],
    managedMetrics: [
      ...medManaged,
      makeManagedMetric({ name: 'azure-rg', group: 'azure.upbound.io', kind: 'ResourceGroup', count: 12 }),
      makeManagedMetric({ name: 'gke-clusters', group: 'container.gcp.upbound.io', kind: 'Cluster', count: 3, dataSink: 'dynatrace' }),
    ],
    federatedMetrics: [
      ...mediumLandscape().federatedMetrics,
      makeFederatedMetric({ name: 'dbclusters', group: 'database.example.io', kind: 'DBCluster', active: 30, failed: 2, pending: 1 }),
    ],
    federatedManagedMetrics: mediumLandscape().federatedManagedMetrics,
  };
}
