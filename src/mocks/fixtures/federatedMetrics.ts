// Hand-crafted FederatedMetric and FederatedManagedMetric fixture instances

import { METRICS_API_VERSION } from '../../common/apiGroup';

export const federatedMetricsFixtures = {
  kind: 'FederatedMetricList',
  apiVersion: METRICS_API_VERSION,
  metadata: {},
  items: [
    {
      apiVersion: METRICS_API_VERSION,
      kind: 'FederatedMetric',
      metadata: {
        name: 'xplane-providers',
        namespace: 'default',
        uid: 'uid-xplane-providers',
        creationTimestamp: '2024-03-01T10:00:00Z',
      },
      spec: {
        target: { group: 'pkg.crossplane.io', version: 'v1', kind: 'Provider' },
        interval: '1m',
        federateClusterAccessRef: { name: 'federated-access', namespace: 'default' },
        dataSinkRef: { name: 'default' },
        projections: [{ name: 'package', fieldPath: 'spec.package', type: 'primitive' }],
      },
      status: {
        ready: 'True',
        observation: { activeCount: 14, failedCount: 2, pendingCount: 0 },
        lastReconcileTime: '2024-03-10T12:00:00Z',
        conditions: [
          { type: 'Available', status: 'True', reason: 'MonitoringActive', lastTransitionTime: '2024-03-01T10:00:00Z' },
        ],
      },
    },
  ],
};

export const federatedManagedMetricsFixtures = {
  kind: 'FederatedManagedMetricList',
  apiVersion: METRICS_API_VERSION,
  metadata: {},
  items: [
    {
      apiVersion: METRICS_API_VERSION,
      kind: 'FederatedManagedMetric',
      metadata: {
        name: 'all-managed-resources',
        namespace: 'default',
        uid: 'uid-all-managed',
        creationTimestamp: '2024-02-01T10:00:00Z',
      },
      spec: {
        interval: '5m',
        federatedClusterAccessRef: { name: 'federated-access', namespace: 'default' },
        dataSinkRef: { name: 'default' },
      },
      status: {
        ready: 'True',
        observation: { activeCount: 87, failedCount: 5, pendingCount: 3 },
        lastReconcileTime: '2024-03-10T11:55:00Z',
        conditions: [
          { type: 'Available', status: 'True', reason: 'MonitoringActive', lastTransitionTime: '2024-02-01T10:00:00Z' },
        ],
      },
    },
  ],
};
