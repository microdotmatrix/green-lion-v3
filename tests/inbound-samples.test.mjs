import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { drizzle } from "drizzle-orm/pglite";

// Use the versions already locked by Drizzle's tooling; no live database or credentials.
const { PGlite } = createRequire(import.meta.resolve("drizzle-orm"))(
  "@electric-sql/pglite",
);
const { build } = createRequire(import.meta.resolve("drizzle-kit"))("esbuild");

test("inbound sample API and database workflow", async (t) => {
  const client = new PGlite();
  const db = drizzle(client);
  db.batch = (queries) => Promise.all(queries);
  globalThis.__inboundTestDb = db;
  await mkdir("node_modules/.cache", { recursive: true });
  const directory = await mkdtemp(resolve("node_modules/.cache/inbound-test-"));
  t.after(async () => {
    await client.close();
    delete globalThis.__inboundTestDb;
    await rm(directory, { recursive: true, force: true });
  });
  await client.exec(
    "CREATE TABLE \"user\" (id text PRIMARY KEY); INSERT INTO \"user\" VALUES ('uploader'), ('reviewer');",
  );
  await client.exec(await readFile("drizzle/0011_inbound_samples.sql", "utf8"));
  const bundle = await build({
    stdin: {
      contents: `export * as collection from './src/pages/api/admin/inbound-samples/index.ts'; export * as item from './src/pages/api/admin/inbound-samples/[id].ts'; export * as review from './src/pages/api/admin/inbound-samples/[id]/review.ts'; export * as validation from './src/lib/inbound-samples.ts';`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: "isolated-test-database",
        setup(build) {
          build.onResolve({ filter: /^@\/lib\/db$/ }, () => ({
            path: "test-db",
            namespace: "test-db",
          }));
          build.onLoad({ filter: /.*/, namespace: "test-db" }, () => ({
            contents: "export const db = globalThis.__inboundTestDb;",
          }));
        },
      },
    ],
  });
  const bundlePath = resolve(directory, "routes.mjs");
  await writeFile(bundlePath, bundle.outputFiles[0].text);
  const { collection, item, review, validation } = await import(
    pathToFileURL(bundlePath)
  );
  const uploader = {
    user: { id: "uploader", name: "Mike", approved: true },
    session: { id: "session" },
  };
  const reviewer = {
    user: { id: "reviewer", name: "Matt", approved: true },
    session: { id: "session-2" },
  };
  let sample;
  async function call(
    handler,
    { body, locals = uploader, id = sample?.id, query = "", raw } = {},
  ) {
    const url = new URL(`http://localhost/api/admin/inbound-samples${query}`);
    const response = await handler({
      locals,
      params: { id },
      url,
      request: new Request(url, {
        method: body !== undefined || raw !== undefined ? "POST" : "GET",
        ...(body !== undefined || raw !== undefined
          ? {
              body: raw ?? JSON.stringify(body),
              headers: { "Content-Type": "application/json" },
            }
          : {}),
      }),
    });
    return { status: response.status, data: await response.json() };
  }
  const input = {
    manufacturer: " Example Manufacturer ",
    partNumber: "CELL_%_01",
    capacity: "5,000 mAh",
    voltage: "3.7 V",
    notes: "Incoming device",
    imageUrl: "https://example.com/sample.jpg",
  };
  const fields = (value) =>
    Object.fromEntries(
      Object.keys(validation.sampleInputSchema.shape).map((key) => [
        key,
        value[key],
      ]),
    );

  await t.test(
    "every endpoint requires an approved authenticated user",
    async () => {
      for (const handler of [
        collection.GET,
        collection.POST,
        item.GET,
        item.PUT,
        review.POST,
      ]) {
        assert.equal(
          (await call(handler, { locals: { user: null, session: null } }))
            .status,
          401,
        );
        assert.equal(
          (
            await call(handler, {
              locals: {
                ...uploader,
                user: { ...uploader.user, approved: false },
              },
            })
          ).status,
          403,
        );
      }
    },
  );
  await t.test(
    "validates inputs and rejects forged attribution and decisions",
    async () => {
      for (const body of [
        { ...input, manufacturer: "  " },
        { ...input, partNumber: "" },
        { ...input, imageUrl: "javascript:alert(1)" },
        { ...input, uploadedBy: "reviewer" },
        { ...input, approved: true },
        { ...input, status: "approved" },
        { ...input, notes: "x".repeat(10001) },
      ]) {
        assert.equal((await call(collection.POST, { body })).status, 400);
      }
      assert.equal(
        (await call(collection.POST, { raw: "{bad json" })).status,
        400,
      );
      for (const query of [
        "?page=0",
        "?limit=101",
        "?page=NaN",
        "?status=bad",
        "?approval=bad",
      ])
        assert.equal((await call(collection.GET, { query })).status, 400);
    },
  );
  await t.test(
    "receives a sample and attributes its uploader on the server",
    async () => {
      const result = await call(collection.POST, { body: input });
      assert.equal(result.status, 201);
      sample = result.data;
      assert.equal(sample.manufacturer, "Example Manufacturer");
      assert.equal(sample.status, "received");
      assert.equal(sample.uploadedBy, "uploader");
      assert.equal(sample.uploaderName, "Mike");
      assert.equal(sample.approved, null);
      assert.equal(sample.version, 1);
      assert.equal((await call(item.GET)).data.partNumber, input.partNumber);
    },
  );
  await t.test(
    "requires completed evaluation for both yes and no decisions",
    async () => {
      for (const approved of [true, false])
        assert.equal(
          (
            await call(review.POST, {
              body: { approved, version: sample.version },
              locals: reviewer,
            })
          ).status,
          400,
        );
      for (const status of ["pending_evaluation", "testing", "evaluated"]) {
        const result = await call(item.PUT, {
          body: {
            ...fields(sample),
            status,
            testingNotes: "Measured capacity and voltage; passed.",
            version: sample.version,
          },
          locals: reviewer,
        });
        assert.equal(result.status, 200);
        sample = result.data;
        assert.equal(sample.status, status);
        assert.equal(sample.uploaderName, "Mike");
      }
    },
  );
  await t.test(
    "stamps a decision, preserves it on duplicate review and unchanged save",
    async () => {
      const result = await call(review.POST, {
        body: { approved: true, version: sample.version },
        locals: reviewer,
      });
      assert.equal(result.status, 200);
      sample = result.data;
      assert.equal(sample.approved, true);
      assert.equal(sample.reviewerName, "Matt");
      assert.ok(sample.reviewedAt);
      const repeated = await call(review.POST, {
        body: { approved: true, version: sample.version },
      });
      assert.equal(repeated.data.reviewerName, "Matt");
      assert.equal(repeated.data.reviewedAt, sample.reviewedAt);
      const saved = await call(item.PUT, {
        body: { ...fields(sample), version: sample.version },
      });
      assert.equal(saved.data.reviewedAt, sample.reviewedAt);
      sample = saved.data;
    },
  );
  await t.test(
    "filters status and decisions, searches literal wildcard characters, and paginates",
    async () => {
      assert.equal(
        (
          await call(collection.GET, {
            query: "?approval=approved&status=evaluated&search=CELL_%25",
          })
        ).data.pagination.total,
        1,
      );
      assert.equal(
        (await call(collection.GET, { query: "?approval=not_approved" })).data
          .samples.length,
        0,
      );
      assert.equal(
        (await call(collection.GET, { query: "?search=missing" })).data.samples
          .length,
        0,
      );
      assert.equal(
        (await call(collection.GET, { query: "?page=2&limit=1" })).data.samples
          .length,
        0,
      );
    },
  );
  await t.test(
    "editing reviewed evidence clears the stamp and rejects stale saves",
    async () => {
      const staleVersion = sample.version;
      const result = await call(item.PUT, {
        body: { ...fields(sample), voltage: "5 V", version: staleVersion },
      });
      assert.equal(result.status, 200);
      sample = result.data;
      assert.equal(sample.approved, null);
      assert.equal(sample.reviewedBy, null);
      assert.equal(sample.reviewerName, null);
      assert.equal(sample.reviewedAt, null);
      assert.equal(
        (
          await call(item.PUT, {
            body: { ...fields(sample), version: staleVersion },
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await call(review.POST, {
            body: { approved: true, version: staleVersion },
          })
        ).status,
        409,
      );
    },
  );
  await t.test(
    "concurrent decisions allow one writer and preserve uploader attribution",
    async () => {
      const results = await Promise.all([
        call(review.POST, {
          body: { approved: true, version: sample.version },
          locals: reviewer,
        }),
        call(review.POST, {
          body: { approved: false, version: sample.version },
        }),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
      sample = (await call(item.GET)).data;
      assert.equal(sample.uploaderName, "Mike");
    },
  );
  await t.test("records a negative decision and can reopen it", async () => {
    sample = (
      await call(review.POST, {
        body: { approved: false, version: sample.version },
        locals: reviewer,
      })
    ).data;
    assert.equal(sample.approved, false);
    assert.equal(
      (await call(collection.GET, { query: "?approval=not_approved" })).data
        .pagination.total,
      1,
    );
    sample = (
      await call(review.POST, {
        body: { approved: null, version: sample.version },
      })
    ).data;
    assert.equal(sample.reviewerName, null);
    assert.equal(
      (await call(collection.GET, { query: "?approval=pending" })).data
        .pagination.total,
      1,
    );
  });
  await t.test(
    "database constraints reject invalid status and unstamped approval",
    async () => {
      await assert.rejects(
        client.query("UPDATE inbound_samples SET status = $1 WHERE id = $2", [
          "invalid",
          sample.id,
        ]),
      );
      await assert.rejects(
        client.query(
          "UPDATE inbound_samples SET approved = true WHERE id = $1",
          [sample.id],
        ),
      );
    },
  );
  await t.test(
    "keeps attribution snapshots after account deletion and handles missing records",
    async () => {
      sample = (
        await call(review.POST, {
          body: { approved: true, version: sample.version },
          locals: reviewer,
        })
      ).data;
      await client.exec('DELETE FROM "user"');
      sample = (await call(item.GET)).data;
      assert.equal(sample.uploadedBy, null);
      assert.equal(sample.reviewedBy, null);
      assert.equal(sample.uploaderName, "Mike");
      assert.equal(sample.reviewerName, "Matt");
      assert.equal((await call(item.GET, { id: "missing" })).status, 404);
      assert.equal(
        (
          await call(item.PUT, {
            id: "missing",
            body: { ...fields(sample), version: 1 },
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await call(review.POST, {
            id: "missing",
            body: { approved: true, version: 1 },
          })
        ).status,
        404,
      );
    },
  );
});
