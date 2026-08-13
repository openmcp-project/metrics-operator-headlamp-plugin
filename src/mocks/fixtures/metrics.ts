// Hand-crafted Metric and ManagedMetric fixture instances

export const metricsFixtures = {
  kind: 'MetricList',
  apiVersion: 'metrics.openmcp.cloud/v1alpha1',
  metadata: {},
  items: [
    {
      apiVersion: 'metrics.openmcp.cloud/v1alpha1',
      kind: 'Metric',
      metadata: {
        name: 'pod-count',
        namespace: 'default',
        uid: 'uid-pod-count',
        creationTimestamp: '2024-03-01T10:00:00Z',
      },
      spec: {
        target: { group: '', version: 'v1', kind: 'Pod' },
        interval: '1m',
        dataSinkRef: { name: 'default' },
        projections: [{ name: 'pod-namespace', fieldPath: 'metadata.namespace', type: 'primitive' }],
      },
      status: {
        ready: 'True',
        observation: { latestValue: '42', timestamp: '2024-03-10T12:00:00Z' },
        conditions: [
          { type: 'Available', status: 'True', reason: 'MonitoringActive', lastTransitionTime: '2024-03-01T10:00:00Z' },
        ],
      },
    },
    {
      apiVersion: 'metrics.openmcp.cloud/v1alpha1',
      kind: 'Metric',
      metadata: {
        name: 'pvc-bound-count',
        namespace: 'default',
        uid: 'uid-pvc-bound',
        creationTimestamp: '2024-03-02T10:00:00Z',
      },
      spec: {
        target: { group: '', version: 'v1', kind: 'PersistentVolumeClaim' },
        interval: '5m',
        dataSinkRef: { name: 'default' },
        labelSelector: { matchLabels: { 'app': 'myapp' } },
      },
      status: {
        ready: 'False',
        observation: { latestValue: null, timestamp: null },
        conditions: [
          { type: 'Available', status: 'False', reason: 'SendMetricFailed', message: 'connection refused: datasink endpoint unreachable', lastTransitionTime: '2024-03-05T08:00:00Z' },
        ],
      },
    },
    {
      apiVersion: 'metrics.openmcp.cloud/v1alpha1',
      kind: 'Metric',
      metadata: {
        name: 'deployment-available',
        namespace: 'production',
        uid: 'uid-deploy-avail',
        creationTimestamp: '2024-02-20T10:00:00Z',
      },
      spec: {
        target: { group: 'apps', version: 'v1', kind: 'Deployment' },
        interval: '2m',
        dataSinkRef: { name: 'dynatrace' },
        projections: [
          { name: 'condition-available', fieldPath: "status.conditions[?(@.type=='Available')].status", type: 'slice' },
          { name: 'team', fieldPath: 'metadata.labels.team', type: 'primitive', default: 'unknown' },
        ],
      },
      status: {
        ready: 'True',
        observation: { latestValue: '7', timestamp: '2024-03-10T12:05:00Z' },
        conditions: [
          { type: 'Available', status: 'True', reason: 'MonitoringActive', lastTransitionTime: '2024-02-20T10:00:00Z' },
        ],
      },
    },
  ],
};

export const managedMetricsFixtures = {
  kind: 'ManagedMetricList',
  apiVersion: 'metrics.openmcp.cloud/v1alpha1',
  metadata: {},
  items: [
    {
      apiVersion: 'metrics.openmcp.cloud/v1alpha1',
      kind: 'ManagedMetric',
      metadata: {
        name: 'helm-releases',
        namespace: 'default',
        uid: 'uid-helm-releases',
        creationTimestamp: '2024-03-01T10:00:00Z',
      },
      spec: {
        target: { group: 'helm.crossplane.io', version: 'v1beta1', kind: 'Release' },
        interval: '1m',
        dataSinkRef: { name: 'default' },
      },
      status: {
        ready: 'True',
        observation: { resources: 12, timestamp: '2024-03-10T12:00:00Z' },
        conditions: [
          { type: 'Available', status: 'True', reason: 'MonitoringActive', lastTransitionTime: '2024-03-01T10:00:00Z' },
        ],
      },
    },
    {
      apiVersion: 'metrics.openmcp.cloud/v1alpha1',
      kind: 'ManagedMetric',
      metadata: {
        name: 's3-buckets',
        namespace: 'production',
        uid: 'uid-s3-buckets',
        creationTimestamp: '2024-02-15T10:00:00Z',
      },
      spec: {
        target: { group: 's3.aws.upbound.io', version: 'v1beta1', kind: 'Bucket' },
        interval: '5m',
        dataSinkRef: { name: 'dynatrace' },
        dimensions: [
          { name: 'ready', fieldPath: "status.conditions[?(@.type=='Ready')].status", type: 'slice' },
        ],
      },
      status: {
        ready: 'Unknown',
        observation: { resources: null, timestamp: null },
        conditions: [],
      },
    },
  ],
};
