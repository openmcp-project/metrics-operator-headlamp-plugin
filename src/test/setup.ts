// Stub Headlamp globals for tests.
import React from 'react';

(global as any).window = global;

// Minimal MUI component stubs — render children/label as plain HTML so assertions work.
const Chip = ({ label }: any) => React.createElement('span', { 'data-testid': 'chip' }, label);
const Box = ({ children, ...rest }: any) => React.createElement('div', rest, children);
const Typography = ({ children, ...rest }: any) => React.createElement('span', rest, children);
const Tabs = ({ children }: any) => React.createElement('div', null, children);
const Tab = ({ label }: any) => React.createElement('button', null, label);
const Tooltip = ({ children }: any) => children;
const CircularProgress = () => React.createElement('span', null, '…');
const Alert = ({ children }: any) => React.createElement('div', { role: 'alert' }, children);
const Button = ({ children, onClick }: any) => React.createElement('button', { onClick }, children);
const TextField = ({ label, value, onChange }: any) => React.createElement('input', { 'aria-label': label, value: value ?? '', onChange });
const Select = ({ children }: any) => React.createElement('select', null, children);
const MenuItem = ({ children, value }: any) => React.createElement('option', { value }, children);
const InputLabel = ({ children }: any) => React.createElement('label', null, children);
const FormControl = ({ children }: any) => React.createElement('div', null, children);
const Paper = ({ children }: any) => React.createElement('div', null, children);
const Accordion = ({ children }: any) => React.createElement('div', null, children);
const AccordionSummary = ({ children }: any) => React.createElement('div', null, children);
const AccordionDetails = ({ children }: any) => React.createElement('div', null, children);
const Stepper = ({ children }: any) => React.createElement('div', null, children);
const Step = ({ children }: any) => React.createElement('div', null, children);
const StepLabel = ({ children }: any) => React.createElement('div', null, children);
const Radio = () => React.createElement('input', { type: 'radio' });
const RadioGroup = ({ children }: any) => React.createElement('div', null, children);
const IconButton = ({ children, onClick }: any) => React.createElement('button', { onClick }, children);
const Divider = () => React.createElement('hr', null);

(global as any).pluginLib = {
  MuiCore: {
    Chip, Box, Typography, Tabs, Tab, Tooltip, CircularProgress, Alert, Button,
    TextField, Select, MenuItem, InputLabel, FormControl, Paper,
    Accordion, AccordionSummary, AccordionDetails,
    Stepper, Step, StepLabel, Radio, RadioGroup, IconButton, Divider,
  },
  CommonComponents: {
    SectionBox: ({ children, title }: any) => React.createElement('section', null, title ? React.createElement('h2', null, title) : null, children),
    NameValueTable: ({ rows }: any) => React.createElement('dl', null, (rows ?? []).map((r: any, i: number) => React.createElement('div', { key: i }, React.createElement('dt', null, r.name), React.createElement('dd', null, r.value)))),
    SimpleTable: ({ data, columns }: any) => React.createElement('table', null, React.createElement('tbody', null, (data ?? []).map((row: any, i: number) => React.createElement('tr', { key: i }, (columns ?? []).map((col: any, j: number) => React.createElement('td', { key: j }, col.getter(row))))))),
  },
  ApiProxy: {
    request: () => Promise.resolve({ items: [] }),
  },
  Activity: {
    launch: () => {},
  },
};

(global as any).headlampBaseUrl = '';
