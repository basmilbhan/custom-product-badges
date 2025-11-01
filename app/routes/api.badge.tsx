import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const productId =
    "gid://shopify/Product/" + url.searchParams.get("productId");

  const shop =
    request.headers.get("x-shopify-shop-domain") ||
    request.headers.get("referer")?.match(/https?:\/\/([^\/]+)/)?.[1];

  if (!shop || !productId) {
    return json(
      { badge: null },
      {
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  const badge = await db.badge.findFirst({
    where: { productId, shop },
    select: { name: true, color: true },
  });

  return json(
    { badge },
    {
      headers: { "Access-Control-Allow-Origin": "*" },
    },
  );
}
