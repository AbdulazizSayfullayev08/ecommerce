import { Request, Response, NextFunction } from 'express';
import { stripe } from '../lib/stripe';
import { env } from '../config/env';
import {
  createStripeSession,
  createCodOrder,
  handleCheckoutSessionCompleted,
} from '../services/checkoutService';

export async function stripeCheckoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const { url, orderNumber } = await createStripeSession(req.user!.userId, req.body.addressId);
    res.status(201).json({ success: true, data: { url, orderNumber } });
  } catch (err) {
    next(err);
  }
}

export async function codCheckoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await createCodOrder(req.user!.userId, req.body.addressId);
    res.status(201).json({ success: true, data: { order } });
  } catch (err) {
    next(err);
  }
}

export async function webhookController(req: Request, res: Response) {
  try {
    let event: {
      type?: string;
      data?: { object?: { id?: string } };
    };

    if (stripe && env.stripe.webhookSecret && req.rawBody) {
      const signature = req.headers['stripe-signature'] as string;
      event = stripe.webhooks.constructEvent(req.rawBody, signature, env.stripe.webhookSecret) as typeof event;
    } else {
      event = req.body;
    }

    if (event.type === 'checkout.session.completed') {
      const sessionId = event.data?.object?.id;
      if (sessionId) {
        await handleCheckoutSessionCompleted(sessionId);
      }
    }

    res.status(200).json({ received: true });
  } catch {
    res.status(400).json({ success: false, error: 'Webhook xatosi' });
  }
}
