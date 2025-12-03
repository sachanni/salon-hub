import type { Express, Request, Response, NextFunction } from "express";
import { eq, and, desc, asc, sql, inArray, like, or } from "drizzle-orm";
import { db } from "../db";
import {
  products,
  productCategories,
  shoppingCarts,
  cartItems,
  wishlists,
  productOrders,
  productOrderItems,
  productReviews,
  salons,
  users,
  addToCartSchema,
  updateCartItemSchema,
  createProductOrderSchema,
} from "../../shared/schema";
import { authenticateMobileUser } from "../middleware/authMobile";
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export function registerShopRoutes(app: Express) {
  
  // =================================================================
  // PRODUCT CATEGORIES (PUBLIC)
  // =================================================================
  
  app.get("/api/shop/categories", async (req: Request, res: Response) => {
    try {
      const categories = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.isActive, 1))
        .orderBy(asc(productCategories.sortOrder));
      
      res.json({ success: true, categories });
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  // =================================================================
  // PRODUCTS (PUBLIC)
  // =================================================================
  
  app.get("/api/shop/products", async (req: Request, res: Response) => {
    try {
      const {
        categoryId,
        salonId,
        search,
        minPrice,
        maxPrice,
        sortBy = 'newest',
        limit = '20',
        offset = '0',
      } = req.query;
      
      let query = db
        .select({
          id: products.id,
          salonId: products.salonId,
          categoryId: products.categoryId,
          name: products.name,
          description: products.description,
          brand: products.brand,
          pricePaisa: products.retailPriceInPaisa,
          originalPricePaisa: products.sellingPriceInPaisa,
          stockQuantity: products.currentStock,
          size: products.size,
          unit: products.unit,
          metadata: products.metadata,
          tags: products.tags,
          isActive: products.isActive,
          availableForRetail: products.availableForRetail,
          createdAt: products.createdAt,
          salon: {
            id: salons.id,
            name: salons.name,
            imageUrl: salons.imageUrl,
          },
        })
        .from(products)
        .leftJoin(salons, eq(products.salonId, salons.id))
        .where(
          and(
            eq(products.isActive, 1),
            eq(products.availableForRetail, 1),
            categoryId ? eq(products.categoryId, categoryId as string) : undefined,
            salonId ? eq(products.salonId, salonId as string) : undefined,
            search ? or(
              like(products.name, `%${search}%`),
              like(products.description, `%${search}%`),
              like(products.brand, `%${search}%`)
            ) : undefined,
            minPrice ? sql`${products.retailPriceInPaisa} >= ${parseInt(minPrice as string)}` : undefined,
            maxPrice ? sql`${products.retailPriceInPaisa} <= ${parseInt(maxPrice as string)}` : undefined
          )
        )
        .$dynamic();
      
      switch (sortBy) {
        case 'price_low':
          query = query.orderBy(asc(products.retailPriceInPaisa));
          break;
        case 'price_high':
          query = query.orderBy(desc(products.retailPriceInPaisa));
          break;
        default:
          query = query.orderBy(desc(products.createdAt));
      }
      
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      query = query.limit(limitNum).offset(offsetNum);
      
      const productList = await query;
      
      res.json({ success: true, products: productList, limit: limitNum, offset: offsetNum });
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  app.get("/api/shop/products/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const product = await db
        .select()
        .from(products)
        .leftJoin(salons, eq(products.salonId, salons.id))
        .where(
          and(
            eq(products.id, id),
            eq(products.isActive, 1),
            eq(products.availableForRetail, 1)
          )
        )
        .limit(1);
      
      if (!product || product.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const reviews = await db
        .select()
        .from(productReviews)
        .leftJoin(users, eq(productReviews.userId, users.id))
        .where(
          and(
            eq(productReviews.productId, id),
            eq(productReviews.isVisible, 1)
          )
        )
        .orderBy(desc(productReviews.createdAt));
      
      res.json({ success: true, product: product[0], reviews });
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });
  
  // =================================================================
  // SHOPPING CART (PROTECTED)
  // =================================================================
  
  app.get("/api/shop/cart", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      
      const userCarts = await db
        .select()
        .from(shoppingCarts)
        .where(
          and(
            eq(shoppingCarts.userId, userId),
            eq(shoppingCarts.status, 'active')
          )
        );
      
      if (!userCarts || userCarts.length === 0) {
        return res.json({ success: true, cart: [] });
      }
      
      const cartIds = userCarts.map(c => c.id);
      
      const cart = await db
        .select()
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.id))
        .leftJoin(salons, eq(products.salonId, salons.id))
        .where(inArray(cartItems.cartId, cartIds))
        .orderBy(desc(cartItems.addedAt));
      
      res.json({ success: true, cart });
    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });
  
  app.post("/api/shop/cart", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const validated = addToCartSchema.parse(req.body);
      const { salonId, productId, quantity } = validated;
      
      const product = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, productId),
            eq(products.isActive, 1),
            eq(products.availableForRetail, 1)
          )
        )
        .limit(1);
      
      if (!product || product.length === 0) {
        return res.status(404).json({ error: "Product not found or not available" });
      }
      
      if (parseFloat(product[0].currentStock) < quantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      
      let cart = await db
        .select()
        .from(shoppingCarts)
        .where(
          and(
            eq(shoppingCarts.userId, userId),
            eq(shoppingCarts.salonId, salonId),
            eq(shoppingCarts.status, 'active')
          )
        )
        .limit(1);
      
      if (!cart || cart.length === 0) {
        const newCart = await db
          .insert(shoppingCarts)
          .values({ userId, salonId, status: 'active' })
          .returning();
        cart = newCart;
      }
      
      const cartId = cart[0].id;
      const price = product[0].retailPriceInPaisa || 0;
      
      const existingCartItem = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cartId),
            eq(cartItems.productId, productId)
          )
        )
        .limit(1);
      
      if (existingCartItem && existingCartItem.length > 0) {
        await db
          .update(cartItems)
          .set({ 
            quantity: existingCartItem[0].quantity + quantity,
            currentPricePaisa: price,
          })
          .where(eq(cartItems.id, existingCartItem[0].id));
        
        res.json({ success: true, message: "Cart updated successfully" });
      } else {
        await db
          .insert(cartItems)
          .values({ 
            cartId, 
            productId, 
            quantity,
            priceAtAddPaisa: price,
            currentPricePaisa: price,
          })
          .returning();
        
        res.json({ success: true, message: "Added to cart" });
      }
    } catch (error: any) {
      console.error("Add to cart error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });
  
  app.patch("/api/shop/cart/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const validated = updateCartItemSchema.parse(req.body);
      const { quantity } = validated;
      
      const cartItem = await db
        .select()
        .from(cartItems)
        .innerJoin(shoppingCarts, eq(cartItems.cartId, shoppingCarts.id))
        .where(
          and(
            eq(cartItems.id, id),
            eq(shoppingCarts.userId, userId)
          )
        )
        .limit(1);
      
      if (!cartItem || cartItem.length === 0) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      if (quantity === 0) {
        await db.delete(cartItems).where(eq(cartItems.id, id));
        return res.json({ success: true, message: "Item removed from cart" });
      }
      
      await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id));
      res.json({ success: true, message: "Cart updated successfully" });
    } catch (error: any) {
      console.error("Update cart error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update cart" });
    }
  });
  
  app.delete("/api/shop/cart/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const cartItem = await db
        .select()
        .from(cartItems)
        .innerJoin(shoppingCarts, eq(cartItems.cartId, shoppingCarts.id))
        .where(
          and(
            eq(cartItems.id, id),
            eq(shoppingCarts.userId, userId)
          )
        )
        .limit(1);
      
      if (!cartItem || cartItem.length === 0) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      await db.delete(cartItems).where(eq(cartItems.id, id));
      res.json({ success: true, message: "Item removed from cart" });
    } catch (error) {
      console.error("Remove from cart error:", error);
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });
  
  app.delete("/api/shop/cart", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      
      const userCarts = await db
        .select()
        .from(shoppingCarts)
        .where(
          and(
            eq(shoppingCarts.userId, userId),
            eq(shoppingCarts.status, 'active')
          )
        );
      
      if (userCarts && userCarts.length > 0) {
        const cartIds = userCarts.map(c => c.id);
        await db.delete(cartItems).where(inArray(cartItems.cartId, cartIds));
      }
      
      res.json({ success: true, message: "Cart cleared successfully" });
    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });
  
  // =================================================================
  // WISHLIST (PROTECTED)
  // =================================================================
  
  app.get("/api/shop/wishlist", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      
      const wishlist = await db
        .select()
        .from(wishlists)
        .leftJoin(products, eq(wishlists.productId, products.id))
        .leftJoin(salons, eq(products.salonId, salons.id))
        .where(eq(wishlists.userId, userId))
        .orderBy(desc(wishlists.addedAt));
      
      res.json({ success: true, wishlist });
    } catch (error) {
      console.error("Get wishlist error:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });
  
  app.post("/api/shop/wishlist", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }
      
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      
      if (!product || product.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const price = product[0].retailPriceInPaisa || 0;
      
      await db
        .insert(wishlists)
        .values({ 
          userId, 
          productId,
          priceAtAddPaisa: price,
        })
        .returning();
      
      res.json({ success: true, message: "Added to wishlist" });
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Product already in wishlist" });
      }
      console.error("Add to wishlist error:", error);
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });
  
  app.delete("/api/shop/wishlist/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      await db
        .delete(wishlists)
        .where(
          and(
            eq(wishlists.id, id),
            eq(wishlists.userId, userId)
          )
        );
      
      res.json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });
  
  // =================================================================
  // ORDERS (PROTECTED)
  // =================================================================
  
  app.post("/api/shop/orders", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const validated = createProductOrderSchema.parse(req.body);
      const { salonId, fulfillmentType, deliveryAddress, paymentMethod, razorpayPaymentId, razorpayOrderId, razorpaySignature } = validated;
      
      const userCarts = await db
        .select()
        .from(shoppingCarts)
        .where(
          and(
            eq(shoppingCarts.userId, userId),
            eq(shoppingCarts.status, 'active'),
            salonId ? eq(shoppingCarts.salonId, salonId) : undefined
          )
        );
      
      if (!userCarts || userCarts.length === 0) {
        return res.status(400).json({ error: "No active cart found" });
      }
      
      const cartIds = userCarts.map(c => c.id);
      const items = await db
        .select()
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.id))
        .where(inArray(cartItems.cartId, cartIds));
      
      if (items.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }
      
      let subtotalPaisa = 0;
      let taxPaisa = 0;
      const orderItemsData: any[] = [];
      
      for (const item of items) {
        if (!item.products) continue;
        
        const quantity = item.cart_items.quantity;
        const unitPrice = item.products.retailPriceInPaisa || 0;
        const itemSubtotal = unitPrice * quantity;
        const itemTax = Math.round(itemSubtotal * 0.18);
        
        subtotalPaisa += itemSubtotal;
        taxPaisa += itemTax;
        
        orderItemsData.push({
          productId: item.cart_items.productId,
          quantity,
          unitPricePaisa: unitPrice,
          discountPerItemPaisa: 0,
          subtotalPaisa: itemSubtotal + itemTax,
        });
      }
      
      const deliveryChargePaisa = fulfillmentType === 'delivery' ? 5000 : 0;
      const totalPaisa = subtotalPaisa + taxPaisa + deliveryChargePaisa;
      
      let verifiedPaymentStatus = 'pending';
      let verifiedPaymentId: string | undefined;

      if (paymentMethod === 'razorpay') {
        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
          return res.status(400).json({ 
            error: 'Razorpay payment requires paymentId, orderId, and signature' 
          });
        }

        const existingOrder = await db
          .select()
          .from(productOrders)
          .where(eq(productOrders.paymentTransactionId, razorpayPaymentId))
          .limit(1);

        if (existingOrder.length > 0) {
          return res.status(400).json({ 
            error: 'Payment already used',
            details: 'This payment has already been used for another order'
          });
        }

        try {
          const sign = razorpayOrderId + '|' + razorpayPaymentId;
          const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(sign)
            .digest('hex');

          if (razorpaySignature !== expectedSign) {
            return res.status(400).json({ error: 'Invalid payment signature' });
          }

          const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
          const payment = await razorpay.payments.fetch(razorpayPaymentId);

          if (payment.order_id !== razorpayOrderId) {
            return res.status(400).json({ error: 'Payment does not match order' });
          }

          if (payment.status !== 'captured' && payment.status !== 'authorized') {
            return res.status(400).json({ error: 'Payment not completed' });
          }

          if (razorpayOrder.amount !== totalPaisa) {
            return res.status(400).json({ 
              error: 'Payment amount mismatch', 
              details: `Expected ${totalPaisa}, got ${razorpayOrder.amount}` 
            });
          }

          const orderNotes: any = razorpayOrder.notes || {};
          if (orderNotes.userId && orderNotes.userId !== userId) {
            return res.status(400).json({ error: 'Payment belongs to different user' });
          }

          verifiedPaymentStatus = 'paid';
          verifiedPaymentId = razorpayPaymentId;
        } catch (error: any) {
          console.error('Razorpay verification error:', error);
          return res.status(400).json({ 
            error: 'Payment verification failed', 
            message: error.message 
          });
        }
      }

      const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const finalSalonId = salonId || userCarts[0].salonId;
      
      await db.transaction(async (tx) => {
        const order = await tx
          .insert(productOrders)
          .values({
            orderNumber,
            customerId: userId,
            salonId: finalSalonId,
            status: 'pending',
            fulfillmentType,
            deliveryAddress: typeof deliveryAddress === 'string' ? deliveryAddress : JSON.stringify(deliveryAddress),
            paymentMethod: paymentMethod || 'pay_at_salon',
            paymentStatus: verifiedPaymentStatus,
            paymentTransactionId: verifiedPaymentId,
            subtotalPaisa,
            discountPaisa: 0,
            deliveryChargePaisa,
            taxPaisa,
            totalPaisa,
            currency: 'INR',
          })
          .returning();
        
        for (const itemData of orderItemsData) {
          await tx.insert(productOrderItems).values({
            orderId: order[0].id,
            ...itemData,
          });
        }
        
        await tx.delete(cartItems).where(inArray(cartItems.cartId, cartIds));
        await tx.update(shoppingCarts).set({ status: 'converted' }).where(inArray(shoppingCarts.id, cartIds));
      });
      
      const createdOrder = await db
        .select()
        .from(productOrders)
        .where(eq(productOrders.orderNumber, orderNumber))
        .limit(1);

      console.log(`🛍️ [Shop] Order created: ${orderNumber} for user: ${userId} (Payment: ${paymentMethod})`);
      res.json({ 
        success: true, 
        order: createdOrder[0],
        orderNumber, 
        message: "Order created successfully" 
      });
    } catch (error: any) {
      console.error("Create order error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  
  app.get("/api/shop/orders", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { status, limit = '20', offset = '0' } = req.query;
      
      const orders = await db
        .select()
        .from(productOrders)
        .leftJoin(salons, eq(productOrders.salonId, salons.id))
        .where(
          and(
            eq(productOrders.customerId, userId),
            status ? eq(productOrders.status, status as string) : undefined
          )
        )
        .orderBy(desc(productOrders.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      res.json({ success: true, orders });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  
  app.get("/api/shop/orders/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const order = await db
        .select()
        .from(productOrders)
        .where(
          and(
            eq(productOrders.id, id),
            eq(productOrders.customerId, userId)
          )
        )
        .limit(1);
      
      if (!order || order.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const items = await db.select().from(productOrderItems).where(eq(productOrderItems.orderId, id));
      const salon = await db.select().from(salons).where(eq(salons.id, order[0].salonId)).limit(1);
      
      res.json({ success: true, order: { ...order[0], items, salon: salon[0] } });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  
  // =================================================================
  // PRODUCT REVIEWS (PROTECTED)
  // =================================================================
  
  app.post("/api/shop/reviews", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { productId, orderId, rating, title, comment, imageUrls } = req.body;
      
      if (!productId || !orderId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Product ID, Order ID, and valid rating (1-5) are required" });
      }
      
      const order = await db
        .select()
        .from(productOrders)
        .where(
          and(
            eq(productOrders.id, orderId),
            eq(productOrders.customerId, userId)
          )
        )
        .limit(1);
      
      if (!order || order.length === 0) {
        return res.status(400).json({ error: "Order not found or not owned by user" });
      }
      
      const orderItem = await db
        .select()
        .from(productOrderItems)
        .where(
          and(
            eq(productOrderItems.orderId, orderId),
            eq(productOrderItems.productId, productId)
          )
        )
        .limit(1);
      
      if (!orderItem || orderItem.length === 0) {
        return res.status(400).json({ error: "Product not found in this order" });
      }
      
      const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      
      if (!product || product.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      await db
        .insert(productReviews)
        .values({
          productId,
          orderId,
          userId,
          salonId: product[0].salonId,
          rating,
          title,
          comment,
          imageUrls,
          verifiedPurchase: 1,
          isVisible: 1,
          moderationStatus: 'approved',
        })
        .returning();
      
      res.json({ success: true, message: "Review submitted successfully" });
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "You have already reviewed this product from this order" });
      }
      console.error("Create review error:", error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });
  
  console.log("✅ Shop routes registered");
}
