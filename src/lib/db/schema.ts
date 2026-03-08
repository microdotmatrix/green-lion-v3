import { relations, sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  approved: boolean("approved").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const adminInvite = pgTable(
  "admin_invite",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    invitedBy: text("invited_by").references(() => user.id, {
      onDelete: "set null",
    }),
    acceptedBy: text("accepted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("admin_invite_email_idx").on(table.email),
    index("admin_invite_invitedBy_idx").on(table.invitedBy),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  productCatalogs: many(productCatalogs),
  blogPosts: many(blogPosts),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Categories for organizing products
export const categories = pgTable("categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  headerImageProductId: varchar("header_image_product_id").references(
    (): any => products.id,
    { onDelete: "set null" },
  ),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  products: many(products),
  categoryAttributes: many(categoryAttributes),
  headerImageProduct: one(products, {
    fields: [categories.headerImageProductId],
    references: [products.id],
  }),
}));

// Products in the catalog
export const products = pgTable("products", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references((): any => categories.id, {
    onDelete: "set null",
  }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  images: jsonb("images")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  minimumOrderQuantity: integer("minimum_order_quantity").notNull().default(1),
  orderQuantityIncrement: integer("order_quantity_increment")
    .notNull()
    .default(1),
  logoCost: decimal("logo_cost", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  packagingCost: decimal("packaging_cost", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  pricingTiers: many(pricingTiers),
  productAttributes: many(productAttributes),
}));

// Tiered pricing for products based on quantity
export const pricingTiers = pgTable("pricing_tiers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  productId: varchar("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  minQuantity: integer("min_quantity").notNull(),
  pricePerUnit: decimal("price_per_unit", {
    precision: 10,
    scale: 2,
  }).notNull(),
});

export const pricingTiersRelations = relations(pricingTiers, ({ one }) => ({
  product: one(products, {
    fields: [pricingTiers.productId],
    references: [products.id],
  }),
}));

// Company-wide customization attributes (Size, Color, Logo, etc.)
export const customizationAttributes = pgTable("customization_attributes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  attributeType: text("attribute_type").notNull(), // 'text', 'number', 'boolean', 'select', 'multi_select'
  options: jsonb("options").$type<string[]>(), // For select and multi_select types
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customizationAttributesRelations = relations(
  customizationAttributes,
  ({ many }) => ({
    productAttributes: many(productAttributes),
    categoryAttributes: many(categoryAttributes),
  }),
);

// Junction table: which attributes apply to which products and their pricing
export const productAttributes = pgTable("product_attributes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  productId: varchar("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  attributeId: varchar("attribute_id")
    .notNull()
    .references(() => customizationAttributes.id, { onDelete: "cascade" }),
  required: boolean("required").notNull().default(false),
  additionalCost: decimal("additional_cost", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  supportedOptions: jsonb("supported_options").$type<string[]>(), // Specific option values this product supports for this attribute
});

export const productAttributesRelations = relations(
  productAttributes,
  ({ one }) => ({
    product: one(products, {
      fields: [productAttributes.productId],
      references: [products.id],
    }),
    attribute: one(customizationAttributes, {
      fields: [productAttributes.attributeId],
      references: [customizationAttributes.id],
    }),
  }),
);

// Junction table: which attributes apply to which categories
export const categoryAttributes = pgTable("category_attributes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  attributeId: varchar("attribute_id")
    .notNull()
    .references(() => customizationAttributes.id, { onDelete: "cascade" }),
  displayOrder: integer("display_order").notNull().default(0),
  activeOptions: jsonb("active_options").$type<string[]>(), // Category-specific options for select/multi_select attributes (null = all options allowed)
});

export const categoryAttributesRelations = relations(
  categoryAttributes,
  ({ one }) => ({
    category: one(categories, {
      fields: [categoryAttributes.categoryId],
      references: [categories.id],
    }),
    attribute: one(customizationAttributes, {
      fields: [categoryAttributes.attributeId],
      references: [customizationAttributes.id],
    }),
  }),
);

// Quote requests from customers
export const quoteRequests = pgTable("quote_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  quoteNumber: text("quote_number").unique(), // GLI-10001 format, generated on save
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  companyName: text("company_name").notNull(),
  title: text("title").notNull(),
  estimatedTotal: decimal("estimated_total", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("pending"), // 'pending', 'reviewed', 'quoted', 'closed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quoteRequestsRelations = relations(quoteRequests, ({ many }) => ({
  items: many(quoteItems),
}));

// Individual items in a quote request
export const quoteItems = pgTable("quote_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  quoteRequestId: varchar("quote_request_id")
    .notNull()
    .references(() => quoteRequests.id, { onDelete: "cascade" }),
  productId: varchar("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  customizations: jsonb("customizations")
    .$type<Record<string, any>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quoteRequest: one(quoteRequests, {
    fields: [quoteItems.quoteRequestId],
    references: [quoteRequests.id],
  }),
  product: one(products, {
    fields: [quoteItems.productId],
    references: [products.id],
  }),
}));

// Client testimonials
export const testimonials = pgTable("testimonials", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  quote: text("quote").notNull(),
  author: text("author").notNull(),
  authorTitle: text("author_title"),
  companyName: text("company_name").notNull(),
  companyLink: text("company_link"),
  companyLogo: text("company_logo"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Case studies
export const caseStudies = pgTable("case_studies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  productName: text("product_name").notNull(),
  brandName: text("brand_name").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  externalLink: text("external_link").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client logos for "Our Clients" section
export const clientLogos = pgTable("client_logos", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  logoUrl: text("logo_url").notNull(),
  externalLink: text("external_link").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  featuredOnHomepage: boolean("featured_on_homepage").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contact form submissions
export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  companyName: text("company_name").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  type: text("type").notNull().default("general"), // 'general', 'feedback', 'quote_inquiry', 'support'
  status: text("status").notNull().default("open"), // 'open', 'needs_review', 'closed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const contactSubmissionsRelations = relations(
  contactSubmissions,
  ({ many }) => ({
    replies: many(feedbackReplies),
  }),
);

// Admin replies to contact/feedback submissions
export const feedbackReplies = pgTable("feedback_replies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id")
    .notNull()
    .references(() => contactSubmissions.id, { onDelete: "cascade" }),
  adminUserId: text("admin_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const feedbackRepliesRelations = relations(
  feedbackReplies,
  ({ one }) => ({
    submission: one(contactSubmissions, {
      fields: [feedbackReplies.submissionId],
      references: [contactSubmissions.id],
    }),
    adminUser: one(user, {
      fields: [feedbackReplies.adminUserId],
      references: [user.id],
    }),
  }),
);

// Services offered by the company
export const services = pgTable("services", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  features: jsonb("features")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  iconName: text("icon_name"), // lucide-react icon name (e.g., 'Package', 'Cpu') - optional fallback if no image
  imageUrl: text("image_url"), // Custom uploaded image URL (preferred over icon)
  googleFormUrl: text("google_form_url"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Trade show representatives for lead capture
export const tradeshowReps = pgTable("tradeshow_reps", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(), // E.164 format: +12038140716
  slug: text("slug").notNull().unique(), // URL slug for public access
  company: text("company").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradeshowRepsRelations = relations(tradeshowReps, ({ many }) => ({
  categories: many(tradeshowRepCategories),
  products: many(tradeshowRepProducts),
  services: many(tradeshowRepServices),
  leads: many(tradeshowLeads),
}));

// Junction table: which categories each trade show rep displays
export const tradeshowRepCategories = pgTable("tradeshow_rep_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  repId: varchar("rep_id")
    .notNull()
    .references(() => tradeshowReps.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
});

export const tradeshowRepCategoriesRelations = relations(
  tradeshowRepCategories,
  ({ one }) => ({
    rep: one(tradeshowReps, {
      fields: [tradeshowRepCategories.repId],
      references: [tradeshowReps.id],
    }),
    category: one(categories, {
      fields: [tradeshowRepCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

// Junction table: which products each trade show rep displays
export const tradeshowRepProducts = pgTable("tradeshow_rep_products", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  repId: varchar("rep_id")
    .notNull()
    .references(() => tradeshowReps.id, { onDelete: "cascade" }),
  productId: varchar("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
});

export const tradeshowRepProductsRelations = relations(
  tradeshowRepProducts,
  ({ one }) => ({
    rep: one(tradeshowReps, {
      fields: [tradeshowRepProducts.repId],
      references: [tradeshowReps.id],
    }),
    product: one(products, {
      fields: [tradeshowRepProducts.productId],
      references: [products.id],
    }),
  }),
);

// Junction table: which services each trade show rep displays
export const tradeshowRepServices = pgTable("tradeshow_rep_services", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  repId: varchar("rep_id")
    .notNull()
    .references(() => tradeshowReps.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
});

export const tradeshowRepServicesRelations = relations(
  tradeshowRepServices,
  ({ one }) => ({
    rep: one(tradeshowReps, {
      fields: [tradeshowRepServices.repId],
      references: [tradeshowReps.id],
    }),
    service: one(services, {
      fields: [tradeshowRepServices.serviceId],
      references: [services.id],
    }),
  }),
);

// Trade show leads captured via QR code
export const tradeshowLeads = pgTable("tradeshow_leads", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  repId: varchar("rep_id")
    .notNull()
    .references(() => tradeshowReps.id, { onDelete: "cascade" }),
  leadName: text("lead_name").notNull(),
  leadCompany: text("lead_company"),
  contactMethod: text("contact_method")
    .notNull()
    .$type<"sms" | "whatsapp" | "gmail" | "applemail" | "otheremail">()
    .default("sms"),
  selectedCategoryIds: jsonb("selected_category_ids")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  selectedProductIds: jsonb("selected_product_ids")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  selectedServiceIds: jsonb("selected_service_ids")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  messageTemplate: text("message_template"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradeshowLeadsRelations = relations(tradeshowLeads, ({ one }) => ({
  rep: one(tradeshowReps, {
    fields: [tradeshowLeads.repId],
    references: [tradeshowReps.id],
  }),
}));

// Terms and Conditions (for legal pages with embedded PDFs)
export const termsConditions = pgTable("terms_conditions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  pdfUrl: text("pdf_url"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// PDF product catalogs uploaded by admins
export const productCatalogs = pgTable(
  "product_catalogs",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    displayName: text("display_name").notNull(),
    pdfUrl: text("pdf_url").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    notes: text("notes"),
    uploadedBy: text("uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("product_catalogs_uploadedBy_idx").on(table.uploadedBy),
    index("product_catalogs_isActive_idx").on(table.isActive),
  ],
);

// Blog categories
export const blogCategories = pgTable(
  "blog_categories",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("blog_categories_slug_idx").on(table.slug)],
);

// Blog posts
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    body: text("body").notNull(),
    excerpt: text("excerpt").notNull(),
    coverImageUrl: text("cover_image_url"),
    categoryId: varchar("category_id").references(() => blogCategories.id, {
      onDelete: "set null",
    }),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    status: text("status")
      .notNull()
      .default("draft")
      .$type<"draft" | "published">(),
    readTimeMinutes: integer("read_time_minutes").notNull().default(1),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("blog_posts_slug_idx").on(table.slug),
    index("blog_posts_categoryId_idx").on(table.categoryId),
    index("blog_posts_authorId_idx").on(table.authorId),
    index("blog_posts_status_idx").on(table.status),
  ],
);

export const productCatalogsRelations = relations(productCatalogs, ({ one }) => ({
  uploadedByUser: one(user, {
    fields: [productCatalogs.uploadedBy],
    references: [user.id],
  }),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  author: one(user, {
    fields: [blogPosts.authorId],
    references: [user.id],
  }),
}));

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPricingTierSchema = createInsertSchema(pricingTiers).omit({
  id: true,
});
export const insertCustomizationAttributeSchema = createInsertSchema(
  customizationAttributes,
).omit({ id: true, createdAt: true });
export const insertProductAttributeSchema = createInsertSchema(
  productAttributes,
).omit({ id: true });
export const insertCategoryAttributeSchema = createInsertSchema(
  categoryAttributes,
).omit({ id: true });
export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  createdAt: true,
});
export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({
  id: true,
});
export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
});
export const insertCaseStudySchema = createInsertSchema(caseStudies).omit({
  id: true,
  createdAt: true,
});
export const insertClientLogoSchema = createInsertSchema(clientLogos).omit({
  id: true,
  createdAt: true,
});
export const insertContactSubmissionSchema = createInsertSchema(
  contactSubmissions,
).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFeedbackReplySchema = createInsertSchema(
  feedbackReplies,
).omit({ id: true, sentAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});
export const insertTradeshowRepSchema = createInsertSchema(tradeshowReps).omit({
  id: true,
  createdAt: true,
});
export const insertTradeshowRepCategorySchema = createInsertSchema(
  tradeshowRepCategories,
).omit({ id: true });
export const insertTradeshowRepProductSchema = createInsertSchema(
  tradeshowRepProducts,
).omit({ id: true });
export const insertTradeshowRepServiceSchema = createInsertSchema(
  tradeshowRepServices,
).omit({ id: true });
export const insertTradeshowLeadSchema = createInsertSchema(
  tradeshowLeads,
).omit({ id: true, createdAt: true });
export const insertTermsConditionsSchema = createInsertSchema(
  termsConditions,
).omit({ id: true, createdAt: true });
export const insertProductCatalogSchema = createInsertSchema(productCatalogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
});
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Select types
export type Category = typeof categories.$inferSelect;
export type CategoryWithHeaderProduct = Category & {
  headerImageProduct?: Product | null;
};
export type Product = typeof products.$inferSelect;
export type PricingTier = typeof pricingTiers.$inferSelect;
export type CustomizationAttribute =
  typeof customizationAttributes.$inferSelect;
export type ProductAttribute = typeof productAttributes.$inferSelect;
export type CategoryAttribute = typeof categoryAttributes.$inferSelect;
export type CategoryAttributeWithAttribute = CategoryAttribute & {
  attribute: CustomizationAttribute;
};
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type CaseStudy = typeof caseStudies.$inferSelect;
export type ClientLogo = typeof clientLogos.$inferSelect;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type FeedbackReply = typeof feedbackReplies.$inferSelect;
export type Service = typeof services.$inferSelect;
export type TradeshowRep = typeof tradeshowReps.$inferSelect;
export type TradeshowRepCategory = typeof tradeshowRepCategories.$inferSelect;
export type TradeshowRepProduct = typeof tradeshowRepProducts.$inferSelect;
export type TradeshowRepService = typeof tradeshowRepServices.$inferSelect;
export type TradeshowLead = typeof tradeshowLeads.$inferSelect;
export type TermsConditions = typeof termsConditions.$inferSelect;
export type ProductCatalog = typeof productCatalogs.$inferSelect;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;

// Insert types
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;
export type InsertCustomizationAttribute = z.infer<
  typeof insertCustomizationAttributeSchema
>;
export type InsertProductAttribute = z.infer<
  typeof insertProductAttributeSchema
>;
export type InsertCategoryAttribute = z.infer<
  typeof insertCategoryAttributeSchema
>;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type InsertCaseStudy = z.infer<typeof insertCaseStudySchema>;
export type InsertClientLogo = z.infer<typeof insertClientLogoSchema>;
export type InsertContactSubmission = z.infer<
  typeof insertContactSubmissionSchema
>;
export type InsertFeedbackReply = z.infer<typeof insertFeedbackReplySchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertTradeshowRep = z.infer<typeof insertTradeshowRepSchema>;
export type InsertTradeshowRepCategory = z.infer<
  typeof insertTradeshowRepCategorySchema
>;
export type InsertTradeshowRepProduct = z.infer<
  typeof insertTradeshowRepProductSchema
>;
export type InsertTradeshowRepService = z.infer<
  typeof insertTradeshowRepServiceSchema
>;
export type InsertTradeshowLead = z.infer<typeof insertTradeshowLeadSchema>;
export type InsertTermsConditions = z.infer<typeof insertTermsConditionsSchema>;
export type InsertProductCatalog = z.infer<typeof insertProductCatalogSchema>;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
