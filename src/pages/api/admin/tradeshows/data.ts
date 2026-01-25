import { db } from "@/lib/db";
import {
  categories,
  products,
  services,
  tradeshowLeads,
  tradeshowRepCategories,
  tradeshowRepProducts,
  tradeshowReps,
  tradeshowRepServices,
} from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { desc, eq, sql } from "drizzle-orm";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch all categories
    const allCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .orderBy(categories.displayOrder, categories.name);

    // Fetch all products with images
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        images: products.images,
        categoryId: products.categoryId,
      })
      .from(products)
      .orderBy(products.name);

    // Fetch all services
    const allServices = await db
      .select({
        id: services.id,
        title: services.title,
        imageUrl: services.imageUrl,
        iconName: services.iconName,
      })
      .from(services)
      .orderBy(services.displayOrder);

    // Fetch all reps with their selections
    const reps = await db
      .select({
        id: tradeshowReps.id,
        name: tradeshowReps.name,
        email: tradeshowReps.email,
        phone: tradeshowReps.phone,
        slug: tradeshowReps.slug,
        company: tradeshowReps.company,
        active: tradeshowReps.active,
        createdAt: tradeshowReps.createdAt,
        leadCount: sql<number>`(SELECT COUNT(*) FROM tradeshow_leads WHERE tradeshow_leads.rep_id = ${tradeshowReps.id})`,
      })
      .from(tradeshowReps)
      .orderBy(desc(tradeshowReps.createdAt));

    // Get category selections for all reps
    const repCategories = await db
      .select({
        repId: tradeshowRepCategories.repId,
        categoryId: tradeshowRepCategories.categoryId,
      })
      .from(tradeshowRepCategories);

    // Get product selections for all reps
    const repProducts = await db
      .select({
        repId: tradeshowRepProducts.repId,
        productId: tradeshowRepProducts.productId,
      })
      .from(tradeshowRepProducts);

    // Get service selections for all reps
    const repServices = await db
      .select({
        repId: tradeshowRepServices.repId,
        serviceId: tradeshowRepServices.serviceId,
      })
      .from(tradeshowRepServices);

    // Fetch all leads with rep info
    const allLeads = await db
      .select({
        id: tradeshowLeads.id,
        repId: tradeshowLeads.repId,
        leadName: tradeshowLeads.leadName,
        leadCompany: tradeshowLeads.leadCompany,
        contactMethod: tradeshowLeads.contactMethod,
        selectedCategoryIds: tradeshowLeads.selectedCategoryIds,
        selectedProductIds: tradeshowLeads.selectedProductIds,
        selectedServiceIds: tradeshowLeads.selectedServiceIds,
        createdAt: tradeshowLeads.createdAt,
        repName: tradeshowReps.name,
      })
      .from(tradeshowLeads)
      .innerJoin(tradeshowReps, eq(tradeshowLeads.repId, tradeshowReps.id))
      .orderBy(desc(tradeshowLeads.createdAt));

    // Group selections by rep
    const categoryMap = new Map<string, string[]>();
    const productMap = new Map<string, string[]>();
    const serviceMap = new Map<string, string[]>();

    for (const rc of repCategories) {
      if (!categoryMap.has(rc.repId)) categoryMap.set(rc.repId, []);
      categoryMap.get(rc.repId)!.push(rc.categoryId);
    }

    for (const rp of repProducts) {
      if (!productMap.has(rp.repId)) productMap.set(rp.repId, []);
      productMap.get(rp.repId)!.push(rp.productId);
    }

    for (const rs of repServices) {
      if (!serviceMap.has(rs.repId)) serviceMap.set(rs.repId, []);
      serviceMap.get(rs.repId)!.push(rs.serviceId);
    }

    // Build rep data with selections
    const repsWithSelections = reps.map((rep) => ({
      ...rep,
      selectedCategoryIds: categoryMap.get(rep.id) || [],
      selectedProductIds: productMap.get(rep.id) || [],
      selectedServiceIds: serviceMap.get(rep.id) || [],
    }));

    return new Response(
      JSON.stringify({
        reps: repsWithSelections,
        categories: allCategories,
        products: allProducts,
        services: allServices,
        leads: allLeads,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching tradeshow data:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch tradeshow data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
