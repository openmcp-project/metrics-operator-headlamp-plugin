#!/usr/bin/env node
/**
 * Mock Kubernetes API server for local metrics-operator plugin development.
 *
 * Usage:
 *   node mock-cluster/server.mjs [--scenario small|medium|large]
 *   node mock-cluster/server.mjs --print-kubeconfig >> ~/.kube/config
 *
 * Then in Headlamp desktop: switch to the "metrics-mock" cluster context.
 */

import http from 'node:http';
import { URL } from 'node:url';

const PORT = 9648;
const SCENARIO = process.argv.includes('--scenario')
  ? process.argv[process.argv.indexOf('--scenario') + 1]
  : 'small';

if (process.argv.includes('--print-kubeconfig')) {
  console.log(`
- cluster:
    server: http://localhost:${PORT}
    insecure-skip-tls-verify: true
  name: metrics-mock
- context:
    cluster: metrics-mock
    user: metrics-mock-user
  name: metrics-mock
- name: metrics-mock-user
  user: {}
`);
  process.exit(0);
}

// ── Data generators ───────────────────────────────────────────────────────────

const GROUP = 'metrics.openmcp.cloud';
const VERSION = 'v1alpha1';

function makeConditions(state) {
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

function makeMetric({ name, namespace = 'default', group = '', version = 'v1', kind = 'Pod', interval = '1m', dataSink = 'default', health = 'ready', value }) {
  return {
    apiVersion: `${GROUP}/${VERSION}`,
    kind: 'Metric',
    metadata: { name, namespace, uid: `uid-${name}`, creationTimestamp: '2024-03-01T10:00:00Z', resourceVersion: '12345' },
    spec: { target: { group, version, kind }, interval, dataSinkRef: { name: dataSink } },
    status: {
      ready: health === 'ready' ? 'True' : health === 'failed' ? 'False' : 'Unknown',
      observation: { latestValue: health === 'ready' ? (value ?? '42') : null, timestamp: health === 'ready' ? '2024-03-10T12:00:00Z' : null },
      conditions: makeConditions(health),
    },
  };
}

function makeManagedMetric({ name, namespace = 'default', group, version = 'v1beta1', kind, interval = '1m', dataSink = 'default', health = 'ready', count = 10 }) {
  return {
    apiVersion: `${GROUP}/${VERSION}`,
    kind: 'ManagedMetric',
    metadata: { name, namespace, uid: `uid-mm-${name}`, creationTimestamp: '2024-03-01T10:00:00Z', resourceVersion: '12345' },
    spec: { target: { group, version, kind }, interval, dataSinkRef: { name: dataSink } },
    status: {
      ready: health === 'ready' ? 'True' : health === 'failed' ? 'False' : 'Unknown',
      observation: { resources: health === 'ready' ? count : null, timestamp: health === 'ready' ? '2024-03-10T12:00:00Z' : null },
      conditions: makeConditions(health),
    },
  };
}

function makeFederatedMetric({ name, namespace = 'default', group, version = 'v1', kind, dataSink = 'default', health = 'ready', active = 10, failed = 0, pending = 0 }) {
  return {
    apiVersion: `${GROUP}/${VERSION}`,
    kind: 'FederatedMetric',
    metadata: { name, namespace, uid: `uid-fm-${name}`, creationTimestamp: '2024-03-01T10:00:00Z', resourceVersion: '12345' },
    spec: { target: { group, version, kind }, interval: '1m', federateClusterAccessRef: { name: 'federated-access', namespace }, dataSinkRef: { name: dataSink } },
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

const DATASINKS = [
  { metadata: { name: 'default', namespace: 'default', uid: 'uid-ds-default', creationTimestamp: '2024-01-15T10:00:00Z' }, spec: { connection: { endpoint: 'https://abc.live.dynatrace.com/api/v2/otlp/v1/metrics' }, authentication: { apiKey: { secretKeyRef: { name: 'dt-token', key: 'api-token' } } } }, status: { conditions: makeConditions('ready') } },
  { metadata: { name: 'dynatrace', namespace: 'production', uid: 'uid-ds-dt', creationTimestamp: '2024-02-01T10:00:00Z' }, spec: { connection: { endpoint: 'https://prod.live.dynatrace.com/api/v2/otlp/v1/metrics' }, authentication: { apiKey: { secretKeyRef: { name: 'dt-prod-token', key: 'token' } } } }, status: { conditions: makeConditions('ready') } },
];

function makeCRD({ kind, plural, singular, group, scope = 'Namespaced', shortNames = [], description = '', properties = {} }) {
  return {
    apiVersion: 'apiextensions.k8s.io/v1',
    kind: 'CustomResourceDefinition',
    metadata: { name: `${plural}.${group}`, uid: `uid-crd-${plural}`, creationTimestamp: '2024-01-01T00:00:00Z' },
    spec: {
      group,
      scope,
      names: { kind, plural, singular, shortNames },
      versions: [{
        name: 'v1alpha1',
        served: true,
        storage: true,
        schema: {
          openAPIV3Schema: {
            type: 'object',
            description,
            properties: {
              spec: { type: 'object', description: `${kind} spec`, properties },
              status: {
                type: 'object',
                description: `${kind} status`,
                properties: {
                  ready: { type: 'string', description: 'True / False / Unknown' },
                  conditions: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, status: { type: 'string' }, reason: { type: 'string' }, message: { type: 'string' }, lastTransitionTime: { type: 'string', format: 'date-time' } } } },
                },
              },
            },
          },
        },
        additionalPrinterColumns: [],
      }],
    },
    status: { acceptedNames: { kind, plural }, conditions: [], storedVersions: ['v1alpha1'] },
  };
}

const TARGET_PROPS = {
  group: { type: 'string', description: 'API group of the target resource (empty string for core API)' },
  version: { type: 'string', description: 'API version of the target resource' },
  kind: { type: 'string', description: 'Kind of the target resource' },
};
const DATASINK_REF_PROPS = {
  name: { type: 'string', description: 'Name of the DataSink' },
  namespace: { type: 'string', description: 'Namespace of the DataSink' },
};
const PROJECTION_PROPS = {
  name: { type: 'string', description: 'Dimension name (OTLP attribute key)' },
  fieldPath: { type: 'string', description: 'JSONPath expression to extract the value' },
  type: { type: 'string', enum: ['primitive', 'map', 'slice', 'timestamp'], description: 'Value type' },
  default: { description: 'Fallback value when field is absent' },
};

const CRDS = [
  makeCRD({
    kind: 'Metric', plural: 'metrics', singular: 'metric', group: GROUP, shortNames: ['mo'],
    description: 'Counts or measures Kubernetes resources of a given GVK and exports the value to a DataSink.',
    properties: {
      target: { type: 'object', description: 'Target resource GVK', properties: TARGET_PROPS },
      interval: { type: 'string', description: 'Scrape interval (e.g. 1m, 30s)' },
      dataSinkRef: { type: 'object', description: 'Reference to the DataSink', properties: DATASINK_REF_PROPS },
      labelSelector: { type: 'object', description: 'Label selector to filter target resources' },
      fieldSelector: { type: 'object', description: 'Field selector to filter target resources' },
      projections: { type: 'array', description: 'Additional dimensions derived from resource fields', items: { type: 'object', properties: PROJECTION_PROPS } },
      valueFrom: { type: 'object', description: 'Extract a numeric value from a resource field', properties: { fieldPath: { type: 'string' }, type: { type: 'string', enum: ['integer', 'timestamp'] }, aggregation: { type: 'string', enum: ['sum', 'max', 'min', 'mean'] }, default: {} } },
      remoteClusterAccessRef: { type: 'object', description: 'Reference to a RemoteClusterAccess', properties: { name: { type: 'string' }, namespace: { type: 'string' } } },
    },
  }),
  makeCRD({
    kind: 'ManagedMetric', plural: 'managedmetrics', singular: 'managedmetric', group: GROUP, shortNames: ['mm'],
    description: 'Tracks counts and status of Crossplane managed resources across a cluster.',
    properties: {
      target: { type: 'object', description: 'Target managed resource GVK', properties: TARGET_PROPS },
      interval: { type: 'string', description: 'Scrape interval' },
      dataSinkRef: { type: 'object', description: 'Reference to the DataSink', properties: DATASINK_REF_PROPS },
      dimensions: { type: 'array', description: 'Dimensions derived from resource fields', items: { type: 'object', properties: PROJECTION_PROPS } },
    },
  }),
  makeCRD({
    kind: 'FederatedMetric', plural: 'federatedmetrics', singular: 'federatedmetric', group: GROUP, shortNames: ['fm'],
    description: 'Like Metric but runs across all clusters reachable via a FederatedClusterAccess.',
    properties: {
      target: { type: 'object', description: 'Target resource GVK', properties: TARGET_PROPS },
      interval: { type: 'string', description: 'Scrape interval' },
      dataSinkRef: { type: 'object', description: 'Reference to the DataSink', properties: DATASINK_REF_PROPS },
      federatedClusterAccessRef: { type: 'object', description: 'Reference to a FederatedClusterAccess', properties: { name: { type: 'string' }, namespace: { type: 'string' } } },
      projections: { type: 'array', description: 'Additional dimensions', items: { type: 'object', properties: PROJECTION_PROPS } },
      valueFrom: { type: 'object', description: 'Extract a numeric value from resource fields', properties: { fieldPath: { type: 'string' }, type: { type: 'string' }, aggregation: { type: 'string' } } },
    },
  }),
  makeCRD({
    kind: 'FederatedManagedMetric', plural: 'federatedmanagedmetrics', singular: 'federatedmanagedmetric', group: GROUP, shortNames: ['fmm'],
    description: 'Counts Crossplane managed resources across all federated clusters.',
    properties: {
      interval: { type: 'string', description: 'Scrape interval' },
      dataSinkRef: { type: 'object', description: 'Reference to the DataSink', properties: DATASINK_REF_PROPS },
      federatedClusterAccessRef: { type: 'object', description: 'Reference to a FederatedClusterAccess', properties: { name: { type: 'string' }, namespace: { type: 'string' } } },
    },
  }),
  makeCRD({
    kind: 'DataSink', plural: 'datasinks', singular: 'datasink', group: GROUP, shortNames: ['ds'],
    description: 'Defines an OTLP-compatible endpoint that receives metric data.',
    properties: {
      connection: { type: 'object', description: 'Connection settings', properties: { endpoint: { type: 'string', description: 'OTLP endpoint URL' } } },
      authentication: { type: 'object', description: 'Authentication configuration', properties: {
        apiKey: { type: 'object', properties: { secretKeyRef: { type: 'object', properties: { name: { type: 'string' }, key: { type: 'string' }, namespace: { type: 'string' } } } } },
        certificate: { type: 'object', properties: { clientSecretKeyRef: { type: 'object' }, keySecretKeyRef: { type: 'object' }, caSecretKeyRef: { type: 'object' } } },
      }},
    },
  }),
  makeCRD({
    kind: 'RemoteClusterAccess', plural: 'remoteclusteraccesses', singular: 'remoteclusteraccess', group: GROUP, shortNames: ['rca'],
    description: 'Credentials to access a single remote Kubernetes cluster.',
    properties: {
      remoteClusterConfig: { type: 'object', description: 'Service-account-based access config' },
      kubeConfigSecretRef: { type: 'object', description: 'Reference to a secret containing a kubeconfig', properties: { name: { type: 'string' }, key: { type: 'string' }, namespace: { type: 'string' } } },
    },
  }),
  makeCRD({
    kind: 'FederatedClusterAccess', plural: 'federatedclusteraccesses', singular: 'federatedclusteraccess', group: GROUP, shortNames: ['fca'],
    description: 'Defines how to discover and access a fleet of clusters for federated metrics collection.',
    properties: {
      target: { type: 'object', description: 'GVK of the resource that represents a cluster', properties: TARGET_PROPS },
      kubeConfigPath: { type: 'string', description: 'JSONPath to kubeconfig within the target resource' },
      secretRefPath: { type: 'string', description: 'JSONPath to a secret ref within the target resource' },
      namespace: { type: 'string', description: 'Namespace to look for target resources' },
    },
  }),
];

function buildLandscape(scenario) {
  const healthStates = scenario === 'large'
    ? ['ready', 'ready', 'ready', 'failed', 'unknown']
    : ['ready', 'failed', 'ready'];

  const metricCount = scenario === 'small' ? 3 : scenario === 'medium' ? 8 : 20;
  const metrics = Array.from({ length: metricCount }, (_, i) => {
    const k = KINDS[i % KINDS.length];
    return makeMetric({ name: `${k.kind.toLowerCase()}-${String(i + 1).padStart(3, '0')}`, namespace: NAMESPACES[i % NAMESPACES.length], ...k, dataSink: i % 2 === 0 ? 'default' : 'dynatrace', health: healthStates[i % healthStates.length], value: String(Math.floor((i + 1) * 7)) });
  });

  const managedCount = scenario === 'small' ? 1 : scenario === 'medium' ? 3 : 6;
  const managedKinds = [
    { group: 'helm.crossplane.io', version: 'v1beta1', kind: 'Release', count: 12 },
    { group: 's3.aws.upbound.io', version: 'v1beta1', kind: 'Bucket', count: 23 },
    { group: 'rds.aws.upbound.io', version: 'v1beta1', kind: 'Instance', count: 6 },
    { group: 'azure.upbound.io', version: 'v1beta1', kind: 'ResourceGroup', count: 15 },
    { group: 'storage.azure.upbound.io', version: 'v1beta1', kind: 'Account', count: 8 },
    { group: 'pkg.crossplane.io', version: 'v1', kind: 'Provider', count: 4 },
  ];
  const managedMetrics = managedKinds.slice(0, managedCount).map((k, i) =>
    makeManagedMetric({ name: `${k.kind.toLowerCase()}-metric-${i + 1}`, ...k, health: i === 1 ? 'failed' : 'ready' })
  );

  const federatedMetrics = [
    makeFederatedMetric({ name: 'xplane-providers', group: 'pkg.crossplane.io', kind: 'Provider', active: 14, failed: 2, pending: 0 }),
  ];
  if (scenario !== 'small') {
    federatedMetrics.push(makeFederatedMetric({ name: 'dbclusters', group: 'database.example.io', kind: 'DBCluster', active: 30, failed: 2, pending: 1 }));
  }

  const federatedManagedMetrics = [{
    apiVersion: `${GROUP}/${VERSION}`,
    kind: 'FederatedManagedMetric',
    metadata: { name: 'all-managed', namespace: 'default', uid: 'uid-fmm-all', creationTimestamp: '2024-02-01T10:00:00Z', resourceVersion: '12345' },
    spec: { interval: '5m', federatedClusterAccessRef: { name: 'federated-access', namespace: 'default' }, dataSinkRef: { name: 'default' } },
    status: { ready: 'True', observation: { activeCount: 87, failedCount: 5, pendingCount: 3 }, lastReconcileTime: '2024-03-10T12:00:00Z', conditions: makeConditions('ready') },
  }];

  return { metrics, managedMetrics, federatedMetrics, federatedManagedMetrics };
}

const data = buildLandscape(SCENARIO);

// ── Route table ───────────────────────────────────────────────────────────────

function list(items, apiVersion, kind) {
  return JSON.stringify({ apiVersion, kind: `${kind}List`, metadata: {}, items });
}

function notFound() {
  return [404, JSON.stringify({ code: 404, message: 'Not Found' })];
}

function routeRequest(req, pathname, query) {
  const method = req.method;
  const ns = pathname.match(/\/namespaces\/([^/]+)/)?.[1];
  const filterNs = (items) => ns ? items.filter(i => i.metadata.namespace === ns) : items;

  // Version & root
  if (pathname === '/version') return JSON.stringify({ major: '1', minor: '29', gitVersion: 'v1.29.0', platform: 'linux/amd64' });
  if (pathname === '/api') return JSON.stringify({ kind: 'APIVersions', versions: ['v1'], serverAddressByClientCIDRs: [{ clientCIDR: '0.0.0.0/0', serverAddress: `localhost:${PORT}` }] });

  // Core API resources
  if (pathname === '/api/v1') return JSON.stringify({ kind: 'APIResourceList', groupVersion: 'v1', resources: [
    { name: 'pods', singularName: '', namespaced: true, kind: 'Pod', verbs: ['get', 'list', 'watch'] },
    { name: 'persistentvolumeclaims', singularName: '', namespaced: true, kind: 'PersistentVolumeClaim', verbs: ['get', 'list', 'watch'] },
    { name: 'services', singularName: '', namespaced: true, kind: 'Service', verbs: ['get', 'list', 'watch'] },
    { name: 'namespaces', singularName: '', namespaced: false, kind: 'Namespace', verbs: ['get', 'list', 'watch'] },
    { name: 'nodes', singularName: '', namespaced: false, kind: 'Node', verbs: ['get', 'list', 'watch'] },
    { name: 'events', singularName: '', namespaced: true, kind: 'Event', verbs: ['get', 'list', 'watch'] },
  ]});

  // API group discovery
  if (pathname === '/apis') return JSON.stringify({ kind: 'APIGroupList', groups: [
    { name: 'apps', versions: [{ groupVersion: 'apps/v1', version: 'v1' }], preferredVersion: { groupVersion: 'apps/v1', version: 'v1' } },
    { name: 'batch', versions: [{ groupVersion: 'batch/v1', version: 'v1' }], preferredVersion: { groupVersion: 'batch/v1', version: 'v1' } },
    { name: 'authorization.k8s.io', versions: [{ groupVersion: 'authorization.k8s.io/v1', version: 'v1' }], preferredVersion: { groupVersion: 'authorization.k8s.io/v1', version: 'v1' } },
    { name: 'rbac.authorization.k8s.io', versions: [{ groupVersion: 'rbac.authorization.k8s.io/v1', version: 'v1' }], preferredVersion: { groupVersion: 'rbac.authorization.k8s.io/v1', version: 'v1' } },
    { name: 'apiextensions.k8s.io', versions: [{ groupVersion: 'apiextensions.k8s.io/v1', version: 'v1' }], preferredVersion: { groupVersion: 'apiextensions.k8s.io/v1', version: 'v1' } },
    { name: GROUP, versions: [{ groupVersion: `${GROUP}/${VERSION}`, version: VERSION }], preferredVersion: { groupVersion: `${GROUP}/${VERSION}`, version: VERSION } },
  ]});

  // Per-group resource lists
  if (pathname === '/apis/apps/v1') return JSON.stringify({ kind: 'APIResourceList', groupVersion: 'apps/v1', resources: [
    { name: 'deployments', namespaced: true, kind: 'Deployment', verbs: ['get', 'list', 'watch'] },
    { name: 'statefulsets', namespaced: true, kind: 'StatefulSet', verbs: ['get', 'list', 'watch'] },
    { name: 'replicasets', namespaced: true, kind: 'ReplicaSet', verbs: ['get', 'list', 'watch'] },
  ]});
  if (pathname === '/apis/batch/v1') return JSON.stringify({ kind: 'APIResourceList', groupVersion: 'batch/v1', resources: [
    { name: 'jobs', namespaced: true, kind: 'Job', verbs: ['get', 'list', 'watch'] },
    { name: 'cronjobs', namespaced: true, kind: 'CronJob', verbs: ['get', 'list', 'watch'] },
  ]});
  if (pathname === '/apis/authorization.k8s.io/v1') return JSON.stringify({ kind: 'APIResourceList', groupVersion: 'authorization.k8s.io/v1', resources: [
    { name: 'selfsubjectaccessreviews', namespaced: false, kind: 'SelfSubjectAccessReview', verbs: ['create'] },
    { name: 'selfsubjectrulesreviews', namespaced: false, kind: 'SelfSubjectRulesReview', verbs: ['create'] },
  ]});
  if (pathname === '/apis/rbac.authorization.k8s.io/v1') return JSON.stringify({ kind: 'APIResourceList', groupVersion: 'rbac.authorization.k8s.io/v1', resources: [
    { name: 'clusterroles', namespaced: false, kind: 'ClusterRole', verbs: ['get', 'list'] },
    { name: 'clusterrolebindings', namespaced: false, kind: 'ClusterRoleBinding', verbs: ['get', 'list'] },
  ]});
  if (pathname === '/apis/apiextensions.k8s.io/v1') return JSON.stringify({ kind: 'APIResourceList', groupVersion: 'apiextensions.k8s.io/v1', resources: [
    { name: 'customresourcedefinitions', namespaced: false, kind: 'CustomResourceDefinition', verbs: ['get', 'list', 'watch'] },
  ]});
  if (pathname === `/apis/${GROUP}/${VERSION}`) return JSON.stringify({ kind: 'APIResourceList', groupVersion: `${GROUP}/${VERSION}`, resources: [
    { name: 'metrics', namespaced: true, kind: 'Metric', verbs: ['get', 'list', 'watch', 'create', 'update', 'delete'] },
    { name: 'managedmetrics', namespaced: true, kind: 'ManagedMetric', verbs: ['get', 'list', 'watch', 'create', 'update', 'delete'] },
    { name: 'federatedmetrics', namespaced: true, kind: 'FederatedMetric', verbs: ['get', 'list', 'watch', 'create', 'update', 'delete'] },
    { name: 'federatedmanagedmetrics', namespaced: true, kind: 'FederatedManagedMetric', verbs: ['get', 'list', 'watch', 'create', 'update', 'delete'] },
    { name: 'datasinks', namespaced: true, kind: 'DataSink', verbs: ['get', 'list', 'watch', 'create', 'update', 'delete'] },
    { name: 'remoteclusteraccesses', namespaced: true, kind: 'RemoteClusterAccess', verbs: ['get', 'list', 'watch'] },
    { name: 'federatedclusteraccesses', namespaced: true, kind: 'FederatedClusterAccess', verbs: ['get', 'list', 'watch'] },
  ]});

  // Namespaces
  if (pathname === '/api/v1/namespaces') return JSON.stringify({ kind: 'NamespaceList', items: NAMESPACES.map(n => ({ apiVersion: 'v1', kind: 'Namespace', metadata: { name: n, uid: `uid-ns-${n}` }, status: { phase: 'Active' } })) });

  // RBAC — allow everything
  if (pathname === '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews') return JSON.stringify({ apiVersion: 'authorization.k8s.io/v1', kind: 'SelfSubjectAccessReview', status: { allowed: true } });
  if (pathname === '/apis/authorization.k8s.io/v1/selfsubjectrulesreviews') return JSON.stringify({ apiVersion: 'authorization.k8s.io/v1', kind: 'SelfSubjectRulesReview', status: { resourceRules: [{ verbs: ['*'], apiGroups: ['*'], resources: ['*'] }], nonResourceRules: [], incomplete: false } });
  if (pathname.startsWith('/apis/rbac.authorization.k8s.io/')) return JSON.stringify({ kind: 'ClusterRoleList', items: [] });

  const G = GROUP, V = VERSION;

  // Metrics
  if (pathname.endsWith('/metrics') || pathname === `/apis/${G}/${V}/metrics`) return list(filterNs(data.metrics), `${G}/${V}`, 'Metric');
  if (/\/metrics\/[^/]+$/.test(pathname)) { const name = pathname.split('/').pop(); const item = data.metrics.find(i => i.metadata.name === name); return item ? JSON.stringify(item) : notFound(); }

  // ManagedMetrics
  if (pathname.endsWith('/managedmetrics') || pathname === `/apis/${G}/${V}/managedmetrics`) return list(filterNs(data.managedMetrics), `${G}/${V}`, 'ManagedMetric');
  if (/\/managedmetrics\/[^/]+$/.test(pathname)) { const name = pathname.split('/').pop(); const item = data.managedMetrics.find(i => i.metadata.name === name); return item ? JSON.stringify(item) : notFound(); }

  // FederatedMetrics
  if (pathname.endsWith('/federatedmetrics') || pathname === `/apis/${G}/${V}/federatedmetrics`) return list(filterNs(data.federatedMetrics), `${G}/${V}`, 'FederatedMetric');

  // FederatedManagedMetrics
  if (pathname.endsWith('/federatedmanagedmetrics') || pathname === `/apis/${G}/${V}/federatedmanagedmetrics`) return list(filterNs(data.federatedManagedMetrics), `${G}/${V}`, 'FederatedManagedMetric');

  // DataSinks
  if (pathname.endsWith('/datasinks') || pathname === `/apis/${G}/${V}/datasinks`) return list(filterNs(DATASINKS.map(d => ({ apiVersion: `${G}/${V}`, kind: 'DataSink', ...d }))), `${G}/${V}`, 'DataSink');
  if (/\/datasinks\/[^/]+$/.test(pathname)) { const name = pathname.split('/').pop(); const item = DATASINKS.find(d => d.metadata.name === name); return item ? JSON.stringify({ apiVersion: `${G}/${V}`, kind: 'DataSink', ...item }) : notFound(); }

  // ClusterAccess
  if (pathname.endsWith('/remoteclusteraccesses')) return list([], `${G}/${V}`, 'RemoteClusterAccess');
  if (pathname.endsWith('/federatedclusteraccesses')) return list([], `${G}/${V}`, 'FederatedClusterAccess');

  // CRDs — return operator CRDs
  if (pathname === '/apis/apiextensions.k8s.io/v1/customresourcedefinitions') return JSON.stringify({ kind: 'CustomResourceDefinitionList', apiVersion: 'apiextensions.k8s.io/v1', metadata: {}, items: CRDS });
  if (/\/apis\/apiextensions\.k8s\.io\/v1\/customresourcedefinitions\/[^/]+$/.test(pathname)) {
    const name = pathname.split('/').pop();
    const crd = CRDS.find(c => c.metadata.name === name);
    return crd ? JSON.stringify(crd) : notFound();
  }

  // Catch-all: return empty list for any unrecognised list endpoint
  if (req.method === 'GET') return JSON.stringify({ kind: 'List', apiVersion: 'v1', metadata: {}, items: [] });

  return notFound();
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const result = routeRequest(req, pathname, url.searchParams);
    const [status, responseBody] = Array.isArray(result) ? result : [200, result];
    res.writeHead(status);
    res.end(responseBody);
  });
});

server.listen(PORT, () => {
  console.log(`\n  metrics-operator mock cluster running on http://localhost:${PORT}`);
  console.log(`  Scenario: ${SCENARIO} (${data.metrics.length} metrics, ${data.managedMetrics.length} managed metrics)\n`);
  console.log(`  Add to kubeconfig: node mock-cluster/server.mjs --print-kubeconfig >> ~/.kube/config`);
  console.log(`  Then switch to context "metrics-mock" in Headlamp.\n`);
});
