function hasVersionField(args: any): boolean {
  if (!args?.data) return false;
  // Only treat model as having a version field when the caller
  // actually provided one (or attempted to provide one). The
  // previous implementation always returned true, causing Prisma
  // to inject a `version` property even on models that don't have
  // the column defined, which breaks `create`/`update` calls.
  return Object.prototype.hasOwnProperty.call(args.data, 'version');
}

export const versionExtension = {
  name: 'version',

  query: {
    $allModels: {
      create({ args, query }: unknown) {
        if (!hasVersionField(args)) {
          return query(args);
        }

        return query({
          ...args,
          data: {
            ...args.data,
            version: args.data?.version ?? 1,
          },
        });
      },

      update({ args, query }: unknown) {
        if (!hasVersionField(args)) {
          return query(args);
        }

        return query({
          ...args,
          data: {
            ...args.data,
            version:
              typeof args.data?.version === 'object'
                ? args.data.version
                : { increment: 1 },
          },
        });
      },

      upsert({ args, query }: unknown) {
        if (!hasVersionField(args)) {
          return query(args);
        }

        return query({
          ...args,
          create: {
            ...args.create,
            version: args.create?.version ?? 1,
          },
          update: {
            ...args.update,
            version:
              typeof args.update?.version === 'object'
                ? args.update.version
                : { increment: 1 },
          },
        });
      },
    },
  },
};
