import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  priceId: z.string().min(1, "Price ID is required"),
  returnUrl: z.string().min(1, "Return URL is required"),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

export const createCustomerPortalSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  returnUrl: z.string().min(1, "Return URL is required").optional(),
});

export type CreateCustomerPortalInput = z.infer<typeof createCustomerPortalSchema>;
