import type { Express, Response } from "express";
import { db } from "../db";
import { servicePackages, packageServices, services, salons } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { authenticateMobileUser } from "../middleware/authMobile";

export function registerMobilePackagesRoutes(app: Express) {
  // Get all active packages for a salon
  app.get("/api/mobile/salons/:salonId/packages", async (req: any, res: Response) => {
    try {
      const { salonId } = req.params;

      // Verify salon exists and is active
      const salon = await db.query.salons.findFirst({
        where: eq(salons.id, salonId),
      });

      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }

      // Get all active packages for the salon
      const packages = await db
        .select({
          id: servicePackages.id,
          name: servicePackages.name,
          description: servicePackages.description,
          regularPriceInPaisa: servicePackages.regularPriceInPaisa,
          packagePriceInPaisa: servicePackages.packagePriceInPaisa,
          totalDurationMinutes: servicePackages.totalDurationMinutes,
          discountPercentage: servicePackages.discountPercentage,
          validFrom: servicePackages.validFrom,
          validUntil: servicePackages.validUntil,
          isActive: servicePackages.isActive,
          serviceCount: sql<number>`(
            SELECT COUNT(*) FROM ${packageServices} 
            WHERE ${packageServices.packageId} = ${servicePackages.id}
          )`,
        })
        .from(servicePackages)
        .where(
          and(
            eq(servicePackages.salonId, salonId),
            eq(servicePackages.isActive, true)
          )
        )
        .orderBy(desc(servicePackages.createdAt));

      // Filter out expired packages
      const now = new Date();
      const activePackages = packages.filter((pkg) => {
        if (pkg.validFrom && new Date(pkg.validFrom) > now) return false;
        if (pkg.validUntil && new Date(pkg.validUntil) < now) return false;
        return true;
      });

      res.json({
        success: true,
        packages: activePackages.map((pkg) => ({
          ...pkg,
          regularPrice: pkg.regularPriceInPaisa / 100,
          packagePrice: pkg.packagePriceInPaisa / 100,
          savings: (pkg.regularPriceInPaisa - pkg.packagePriceInPaisa) / 100,
          savingsPercentage: pkg.discountPercentage || 
            Math.round(((pkg.regularPriceInPaisa - pkg.packagePriceInPaisa) / pkg.regularPriceInPaisa) * 100),
        })),
      });
    } catch (error) {
      console.error("Error fetching salon packages:", error);
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  // Get package details with services
  app.get("/api/mobile/salons/:salonId/packages/:packageId", async (req: any, res: Response) => {
    try {
      const { salonId, packageId } = req.params;

      // Verify salon exists
      const salon = await db.query.salons.findFirst({
        where: eq(salons.id, salonId),
      });

      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }

      // Get package details
      const packageData = await db.query.servicePackages.findFirst({
        where: and(
          eq(servicePackages.id, packageId),
          eq(servicePackages.salonId, salonId)
        ),
      });

      if (!packageData) {
        return res.status(404).json({ error: "Package not found" });
      }

      if (!packageData.isActive) {
        return res.status(400).json({ error: "Package is not currently available" });
      }

      // Check validity dates
      const now = new Date();
      if (packageData.validFrom && new Date(packageData.validFrom) > now) {
        return res.status(400).json({ error: "Package is not yet available" });
      }
      if (packageData.validUntil && new Date(packageData.validUntil) < now) {
        return res.status(400).json({ error: "Package has expired" });
      }

      // Get services included in the package
      const packageServicesList = await db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
          category: services.category,
          subCategory: services.subCategory,
          priceInPaisa: services.priceInPaisa,
          durationMinutes: services.durationMinutes,
          imageUrl: services.imageUrl,
          quantity: packageServices.quantity,
        })
        .from(packageServices)
        .innerJoin(services, eq(packageServices.serviceId, services.id))
        .where(eq(packageServices.packageId, packageId));

      res.json({
        success: true,
        package: {
          id: packageData.id,
          salonId: packageData.salonId,
          name: packageData.name,
          description: packageData.description,
          regularPriceInPaisa: packageData.regularPriceInPaisa,
          packagePriceInPaisa: packageData.packagePriceInPaisa,
          totalDurationMinutes: packageData.totalDurationMinutes,
          discountPercentage: packageData.discountPercentage,
          regularPrice: packageData.regularPriceInPaisa / 100,
          packagePrice: packageData.packagePriceInPaisa / 100,
          savings: (packageData.regularPriceInPaisa - packageData.packagePriceInPaisa) / 100,
          savingsPercentage: packageData.discountPercentage || 
            Math.round(((packageData.regularPriceInPaisa - packageData.packagePriceInPaisa) / packageData.regularPriceInPaisa) * 100),
          validFrom: packageData.validFrom,
          validUntil: packageData.validUntil,
          isActive: packageData.isActive,
          services: packageServicesList.map((svc) => ({
            ...svc,
            price: svc.priceInPaisa / 100,
          })),
        },
        salon: {
          id: salon.id,
          name: salon.name,
          address: salon.address,
          imageUrl: salon.imageUrl,
        },
      });
    } catch (error) {
      console.error("Error fetching package details:", error);
      res.status(500).json({ error: "Failed to fetch package details" });
    }
  });

  console.log("✅ Mobile package routes registered");
}
