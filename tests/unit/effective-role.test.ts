import { describe, it, expect } from "vitest";
import { mergeTicketListScope, canAccessTicket } from "@/lib/tickets/auth";
import type { AuthTenantUser } from "@/lib/tenant/types";

function authUser(
  membershipRole: string,
  organizationRole: string | null
): AuthTenantUser {
  return {
    userId: "user-1",
    username: "test",
    email: "test@test.local",
    profileRole: "user",
    ctx: {
      tenantId: "tenant-1",
      organizationId: "org-1",
      propertyId: null,
      membershipRole,
      organizationRole,
      effectiveRole: organizationRole ?? membershipRole,
      userId: "user-1",
      isPlatformAdmin: false,
    },
  };
}

describe("ticket scoping uses the effective role", () => {
  it("restricts a technician to their own tickets", () => {
    const scope = mergeTicketListScope({}, authUser("technician", null));
    expect(scope).toEqual({ tenantId: "tenant-1", assignedToId: "user-1" });
  });

  it("does not restrict a manager", () => {
    const scope = mergeTicketListScope({}, authUser("manager", null));
    expect(scope).toEqual({ tenantId: "tenant-1" });
  });

  it("restricts when the organization role demotes a manager to technician", () => {
    const scope = mergeTicketListScope({}, authUser("manager", "technician"));
    expect(scope).toEqual({ tenantId: "tenant-1", assignedToId: "user-1" });
  });

  it("does not restrict when the organization role promotes a technician", () => {
    const scope = mergeTicketListScope({}, authUser("technician", "manager"));
    expect(scope).toEqual({ tenantId: "tenant-1" });
  });

  it("preserves caller-supplied filters while scoping", () => {
    const scope = mergeTicketListScope(
      { status: "open" },
      authUser("manager", "technician")
    );
    expect(scope).toEqual({
      status: "open",
      tenantId: "tenant-1",
      assignedToId: "user-1",
    });
  });
});

describe("canAccessTicket uses the effective role", () => {
  it("denies a technician a ticket assigned to someone else", () => {
    expect(
      canAccessTicket({ assignedToId: "other" }, authUser("technician", null))
    ).toBe(false);
  });

  it("allows a technician their own ticket", () => {
    expect(
      canAccessTicket({ assignedToId: "user-1" }, authUser("technician", null))
    ).toBe(true);
  });

  it("denies a manager demoted to technician by the organization role", () => {
    expect(
      canAccessTicket(
        { assignedToId: "other" },
        authUser("manager", "technician")
      )
    ).toBe(false);
  });

  it("allows a manager any ticket", () => {
    expect(
      canAccessTicket({ assignedToId: "other" }, authUser("manager", null))
    ).toBe(true);
  });

  it("allows an unassigned ticket for non-technicians", () => {
    expect(
      canAccessTicket({ assignedToId: null }, authUser("tenant_admin", null))
    ).toBe(true);
  });
});
