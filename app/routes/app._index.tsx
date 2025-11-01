import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  Modal,
  FormLayout,
  TextField,
  ChoiceList,
  DataTable,
  Link,
  List,
  Select,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const productsResponse = await admin.graphql(
    `#graphql
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
        }
      }
    }
  `,
  );

  const productsJson = await productsResponse.json();
  const products =
    productsJson?.data?.products?.edges?.map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      handle: e.node.handle,
      image: e.node.images?.edges?.[0]?.node?.url || null,
    })) || [];

  const shopResp = await admin.graphql(`{ shop { myshopifyDomain } }`);
  const shopJson = await shopResp.json();
  const shop = shopJson?.data?.shop?.myshopifyDomain;

  const badgesFromDb = shop
    ? await prisma.badge.findMany({
        where: { shop },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return json({ products, badgesFromDb });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Get shop domain
  const shopResp = await admin.graphql(`{ shop { myshopifyDomain } }`);
  const shopJson = await shopResp.json();
  const shop = shopJson?.data?.shop?.myshopifyDomain;

  const form = await request.formData();
  const productIds = form.get("productIds");
  const badgeName = form.get("badgeName");
  const badgeColor = form.get("badgeColor");
  const editingId = form.get("editingId");
  const deleteId = form.get("deleteId");

  // Delete
  if (deleteId) {
    await prisma.badge.deleteMany({ where: { id: String(deleteId), shop } });
    return json({ deletedId: String(deleteId) });
  }

  // Update
  if (editingId) {
    await prisma.badge.updateMany({
      where: { id: String(editingId), shop },
      data: { name: String(badgeName), color: String(badgeColor) },
    });
    const updatedRecord = await prisma.badge.findUnique({
      where: { id: String(editingId) },
    });
    return json({ updatedRecord });
  }

  // Create
  const ids = JSON.parse(String(productIds));
  const createdRecords = [];
  for (const pid of ids) {
    const created = await prisma.badge.create({
      data: {
        productId: pid,
        name: String(badgeName),
        color: String(badgeColor),
        shop: String(shop),
      },
    });
    createdRecords.push(created);
  }

  return json({ createdRecords });
};

export default function CustomBadgePage() {
  const { products, badgesFromDb } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const app = useAppBridge();

  const [badges, setBadges] = useState(
    badgesFromDb.map((b: any) => ({
      id: b.id,
      productId: b.productId,
      badgeName: b.name,
      badgeColor: b.color,
    })),
  );

  const [isSelectModalOpen, setSelectModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [badgeName, setBadgeName] = useState("");
  const [badgeColor, setBadgeColor] = useState("#ef4444");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const data: any = fetcher.data;
    if (!data) return;

    if (data.createdRecords) {
      app.toast.show("Badge created");
      const newBadges = data.createdRecords.map((r: any) => ({
        id: r.id,
        productId: r.productId,
        badgeName: r.name,
        badgeColor: r.color,
      }));
      setBadges((prev) => [...newBadges, ...prev]);
      resetForm();
    }

    if (data.updatedRecord) {
      app.toast.show("Badge updated");
      const r = data.updatedRecord;
      setBadges((prev) =>
        prev.map((b) =>
          b.id === r.id ? { ...b, badgeName: r.name, badgeColor: r.color } : b,
        ),
      );
      resetForm();
    }

    if (data.deletedId) {
      app.toast.show("Badge deleted");
      setBadges((prev) => prev.filter((b) => b.id !== data.deletedId));
    }
  }, [fetcher.data, app]);

  const resetForm = () => {
    setBadgeName("");
    setBadgeColor("#ef4444");
    setSelectedProductIds([]);
    setEditingId(null);
    setDetailsModalOpen(false);
  };

  const openCreateFlow = () => setSelectModalOpen(true);

  const continueToDetails = () => {
    if (selectedProductIds.length === 0) return;
    setSelectModalOpen(false);
    setDetailsModalOpen(true);
  };

  const submitBadge = () => {
    const formData = new FormData();
    formData.append("productIds", JSON.stringify(selectedProductIds));
    formData.append("badgeName", badgeName);
    formData.append("badgeColor", badgeColor);
    if (editingId) formData.append("editingId", editingId);
    fetcher.submit(formData, { method: "post" });
  };

  const deleteBadge = (id: string) => {
    const formData = new FormData();
    formData.append("deleteId", id);
    fetcher.submit(formData, { method: "post" });
  };

  const editBadge = (badge: any) => {
    setSelectedProductIds([badge.productId]);
    setBadgeName(badge.badgeName);
    setBadgeColor(badge.badgeColor);
    setEditingId(badge.id);
    setDetailsModalOpen(true);
  };

  const colorOptions = [
    { label: "Red", value: "#ef4444" },
    { label: "Orange", value: "#fb923c" },
    { label: "Yellow", value: "#f59e0b" },
    { label: "Green", value: "#10b981" },
    { label: "Blue", value: "#3b82f6" },
  ];

  return (
    <Page>
      <TitleBar title="Remix app template" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ marginTop: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid #e1e1e1",
                      }}
                    >
                      <th style={{ padding: "12px 8px" }}>Product</th>
                      <th style={{ padding: "12px 8px" }}>Badge Preview</th>
                      <th style={{ padding: "12px 8px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {badges.map((badge) => {
                      const product = products.find(
                        (p: any) => p.id === badge.productId,
                      );
                      const productTitle = product?.title || badge.productId;
                      const productImage = product?.image;

                      return (
                        <tr
                          key={badge.id}
                          style={{ borderBottom: "1px solid #f3f4f6" }}
                        >
                          <td style={{ padding: "12px 8px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              {productImage ? (
                                <img
                                  src={productImage}
                                  alt=""
                                  style={{
                                    width: 48,
                                    height: 48,
                                    objectFit: "cover",
                                    borderRadius: 6,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 6,
                                    background: "#f3f4f6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 32,
                                  }}
                                >
                                  {productTitle[0]}
                                </div>
                              )}
                              <div style={{ fontWeight: 600 }}>
                                {productTitle}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "6px 12px",
                                borderRadius: 9999,
                                background: badge.badgeColor,
                                color: "white",
                                fontWeight: 600,
                              }}
                            >
                              {badge.badgeName}
                            </span>
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{ display: "flex", gap: 12 }}>
                              <Button
                                variant="plain"
                                onClick={() => editBadge(badge)}
                              >
                                Edit
                              </Button>
                              <button
                                onClick={() => deleteBadge(badge.id)}
                                style={{
                                  background: "transparent",
                                  border: 0,
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  padding: 0,
                                  fontSize: 14,
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {badges.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          style={{ padding: "12px 8px", color: "#6b7280" }}
                        >
                          No badges yet. Create one using the button above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </Layout.Section>

          <Modal
            open={isSelectModalOpen}
            onClose={() => setSelectModalOpen(false)}
            title="Select products"
            primaryAction={{ content: "Continue", onAction: continueToDetails }}
          >
            <Modal.Section>
              <FormLayout>
                <div style={{ display: "grid", gap: 8 }}>
                  {products.map((p: any) => {
                    const checked = selectedProductIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: 8,
                          border: checked
                            ? "1px solid #3b82f6"
                            : "1px solid #e5e7eb",
                          borderRadius: 6,
                          cursor: "pointer",
                          background: checked
                            ? "rgba(59,130,246,0.04)"
                            : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setSelectedProductIds((prev) =>
                              isChecked
                                ? [...prev, p.id]
                                : prev.filter((id) => id !== p.id),
                            );
                          }}
                          style={{ width: 18, height: 18 }}
                        />
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "cover",
                              borderRadius: 6,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 6,
                              background: "#f3f4f6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 32,
                            }}
                          >
                            {p.title[0]}
                          </div>
                        )}
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <div style={{ fontWeight: 600 }}>{p.title}</div>
                          <div style={{ color: "#6b7280", fontSize: 12 }}>
                            {p.handle}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </FormLayout>
            </Modal.Section>
          </Modal>

          <Modal
            open={isDetailsModalOpen}
            onClose={() => setDetailsModalOpen(false)}
            title="Badge details"
            primaryAction={{ content: "Create badge", onAction: submitBadge }}
          >
            <Modal.Section>
              <FormLayout>
                <TextField
                  label="Badge name"
                  value={badgeName}
                  onChange={(v) => setBadgeName(v)}
                  autoComplete="off"
                />
                <Select
                  label="Badge color"
                  options={colorOptions}
                  value={badgeColor}
                  onChange={(v) => setBadgeColor(v)}
                />
              </FormLayout>
            </Modal.Section>
          </Modal>

          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    App template specs
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Framework
                      </Text>
                      <Link
                        url="https://remix.run"
                        target="_blank"
                        removeUnderline
                      >
                        Remix
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Database
                      </Text>
                      <Link
                        url="https://www.prisma.io/"
                        target="_blank"
                        removeUnderline
                      >
                        Prisma
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Interface
                      </Text>
                      <span>
                        <Link
                          url="https://polaris.shopify.com"
                          target="_blank"
                          removeUnderline
                        >
                          Polaris
                        </Link>
                        {", "}
                        <Link
                          url="https://shopify.dev/docs/apps/tools/app-bridge"
                          target="_blank"
                          removeUnderline
                        >
                          App Bridge
                        </Link>
                      </span>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        API
                      </Text>
                      <Link
                        url="https://shopify.dev/docs/api/admin-graphql"
                        target="_blank"
                        removeUnderline
                      >
                        GraphQL API
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="300">
                  <Text as="p" variant="bodyMd">
                    Create and assign custom badges to products in your store.
                  </Text>
                  <Button variant="primary" onClick={openCreateFlow}>
                    Create new product badge
                  </Button>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
