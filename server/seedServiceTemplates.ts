/**
 * Seed Script for Service Templates
 * Populates the service_templates table with comprehensive service library
 * Run with: npx tsx server/seedServiceTemplates.ts
 */

import { db } from "./db";
import { serviceTemplates } from "@shared/schema";
import { allServiceTemplates, serviceTemplatesSummary } from "@shared/serviceTemplatesData";
import { sql } from "drizzle-orm";

async function seedServiceTemplates() {
  console.log("🌱 Starting service templates seed...");
  console.log(`📊 Total services to insert: ${serviceTemplatesSummary.totalServices}`);
  console.log("\n📋 Services by category:");
  Object.entries(serviceTemplatesSummary.categories).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count} services`);
  });
  console.log("\n");

  try {
    const BATCH_SIZE = 50;
    let insertedCount = 0;
    let totalProcessed = 0;

    const valuesToInsert = allServiceTemplates.map(template => ({
      name: template.name,
      description: template.description,
      category: template.category,
      subCategory: template.subCategory || null,
      gender: template.gender,
      suggestedDurationMinutes: template.suggestedDurationMinutes,
      suggestedPriceInPaisa: template.suggestedPriceInPaisa,
      currency: 'INR' as const,
      isPopular: template.isPopular ? 1 : 0,
      tags: template.tags || [],
      isActive: 1,
      sortOrder: 0,
      imageUrl: null,
    }));

    for (let i = 0; i < valuesToInsert.length; i += BATCH_SIZE) {
      const batch = valuesToInsert.slice(i, i + BATCH_SIZE);
      
      try {
        const result = await db
          .insert(serviceTemplates)
          .values(batch)
          .onConflictDoNothing({
            target: [serviceTemplates.name, serviceTemplates.category, serviceTemplates.gender]
          })
          .returning({ id: serviceTemplates.id });

        insertedCount += result.length;
        totalProcessed += batch.length;
        console.log(`   ✓ Processed ${totalProcessed}/${valuesToInsert.length} services (${insertedCount} new)...`);
      } catch (error: any) {
        console.error(`   ❌ Error inserting batch starting at index ${i}:`, error.message);
        totalProcessed += batch.length;
      }
    }

    console.log("\n✅ Seed completed!");
    console.log(`   ✓ Inserted: ${insertedCount} new services`);
    console.log(`   ⊘ Skipped: ${totalProcessed - insertedCount} duplicates`);

    const totalInDb = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceTemplates);

    console.log(`\n📊 Total services in database: ${totalInDb[0].count}`);

  } catch (error) {
    console.error("❌ Fatal error during seeding:", error);
    throw error;
  }
}

seedServiceTemplates()
  .then(() => {
    console.log("\n🎉 Service templates seeded successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });

export { seedServiceTemplates };
