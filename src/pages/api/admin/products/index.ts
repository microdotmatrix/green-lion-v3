import { db } from "@/lib/db";
import {
  categories,
  insertProductSchema,
  pricingTiers,
  productAttributes,
  products,
} from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";

export const GET: APIRoute = async ({ url, locals }) => {
  // Check authentication
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const attributeId = searchParams.get("attributeId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
        ),
      );
    }
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    if (attributeId) {
      conditions.push(
        sql`exists (
          select 1 from ${productAttributes}
          where ${productAttributes.productId} = ${products.id}
            and ${productAttributes.attributeId} = ${attributeId}
        )`,
      );
    }

    const minPriceSubquery = db
      .select({
        productId: pricingTiers.productId,
        minPrice: sql<number>`min(${pricingTiers.pricePerUnit})`,
      })
      .from(pricingTiers)
      .groupBy(pricingTiers.productId)
      .as("min_price");

    const sortMap = {
      createdAt: products.createdAt,
      title: products.name,
      sku: products.sku,
      category: categories.name,
    } as const;
    const sortColumn =
      sortBy === "price"
        ? minPriceSubquery.minPrice
        : sortMap[sortBy as keyof typeof sortMap] ?? products.createdAt;

    // Fetch products with category names
    const productsQuery = db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        description: products.description,
        images: products.images,
        categoryId: products.categoryId,
        categoryName: categories.name,
        minimumOrderQuantity: products.minimumOrderQuantity,
        orderQuantityIncrement: products.orderQuantityIncrement,
        logoCost: products.logoCost,
        packagingCost: products.packagingCost,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(minPriceSubquery, eq(products.id, minPriceSubquery.productId))
      .where(
        conditions.length > 0
          ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
          : undefined,
      )
      .orderBy(sortDir === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    // Count total
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(
        conditions.length > 0
          ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
          : undefined,
      );

    const [productsList, countResult] = await db.batch([
      productsQuery,
      countQuery,
    ] as const);
    const total = countResult[0]?.count ?? 0;

    // Get price ranges for each product
    const productIds = productsList.map((p) => p.id);
    let priceRanges: Record<string, { min: string; max: string }> = {};

    if (productIds.length > 0) {
      const tiers = await db
        .select({
          productId: pricingTiers.productId,
          minPrice: sql<string>`min(${pricingTiers.pricePerUnit})`,
          maxPrice: sql<string>`max(${pricingTiers.pricePerUnit})`,
        })
        .from(pricingTiers)
        .where(sql`${pricingTiers.productId} IN ${productIds}`)
        .groupBy(pricingTiers.productId);

      priceRanges = Object.fromEntries(
        tiers.map((t) => [t.productId, { min: t.minPrice, max: t.maxPrice }]),
      );
    }

    const result = productsList.map((product) => ({
      ...product,
      priceRange: priceRanges[product.id] || null,
    }));

    return new Response(
      JSON.stringify({
        products: result,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch products" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { pricingTiers: tiersData, ...productData } = body;

    // Validate product input
    const parsed = insertProductSchema.safeParse(productData);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid data",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check SKU uniqueness
    const [existingSku] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, parsed.data.sku));

    if (existingSku) {
      return new Response(JSON.stringify({ error: "SKU already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create product
    const [newProduct] = await db
      .insert(products)
      .values(parsed.data)
      .returning();

    // Create pricing tiers if provided
    if (tiersData && Array.isArray(tiersData) && tiersData.length > 0) {
      await db.insert(pricingTiers).values(
        tiersData.map(
          (tier: { minQuantity: number; pricePerUnit: string }) => ({
            productId: newProduct.id,
            minQuantity: tier.minQuantity,
            pricePerUnit: tier.pricePerUnit,
          }),
        ),
      );
    }

    return new Response(JSON.stringify(newProduct), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return new Response(JSON.stringify({ error: "Failed to create product" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
