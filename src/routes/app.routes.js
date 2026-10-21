import {  Router  } from "express";
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { requirePurchase } from "../middlewares/require-purchase.js"
import { createAccessSession } from '../repositories/access-session.repository.js';
import { findPaidPurchaseByStripeSessionId } from '../repositories/purchase.repository.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router = Router();

router.get('/premium', requirePurchase, (req, res) => {
  res.render('pages/premium');
});

router.get('/:pageAccess/success', async (req, res) => {

    const { pageAccess } = req.params;
    const { session_id: sessionId } = req.query;

    if (!sessionId) {
        return res.redirect('/');
    }

    try {

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return res.status(403).render('errors/403', {
                title: '403 - Access denied',
                url: req.originalUrl
            });
        }

        const sessionPageAccess = session.metadata?.page_access;

        if (sessionPageAccess !== `${pageAccess}`) {
            return res.status(403).render('errors/403', {
                title: '403 - Access denied',
                url: req.originalUrl
            });
        }

        const purchase = await findPaidPurchaseByStripeSessionId(sessionId);

        if (!purchase) {
            return res.status(403).render('errors/403', {
                title: '403 - Access denied',
                url: req.originalUrl
            });
        }

        const sessionToken = uuidv4();

        const expiresAt = new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 30
        );

        await createAccessSession({
            purchaseId: purchase.id,
            sessionToken,
            expiresAt
        });

        res.cookie(`access_session_${pageAccess}`, sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 3,
            path: '/'
        });

        return res.redirect(`/${pageAccess}`);

    } catch (error) {

        console.error(error);

        return res.status(500).render('errors/500', {
            title: '500 - Internal Error',
            url: req.originalUrl
        });
    }
});

router.get("/404", (req, res)=> res.render('errors/404'));
router.get("/403", (req, res)=> res.render('errors/403'));
router.get("/404", (req, res)=> res.render('errors/500'));
router.get("/terms", (req, res) => res.render("pages/terms"));
router.get("/privacy", (req, res) => res.render("pages/privacy"));
router.get("/refunds", (req, res) => res.render("pages/refunds"));
router.get('/', (req, res, next) => res.render('pages/page'));

export default router;
