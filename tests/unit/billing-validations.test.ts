import { describe, it, expect } from "vitest";
import {
  createCheckoutSessionSchema,
  createCustomerPortalSchema,
} from "@/lib/validations/billing";

describe("Billing Validation Schemas", () => {
  describe("createCheckoutSessionSchema", () => {
    it("validates valid checkout session parameters", () => {
      const input = {
        workspaceId: "ws-123",
        priceId: "price_pro_monthly",
        returnUrl: "http://localhost:3000/ws-123/settings/billing",
      };

      const parsed = createCheckoutSessionSchema.safeParse(input);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(input);
      }
    });

    it("rejects empty workspaceId", () => {
      const input = {
        workspaceId: "",
        priceId: "price_pro_monthly",
        returnUrl: "http://localhost:3000/ws-123/settings/billing",
      };

      const parsed = createCheckoutSessionSchema.safeParse(input);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].path).toContain("workspaceId");
      }
    });

    it("rejects empty priceId", () => {
      const input = {
        workspaceId: "ws-123",
        priceId: "",
        returnUrl: "http://localhost:3000/ws-123/settings/billing",
      };

      const parsed = createCheckoutSessionSchema.safeParse(input);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].path).toContain("priceId");
      }
    });

    it("rejects empty returnUrl", () => {
      const input = {
        workspaceId: "ws-123",
        priceId: "price_pro_monthly",
        returnUrl: "",
      };

      const parsed = createCheckoutSessionSchema.safeParse(input);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].path).toContain("returnUrl");
      }
    });
  });

  describe("createCustomerPortalSchema", () => {
    it("validates valid customer portal input with returnUrl", () => {
      const input = {
        workspaceId: "ws-123",
        returnUrl: "http://localhost:3000/ws-123/settings/billing",
      };

      const parsed = createCustomerPortalSchema.safeParse(input);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(input);
      }
    });

    it("validates valid customer portal input without returnUrl", () => {
      const input = {
        workspaceId: "ws-123",
      };

      const parsed = createCustomerPortalSchema.safeParse(input);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.workspaceId).toBe("ws-123");
        expect(parsed.data.returnUrl).toBeUndefined();
      }
    });

    it("rejects empty workspaceId", () => {
      const input = {
        workspaceId: "",
      };

      const parsed = createCustomerPortalSchema.safeParse(input);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].path).toContain("workspaceId");
      }
    });
  });
});
