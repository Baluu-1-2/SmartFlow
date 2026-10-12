import { PrismaClient } from '@prisma/client';
import { PGlite } from '@electric-sql/pglite';
import { PrismaPg } from '@prisma/adapter-pg';
import pgModule from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let prismaInstance: PrismaClient | null = null;
let pgliteInstance: PGlite | null = null;

export async function initPrisma(): Promise<PrismaClient> {
  if (prismaInstance) {
    return prismaInstance;
  }

  // 1. External PostgreSQL (Supabase, Neon, AWS RDS, local postgres container)
  if (ENV.DATABASE_URL && (ENV.DATABASE_URL.startsWith('postgresql://') || ENV.DATABASE_URL.startsWith('postgres://'))) {
    console.log('[Database] Connecting to external PostgreSQL database via DATABASE_URL...');
    const pool = new pgModule.Pool({ connectionString: ENV.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({ adapter });
    await prismaInstance.$connect();
    console.log('[Database] Connected to external PostgreSQL via PrismaPg adapter.');
    return prismaInstance;
  }

  // 2. Embedded PostgreSQL (PGlite) fallback for zero-config local development and testing
  console.log('[Database] Initializing embedded PostgreSQL (PGlite engine)...');
  const dbDir = path.resolve(__dirname, '../../../.pglite_data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  pgliteInstance = new PGlite(dbDir);
  await pgliteInstance.waitReady;

  // Initialize schema if tables do not exist
  try {
    const initSqlPath = path.resolve(__dirname, '../../prisma/init.sql');
    if (fs.existsSync(initSqlPath)) {
      const sql = fs.readFileSync(initSqlPath, 'utf8');
      await pgliteInstance.exec(sql);
      console.log('[Database] PostgreSQL schema initialized successfully.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[Database] Schema execution notice:', msg);
  }

  const queryFn = async (configOrText: any, values?: any) => {
    let sql: string;
    let vals: any[];
    let rowMode: any;
    if (typeof configOrText === 'string') {
      sql = configOrText;
      vals = values;
    } else {
      sql = configOrText.text;
      vals = configOrText.values;
      rowMode = configOrText.rowMode;
    }
    const res = await pgliteInstance!.query(sql, vals, { rowMode });
    const formattedRows = (res.rows as any[]).map(r =>
      Array.isArray(r) ? r.map(v => v instanceof Date ? v.toISOString() : v) : r
    );
    return {
      rows: formattedRows,
      fields: res.fields.map((f: any) => ({ name: f.name, dataTypeID: f.dataTypeID })),
      rowCount: (res as any).affectedRows ?? res.rows.length,
    };
  };

  const pool = Object.create(pgModule.Pool.prototype);
  Object.assign(pool, {
    options: {},
    query: queryFn,
    connect: async () => ({
      query: queryFn,
      on: () => {},
      removeListener: () => {},
      release: () => {},
    }),
    on: () => {},
    removeListener: () => {},
    end: () => pgliteInstance!.close(),
  });

  const adapter = new PrismaPg(pool as any);
  prismaInstance = new PrismaClient({ adapter });
  await prismaInstance.$connect();
  console.log('[Database] Prisma connected successfully to PostgreSQL engine.');
  return prismaInstance;
}

export const prisma = await initPrisma();
