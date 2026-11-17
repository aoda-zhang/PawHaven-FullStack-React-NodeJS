export const databaseEngines = {
  // SQL
  mysql: 'mysql',
  postgresql: 'postgresql',
  sqlite: 'sqlite',
  sqlserver: 'sqlserver',

  // NoSQL
  mongodb: 'mongodb',
  redis: 'redis',

  // Analytics / OLAP
  clickhouse: 'clickhouse',

  // Search / Index
  elasticsearch: 'elasticsearch',

  // Message / Stream
  kafka: 'kafka',

  // Cloud managed / special
  dynamodb: 'dynamodb',
} as const;

export type DatabaseEngine =
  (typeof databaseEngines)[keyof typeof databaseEngines];
