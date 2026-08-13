import { describe, it, expect } from 'vitest';
import {
  formatAge,
  formatValue,
  formatGVK,
  isValidDuration,
  getCondition,
  isConditionTrue,
  conditionSummary,
  readyLabel,
} from '../common/helpers';

describe('formatValue', () => {
  it('returns em dash for null', () => expect(formatValue(null)).toBe('—'));
  it('returns em dash for undefined', () => expect(formatValue(undefined)).toBe('—'));
  it('returns string values unchanged', () => expect(formatValue('42')).toBe('42'));
  it('converts numbers to string', () => expect(formatValue(7)).toBe('7'));
});

describe('formatGVK', () => {
  it('formats core group', () => expect(formatGVK('', 'v1', 'Pod')).toBe('v1/Pod'));
  it('formats full group', () => expect(formatGVK('apps', 'v1', 'Deployment')).toBe('apps/v1/Deployment'));
});

describe('isValidDuration', () => {
  it('accepts seconds', () => expect(isValidDuration('30s')).toBe(true));
  it('accepts minutes', () => expect(isValidDuration('5m')).toBe(true));
  it('accepts hours', () => expect(isValidDuration('1h')).toBe(true));
  it('accepts combined', () => expect(isValidDuration('1h30m')).toBe(true));
  it('rejects plain number', () => expect(isValidDuration('60')).toBe(false));
  it('rejects empty string', () => expect(isValidDuration('')).toBe(false));
  it('rejects garbage', () => expect(isValidDuration('abc')).toBe(false));
});

describe('formatAge', () => {
  it('returns em dash for null', () => expect(formatAge(null)).toBe('—'));
  it('returns em dash for undefined', () => expect(formatAge(undefined)).toBe('—'));
  it('returns relative time for a recent timestamp', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatAge(fiveMinutesAgo)).toMatch(/m|s/);
  });
});

describe('getCondition', () => {
  const conditions = [
    { type: 'Ready', status: 'True', reason: 'ReconcileSuccess' },
    { type: 'Synced', status: 'False', reason: 'Error' },
  ];

  it('finds existing condition', () => expect(getCondition(conditions, 'Ready')?.reason).toBe('ReconcileSuccess'));
  it('returns undefined for missing condition', () => expect(getCondition(conditions, 'Missing')).toBeUndefined());
});

describe('isConditionTrue', () => {
  const conditions = [{ type: 'Ready', status: 'True' }, { type: 'Synced', status: 'False' }];
  it('returns true when status is True', () => expect(isConditionTrue(conditions, 'Ready')).toBe(true));
  it('returns false when status is False', () => expect(isConditionTrue(conditions, 'Synced')).toBe(false));
  it('returns false for missing condition', () => expect(isConditionTrue(conditions, 'Unknown')).toBe(false));
});

describe('conditionSummary', () => {
  it('returns OK for all-true conditions', () => {
    const ok = [{ type: 'Ready', status: 'True' }, { type: 'Synced', status: 'True' }];
    expect(conditionSummary(ok)).toBe('OK');
  });
  it('returns message for failing condition', () => {
    const failing = [{ type: 'Ready', status: 'False', message: 'Timeout' }];
    expect(conditionSummary(failing)).toContain('Timeout');
  });
  it('handles empty array', () => expect(conditionSummary([])).toBe('No conditions'));
});

describe('readyLabel', () => {
  it('maps True to Ready', () => expect(readyLabel('True')).toBe('Ready'));
  it('maps False to Not Ready', () => expect(readyLabel('False')).toBe('Not Ready'));
  it('maps Unknown to Unknown', () => expect(readyLabel('Unknown')).toBe('Unknown'));
});
