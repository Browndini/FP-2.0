import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { fulfillIapPurchase, getStripeSecretKey } from "./iap";

export const stripeWebhook = onRequest(
  { region: "us-central1", cors: false },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      res.status(500).send("Webhook secret not configured.");
      return;
    }

    const stripe = new Stripe(getStripeSecretKey());
    const signature = req.headers["stripe-signature"];

    if (!signature || !req.rawBody) {
      res.status(400).send("Missing signature or body.");
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    } catch {
      res.status(400).send("Webhook signature verification failed.");
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id?: string;
        client_reference_id?: string | null;
        metadata?: { uid?: string; productId?: string };
      };
      const uid = session.client_reference_id ?? session.metadata?.uid;
      const productId = session.metadata?.productId;

      if (uid && productId && session.id) {
        const db = admin.firestore();
        await fulfillIapPurchase(db, uid, productId, session.id);
      }
    }

    res.status(200).json({ received: true });
  }
);
