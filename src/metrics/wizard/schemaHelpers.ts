import { getApiProxy } from '../../common/helpers';

export interface FieldSuggestion {
  path: string;
  type: string;
  description?: string;
}

export async function fetchCRDSchema(group: string, version: string, kind: string): Promise<any | null> {
  const proxy = getApiProxy();
  if (!proxy) return null;
  try {
    const allCrds = await proxy.request(
      `/apis/apiextensions.k8s.io/v1/customresourcedefinitions`
    );
    const crd = (allCrds?.items ?? []).find((c: any) => {
      const spec = c.spec ?? {};
      return (
        spec.group === group &&
        (spec.names?.kind === kind || spec.names?.singular === kind.toLowerCase())
      );
    });
    if (!crd) return null;
    const versionEntry = (crd.spec?.versions ?? []).find((v: any) => v.name === version);
    return versionEntry?.schema?.openAPIV3Schema ?? null;
  } catch {
    return null;
  }
}

function flattenSchema(
  schema: any,
  prefix: string,
  results: FieldSuggestion[],
  depth: number
): void {
  if (depth > 5 || !schema) return;
  const props = schema.properties ?? {};
  for (const [key, val] of Object.entries(props) as [string, any][]) {
    const path = prefix ? `${prefix}.${key}` : key;
    const type: string = val.type ?? (val.additionalProperties ? 'object' : 'string');
    results.push({ path, type, description: val.description });
    if (val.type === 'object' && val.properties) {
      flattenSchema(val, path, results, depth + 1);
    }
    if (val.type === 'array' && val.items?.properties) {
      flattenSchema(val.items, `${path}[]`, results, depth + 1);
    }
  }
}

export function extractFieldPaths(schema: any): FieldSuggestion[] {
  if (!schema) return [];
  const results: FieldSuggestion[] = [];
  flattenSchema(schema, '', results, 0);
  return results;
}

export function filterFieldPaths(suggestions: FieldSuggestion[], query: string): FieldSuggestion[] {
  const q = query.toLowerCase();
  return suggestions.filter(s => s.path.toLowerCase().includes(q)).slice(0, 30);
}

export async function fetchApiGroups(): Promise<Array<{ group: string; version: string; kind: string; namespaced: boolean }>> {
  const proxy = getApiProxy();
  if (!proxy) return [];
  const results: Array<{ group: string; version: string; kind: string; namespaced: boolean }> = [];

  try {
    const core = await proxy.request('/api/v1');
    for (const r of core?.resources ?? []) {
      if (!r.name.includes('/')) {
        results.push({ group: '', version: 'v1', kind: r.kind, namespaced: r.namespaced });
      }
    }
  } catch { /* ignore */ }

  try {
    const apis = await proxy.request('/apis');
    const groups: Array<{ group: string; preferredVersion: string }> = [];
    for (const g of apis?.groups ?? []) {
      groups.push({ group: g.name, preferredVersion: g.preferredVersion?.version ?? g.versions?.[0]?.version ?? '' });
    }

    await Promise.all(
      groups.map(async ({ group, preferredVersion }) => {
        if (!preferredVersion) return;
        try {
          const gv = await proxy.request(`/apis/${group}/${preferredVersion}`);
          for (const r of gv?.resources ?? []) {
            if (!r.name.includes('/')) {
              results.push({ group, version: preferredVersion, kind: r.kind, namespaced: r.namespaced });
            }
          }
        } catch { /* ignore */ }
      })
    );
  } catch { /* ignore */ }

  return results;
}
