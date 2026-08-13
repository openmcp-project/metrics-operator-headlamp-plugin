export interface DimensionConfig {
  name: string;
  fieldPath: string;
  type: 'primitive' | 'map' | 'slice' | 'timestamp';
  default?: any;
  highCardinality?: boolean;
}

export interface ValueFromConfig {
  fieldPath: string;
  type: 'integer' | 'timestamp';
  aggregation: 'sum' | 'max' | 'min' | 'mean';
  default?: any;
}

export interface ProposalConfig {
  id: string;
  title: string;
  description: string;
  interval?: string;
  labelSelector?: Record<string, string>;
  fieldSelector?: Record<string, string>;
  projections?: DimensionConfig[];
  valueFrom?: ValueFromConfig;
  cardinalityWarning?: string;
  suggestKindSwitch?: 'ManagedMetric';
}

export interface GVKProposals {
  gvkKey: string; // "group/version/Kind"
  proposals: ProposalConfig[];
}

function gvk(group: string, version: string, kind: string): string {
  return `${group}/${version}/${kind}`;
}

const PROPOSALS: Record<string, ProposalConfig[]> = {
  [gvk('', 'v1', 'Pod')]: [
    {
      id: 'pod-count-all',
      title: 'Count all pods',
      description: 'Total number of pods in the cluster.',
      interval: '5m',
    },
    {
      id: 'pod-count-running',
      title: 'Count running pods',
      description: 'Pods currently in Running phase.',
      interval: '5m',
      fieldSelector: { 'status.phase': 'Running' },
    },
    {
      id: 'pod-count-failed',
      title: 'Count failed pods',
      description: 'Pods in Failed phase — useful for alerting on workload failures.',
      interval: '5m',
      fieldSelector: { 'status.phase': 'Failed' },
    },
    {
      id: 'pod-by-namespace',
      title: 'Count pods by namespace (dimension)',
      description: 'Total pods with namespace exported as a dimension — creates one time series per namespace.',
      interval: '5m',
      projections: [
        { name: 'namespace', fieldPath: 'metadata.namespace', type: 'primitive' },
      ],
      cardinalityWarning: 'Creates one OTLP time series per unique namespace.',
    },
  ],

  [gvk('', 'v1', 'PersistentVolumeClaim')]: [
    {
      id: 'pvc-count-bound',
      title: 'Count bound PVCs',
      description: 'PersistentVolumeClaims in Bound phase.',
      interval: '5m',
      fieldSelector: { 'status.phase': 'Bound' },
    },
    {
      id: 'pvc-count-pending',
      title: 'Count pending PVCs',
      description: 'PVCs waiting to be bound — may indicate storage pressure.',
      interval: '5m',
      fieldSelector: { 'status.phase': 'Pending' },
    },
    {
      id: 'pvc-count-all',
      title: 'Count all PVCs',
      description: 'Total PVC count across all namespaces.',
      interval: '10m',
    },
  ],

  [gvk('apps', 'v1', 'Deployment')]: [
    {
      id: 'deployment-available',
      title: 'Count available deployments',
      description: 'Deployments with Available condition = True.',
      interval: '5m',
      projections: [
        {
          name: 'available',
          fieldPath: "status.conditions[?(@.type=='Available')].status",
          type: 'primitive',
          default: 'Unknown',
        },
      ],
    },
    {
      id: 'deployment-unavailable',
      title: 'Count unavailable deployments',
      description: 'Deployments with Available condition = False — critical for SLO monitoring.',
      interval: '2m',
      projections: [
        {
          name: 'available',
          fieldPath: "status.conditions[?(@.type=='Available')].status",
          type: 'primitive',
          default: 'Unknown',
        },
      ],
    },
    {
      id: 'deployment-by-label',
      title: 'Count deployments with custom label',
      description: 'Track deployment counts grouped by a custom label (e.g. "operations=true" for critical services).',
      interval: '5m',
      projections: [
        {
          name: 'app',
          fieldPath: 'metadata.labels.app',
          type: 'primitive',
          default: 'unknown',
          highCardinality: true,
        },
      ],
      cardinalityWarning: 'Using a label as a dimension creates one time series per unique label value. Ensure the cardinality is bounded.',
    },
    {
      id: 'deployment-replicas',
      title: 'Track available replica count',
      description: 'Export the number of available replicas as the metric value using valueFrom.',
      interval: '5m',
      valueFrom: {
        fieldPath: 'status.availableReplicas',
        type: 'integer',
        aggregation: 'sum',
        default: 0,
      },
    },
  ],

  [gvk('batch', 'v1', 'Job')]: [
    {
      id: 'job-active',
      title: 'Count active jobs',
      description: 'Jobs currently running at least one pod.',
      interval: '5m',
    },
    {
      id: 'job-failed',
      title: 'Count failed jobs',
      description: 'Jobs that have failed — important for batch pipeline health.',
      interval: '5m',
      fieldSelector: { 'status.failed': '1' },
    },
    {
      id: 'job-complete',
      title: 'Count completed jobs',
      description: 'Jobs that completed successfully.',
      interval: '10m',
    },
  ],

  [gvk('batch', 'v1', 'CronJob')]: [
    {
      id: 'cronjob-active',
      title: 'Count active cron jobs',
      description: 'CronJobs that currently have active runs.',
      interval: '5m',
    },
  ],
};

export function getProposals(group: string, version: string, kind: string): ProposalConfig[] {
  const key = gvk(group, version, kind);
  return PROPOSALS[key] ?? [];
}

export const GENERIC_PROPOSALS: ProposalConfig[] = [
  {
    id: 'generic-count-all',
    title: 'Count all resources',
    description: 'Total number of resources of this type across all namespaces.',
    interval: '10m',
  },
  {
    id: 'generic-count-ready',
    title: 'Count resources with Ready = True',
    description: 'Resources where status.conditions contains a Ready condition with status True.',
    interval: '10m',
    projections: [
      {
        name: 'ready',
        fieldPath: "status.conditions[?(@.type=='Ready')].status",
        type: 'primitive',
        default: 'Unknown',
      },
    ],
  },
  {
    id: 'generic-by-namespace',
    title: 'Count with namespace dimension',
    description: 'Count resources with the namespace exported as an OTLP dimension.',
    interval: '10m',
    projections: [
      { name: 'namespace', fieldPath: 'metadata.namespace', type: 'primitive' },
    ],
  },
];
