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

import { generateId } from "../utils/id";
import { organization } from "./auth-schema";

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
  "incomplete",
  "incomplete_expired",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
]);

export const usageRecords = pgTable(
  "usage_record",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("ur")), // Unique identifier for the usage record
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the usage record
    type: usageTypeEnum("type").notNull(), // The type of usage
    quantity: integer("quantity").notNull(), // The quantity of usage
    unitCostCents: integer("unit_cost_cents"), // The cost per unit in cents
    periodStart: timestamp("period_start").notNull(), // The start of the usage period
    periodEnd: timestamp("period_end").notNull(), // The end of the usage period
    resourceType: text("resource_type"), // The type of resource used
    resourceId: text("resource_id"), // The ID of the resource used
    metadata: jsonb("metadata").default({}), // Metadata associated with the usage record
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the usage record was created
  },
  (table) => [
    index("usage_orgId_period_idx").on(table.orgId, table.periodStart),
    index("usage_orgId_type_idx").on(table.orgId, table.type),
    index("usage_period_idx").on(table.periodStart, table.periodEnd),
  ],
);

export const usageSummary = pgTable(
  "usage_summary",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("usum")), // Unique identifier for the usage summary
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the usage summary
    date: timestamp("date").notNull(), // The date of the usage summary
    encodingMinutes: integer("encoding_minutes").default(0).notNull(), // The total encoding minutes
    storageGb: integer("storage_gb").default(0).notNull(), // The total storage in GB
    aiTokens: integer("ai_tokens").default(0).notNull(), // The total AI tokens used
    bandwidthGb: integer("bandwidth_gb").default(0).notNull(), // The total bandwidth in GB
    liveStreamingMinutes: integer("live_streaming_minutes")
      .default(0)
      .notNull(), // The total live streaming minutes
    apiRequests: integer("api_requests").default(0).notNull(), // The total API requests
    encodingCostCents: integer("encoding_cost_cents").default(0), // The cost of encoding in cents
    storageCostCents: integer("storage_cost_cents").default(0), // The cost of storage in cents
    aiCostCents: integer("ai_cost_cents").default(0), // The cost of AI in cents
    bandwidthCostCents: integer("bandwidth_cost_cents").default(0), // The cost of bandwidth in cents
    streamingCostCents: integer("streaming_cost_cents").default(0), // The cost of streaming in cents
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the usage summary was created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // The timestamp when the usage summary was last updated
  },
  (table) => [
    index("usage_summary_orgId_date_idx").on(table.orgId, table.date),
  ],
);

export const subscriptions = pgTable(
  "subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("sub")), // Unique identifier for the subscription
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the subscription
    stripeCustomerId: text("stripe_customer_id"), // The Stripe customer ID
    stripeSubscriptionId: text("stripe_subscription_id"), // The Stripe subscription ID
    stripePriceId: text("stripe_price_id"), // The Stripe price ID
    planName: text("plan_name").notNull(), // The name of the plan
    status: subscriptionStatusEnum("status").default("active").notNull(), // The status of the subscription
    currentPeriodStart: timestamp("current_period_start").notNull(), // The start of the current billing period
    currentPeriodEnd: timestamp("current_period_end").notNull(), // The end of the current billing period
    trialStart: timestamp("trial_start"), // The start of the trial period
    trialEnd: timestamp("trial_end"), // The end of the trial period
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false), // Whether the subscription will cancel at the end of the period
    canceledAt: timestamp("canceled_at"), // The timestamp when the subscription was canceled
    limits: jsonb("limits").default({}).notNull(), // The limits associated with the subscription
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the subscription was created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // The timestamp when the subscription was last updated
    deletedAt: timestamp("deleted_at"), // The timestamp when the subscription was deleted
  },
  (table) => [
    index("subscription_orgId_idx").on(table.orgId),
    index("subscription_stripeCustomerId_idx").on(table.stripeCustomerId),
  ],
);

export const invoices = pgTable(
  "invoice",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("inv")), // Unique identifier for the invoice
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the invoice
    subscriptionId: text("subscription_id").references(() => subscriptions.id), // The subscription associated with the invoice
    stripeInvoiceId: text("stripe_invoice_id"), // The Stripe invoice ID
    stripePaymentIntentId: text("stripe_payment_intent_id"), // The Stripe payment intent ID
    status: invoiceStatusEnum("status").default("draft").notNull(), // The status of the invoice
    currency: text("currency").default("usd").notNull(), // The currency of the invoice
    subtotalCents: integer("subtotal_cents").default(0).notNull(), // The subtotal in cents
    taxCents: integer("tax_cents").default(0), // The tax in cents
    discountCents: integer("discount_cents").default(0), // The discount in cents
    totalCents: integer("total_cents").default(0).notNull(), // The total in cents
    periodStart: timestamp("period_start").notNull(), // The start of the billing period
    periodEnd: timestamp("period_end").notNull(), // The end of the billing period
    lineItems: jsonb("line_items").default([]), // The line items of the invoice
    invoicePdfUrl: text("invoice_pdf_url"), // The URL of the invoice PDF
    hostedInvoiceUrl: text("hosted_invoice_url"), // The URL of the hosted invoice
    paidAt: timestamp("paid_at"), // The timestamp when the invoice was paid
    dueDate: timestamp("due_date"), // The due date of the invoice
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the invoice was created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // The timestamp when the invoice was last updated
  },
  (table) => [
    index("invoice_orgId_idx").on(table.orgId),
    index("invoice_status_idx").on(table.status),
    index("invoice_stripeId_idx").on(table.stripeInvoiceId),
  ],
);

export const paymentMethods = pgTable(
  "payment_method",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("pm")), // Unique identifier for the payment method
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the payment method
    stripePaymentMethodId: text("stripe_payment_method_id").notNull(), // The Stripe payment method ID
    type: text("type").notNull(), // The type of payment method
    brand: text("brand"), // The brand of the payment method
    last4: text("last4"), // The last 4 digits of the payment method
    expiryMonth: integer("expiry_month"), // The expiry month of the payment method
    expiryYear: integer("expiry_year"), // The expiry year of the payment method
    isDefault: boolean("is_default").default(false).notNull(), // Whether the payment method is the default
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the payment method was created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // The timestamp when the payment method was last updated
    deletedAt: timestamp("deleted_at"), // The timestamp when the payment method was deleted
  },
  (table) => [index("payment_method_orgId_idx").on(table.orgId)],
);

export const credits = pgTable(
  "credit",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("cr")), // Unique identifier for the credit
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the credit
    type: text("type").notNull(), // The type of credit transaction
    amountCents: integer("amount_cents").notNull(), // The amount in cents
    balanceAfterCents: integer("balance_after_cents").notNull(), // The balance after the transaction in cents
    description: text("description"), // The description of the credit
    referenceType: text("reference_type"), // The reference type
    referenceId: text("reference_id"), // The reference ID
    expiresAt: timestamp("expires_at"), // The timestamp when the credit expires
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the credit was created
  },
  (table) => [
    index("credit_orgId_idx").on(table.orgId),
    index("credit_orgId_createdAt_idx").on(table.orgId, table.createdAt),
  ],
);

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
