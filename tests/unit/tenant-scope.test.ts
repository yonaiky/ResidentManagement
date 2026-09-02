import { describe, it, expect } from "vitest";
import { mergeTenantWhere } from "@/lib/tenant/scope";
import { hasTenantPermission } from "@/lib/tenant/auth";

describe("mergeTenantWhere", () => {
  it("adds tenantId to empty where", () => {
    const result = mergeTenantWhere({}, {
      tenantId: "tenant-1",
      organizationId: null,
      propertyId: null,
      membershipRole: "user",
      organizationRole: null,
      userId: "u1",
      isPlatformAdmin: false,
    });
    expect(result).toEqual({ tenantId: "tenant-1" });
  });

  it("preserves existing filters", () => {
    const result = mergeTenantWhere(
      { status: "pending" },
      {
        tenantId: "tenant-1",
        organizationId: null,
        propertyId: null,
        membershipRole: "user",
        organizationRole: null,
        userId: "u1",
        isPlatformAdmin: false,
      }
    );
    expect(result).toEqual({ status: "pending", tenantId: "tenant-1" });
  });
});

describe("hasTenantPermission", () => {
  it("tenant_admin has manager permission", () => {
    expect(hasTenantPermission("tenant_admin", "manager")).toBe(true);
  });

  it("user does not have manager permission", () => {
    expect(hasTenantPermission("user", "manager")).toBe(false);
  });

  it("manager has user permission", () => {
    expect(hasTenantPermission("manager", "user")).toBe(true);
  });
});
