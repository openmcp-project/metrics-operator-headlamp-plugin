import React, { useState } from 'react';
import MetricList from './MetricList';
import ManagedMetricList from './ManagedMetricList';
import FederatedMetricList from './FederatedMetricList';
import { MetricWizard } from './wizard/MetricWizard';
import { Metric, ManagedMetric, FederatedMetric, FederatedManagedMetric } from '../common/Resources';

const { Box, Tabs, Tab, Button } = (window as any).pluginLib?.MuiCore ?? {};
const { SectionBox } = (window as any).pluginLib?.CommonComponents ?? {};

interface MetricsTabsProps {
  onCreateMetric?: (kind: string) => void;
}

export default function MetricsTabs({ onCreateMetric }: MetricsTabsProps) {
  const [tab, setTab] = useState(0);

  const [metrics] = Metric.useList() as [any[], any];
  const [managed] = ManagedMetric.useList() as [any[], any];
  const [federated] = FederatedMetric.useList() as [any[], any];
  const [federatedManaged] = FederatedManagedMetric.useList() as [any[], any];

  const counts = [
    metrics?.length ?? 0,
    managed?.length ?? 0,
    federated?.length ?? 0,
    federatedManaged?.length ?? 0,
  ];

  const tabLabels = [
    `Metric${counts[0] ? ` (${counts[0]})` : ''}`,
    `Managed Metric${counts[1] ? ` (${counts[1]})` : ''}`,
    `Federated Metric${counts[2] ? ` (${counts[2]})` : ''}`,
    `Federated Managed${counts[3] ? ` (${counts[3]})` : ''}`,
  ];

  function openWizard(kind: string) {
    const Activity = (window as any).pluginLib?.Activity;
    if (!Activity) { onCreateMetric?.(kind); return; }
    Activity.launch({
      id: `metric-create:${kind}`,
      location: 'split-right',
      temporary: true,
      title: `Create ${kind}`,
      content: React.createElement(MetricWizard, { initialKind: kind }),
    });
  }

  return (
    <SectionBox
      title="Metrics"
      headerProps={{
        headerStyle: 'main',
        actions: [
          <Button key="create" variant="contained" size="small"
            onClick={() => openWizard(tab === 0 ? 'Metric' : tab === 1 ? 'ManagedMetric' : tab === 2 ? 'FederatedMetric' : 'FederatedManagedMetric')}
            style={{ background: '#1565c0' }}>
            + Create Metric
          </Button>,
        ],
      }}
    >
      <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} style={{ marginBottom: 16, borderBottom: '1px solid #e0e0e0' }}>
        {tabLabels.map((label, i) => <Tab key={i} label={label} style={{ fontSize: 13 }} />)}
      </Tabs>

      {tab === 0 && <MetricList />}
      {tab === 1 && <ManagedMetricList />}
      {tab === 2 && <FederatedMetricList kind="FederatedMetric" />}
      {tab === 3 && <FederatedMetricList kind="FederatedManagedMetric" />}
    </SectionBox>
  );
}
