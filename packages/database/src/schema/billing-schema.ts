import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";

// Enums
export const usageTypeEnum = pgEnum("usage_type", [
  "encoding_minutes",
  "storage_gb",
  "ai_tokens",
  "bandwidth_gb",
  "live_streaming_minutes",
  "api_requests",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "paused",
  "incomplete", // Common Stripe status when payment fails initially
  "incomplete_expired",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
]);

// ============================================
// USAGE TRACKING
// ============================================

/**
 * Granular usage records for billing calculation
 * Aggregated periodically for invoicing
 * NEVER DELETE THESE.
 */
export const usageRecords = pgTable(
  "usage_record",
  {
    id: text("id").primaryKey(), // NanoID
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    type: usageTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(), // Units depend on type

    // Snapshot of cost at the moment of usage (Audit trail)
    unitCostCents: integer("unit_cost_cents"),

    // Period tracking (e.g., for the 'Oct 2025' invoice)
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),

    // Reference to what generated this usage
    resourceType: text("resource_type"), // 'video', 'stream', 'ai_job'
    resourceId: text("resource_id"), // e.g., video_123

    // Metadata for detailed breakdown
    metadata: jsonb("metadata").default({}), // { videoId: "xxx", resolution: "1080p" }

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("usage_orgId_period_idx").on(table.orgId, table.periodStart),
    index("usage_orgId_type_idx").on(table.orgId, table.type),
    index("usage_period_idx").on(table.periodStart, table.periodEnd),
  ],
);

/**
 * Daily aggregated usage for fast dashboard queries
 */
export const usageSummary = pgTable(
  "usage_summary",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(), // Truncated to YYYY-MM-DD

    // Aggregated totals by type
    encodingMinutes: integer("encoding_minutes").default(0).notNull(),
    storageGb: integer("storage_gb").default(0).notNull(),
    aiTokens: integer("ai_tokens").default(0).notNull(),
    bandwidthGb: integer("bandwidth_gb").default(0).notNull(),
    liveStreamingMinutes: integer("live_streaming_minutes")
      .default(0)
      .notNull(),
    apiRequests: integer("api_requests").default(0).notNull(),

    // Cost breakdown (in cents) for fast charts
    encodingCostCents: integer("encoding_cost_cents").default(0),
    storageCostCents: integer("storage_cost_cents").default(0),
    aiCostCents: integer("ai_cost_cents").default(0),
    bandwidthCostCents: integer("bandwidth_cost_cents").default(0),
    streamingCostCents: integer("streaming_cost_cents").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("usage_summary_orgId_date_idx").on(table.orgId, table.date),
  ],
);

// ============================================
// SUBSCRIPTIONS & BILLING
// ============================================

/**
 * Organization subscription plans
 */
export const subscriptions = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Stripe/Payment provider IDs
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),

    // Plan details
    planName: text("plan_name").notNull(), // 'free', 'starter', 'pro', 'enterprise'
    status: subscriptionStatusEnum("status").default("active").notNull(),

    // Billing period
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),

    // Trial info
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),

    // Cancellation
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    canceledAt: timestamp("canceled_at"),

    // Plan limits & Features (The "Source of Truth" for what they can do)
    // Example: { "encoding_limit": 1000, "can_use_ai": true }
    limits: jsonb("limits").default({}).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // ⚠️ Soft Delete: Keep history of old subscriptions
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("subscription_orgId_idx").on(table.orgId),
    index("subscription_stripeCustomerId_idx").on(table.stripeCustomerId),
  ],
);

/**
 * Invoice history
 */
export const invoices = pgTable(
  "invoice",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").references(() => subscriptions.id),

    // Stripe IDs
    stripeInvoiceId: text("stripe_invoice_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),

    // Invoice details
    status: invoiceStatusEnum("status").default("draft").notNull(),
    currency: text("currency").default("usd").notNull(),

    // Amounts (in cents)
    subtotalCents: integer("subtotal_cents").default(0).notNull(),
    taxCents: integer("tax_cents").default(0),
    discountCents: integer("discount_cents").default(0),
    totalCents: integer("total_cents").default(0).notNull(),

    // Period covered
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),

    // Line items breakdown (JSON is safer than a separate table for simple invoices)
    lineItems: jsonb("line_items").default([]),
    // Example: [{ description: "Encoding - 500 minutes", amount: 2500, quantity: 500 }]

    // URLs
    invoicePdfUrl: text("invoice_pdf_url"),
    hostedInvoiceUrl: text("hosted_invoice_url"),

    // Payment info
    paidAt: timestamp("paid_at"),
    dueDate: timestamp("due_date"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("invoice_orgId_idx").on(table.orgId),
    index("invoice_status_idx").on(table.status),
    index("invoice_stripeId_idx").on(table.stripeInvoiceId),
  ],
);

/**
 * Payment methods on file
 */
export const paymentMethods = pgTable(
  "payment_method",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    stripePaymentMethodId: text("stripe_payment_method_id").notNull(),

    // Card details (non-sensitive, for display)
    type: text("type").notNull(), // 'card', 'bank_account'
    brand: text("brand"), // 'visa', 'mastercard'
    last4: text("last4"),
    expiryMonth: integer("expiry_month"),
    expiryYear: integer("expiry_year"),

    isDefault: boolean("is_default").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete for cards user removed
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [index("payment_method_orgId_idx").on(table.orgId)],
);

// ============================================
// CREDITS & PROMOTIONAL
// ============================================

/**
 * Credit balance and transactions
 * Used for "Startup Credits" ($500 free) or Refunds
 */
export const credits = pgTable(
  "credit",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Transaction type
    type: text("type").notNull(), // 'grant', 'usage', 'refund', 'expiry'
    amountCents: integer("amount_cents").notNull(), // Positive for grants, negative for usage

    // Balance after this transaction (Ledger style)
    balanceAfterCents: integer("balance_after_cents").notNull(),

    // Reference
    description: text("description"),
    referenceType: text("reference_type"), // 'promo_code', 'invoice', 'manual'
    referenceId: text("reference_id"),

    // Expiration for promotional credits
    expiresAt: timestamp("expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("credit_orgId_idx").on(table.orgId),
    index("credit_orgId_createdAt_idx").on(table.orgId, table.createdAt),
  ],
);

// ============================================
// RELATIONS
// ============================================

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  organization: one(organization, {
    fields: [usageRecords.orgId],
    references: [organization.id],
  }),
}));

export const usageSummaryRelations = relations(usageSummary, ({ one }) => ({
  organization: one(organization, {
    fields: [usageSummary.orgId],
    references: [organization.id],
  }),
}));

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [subscriptions.orgId],
      references: [organization.id],
    }),
    invoices: many(invoices),
  }),
);

export const invoicesRelations = relations(invoices, ({ one }) => ({
  organization: one(organization, {
    fields: [invoices.orgId],
    references: [organization.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  organization: one(organization, {
    fields: [paymentMethods.orgId],
    references: [organization.id],
  }),
}));

export const creditsRelations = relations(credits, ({ one }) => ({
  organization: one(organization, {
    fields: [credits.orgId],
    references: [organization.id],
  }),
}));
