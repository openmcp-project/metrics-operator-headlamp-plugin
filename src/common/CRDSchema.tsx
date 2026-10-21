import { useState } from 'react';
import * as jsYaml from 'js-yaml';
import styles from './CRDSchema.module.css';

const { Typography, Box, useTheme } = (window as any).pluginLib?.MuiCore ?? {};

// ── Type chip ─────────────────────────────────────────────────────────────────

export function TypeChip({ type }: { type: string }) {
  const colors: Record<string, string> = {
    string: '#1565c0', integer: '#6a1b9a', number: '#6a1b9a',
    boolean: '#e65100', object: '#2e7d32', array: '#00695c',
  };
  return (
    <span className={styles.typeChip} style={{ background: colors[type] ?? '#616161', color: '#fff' }}>{type}</span>
  );
}

// ── Schema property tree ──────────────────────────────────────────────────────

export function SchemaPropertyTree({ schema, required = [], depth = 0 }: {
  schema: any;
  required?: string[];
  depth?: number;
}) {
  const theme = useTheme();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  if (!schema?.properties) {
    return (
      <Typography variant="body2" color="textSecondary" className={styles.empty}>
        No properties defined.
      </Typography>
    );
  }

  const props = Object.entries(schema.properties) as [string, any][];

  return (
    <Box style={{ paddingLeft: depth * 16 }}>
      {props.map(([name, propSchema]) => {
        const isRequired = required.includes(name);
        const hasChildren = (propSchema.type === 'object' || propSchema.properties) && propSchema.properties;
        const isCollapsed = collapsed.has(name);
        const type: string = propSchema.type ?? (propSchema.properties ? 'object' : '?');
        const arrayItemType: string | null =
          type === 'array' && propSchema.items?.type ? propSchema.items.type : null;

        return (
          <Box key={name} className={styles.row}>
            <Box
              display="flex" alignItems="flex-start"
              className={styles.rowHeader}
              style={{ cursor: hasChildren ? 'pointer' : 'default' }}
              onClick={() => {
                if (!hasChildren) return;
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  next.has(name) ? next.delete(name) : next.add(name);
                  return next;
                });
              }}
            >
              {hasChildren ? (
                <span className={styles.caret} style={{ color: theme.palette.text.secondary }}>
                  {isCollapsed ? '▸' : '▾'}
                </span>
              ) : (
                <span className={styles.caretSpacer} />
              )}
              <span className={styles.propName}>{name}</span>
              <TypeChip type={type} />
              {arrayItemType && (
                <span className={styles.arrayItem} style={{ color: theme.palette.text.secondary }}>of {arrayItemType}</span>
              )}
              {isRequired && (
                <span className={styles.requiredChip} style={{ background: '#c62828', color: '#fff' }}>required</span>
              )}
              {propSchema.description && (
                <Typography variant="caption" color="textSecondary"
                  className={styles.description}>
                  {propSchema.description}
                </Typography>
              )}
            </Box>
            {hasChildren && !isCollapsed && (
              <Box className={styles.children} style={{ borderLeft: `2px solid ${theme.palette.divider}` }}>
                <SchemaPropertyTree
                  schema={propSchema}
                  required={propSchema.required ?? []}
                  depth={0}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ── YAML scaffold from OpenAPI schema ─────────────────────────────────────────

function scaffoldValue(schema: any, depth: number): any {
  if (depth > 4 || !schema) return undefined;
  const type: string = schema.type ?? '';
  if (type === 'string') return schema.default ?? '';
  if (type === 'integer' || type === 'number') return schema.default ?? 0;
  if (type === 'boolean') return schema.default ?? false;
  if (type === 'array') return [];
  if (type === 'object' || schema.properties) {
    const obj: any = {};
    for (const key of (schema.required ?? [])) {
      const val = scaffoldValue(schema.properties?.[key], depth + 1);
      if (val !== undefined) obj[key] = val;
    }
    return Object.keys(obj).length > 0 ? obj : {};
  }
  return undefined;
}

export function scaffoldFromSchema(kind: string, group: string, version: string, schema: any): string {
  const spec = schema?.properties?.spec ? scaffoldValue(schema.properties.spec, 0) : {};
  const obj: any = {
    apiVersion: `${group}/${version}`,
    kind,
    metadata: { name: '' },
  };
  if (spec && Object.keys(spec).length > 0) obj.spec = spec;
  return jsYaml.dump(obj);
}
