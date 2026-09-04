import { describe, it, expect } from "vitest";
import { analyticsFilterSchema } from "@/lib/validations/analytics";

describe("Analytics Validation Schemas (FEAT-008-BE)", () => {
  it("TC-ANA-VAL-01: parses valid analytics filter input with workspaceId only", () => {
    const input = {
      workspaceId: "ws-123",
    };

    const result = analyticsFilterSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workspaceId).toBe("ws-123");
      expect(result.data.projectId).toBeUndefined();
      expect(result.data.startDate).toBeUndefined();
      expect(result.data.endDate).toBeUndefined();
    }
  });

  it("TC-ANA-VAL-02: parses valid filter with projectId and date range", () => {
    const input = {
      workspaceId: "ws-123",
      projectId: "proj-456",
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2026-08-31T23:59:59.999Z",
    };

    const result = analyticsFilterSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workspaceId).toBe("ws-123");
      expect(result.data.projectId).toBe("proj-456");
      expect(result.data.startDate).toBeInstanceOf(Date);
      expect(result.data.endDate).toBeInstanceOf(Date);
      expect(result.data.startDate?.toISOString()).toBe("2026-08-01T00:00:00.000Z");
      expect(result.data.endDate?.toISOString()).toBe("2026-08-31T23:59:59.999Z");
    }
  });

  it("TC-ANA-VAL-03: rejects missing or empty workspaceId", () => {
    const input = {
      workspaceId: "",
    };

    const result = analyticsFilterSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("workspaceId"));
      expect(issue).toBeDefined();
    }
  });

  it("TC-ANA-VAL-04: allows null values for optional filter fields", () => {
    const input = {
      workspaceId: "ws-123",
      projectId: null,
      startDate: null,
      endDate: null,
    };

    const result = analyticsFilterSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workspaceId).toBe("ws-123");
      expect(result.data.projectId).toBeNull();
      expect(result.data.startDate).toBeNull();
      expect(result.data.endDate).toBeNull();
    }
  });

  it("TC-ANA-VAL-05: rejects invalid date string formats", () => {
    const input = {
      workspaceId: "ws-123",
      startDate: "not-a-valid-date",
    };

    const result = analyticsFilterSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
