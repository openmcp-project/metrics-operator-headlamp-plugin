import {
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import HealthView from './health/HealthView';
import MetricsTabs from './metrics/MetricsTabs';
import DataSinkList from './datasinks/DataSinkList';
import CRDView from './crds/CRDView';
import ClusterAccessTabs from './access/ClusterAccessTabs';

// Gauge / speedometer icon representing metrics
const metricsIcon = {
  body: `<path fill="#fff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
<path fill="#fff" d="M6.5 17.5l1.4-1.4C8.84 17.27 10.34 18 12 18c1.66 0 3.16-.73 4.1-1.9l1.4 1.4C16.16 18.98 14.18 20 12 20s-4.16-1.02-5.5-2.5z"/>
<path fill="#fff" opacity=".6" d="M12 6c-3.31 0-6 2.69-6 6 0 1.12.31 2.16.85 3.05l1.44-1.44A4.02 4.02 0 0 1 8 12c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .57-.12 1.11-.33 1.61l1.44 1.44A5.96 5.96 0 0 0 18 12c0-3.31-2.69-6-6-6z"/>
<circle fill="#fff" cx="12" cy="12" r="1.5"/>
<path fill="#fff" d="M12 10.5V7" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>`,
  width: 24,
  height: 24,
};

// ── Sidebar entries ──────────────────────────────────────────────────────────

registerSidebarEntry({
  parent: null,
  name: 'metrics-operator',
  label: 'Metrics Operator',
  url: '/metrics-operator/health',
  icon: metricsIcon,
});

registerSidebarEntry({
  parent: 'metrics-operator',
  name: 'metrics-operator-health',
  label: 'Health',
  url: '/metrics-operator/health',
});

registerSidebarEntry({
  parent: 'metrics-operator',
  name: 'metrics-operator-metrics',
  label: 'Metrics',
  url: '/metrics-operator/metrics',
});

registerSidebarEntry({
  parent: 'metrics-operator',
  name: 'metrics-operator-datasinks',
  label: 'Data Sinks',
  url: '/metrics-operator/datasinks',
});

registerSidebarEntry({
  parent: 'metrics-operator',
  name: 'metrics-operator-crds',
  label: 'CRDs',
  url: '/metrics-operator/crds',
});

registerSidebarEntry({
  parent: 'metrics-operator',
  name: 'metrics-operator-access',
  label: 'Cluster Access',
  url: '/metrics-operator/access',
});

// ── Routes ───────────────────────────────────────────────────────────────────

registerRoute({
  path: '/metrics-operator/health',
  sidebar: 'metrics-operator-health',
  name: 'metricsOperatorHealth',
  exact: true,
  component: () => React.createElement(HealthView),
});

registerRoute({
  path: '/metrics-operator/metrics',
  sidebar: 'metrics-operator-metrics',
  name: 'metricsOperatorMetrics',
  exact: true,
  component: () => React.createElement(MetricsTabs),
});

registerRoute({
  path: '/metrics-operator/datasinks',
  sidebar: 'metrics-operator-datasinks',
  name: 'metricsOperatorDataSinks',
  exact: true,
  component: () => React.createElement(DataSinkList),
});

registerRoute({
  path: '/metrics-operator/crds',
  sidebar: 'metrics-operator-crds',
  name: 'metricsOperatorCRDs',
  exact: true,
  component: () => React.createElement(CRDView),
});

registerRoute({
  path: '/metrics-operator/access',
  sidebar: 'metrics-operator-access',
  name: 'metricsOperatorAccess',
  exact: true,
  component: () => React.createElement(ClusterAccessTabs),
});
