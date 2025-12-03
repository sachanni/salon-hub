import express, { type Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { authenticateMobileUser } from '../middleware/authMobile';
import { db } from '../db';
import { shoppingCarts, cartItems, products } from '../../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

router.post('/create-razorpay-order', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { salonId, fulfillmentType } = req.body;

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
      return res.status(400).json({ error: 'No active cart found' });
    }

    const cartIds = userCarts.map(c => c.id);
    const items = await db
      .select()
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(inArray(cartItems.cartId, cartIds));

    if (items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let subtotalPaisa = 0;
    let taxPaisa = 0;

    for (const item of items) {
      if (!item.products) continue;
      const quantity = item.cart_items.quantity;
      const unitPrice = item.products.retailPriceInPaisa || 0;
      const itemSubtotal = unitPrice * quantity;
      const itemTax = Math.round(itemSubtotal * 0.18);
      subtotalPaisa += itemSubtotal;
      taxPaisa += itemTax;
    }

    const deliveryChargePaisa = fulfillmentType === 'delivery' ? 5000 : 0;
    const totalPaisa = subtotalPaisa + taxPaisa + deliveryChargePaisa;

    if (totalPaisa <= 0) {
      return res.status(400).json({ error: 'Invalid cart total' });
    }

    const orderNumber = `RZP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const options = {
      amount: totalPaisa,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        userId,
        salonId: salonId || userCarts[0].salonId,
        fulfillmentType,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      error: 'Failed to create payment order',
      message: error.message,
    });
  }
});

router.post('/verify-payment', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification parameters' });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        error: 'Payment does not match order',
      });
    }

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: razorpayOrder.amount,
        status: payment.status,
      },
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      error: 'Payment verification failed',
      message: error.message,
    });
  }
});

export default router;
