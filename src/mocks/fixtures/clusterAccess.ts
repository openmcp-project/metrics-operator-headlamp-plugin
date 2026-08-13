// Hand-crafted RemoteClusterAccess and FederatedClusterAccess fixture instances

export const clusterAccessFixtures = {
  remoteClusterAccesses: {
    kind: 'RemoteClusterAccessList',
    apiVersion: 'metrics.openmcp.cloud/v1alpha1',
    metadata: {},
    items: [
      {
        apiVersion: 'metrics.openmcp.cloud/v1alpha1',
        kind: 'RemoteClusterAccess',
        metadata: {
          name: 'production-cluster',
          namespace: 'default',
          uid: 'uid-rca-prod',
          creationTimestamp: '2024-01-10T10:00:00Z',
        },
        spec: {
          remoteClusterConfig: {
            clusterSecretRef: { name: 'prod-cluster-secret', namespace: 'default' },
            serviceAccountName: 'metrics-operator-reader',
            serviceAccountNamespace: 'metrics-operator-system',
          },
        },
        status: {},
      },
      {
        apiVersion: 'metrics.openmcp.cloud/v1alpha1',
        kind: 'RemoteClusterAccess',
        metadata: {
          name: 'staging-cluster',
          namespace: 'default',
          uid: 'uid-rca-staging',
          creationTimestamp: '2024-02-01T10:00:00Z',
        },
        spec: {
          kubeConfigSecretRef: {
            name: 'staging-kubeconfig',
            namespace: 'default',
            key: 'kubeconfig',
          },
        },
        status: {},
      },
    ],
  },
  federatedClusterAccesses: {
    kind: 'FederatedClusterAccessList',
    apiVersion: 'metrics.openmcp.cloud/v1alpha1',
    metadata: {},
    items: [
      {
        apiVersion: 'metrics.openmcp.cloud/v1alpha1',
        kind: 'FederatedClusterAccess',
        metadata: {
          name: 'federated-access',
          namespace: 'default',
          uid: 'uid-fca-main',
          creationTimestamp: '2024-01-15T10:00:00Z',
        },
        spec: {
          target: { group: 'openmcp.cloud', version: 'v1alpha1', kind: 'ControlPlane' },
          kubeConfigPath: '$.spec.kubeConfigRef.name',
          namespace: 'openmcp-system',
          labelSelector: { matchLabels: { 'openmcp.cloud/managed': 'true' } },
        },
        status: {},
      },
    ],
  },
};
