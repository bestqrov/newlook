import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { startServer, stopServer, client } from "./helpers.js"

before(startServer)
after(stopServer)

test("health endpoint answers", async () => {
  const r = await client()("/api/health")
  assert.equal(r.status, 200)
  assert.deepEqual(r.data, { ok: true })
})
