import React from 'react';
import styles from './ConditionsTable.module.css';

const { Box, Typography, Chip, useTheme } = (window as any).pluginLib?.MuiCore ?? {};

const CONDITION_COLORS: Record<string, string> = {
  True: '#2e7d32',
  False: '#c62828',
  Unknown: '#616161',
};

interface ConditionsTableProps {
  conditions: any[];
}

export function ConditionsTable({ conditions }: ConditionsTableProps) {
  const theme = useTheme();
  if (!conditions?.length) {
    return (
      <Typography variant="body2" color="textSecondary" className={styles.empty}>
        No conditions reported.
      </Typography>
    );
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.headerRow} style={{ borderBottom: `2px solid ${theme.palette.divider}` }}>
          <th className={styles.th}>Type</th>
          <th className={styles.th}>Status</th>
          <th className={styles.th}>Reason</th>
          <th className={styles.th}>Message</th>
          <th className={styles.th}>Last Transition</th>
        </tr>
      </thead>
      <tbody>
        {conditions.map((c: any, i: number) => (
          <tr key={i} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
            <td className={styles.tdType}>
              {c.type}
            </td>
            <td className={styles.tdStatus}>
              <Chip
                label={c.status}
                size="small"
                className={styles.statusChip}
                style={{
                  background: CONDITION_COLORS[c.status] ?? '#616161',
                  color: '#fff',
                }}
              />
            </td>
            <td className={styles.tdText} style={{ color: theme.palette.text.secondary }}>{c.reason ?? '—'}</td>
            <td className={styles.tdMessage} style={{ color: theme.palette.text.secondary }}>
              {c.message ?? '—'}
            </td>
            <td className={styles.tdTime} style={{ color: theme.palette.text.secondary }}>
              {c.lastTransitionTime ? new Date(c.lastTransitionTime).toLocaleString() : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Inline count badge for use in list rows
export function ConditionsBadge({ conditions, onClick }: { conditions: any[]; onClick?: () => void }) {
  const theme = useTheme();
  if (!conditions?.length) return <span className={styles.badgeEmpty} style={{ color: theme.palette.text.secondary }}>—</span>;

  const failed = conditions.filter((c: any) => c.status === 'False').length;
  const color = failed > 0 ? '#c62828' : '#2e7d32';

  return (
    <Box
      display="inline-flex"
      alignItems="center"
      className={styles.badge}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <span className={styles.dot} style={{ background: color }} />
      <span className={styles.badgeLabel} style={{ color: theme.palette.text.secondary }}>
        {failed > 0 ? `${failed} failed` : `${conditions.length} OK`}
      </span>
    </Box>
  );
}
