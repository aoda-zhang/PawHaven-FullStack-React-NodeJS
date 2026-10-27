const reportedMissingVars = new Set<string>();

/**
 * Recursively resolves `${VAR}` placeholders inside a configuration object
 * using values from environment variables.
 *
 * - Supports nested objects and arrays
 * - Only string values are interpolated
 * - Missing environment variables warn once per variable and are replaced with
 *   an empty string
 *
 * @param yamlContent - Raw configuration object (e.g. parsed from YAML)
 * @param envContent - Raw configuration object (e.g. parsed from YAML)
 * @returns A new configuration object with all placeholders resolved
 */
export const resolveAppConfig = <Y>(
  yamlContent: Y,
  envContent: Record<string, unknown>,
): Y => {
  const walk = <T>(value: T): T => {
    if (typeof value === 'string') {
      // @ts-ignore
      return value.replace(/\$\{([^}]+)\}/g, (_: string, varName: string) => {
        const envKey = varName.trim();
        const envValue = envContent?.[envKey];
        if (envValue === undefined && !reportedMissingVars.has(envKey)) {
          reportedMissingVars.add(envKey);
          console.warn(
            `Missing environment variable for placeholder: ${envKey}`,
          );
        }
        return envValue ?? '';
      }) as unknown as T;
    }
    if (Array.isArray(value)) {
      return value.map((v) => walk(v)) as T;
    }
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, walk(v)]),
      ) as T;
    }
    return value;
  };

  return walk(yamlContent);
};
