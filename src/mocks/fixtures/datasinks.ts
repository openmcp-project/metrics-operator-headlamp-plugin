// Hand-crafted DataSink fixture instances

export const dataSinksFixtures = {
  kind: 'DataSinkList',
  apiVersion: 'metrics.openmcp.cloud/v1alpha1',
  metadata: {},
  items: [
    {
      apiVersion: 'metrics.openmcp.cloud/v1alpha1',
      kind: 'DataSink',
      metadata: {
        name: 'default',
        namespace: 'default',
        uid: 'uid-datasink-default',
        creationTimestamp: '2024-01-15T10:00:00Z',
      },
      spec: {
        connection: { endpoint: 'https://abc12345.live.dynatrace.com/api/v2/otlp/v1/metrics' },
        authentication: {
          apiKey: { secretKeyRef: { name: 'dynatrace-credentials', key: 'api-token' } },
        },
      },
      status: {
        conditions: [
          { type: 'Available', status: 'True', reason: 'ConnectionEstablished', lastTransitionTime: '2024-01-15T10:05:00Z' },
        ],
      },
    },
    {
      apiVersion: 'metrics.openmcp.cloud/v1alpha1',
      kind: 'DataSink',
      metadata: {
        name: 'dynatrace',
        namespace: 'production',
        uid: 'uid-datasink-dynatrace',
        creationTimestamp: '2024-02-01T10:00:00Z',
      },
      spec: {
        connection: { endpoint: 'https://prod-tenant.live.dynatrace.com/api/v2/otlp/v1/metrics' },
        authentication: {
          apiKey: { secretKeyRef: { name: 'dt-prod-token', key: 'token' } },
        },
      },
      status: {
        conditions: [
          { type: 'Available', status: 'True', reason: 'ConnectionEstablished', lastTransitionTime: '2024-02-01T10:05:00Z' },
        ],
      },
    },
    {
      apiVersion: 'metrics.openmcp.cloud/v1alpha1',
      kind: 'DataSink',
      metadata: {
        name: 'grpc-sink',
        namespace: 'monitoring',
        uid: 'uid-datasink-grpc',
        creationTimestamp: '2024-03-01T10:00:00Z',
      },
      spec: {
        connection: { endpoint: 'grpcs://otel-collector.monitoring.svc.cluster.local:4317' },
        authentication: {
          certificate: {
            clientCertSecretKeyRef: { name: 'otel-mtls-certs', key: 'tls.crt' },
            clientKeySecretKeyRef: { name: 'otel-mtls-certs', key: 'tls.key' },
            caCertSecretKeyRef: { name: 'otel-mtls-certs', key: 'ca.crt' },
          },
        },
      },
      status: {
        conditions: [
          { type: 'Available', status: 'False', reason: 'ConnectionFailed', message: 'x509: certificate signed by unknown authority', lastTransitionTime: '2024-03-05T08:00:00Z' },
        ],
      },
    },
  ],
};
