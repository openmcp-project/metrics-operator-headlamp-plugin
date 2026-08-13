import { http, HttpResponse } from 'msw';
import { metricsFixtures, managedMetricsFixtures } from './fixtures/metrics';
import { federatedMetricsFixtures, federatedManagedMetricsFixtures } from './fixtures/federatedMetrics';
import { dataSinksFixtures } from './fixtures/datasinks';
import { clusterAccessFixtures } from './fixtures/clusterAccess';

const BASE = 'http://localhost:4466';
const json = (data: any) => HttpResponse.json(data);

const GROUP = 'metrics.openmcp.cloud';
const VERSION = 'v1alpha1';

export const handlers = [
  // ── Metrics ─────────────────────────────────────────────────────────────────
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/metrics`, () => json(metricsFixtures)),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/metrics`, ({ params }) =>
    json({ ...metricsFixtures, items: metricsFixtures.items.filter(i => i.metadata.namespace === params.ns) })
  ),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/metrics/:name`, ({ params }) => {
    const item = metricsFixtures.items.find(i => i.metadata.name === params.name);
    return item ? json(item) : HttpResponse.json({ code: 404 }, { status: 404 });
  }),

  // ── ManagedMetrics ───────────────────────────────────────────────────────────
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/managedmetrics`, () => json(managedMetricsFixtures)),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/managedmetrics`, ({ params }) =>
    json({ ...managedMetricsFixtures, items: managedMetricsFixtures.items.filter(i => i.metadata.namespace === params.ns) })
  ),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/managedmetrics/:name`, ({ params }) => {
    const item = managedMetricsFixtures.items.find(i => i.metadata.name === params.name);
    return item ? json(item) : HttpResponse.json({ code: 404 }, { status: 404 });
  }),

  // ── FederatedMetrics ─────────────────────────────────────────────────────────
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/federatedmetrics`, () => json(federatedMetricsFixtures)),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/federatedmetrics`, () => json(federatedMetricsFixtures)),

  // ── FederatedManagedMetrics ──────────────────────────────────────────────────
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/federatedmanagedmetrics`, () => json(federatedManagedMetricsFixtures)),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/federatedmanagedmetrics`, () => json(federatedManagedMetricsFixtures)),

  // ── DataSinks ─────────────────────────────────────────────────────────────────
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/datasinks`, () => json(dataSinksFixtures)),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/datasinks`, ({ params }) =>
    json({ ...dataSinksFixtures, items: dataSinksFixtures.items.filter(i => i.metadata.namespace === params.ns) })
  ),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/datasinks/:name`, ({ params }) => {
    const item = dataSinksFixtures.items.find(i => i.metadata.name === params.name);
    return item ? json(item) : HttpResponse.json({ code: 404 }, { status: 404 });
  }),
  http.post(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/datasinks`, async ({ request }) => {
    const body = await request.json() as any;
    return json({ ...body, metadata: { ...body.metadata, uid: 'uid-new', creationTimestamp: new Date().toISOString() } });
  }),

  // ── ClusterAccess ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/remoteclusteraccesses`, () => json(clusterAccessFixtures.remoteClusterAccesses)),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/remoteclusteraccesses`, () => json(clusterAccessFixtures.remoteClusterAccesses)),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/federatedclusteraccesses`, () => json(clusterAccessFixtures.federatedClusterAccesses)),
  http.get(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/federatedclusteraccesses`, () => json(clusterAccessFixtures.federatedClusterAccesses)),

  // ── Metric create/update ─────────────────────────────────────────────────────
  http.post(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/metrics`, async ({ request }) => {
    const body = await request.json() as any;
    return json({ ...body, metadata: { ...body.metadata, uid: 'uid-new', creationTimestamp: new Date().toISOString() } });
  }),
  http.post(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/managedmetrics`, async ({ request }) => {
    const body = await request.json() as any;
    return json({ ...body, metadata: { ...body.metadata, uid: 'uid-new', creationTimestamp: new Date().toISOString() } });
  }),
  http.post(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/federatedmetrics`, async ({ request }) => {
    const body = await request.json() as any;
    return json({ ...body, metadata: { ...body.metadata, uid: 'uid-new', creationTimestamp: new Date().toISOString() } });
  }),
  http.post(`${BASE}/apis/${GROUP}/${VERSION}/namespaces/:ns/federatedmanagedmetrics`, async ({ request }) => {
    const body = await request.json() as any;
    return json({ ...body, metadata: { ...body.metadata, uid: 'uid-new', creationTimestamp: new Date().toISOString() } });
  }),

  // ── CRDs ──────────────────────────────────────────────────────────────────────
  http.get(`${BASE}/apis/apiextensions.k8s.io/v1/customresourcedefinitions`, () =>
    json({
      kind: 'CustomResourceDefinitionList',
      items: [
        { metadata: { name: `metrics.${GROUP}` }, jsonData: { spec: { group: GROUP, names: { kind: 'Metric', plural: 'metrics' }, scope: 'Namespaced', versions: [{ name: VERSION }] } } },
        { metadata: { name: `managedmetrics.${GROUP}` }, jsonData: { spec: { group: GROUP, names: { kind: 'ManagedMetric', plural: 'managedmetrics' }, scope: 'Namespaced', versions: [{ name: VERSION }] } } },
        { metadata: { name: `federatedmetrics.${GROUP}` }, jsonData: { spec: { group: GROUP, names: { kind: 'FederatedMetric', plural: 'federatedmetrics' }, scope: 'Namespaced', versions: [{ name: VERSION }] } } },
        { metadata: { name: `federatedmanagedmetrics.${GROUP}` }, jsonData: { spec: { group: GROUP, names: { kind: 'FederatedManagedMetric', plural: 'federatedmanagedmetrics' }, scope: 'Namespaced', versions: [{ name: VERSION }] } } },
        { metadata: { name: `datasinks.${GROUP}` }, jsonData: { spec: { group: GROUP, names: { kind: 'DataSink', plural: 'datasinks' }, scope: 'Namespaced', versions: [{ name: VERSION }] } } },
        { metadata: { name: `remoteclusteraccesses.${GROUP}` }, jsonData: { spec: { group: GROUP, names: { kind: 'RemoteClusterAccess', plural: 'remoteclusteraccesses' }, scope: 'Namespaced', versions: [{ name: VERSION }] } } },
        { metadata: { name: `federatedclusteraccesses.${GROUP}` }, jsonData: { spec: { group: GROUP, names: { kind: 'FederatedClusterAccess', plural: 'federatedclusteraccesses' }, scope: 'Namespaced', versions: [{ name: VERSION }] } } },
      ],
    })
  ),

  // ── Cluster discovery ─────────────────────────────────────────────────────────
  http.get(`${BASE}/api/v1`, () => json({
    kind: 'APIResourceList',
    groupVersion: 'v1',
    resources: [
      { name: 'pods', kind: 'Pod', namespaced: true, verbs: ['get', 'list', 'watch'] },
      { name: 'persistentvolumeclaims', kind: 'PersistentVolumeClaim', namespaced: true, verbs: ['get', 'list', 'watch'] },
      { name: 'services', kind: 'Service', namespaced: true, verbs: ['get', 'list', 'watch'] },
      { name: 'configmaps', kind: 'ConfigMap', namespaced: true, verbs: ['get', 'list', 'watch'] },
      { name: 'namespaces', kind: 'Namespace', namespaced: false, verbs: ['get', 'list', 'watch'] },
    ],
  })),
  http.get(`${BASE}/apis`, () => json({
    kind: 'APIGroupList',
    groups: [
      { name: 'apps', versions: [{ groupVersion: 'apps/v1', version: 'v1' }] },
      { name: 'batch', versions: [{ groupVersion: 'batch/v1', version: 'v1' }] },
      { name: GROUP, versions: [{ groupVersion: `${GROUP}/${VERSION}`, version: VERSION }] },
    ],
  })),
  http.get(`${BASE}/apis/apps/v1`, () => json({
    kind: 'APIResourceList',
    groupVersion: 'apps/v1',
    resources: [
      { name: 'deployments', kind: 'Deployment', namespaced: true, verbs: ['get', 'list', 'watch'] },
      { name: 'statefulsets', kind: 'StatefulSet', namespaced: true, verbs: ['get', 'list', 'watch'] },
      { name: 'daemonsets', kind: 'DaemonSet', namespaced: true, verbs: ['get', 'list', 'watch'] },
    ],
  })),
  http.get(`${BASE}/apis/batch/v1`, () => json({
    kind: 'APIResourceList',
    groupVersion: 'batch/v1',
    resources: [
      { name: 'jobs', kind: 'Job', namespaced: true, verbs: ['get', 'list', 'watch'] },
      { name: 'cronjobs', kind: 'CronJob', namespaced: true, verbs: ['get', 'list', 'watch'] },
    ],
  })),

  // ── Namespaces ────────────────────────────────────────────────────────────────
  http.get(`${BASE}/api/v1/namespaces`, () => json({
    kind: 'NamespaceList',
    items: ['default', 'production', 'staging', 'platform', 'monitoring']
      .map(name => ({ metadata: { name, uid: `uid-ns-${name}` } })),
  })),

  // ── RBAC ─────────────────────────────────────────────────────────────────────
  http.post(`${BASE}/apis/authorization.k8s.io/v1/selfsubjectaccessreviews`, () =>
    json({ status: { allowed: true } })
  ),
  http.get(`${BASE}/version`, () => json({ gitVersion: 'v1.29.0' })),
  http.get(`${BASE}/api`, () => json({ versions: ['v1'] })),
];
