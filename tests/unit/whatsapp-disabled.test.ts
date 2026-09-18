import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { WHATSAPP_ENABLED } from "@/lib/features";
import { GET as getStatus, POST as createInstance } from "@/app/api/whatsapp/status/route";
import { POST as sendMessage } from "@/app/api/whatsapp/send/route";
import { POST as bulkSend } from "@/app/api/whatsapp/bulk-send/route";

function post(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

// The suite pins the shipped default. Flip NEXT_PUBLIC_WHATSAPP_ENABLED to
// "true" and these skip, because the routes are then meant to be reachable.
describe.skipIf(WHATSAPP_ENABLED)("whatsapp routes while the feature is off", () => {
  it("defaults to disabled", () => {
    expect(WHATSAPP_ENABLED).toBe(false);
  });

  it("closes GET /api/whatsapp/status", async () => {
    const res = await getStatus(
      new NextRequest("http://localhost/api/whatsapp/status")
    );
    expect(res.status).toBe(503);
  });

  it("closes POST /api/whatsapp/status", async () => {
    const res = await createInstance(
      post("http://localhost/api/whatsapp/status", {})
    );
    expect(res.status).toBe(503);
  });

  it("closes POST /api/whatsapp/send", async () => {
    const res = await sendMessage(
      post("http://localhost/api/whatsapp/send", {
        residentId: 1,
        messageType: "payment_reminder",
      })
    );
    expect(res.status).toBe(503);
  });

  it("closes POST /api/whatsapp/bulk-send", async () => {
    const res = await bulkSend(
      post("http://localhost/api/whatsapp/bulk-send", {
        messageType: "payment_reminder",
      })
    );
    expect(res.status).toBe(503);
  });

  it("rejects before touching authentication or the database", async () => {
    // No auth mocking and no DATABASE_URL needed: a 503 here proves the guard
    // short-circuits ahead of requireTenantManager and Prisma.
    const res = await sendMessage(
      post("http://localhost/api/whatsapp/send", {})
    );
    expect(res.status).toBe(503);
  });
});
