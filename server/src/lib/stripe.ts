import Stripe from 'stripe';
import { env } from '../config/env';

export const stripe = env.stripe.secretKey ? new Stripe(env.stripe.secretKey) : null;
