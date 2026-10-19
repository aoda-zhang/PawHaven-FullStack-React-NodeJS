const { existsSync, readFileSync } = require('node:fs');
const { relative } = require('node:path');

function checkTokenContract({ repoRoot, sourceFiles }) {
  const definitions = new Map();
  const references = [];
  const failures = [];

  for (const file of sourceFiles) {
    if (!existsSync(file)) {
      failures.push(`token-contract: required source missing: ${relative(repoRoot, file)}`);
      continue;
    }
    const content = readFileSync(file, 'utf8');
    const rel = relative(repoRoot, file);
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const definitionRegex = /(--[\w-]+)\s*:/g;
      let definition;
      while ((definition = definitionRegex.exec(line)) !== null) {
        const name = definition[1];
        if (!definitions.has(name)) definitions.set(name, []);
        definitions.get(name).push({ file: rel, line: index + 1 });
      }

      const referenceRegex = /var\(\s*(--[\w-]+)/g;
      let reference;
      while ((reference = referenceRegex.exec(line)) !== null) {
        references.push({
          name: reference[1],
          file: rel,
          line: index + 1,
        });
      }
    });
  }

  for (const reference of references) {
    if (reference.name.startsWith('--tw-')) continue;
    if (!definitions.has(reference.name)) {
      failures.push(
        `token-contract: ${reference.file}:${reference.line}: undefined CSS variable ${reference.name}`,
      );
    }
  }

  const graph = new Map();
  for (const file of sourceFiles) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const definitionRegex = /(--[\w-]+)\s*:\s*([^;{}]+)/g;
      let definition;
      while ((definition = definitionRegex.exec(line)) !== null) {
        const name = definition[1];
        const value = definition[2];
        const refs = [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]);
        if (!graph.has(name)) graph.set(name, []);
        graph.get(name).push(...refs.map((target) => ({
          target,
          file: relative(repoRoot, file),
          line: index + 1,
        })));
      }
    });
  }

  const visited = new Set();
  const active = new Set();
  const reportedCycles = new Set();
  function visit(name, path = []) {
    if (active.has(name)) {
      const cycle = [...path, name].join(' -> ');
      if (!reportedCycles.has(cycle)) {
        reportedCycles.add(cycle);
        failures.push(`token-contract: circular token alias: ${cycle}`);
      }
      return;
    }
    if (visited.has(name)) return;
    active.add(name);
    for (const edge of graph.get(name) ?? []) {
      if (definitions.has(edge.target)) visit(edge.target, [...path, name]);
    }
    active.delete(name);
    visited.add(name);
  }
  for (const name of graph.keys()) visit(name);

  const duplicateDefinitions = [...definitions.entries()]
    .filter(([, locations]) => locations.length > 1);
  console.log(
    `token-contract: ${definitions.size} CSS variables defined, ${references.length} var() references, ${duplicateDefinitions.length} repeated definitions`,
  );
  if (duplicateDefinitions.length > 0) {
    for (const [name, locations] of duplicateDefinitions) {
      console.warn(
        `warn  token-contract: repeated definition ${name}: ${locations.map((item) => `${item.file}:${item.line}`).join(', ')}`,
      );
    }
  }
  return failures;
}


module.exports = { checkTokenContract };
