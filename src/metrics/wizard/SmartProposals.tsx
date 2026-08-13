import React from 'react';
import { getProposals, GENERIC_PROPOSALS, ProposalConfig } from './proposals';
import type { SelectedGVK } from './ResourcePicker';

const { Box, Typography, Button, Alert } = (window as any).pluginLib?.MuiCore ?? {};

interface Props {
  gvk: SelectedGVK;
  onSelect: (proposal: ProposalConfig) => void;
  onSkip: () => void;
}

function ProposalCard({ proposal, onSelect }: { proposal: ProposalConfig; onSelect: () => void }) {
  return (
    <Box
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: '12px 16px',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
      <Typography variant="subtitle2" style={{ fontWeight: 700 }}>{proposal.title}</Typography>
      <Typography variant="body2" color="textSecondary" style={{ fontSize: 12, flex: 1 }}>
        {proposal.description}
      </Typography>
      {proposal.cardinalityWarning && (
        <Alert severity="warning" style={{ fontSize: 11, padding: '4px 10px' }}>
          {proposal.cardinalityWarning}
        </Alert>
      )}
      {proposal.suggestKindSwitch && (
        <Alert severity="info" style={{ fontSize: 11, padding: '4px 10px' }}>
          Consider using a <strong>ManagedMetric</strong> instead — it auto-discovers Crossplane managed resources without needing a specific GVK.
        </Alert>
      )}
      <Box display="flex" style={{ gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        {proposal.projections?.map(p => (
          <Box key={p.name} style={{ background: '#f5f5f5', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontFamily: 'monospace' }}>
            dim: {p.name}
          </Box>
        ))}
        {proposal.valueFrom && (
          <Box style={{ background: '#e8f5e9', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontFamily: 'monospace' }}>
            valueFrom: {proposal.valueFrom.fieldPath}
          </Box>
        )}
        {proposal.interval && (
          <Box style={{ background: '#e3f2fd', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontFamily: 'monospace' }}>
            interval: {proposal.interval}
          </Box>
        )}
      </Box>
      <Button variant="contained" size="small" onClick={onSelect} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
        Use this proposal
      </Button>
    </Box>
  );
}

export function SmartProposals({ gvk, onSelect, onSkip }: Props) {
  const specific = getProposals(gvk.group, gvk.version, gvk.kind);
  const proposals = specific.length > 0 ? specific : GENERIC_PROPOSALS;
  const isGeneric = specific.length === 0;

  return (
    <Box>
      <Typography variant="h6" style={{ marginBottom: 6 }}>Smart Proposals</Typography>
      <Typography variant="body2" color="textSecondary" style={{ marginBottom: 18 }}>
        {isGeneric
          ? `No built-in proposals for ${gvk.kind}. Here are generic patterns that work with any resource.`
          : `Based on ${gvk.group ? `${gvk.group}/` : ''}${gvk.version}/${gvk.kind} — select a proposal to pre-fill the form.`}
      </Typography>

      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
        {proposals.map(p => (
          <ProposalCard key={p.id} proposal={p} onSelect={() => onSelect(p)} />
        ))}
      </Box>

      <Box style={{ borderTop: '1px solid #e0e0e0', paddingTop: 14 }}>
        <Button variant="outlined" onClick={onSkip}>
          Custom / Start from scratch
        </Button>
        <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 6 }}>
          Skip proposals and configure all fields manually.
        </Typography>
      </Box>
    </Box>
  );
}
