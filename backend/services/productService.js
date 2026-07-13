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

/*
 * Select the next eligible product for store automation.
 *
 * Priority:
 * 1. Products that have never been posted
 * 2. Products with the oldest last_posted_at date
 * 3. Products with the lowest times_posted count
 *
 * Products posted inside the repeat-delay window are excluded.
 */
export async function getNextAutomationProduct({
  userId,
  storeId,
  storeType,
  storeName,
  repeatDelayDays = 30,
  selectionMode = "least_recently_posted",
}) {
  if (!userId) {
    throw new Error(
      "A userId is required to select an automation product."
    );
  }

  const parsedRepeatDelayDays = Math.max(
    Number(repeatDelayDays) || 0,
    0
  );

  let resolvedStoreType = storeType
    ? String(storeType).toLowerCase()
    : null;

  let resolvedStoreName = storeName
    ? String(storeName)
    : null;

  /*
   * If only storeId is provided, resolve the connected store
   * from social_connections.
   */
  if (
    storeId &&
    (!resolvedStoreType || !resolvedStoreName)
  ) {
    const {
      data: connection,
      error: connectionError,
    } = await supabase
      .from("social_connections")
      .select(
        `
          id,
          platform,
          shop_domain,
          connected
        `
      )
      .eq("id", storeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (connectionError) {
      throw new Error(
        `Unable to resolve store connection: ${connectionError.message}`
      );
    }

    if (!connection) {
      throw new Error(
        "The selected store connection was not found."
      );
    }

    if (!connection.connected) {
      throw new Error(
        "The selected store is not currently connected."
      );
    }

    resolvedStoreType = String(
      connection.platform || ""
    ).toLowerCase();

    resolvedStoreName =
      connection.shop_domain ||
      connection.platform ||
      null;
  }

  if (!resolvedStoreType) {
    throw new Error(
      "A storeType is required to select an automation product."
    );
  }

  if (!resolvedStoreName) {
    throw new Error(
      "A storeName is required to select an automation product."
    );
  }

  let query = supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .eq("store_type", resolvedStoreType)
    .eq("store_name", resolvedStoreName);

  /*
   * Only include active products when a status value exists.
   */
  query = query.or(
    "status.is.null,status.eq.active,status.eq.published"
  );

  const {
    data: products,
    error: productsError,
  } = await query;

  if (productsError) {
    throw new Error(
      `Unable to load automation products: ${productsError.message}`
    );
  }

  const availableProducts = products || [];

  if (availableProducts.length === 0) {
    return null;
  }

  const repeatCutoff = new Date();

  repeatCutoff.setDate(
    repeatCutoff.getDate() - parsedRepeatDelayDays
  );

  const eligibleProducts =
    parsedRepeatDelayDays === 0
      ? availableProducts
      : availableProducts.filter(
          (product) => {
            if (!product.last_posted_at) {
              return true;
            }

            const lastPostedDate = new Date(
              product.last_posted_at
            );

            if (
              Number.isNaN(
                lastPostedDate.getTime()
              )
            ) {
              return true;
            }

            return lastPostedDate < repeatCutoff;
          }
        );

  /*
   * If every product is still inside the repeat-delay
   * window, do not repeat one early.
   */
  if (eligibleProducts.length === 0) {
    return null;
  }

  if (selectionMode === "random") {
    const randomIndex = Math.floor(
      Math.random() * eligibleProducts.length
    );

    return eligibleProducts[randomIndex];
  }

  const sortedProducts = [
    ...eligibleProducts,
  ].sort((productA, productB) => {
    const productANeverPosted =
      !productA.last_posted_at;

    const productBNeverPosted =
      !productB.last_posted_at;

    /*
     * Never-posted products always come first.
     */
    if (
      productANeverPosted &&
      !productBNeverPosted
    ) {
      return -1;
    }

    if (
      !productANeverPosted &&
      productBNeverPosted
    ) {
      return 1;
    }

    const productATimesPosted =
      Number(productA.times_posted) || 0;

    const productBTimesPosted =
      Number(productB.times_posted) || 0;

    /*
     * For never-posted products, prioritize the
     * lowest posting count.
     */
    if (
      productANeverPosted &&
      productBNeverPosted
    ) {
      if (
        productATimesPosted !==
        productBTimesPosted
      ) {
        return (
          productATimesPosted -
          productBTimesPosted
        );
      }

      return String(productA.id).localeCompare(
        String(productB.id)
      );
    }

    const productALastPostedTime =
      new Date(
        productA.last_posted_at
      ).getTime();

    const productBLastPostedTime =
      new Date(
        productB.last_posted_at
      ).getTime();

    /*
     * Oldest posted product comes first.
     */
    if (
      productALastPostedTime !==
      productBLastPostedTime
    ) {
      return (
        productALastPostedTime -
        productBLastPostedTime
      );
    }

    /*
     * If the dates match, use the lowest posting count.
     */
    if (
      productATimesPosted !==
      productBTimesPosted
    ) {
      return (
        productATimesPosted -
        productBTimesPosted
      );
    }

    return String(productA.id).localeCompare(
      String(productB.id)
    );
  });

  return sortedProducts[0] || null;
}

/*
 * Update the product after a successful automation post.
 */
export async function markProductAsPosted({
  productId,
  userId,
  postedAt = new Date().toISOString(),
}) {
  const product = await getProductById({
    productId,
    userId,
  });

  if (!product) {
    throw new Error(
      "Unable to update posting history because the product was not found."
    );
  }

  const currentTimesPosted =
    Number(product.times_posted) || 0;

  const {
    data: updatedProduct,
    error,
  } = await supabase
    .from("products")
    .update({
      times_posted: currentTimesPosted + 1,
      last_posted_at: postedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Unable to update product posting history: ${error.message}`
    );
  }

  return updatedProduct;
}