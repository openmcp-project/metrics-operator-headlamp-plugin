import React from 'react';

const { Box, Typography, Chip } = (window as any).pluginLib?.MuiCore ?? {};

const CONDITION_COLORS: Record<string, string> = {
  True: '#2e7d32',
  False: '#c62828',
  Unknown: '#616161',
};

interface ConditionsTableProps {
  conditions: any[];
}

export function ConditionsTable({ conditions }: ConditionsTableProps) {
  if (!conditions?.length) {
    return (
      <Typography variant="body2" color="textSecondary" style={{ padding: '8px 0', fontStyle: 'italic' }}>
        No conditions reported.
      </Typography>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>
          <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>Type</th>
          <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>Status</th>
          <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>Reason</th>
          <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>Message</th>
          <th style={{ padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>Last Transition</th>
        </tr>
      </thead>
      <tbody>
        {conditions.map((c: any, i: number) => (
          <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
            <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
              {c.type}
            </td>
            <td style={{ padding: '8px 12px' }}>
              <Chip
                label={c.status}
                size="small"
                style={{
                  background: CONDITION_COLORS[c.status] ?? '#616161',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 10,
                  height: 20,
                }}
              />
            </td>
            <td style={{ padding: '8px 12px', fontSize: 12, color: '#555' }}>{c.reason ?? '—'}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, color: '#555', maxWidth: 320, wordBreak: 'break-word' }}>
              {c.message ?? '—'}
            </td>
            <td style={{ padding: '8px 12px', fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>
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
  if (!conditions?.length) return <span style={{ color: '#888', fontSize: 12 }}>—</span>;

  const failed = conditions.filter((c: any) => c.status === 'False').length;
  const color = failed > 0 ? '#c62828' : '#2e7d32';

  return (
    <Box
      display="inline-flex"
      alignItems="center"
      style={{ gap: 4, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <span style={{
        display: 'inline-block',
        width: 8, height: 8, borderRadius: '50%',
        background: color, flexShrink: 0,
      }} />
      <span style={{ fontSize: 12, color: '#555' }}>
        {failed > 0 ? `${failed} failed` : `${conditions.length} OK`}
      </span>
    </Box>
  );
}
