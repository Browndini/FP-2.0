import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import {
  assertIapProductId,
  fulfillIapPurchase,
  getStripeSecretKey,
  resolveStripePriceId,
} from "./iap";

interface CreateStripeCheckoutInput {
  productId: string;
  successUrl: string;
  cancelUrl: string;
}

export const createStripeCheckout = onCall<CreateStripeCheckoutInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { productId, successUrl, cancelUrl } = request.data;

    if (!productId || !successUrl || !cancelUrl) {
      throw new HttpsError("invalid-argument", "Missing checkout parameters.");
    }

    assertIapProductId(productId);
    const priceId = resolveStripePriceId(productId);
    const stripe = new Stripe(getStripeSecretKey());

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}${successUrl.includes("?") ? "&" : "?"}iap=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      client_reference_id: uid,
      metadata: {
        uid,
        productId,
      },
    });

    if (!session.url) {
      throw new HttpsError("internal", "Could not create checkout session.");
    }

    return { url: session.url, sessionId: session.id };
  }
);

interface VerifyIapPurchaseInput {
  sessionId: string;
}

export const verifyIapPurchase = onCall<VerifyIapPurchaseInput>(
  { region: "us-central1", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = request.auth.uid;
    const { sessionId } = request.data;

    if (!sessionId) {
      throw new HttpsError("invalid-argument", "Session ID is required.");
    }

    const stripe = new Stripe(getStripeSecretKey());
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new HttpsError("failed-precondition", "Payment not completed.");
    }

    if (session.client_reference_id !== uid && session.metadata?.uid !== uid) {
      throw new HttpsError("permission-denied", "Session does not belong to you.");
    }

    const productId = session.metadata?.productId;
    if (!productId) {
      throw new HttpsError("failed-precondition", "Missing product metadata.");
    }

    const db = admin.firestore();
    const result = await fulfillIapPurchase(db, uid, productId, sessionId);

    return {
      productId,
      alreadyFulfilled: result.alreadyFulfilled,
    };
  }
);
