import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge } from '../common/StatusBadge';

describe('StatusBadge', () => {
  it('renders Ready chip for ready=True', () => {
    render(React.createElement(StatusBadge, { ready: 'True' }));
    expect(screen.getByText('Ready')).toBeTruthy();
  });

  it('renders Not Ready chip for ready=False', () => {
    render(React.createElement(StatusBadge, { ready: 'False' }));
    expect(screen.getByText('Not Ready')).toBeTruthy();
  });

  it('renders Unknown chip for ready=Unknown', () => {
    render(React.createElement(StatusBadge, { ready: 'Unknown' }));
    expect(screen.getByText('Unknown')).toBeTruthy();
  });

  it('renders phase chip for phase prop', () => {
    render(React.createElement(StatusBadge, { phase: 'Running' }));
    expect(screen.getByText('Running')).toBeTruthy();
  });
});
