import React from 'react';
import { getProposals, GENERIC_PROPOSALS, ProposalConfig } from './proposals';
import type { SelectedGVK } from './ResourcePicker';
import styles from './SmartProposals.module.css';

const { Box, Typography, Button, Alert, useTheme } = (window as any).pluginLib?.MuiCore ?? {};

interface Props {
  gvk: SelectedGVK;
  onSelect: (proposal: ProposalConfig) => void;
  onSkip: () => void;
}

function ProposalCard({ proposal, onSelect }: { proposal: ProposalConfig; onSelect: () => void }) {
  const theme = useTheme();
  return (
    <Box
      className={styles.card}
      style={{
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
      }}>
      <Typography variant="subtitle2" className={styles.cardTitle}>{proposal.title}</Typography>
      <Typography variant="body2" color="textSecondary" className={styles.cardDescription}>
        {proposal.description}
      </Typography>
      {proposal.cardinalityWarning && (
        <Alert severity="warning" className={styles.cardAlert}>
          {proposal.cardinalityWarning}
        </Alert>
      )}
      {proposal.suggestKindSwitch && (
        <Alert severity="info" className={styles.cardAlert}>
          Consider using a <strong>ManagedMetric</strong> instead — it auto-discovers Crossplane managed resources without needing a specific GVK.
        </Alert>
      )}
      <Box display="flex" className={styles.pillRow}>
        {proposal.projections?.map(p => (
          <Box key={p.name} className={styles.pill} style={{ background: theme.palette.background.default }}>
            dim: {p.name}
          </Box>
        ))}
        {proposal.valueFrom && (
          <Box className={styles.pill} style={{ background: '#e8f5e9', color: '#1a1a1a' }}>
            valueFrom: {proposal.valueFrom.fieldPath}
          </Box>
        )}
        {proposal.interval && (
          <Box className={styles.pill} style={{ background: '#e3f2fd', color: '#1a1a1a' }}>
            interval: {proposal.interval}
          </Box>
        )}
      </Box>
      <Button variant="contained" size="small" onClick={onSelect} className={styles.useButton}>
        Use this proposal
      </Button>
    </Box>
  );
}

export function SmartProposals({ gvk, onSelect, onSkip }: Props) {
  const theme = useTheme();
  const specific = getProposals(gvk.group, gvk.version, gvk.kind);
  const proposals = specific.length > 0 ? specific : GENERIC_PROPOSALS;
  const isGeneric = specific.length === 0;

  return (
    <Box>
      <Typography variant="h6" className={styles.title}>Smart Proposals</Typography>
      <Typography variant="body2" color="textSecondary" className={styles.subtitle}>
        {isGeneric
          ? `No built-in proposals for ${gvk.kind}. Here are generic patterns that work with any resource.`
          : `Based on ${gvk.group ? `${gvk.group}/` : ''}${gvk.version}/${gvk.kind} — select a proposal to pre-fill the form.`}
      </Typography>

      <Box className={styles.grid}>
        {proposals.map(p => (
          <ProposalCard key={p.id} proposal={p} onSelect={() => onSelect(p)} />
        ))}
      </Box>

      <Box className={styles.skipSection} style={{ borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button variant="outlined" onClick={onSkip}>
          Custom / Start from scratch
        </Button>
        <Typography variant="caption" color="textSecondary" className={styles.skipHint}>
          Skip proposals and configure all fields manually.
        </Typography>
      </Box>
    </Box>
  );
}
