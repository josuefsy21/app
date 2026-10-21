import { findAccessSession, updateLastUsedAt } from "../repositories/access-session.repository.js";

export async function requirePurchase(req, res, next) {

    try {

        const sessionToken = req.cookies?.access_session_premium;

        if (!sessionToken) {
            return res.redirect("/");
        }

        const session = await findAccessSession(sessionToken);

        if (!session) {

            res.clearCookie("access_session_premium");

            return res.redirect("/");
        }

        if (new Date(session.expires_at) <= new Date()) {

            res.clearCookie("access_session_premium");

            return res.redirect("/");
        }

        if (session.purchase_status !== "paid") {

            res.clearCookie("access_session_preimum");

            return res.status(403).render("errors/403", {
                title: "403 - Access denied",
                url: req.originalUrl
            });
        }

        await updateLastUsedAt(sessionToken);

        req.purchase = {
            id: session.purchase_id,
            page_access: session.page_access,
            email: session.email
        };

        return next();

    } catch (error) {

        console.error(error);

        return res.status(500).render("errors/500", {
            title: "500 - Internal Error",
            url: req.originalUrl
        });
    }
}
