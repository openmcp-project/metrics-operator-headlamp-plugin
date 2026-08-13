# metrics-operator-headlamp-plugin

A [Headlamp](https://headlamp.dev) plugin for the [service-provider-metrics-operator](https://github.com/openmcp-project/metrics-operator). Provides a UI for managing and monitoring metrics, data sinks, and cluster access resources across single and federated Kubernetes clusters.

## Features

- **Health dashboard** — cross-kind overview of all metrics with status, values, conditions, and grouping/filtering
- **Metrics** — list, inspect, and create all four metric kinds (Metric, ManagedMetric, FederatedMetric, FederatedManagedMetric) via a guided wizard
- **Data Sinks** — view and create DataSink resources (HTTPS/gRPC, API key/mTLS auth)
- **CRDs** — browse all `*.openmcp.cloud` CRDs with schema viewer and inline resource creation
- **Cluster Access** — read-only view of RemoteClusterAccess and FederatedClusterAccess resources

## Prerequisites

- [Headlamp desktop app](https://github.com/headlamp-k8s/headlamp/releases) (recommended for local dev)
- Node.js 18+
- A Kubernetes cluster with the metrics-operator installed **or** the included mock server (see below)

## Running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start the mock cluster (no real cluster needed)

The mock server simulates the full metrics-operator Kubernetes API on port `9648`.

```bash
# Small dataset (default)
npm run mock

# Medium dataset (~30 metrics)
npm run mock:medium

# Large dataset (~100 metrics)
npm run mock:large
```

To connect Headlamp desktop to the mock server, import the pre-built kubeconfig:

```
mock-cluster/kubeconfig.yaml
```

In Headlamp desktop: **Settings → Clusters → Add cluster** → select that file. Choose the `metrics-mock` context.

### 3. Build and load the plugin

```bash
# Build once
npm run build

# Or watch mode (rebuilds on file changes)
npm start
```

In Headlamp desktop, go to **Settings → Plugins** and add the path to this directory. The plugin loads automatically after build.

The full dev loop:

```bash
# Terminal 1 — mock cluster
npm run mock

# Terminal 2 — plugin watch build
npm start
```

Then open Headlamp desktop, select the `metrics-mock` context, and the **Metrics Operator** section appears in the sidebar.

### 4. Against a real cluster

Point `KUBECONFIG` at your cluster (with the metrics-operator installed), then run `npm start`. No mock server needed.

## Running tests

```bash
npm test
```

Tests use [Vitest](https://vitest.dev) with jsdom. No cluster or mock server is required — all Kubernetes calls are stubbed.

## TypeScript check

```bash
npm run tsc
```

## Project structure

```
index.tsx                        # Plugin entry point — sidebar entries + routes
src/
  common/                        # Shared components and utilities
    Resources.ts                 # KubeObject subclasses for all 9 operator CRDs
    colors.ts                    # Status and kind color tokens
    helpers.ts                   # API proxy, formatting, condition utilities
    StatusBadge.tsx              # Ready/phase colored chip
    KindBadge.tsx                # Metric kind chip
    ConditionsTable.tsx          # Conditions table + inline badge
    GVKChip.tsx                  # Group/version/Kind monospace chip
    YamlEditor.tsx               # 3-stage Monaco YAML editor (view/edit/diff)
    CRDSchema.tsx                # Schema tree + YAML scaffold from CRD schema
  health/
    HealthView.tsx               # Cross-type health dashboard
  metrics/
    MetricsTabs.tsx              # Tab shell for all 4 metric kinds
    MetricList.tsx               # Metric list + detail
    ManagedMetricList.tsx        # ManagedMetric list + detail
    FederatedMetricList.tsx      # FederatedMetric + FederatedManagedMetric lists
    MetricDetail.tsx
    ManagedMetricDetail.tsx
    FederatedMetricDetail.tsx
    wizard/                      # 5-step metric creation wizard
      MetricWizard.tsx           # Stepper shell
      KindSelector.tsx           # Step 1: choose kind
      ResourcePicker.tsx         # Step 2: browse cluster API groups
      SmartProposals.tsx         # Step 3: GVK-based pre-built configs
      MetricForm.tsx             # Step 4: full form with dimension builder
      ReviewYaml.tsx             # Step 5: Monaco review + POST
      proposals.ts               # GVK → proposal map
      schemaHelpers.ts           # CRD schema fetch + field path extraction
  datasinks/
    DataSinkList.tsx
    DataSinkForm.tsx
  crds/
    CRDView.tsx                  # CRD browser for *.openmcp.cloud groups
  access/
    ClusterAccessTabs.tsx        # RemoteClusterAccess + FederatedClusterAccess
  mocks/
    handlers.ts                  # MSW 2.x request handlers (for tests)
    generators.ts                # Landscape generators: small/medium/large
    fixtures/                    # Hand-crafted fixture objects
  test/
    setup.ts                     # window.pluginLib stub for test environment
mock-cluster/
  server.mjs                     # Standalone Node.js mock server (port 9648)
  kubeconfig.template.yaml       # Kubeconfig pointing to http://localhost:9648
```

## API group

All operator CRDs live under `metrics.openmcp.cloud/v1alpha1`.

| Kind | Scope | Description |
|---|---|---|
| `Metric` | Namespaced | Count/measure any K8s resource by GVK |
| `ManagedMetric` | Namespaced | Crossplane managed resource counts |
| `FederatedMetric` | Namespaced | Cross-cluster Metric |
| `FederatedManagedMetric` | Namespaced | Cross-cluster ManagedMetric |
| `DataSink` | Namespaced | OTLP export target (HTTPS/gRPC) |
| `RemoteClusterAccess` | Namespaced | Single remote cluster credentials |
| `FederatedClusterAccess` | Namespaced | Multi-cluster discovery |
