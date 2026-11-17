// Single source of truth for the metrics-operator API groups.
//
// Change the group/version here and it propagates to resource classes, forms,
// the creation wizard, and the MSW mocks/fixtures. Kept dependency-free (no
// import of @kinvolk/headlamp-plugin/lib) so the mock layer can consume it too.
//
// Two distinct groups are in play:
//   - METRICS_GROUP           workload CRDs (Metric, DataSink, ManagedMetric, ...)
//   - METRICS_SERVICES_GROUP  service-provider CRs (MetricsOperator, ProviderConfig)
// Both are served by the managed control plane under *.open-control-plane.io.

export const METRICS_GROUP = 'metrics.open-control-plane.io';
export const METRICS_VERSION = 'v1alpha1';
export const METRICS_API_VERSION = `${METRICS_GROUP}/${METRICS_VERSION}`;

export const METRICS_SERVICES_GROUP = 'metrics.services.open-control-plane.io';
export const METRICS_SERVICES_API_VERSION = `${METRICS_SERVICES_GROUP}/${METRICS_VERSION}`;
