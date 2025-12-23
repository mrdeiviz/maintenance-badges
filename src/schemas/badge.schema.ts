import { z } from "zod";

export const BadgeParamsSchema = z.object({
  platform: z.enum(["github"]),
  username: z
    .string()
    .min(1, "Username is required")
    .max(39, "Username is too long")
    .regex(/^[a-zA-Z0-9-]+$/, "Username contains invalid characters"),
  goal: z.coerce
    .number()
    .positive("Goal must be greater than 0")
    .max(1_000_000_000, "Goal is too large"),
});

export const BadgeQuerySchema = z.object({
  style: z.enum(["flat", "flat-square", "for-the-badge"]).default("flat"),
  label: z.string().max(50, "Label is too long").default("Funding"),
  logo: z
    .string()
    .max(20, "Logo name is too long")
    .regex(/^[a-z0-9-]+$/, "Logo name contains invalid characters")
    .optional(),
  color: z
    .string()
    .regex(/^[0-9a-f]{6}$/i, "Color must be a valid hex color (e.g., ff5733)")
    .optional(),
  refresh: z
    .enum(["true", "false", "1", "0"])
    .transform((val) => val === "true" || val === "1")
    .default("false"),
  demo: z
    .enum(["true", "false", "1", "0"])
    .transform((val) => val === "true" || val === "1")
    .optional(),
  current: z.coerce
    .number()
    .positive("Current amount must be greater than 0")
    .max(1_000_000_000, "Current amount is too large")
    .optional(),
});

export type BadgeParams = z.infer<typeof BadgeParamsSchema>;
export type BadgeQuery = z.infer<typeof BadgeQuerySchema>;
