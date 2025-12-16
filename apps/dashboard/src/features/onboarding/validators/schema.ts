import { z } from "zod";

// --- Step 1: Basic Information ---
export const basicInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  recoveryEmail: z.email("Please enter a valid email address"),
  avatarUrl: z.string().optional(),
});

// --- Step 2: Organization ---
export const organizationSchema = z.object({
  orgName: z.string().min(3, "Organization name must be at least 3 characters"),
  orgSlug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and dashes",
    ),
  orgAvatarUrl: z.string(),
});

// --- Step 3: Plan Selection ---
export const planSelectionSchema = z.object({
  planId: z.enum(["starter", "pro", "enterprise"], {
    message: "Please select a plan to continue",
  }),
});

// --- Step 4: Billing ---
export const billingSchema = z.object({
  streetAddress: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid Zip Code"),
  country: z.string().min(2, "Country is required"),
});

// --- Step 5: Invite Members ---
export const inviteMembersSchema = z.object({
  invites: z
    .array(
      z.object({
        email: z.email("Invalid email address"),
        role: z.enum(["admin", "editor", "viewer"]),
      }),
    )
    .min(1, "Invite at least one member (or yourself)"),
});
