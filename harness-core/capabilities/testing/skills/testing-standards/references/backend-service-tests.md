# Backend Service Tests

## Contents

- [The shape of a service test](#the-shape-of-a-service-test)
- [The factory](#the-factory)
- [The Prisma double](#the-prisma-double)
- [Assertions worth writing](#assertions-worth-writing)
- [Error paths](#error-paths)
- [HTTP tests](#http-tests)
- [What not to do](#what-not-to-do)

`apps/backend/core-service/src/modules/rescue/rescue.service.test.ts` is the reference
implementation. Read it alongside this.

## The shape of a service test

1. A **record factory** with overridable defaults.
2. A **`buildService` double** that wires `vi.fn()`s in place of Prisma and hands back both the
   service and the mocks, so assertions can inspect the query.
3. `describe` per method, `it` per behaviour.

There is no Prisma mocking library in this repo and no test database. The double is hand-written.

## The factory

```typescript
const RECORD_ID = 'PAW-0001';
const REPORTED_AT = new Date('2026-08-22T10:00:00.000Z');
const FIRST_PHOTO_URL = `/api/core/rescues/${RECORD_ID}/photo/0`;

type RecordOverrides = Record<string, unknown>;

const buildRecord = (overrides: RecordOverrides = {}) => ({
  id: RECORD_ID,
  animalType: 'cat',
  age: 'baby',
  animalStatus: AnimalStatus.PENDING,
  statusDescription: null,
  description: 'Found near the park',
  size: 'small',
  animalCount: 1,
  appearance: { color: 'black' },
  locationObj: { address: 'Central Park' },
  reporterPhotos: [],
  reporter: { reporterID: 'user-1', reporterName: null },
  createdAt: REPORTED_AT,
  deletedAt: null,
  ...overrides,
});
```

Use `AnimalStatus.PENDING` from `@pawhaven/shared/types` rather than the string `'pending'` — the
enum is the contract, and a literal silently rots when the enum changes.

`buildRecord()` is also called with no argument by the `findUnique` double, so the factory must be
total.

## The Prisma double

The service calls the same model method with different `select` shapes. The double **distinguishes
them**, which is what lets a test assert that a list query does not drag the photo payload:

```typescript
const buildService = (records: RecordOverrides[] | Error = []) => {
  const stored = records instanceof Error ? [] : records.map(buildRecord);

  const isPhotoLookup = (args?: { select?: Record<string, boolean> }) =>
    args?.select !== undefined && Object.keys(args.select).length === 1;

  const findMany = vi.fn((args?: { select?: Record<string, boolean> }) => {
    if (records instanceof Error) return Promise.reject(records);
    if (isPhotoLookup(args)) {
      return Promise.resolve(
        stored
          .filter((r) => r.reporterPhotos.length > 0)
          .map((r) => ({ id: r.id })),
      );
    }
    // Mirrors the projection: a list row never carries the photo payload, so a
    // mapper that still reads `reporterPhotos` gets undefined and fails loudly.
    return Promise.resolve(
      stored.map((record) => ({
        id: record.id,
        animalType: record.animalType,
        animalStatus: record.animalStatus,
        description: record.description,
        locationObj: record.locationObj,
        reporter: record.reporter,
        createdAt: record.createdAt,
      })),
    );
  });

  const findUnique = vi.fn(({ where }: { where: { id: string } }) =>
    records instanceof Error
      ? Promise.reject(records)
      : Promise.resolve(
          records.map(buildRecord).find((record) => record.id === where.id) ??
            null,
        ),
  );

  const prisma = { animalReports: { findMany, findUnique } };

  return { service: new RescueService(prisma as never), findMany, findUnique };
};
```

Three things to copy:

- **`records instanceof Error`** makes the rejection path reachable without a second builder. Error
  behaviour is a real requirement, not an edge case.
- **The double projects like Prisma does.** Returning the full record where the real query returned
  a subset would let a mapper read a field it should never see, and the bug would ship. The comment
  in the source says exactly this.
- **`new RescueService(prisma as never)`** — the double is a structural subset, so it needs the
  cast. Return the mocks too, or the test cannot assert on the query.

## Assertions worth writing

```typescript
describe('RescueService.findAll', () => {
  it('queries only live rescues, newest first', async () => {
    const { service, findMany } = buildService([{}]);

    await service.findAll();

    expect(findMany).toHaveBeenCalledWith({
      where: { deletedAt: { isSet: false } },
      orderBy: { createdAt: 'desc' },
      take: undefined,
      select: expect.objectContaining({ id: true, createdAt: true }),
    });
  });

  it('never selects the multi-megabyte photo payload for a list row', async () => {
    const { service, findMany } = buildService([{}]);
    await service.findAll();
    const [listQuery] = findMany.mock.calls[0] as [
      { select: Record<string, boolean> },
    ];
    expect(listQuery.select.reporterPhotos).toBeUndefined();
  });
});
```

Note `deletedAt: { isSet: false }` in the expected `where`. **Soft delete is a filter you can forget**,
and a test that omits it will not notice when the service does. Assert the filter.

Use `expect.objectContaining` for `select` so adding a projected field does not break every test.

## Error paths

Assert the exception the service throws, not the driver's:

```typescript
await expect(service.findAll()).rejects.toBeInstanceOf(BadRequestException);
```

The service catches broadly, logs the detail, and rethrows a generic `BadRequestException`. Asserting
on Prisma's message would pin behaviour the service deliberately hides.

## HTTP tests

`supertest` is installed in `gateway`, `auth-service`, and `backend-core` — not in `core-service`.
HTTP-level tests live with the service that owns the HTTP surface. For a core-service contract,
assert through the service or add the dependency deliberately.

## What not to do

- **No `jest.fn()`, `jest.mock()`, `beforeEach` from Jest.** Not installed.
- **No snapshot tests.** They pass on whatever the current output is, including a wrong output.
- **No test database.** The double is the isolation strategy; adding one changes the setup for
  every future test.
- **Do not assert only the happy path.** The `Error` branch above exists because silent failure
  handling is how a 500 becomes a mystery.
