import supabase from "../lib/supabase.js";

export async function getProductById({
  productId,
  userId,
}) {
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load product: ${error.message}`
    );
  }

  return product || null;
}

export async function getProducts({
  userId,
  storeType,
  storeName,
  status,
  limit = 100,
  offset = 0,
}) {
  const parsedLimit = Math.min(
    Math.max(Number(limit) || 100, 1),
    500
  );

  const parsedOffset = Math.max(
    Number(offset) || 0,
    0
  );

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(
      parsedOffset,
      parsedOffset + parsedLimit - 1
    );

  if (storeType) {
    query = query.eq(
      "store_type",
      String(storeType).toLowerCase()
    );
  }

  if (storeName) {
    query = query.eq(
      "store_name",
      String(storeName)
    );
  }

  if (status) {
    query = query.eq(
      "status",
      String(status).toLowerCase()
    );
  }

  const {
    data: products,
    error,
    count,
  } = await query;

  if (error) {
    throw new Error(
      `Unable to load products: ${error.message}`
    );
  }

  return {
    products: products || [],
    total: count || 0,
    limit: parsedLimit,
    offset: parsedOffset,
  };
}

export async function getStores({
  userId,
}) {
  const supportedStorePlatforms = [
    "shopify",
    "etsy",
    "ebay",
    "redbubble",
    "artpal",
    "fine_art_america",
    "woocommerce",
    "printify",
    "printful",
    "bigcommerce",
    "squarespace",
    "custom_store",
  ];

  const {
    data: connections,
    error: connectionsError,
  } = await supabase
    .from("social_connections")
    .select(
      `
        id,
        platform,
        connected,
        shop_domain,
        connected_at,
        updated_at
      `
    )
    .eq("user_id", userId)
    .in("platform", supportedStorePlatforms)
    .order("updated_at", {
      ascending: false,
    });

  if (connectionsError) {
    throw new Error(
      `Unable to load store connections: ${connectionsError.message}`
    );
  }

  const {
    data: productRows,
    error: productError,
  } = await supabase
    .from("products")
    .select("store_type, store_name")
    .eq("user_id", userId);

  if (productError) {
    throw new Error(
      `Unable to load store product counts: ${productError.message}`
    );
  }

  const productCounts = {};

  for (const product of productRows || []) {
    const key = `${product.store_type || ""}::${
      product.store_name || ""
    }`;

    productCounts[key] =
      (productCounts[key] || 0) + 1;
  }

  return (connections || []).map(
    (connection) => {
      const storeType = String(
        connection.platform || ""
      ).toLowerCase();

      const storeName =
        connection.shop_domain ||
        connection.platform ||
        "Store";

      const countKey =
        `${storeType}::${storeName}`;

      return {
        id: connection.id,
        storeType,
        storeName,
        connected: Boolean(
          connection.connected
        ),
        productCount:
          productCounts[countKey] || 0,
        connectedAt:
          connection.connected_at || null,
        updatedAt:
          connection.updated_at || null,
      };
    }
  );
}