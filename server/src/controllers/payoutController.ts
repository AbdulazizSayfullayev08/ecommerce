import { Request, Response, NextFunction } from 'express';
import {
  getPayoutSummary,
  requestPayout,
  listPayouts,
  handlePayout,
} from '../services/payoutService';

export async function summaryController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getPayoutSummary(req.user!.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function requestPayoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const payout = await requestPayout(req.user!.userId, req.body.amount);
    res.status(201).json({ success: true, data: { payout } });
  } catch (err) {
    next(err);
  }
}

export async function listPayoutsController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listPayouts(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handlePayoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const payout = await handlePayout(req.params.id as string, req.body.status);
    res.status(200).json({ success: true, data: { payout } });
  } catch (err) {
    next(err);
  }
}
