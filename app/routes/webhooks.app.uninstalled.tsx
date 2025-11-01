import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
    // remove persisted badges for this shop
    try {
      await prisma.badge.deleteMany({ where: { shop } });
    } catch (e) {
      // best-effort cleanup; ignore errors here
      console.warn("Failed to delete badges for shop", shop, e);
    }
  }

  return new Response();
};
