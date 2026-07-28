#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Apply SQL migrations to your Supabase project.
 *
 * Two ways to use this:
 *
 *  1. Direct DB connection (recommended when pg is installed locally):
 *     Get the connection string from your Supabase dashboard:
 *       Project → Settings → Database → Connection string → URI
 *     It'll look like:
 *       postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
 *     Then run:
 *       DATABASE_URL="postgresql://..." npm run migrate
 *
 *  2. Manual via Supabase SQL Editor:
 *     Open https://supabase.com/dashboard/project/<ref>/sql, click New query,
 *     paste the contents of each supabase/migrations/*.sql file in order, run.
 *
 *  3. Dry run (no execution — just prints SQL to stdout):
 *       DRY_RUN=1 npm run migrate
 */

const { readdirSync, readFileSync } = require("fs");
const { join } = require("path");

const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations");

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const dryRun = process.env.DRY_RUN === "1";

  if (!dbUrl && !dryRun) {
    console.error(
      "ERROR: DATABASE_URL not set.\n\n" +
        "Either:\n" +
        "  1. Set DATABASE_URL to your Supabase Postgres connection string and run: npm run migrate\n" +
        "  2. Or run with DRY_RUN=1 to print SQL without executing\n" +
        "  3. Or apply manually via Supabase dashboard SQL Editor\n\n" +
        "Find DATABASE_URL at: Supabase → Project → Settings → Database → Connection string → URI"
    );
    process.exit(1);
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("No .sql files found in supabase/migrations/");
    process.exit(1);
  }

  console.log(`Found ${files.length} migration file(s):`);
  for (const f of files) console.log(`  - ${f}`);

  if (dryRun) {
    console.log("\nDRY_RUN=1 — printing SQL without executing:\n");
    for (const f of files) {
      const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8");
      console.log(`========== ${f} ==========`);
      console.log(sql);
      console.log("");
    }
    return;
  }

  // Lazy-import pg so dry-run works without it installed.
  let pg;
  try {
    pg = await import("pg");
  } catch {
    console.error(
      "ERROR: 'pg' package not installed.\n" +
        "Install with: npm install pg\n" +
        "Then set DATABASE_URL and re-run npm run migrate."
    );
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("\nConnected to Supabase Postgres.\n");

  let applied = 0;
  for (const f of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8");
    process.stdout.write(`→ Applying ${f}... `);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log("✓");
      applied++;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      console.log("✗");
      console.error(`  ${f} failed: ${e.message}`);
      process.exit(1);
    }
  }

  await client.end();
  console.log(`\nDone — ${applied}/${files.length} migration(s) applied.`);
  console.log("\nNext steps:");
  console.log("  1. Copy frontend/.env.local.example → frontend/.env.local and add your keys");
  console.log("  2. Start the dev server and visit /signup");
  console.log("  3. Check Supabase → Authentication → Users to see your new account");
  console.log("  4. Check Supabase → Table Editor to see your profile row");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});