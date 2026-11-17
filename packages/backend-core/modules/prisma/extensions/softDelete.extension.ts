function supportsSoftDelete(args: any): boolean {
  if (!args) return false;

  if (args.data && 'deletedAt' in args.data) return true;
  if (args.where && 'deletedAt' in args.where) return true;

  return false;
}

export const softDeleteExtension = {
  name: 'softDelete',

  query: {
    $allModels: {
      delete({ args, query }: unknown) {
        if (!supportsSoftDelete(args)) {
          return query(args);
        }

        const now = new Date();

        return query({
          ...args,
          data: {
            deletedAt: now,
            updatedAt: now,
          },
        });
      },

      deleteMany({ args, query }: unknown) {
        if (!supportsSoftDelete(args)) {
          return query(args);
        }

        const now = new Date();

        return query({
          ...args,
          data: {
            deletedAt: now,
            updatedAt: now,
          },
        });
      },
    },
  },
};
