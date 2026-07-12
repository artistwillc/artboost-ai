import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const API_BASE = "https://artboost-ai.onrender.com";

const USER_ID = "08f428a1-6abf-4daa-809f-06a92484c07a";

type Product = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  productUrl: string;
  price?: number | null;
  currency?: string | null;
  storeType?: string | null;
  storeName?: string | null;
  status?: string | null;
  automationEnabled?: boolean;
  timesPosted?: number;
  lastPostedAt?: string | null;
};

export default function ProductsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const stores = useMemo(() => {
  const unique = Array.from(
    new Set(
      products
        .map((p) => p.storeName || p.storeType)
        .filter(Boolean)
    )
  );

  return ["All", ...unique];
}, [products]);

  const loadProducts = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await fetch(
  `${API_BASE}/shopify/products?userId=${encodeURIComponent(USER_ID)}`
);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || "Unable to load products.");
      }

  setProducts(
  (data.products || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.image_url,
    productUrl: item.product_url,
    price: item.price,
    currency: item.currency,
    storeType: item.store_type,
    storeName: item.store_name,
    status: item.status,
    automationEnabled: item.automation_enabled || false,
    timesPosted: item.times_posted || 0,
    lastPostedAt: item.last_posted_at,
  }))
);
    } catch (error: any) {
      console.log("Products load failed:", error);

      Alert.alert(
        "Products Unavailable",
        error?.message || "ArtBoost could not load your products."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const filteredProducts = useMemo(() => {
  const cleanSearch = search.trim().toLowerCase();

  return products.filter((product) => {
    const matchesStore =
      selectedStore === "All" ||
      product.storeName === selectedStore ||
      product.storeType === selectedStore;

    const matchesSearch =
      !cleanSearch ||
      [
        product.title,
        product.description,
        product.storeName,
        product.storeType,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(cleanSearch)
        );

    return matchesStore && matchesSearch;
  });
}, [products, search, selectedStore]);

  function openImportOptions() {
    Alert.alert("Add Products", "Choose how you want to add products.", [
      {
        text: "Manual Product",
        onPress: () => router.push("/product-create" as any),
      },
      {
        text: "Connect Store",
        onPress: () => router.push("/store-connections" as any),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }

  function openProduct(product: Product) {
    router.push({
      pathname: "/product-details" as any,
      params: {
        id: product.id,
      },
    });
  }

  function formatPrice(product: Product) {
    if (product.price === null || product.price === undefined) {
      return null;
    }

    const currency = product.currency || "USD";

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(product.price);
    } catch {
      return `$${Number(product.price).toFixed(2)}`;
    }
  }

  function formatLastPosted(value?: string | null) {
    if (!value) {
      return "Never posted";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Posted previously";
    }

    return `Last posted ${date.toLocaleDateString()}`;
  }

  function renderProduct({ item }: { item: Product }) {
    const price = formatPrice(item);

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => openProduct(item)}
      >
        <View style={styles.imageWrap}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#777" />
            </View>
          )}
        </View>

        <View style={styles.productContent}>
          <View style={styles.productHeaderRow}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#666"
            />
          </View>

          <Text style={styles.storeText}>
            {item.storeName ||
              item.storeType ||
              "Manual Product"}
          </Text>

          {price ? <Text style={styles.priceText}>{price}</Text> : null}

          <View style={styles.metaRow}>
            <View
              style={[
                styles.statusPill,
                item.automationEnabled
                  ? styles.statusPillActive
                  : styles.statusPillInactive,
              ]}
            >
              <Ionicons
                name={
                  item.automationEnabled
                    ? "flash"
                    : "pause"
                }
                size={13}
                color={
                  item.automationEnabled
                    ? "#c4b5fd"
                    : "#aaa"
                }
              />

              <Text
                style={[
                  styles.statusText,
                  item.automationEnabled
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {item.automationEnabled
                  ? "Auto enabled"
                  : "Auto disabled"}
              </Text>
            </View>

            <Text style={styles.postedText}>
              {formatLastPosted(item.lastPostedAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="cube-outline" size={46} color="#a78bfa" />
        </View>

        <Text style={styles.emptyTitle}>No products yet</Text>

        <Text style={styles.emptyText}>
          Add a product manually or connect a store to start building your
          automatic marketing library.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={openImportOptions}
        >
          <Ionicons name="add" size={21} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Add Products</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ARTBOOST AI</Text>
          <Text style={styles.title}>
          Products TEST
          </Text>
          <Text style={styles.subtitle}>
            Build your product library and automate promotion.
          </Text>
        </View>

        <Pressable
          style={styles.headerButton}
          onPress={openImportOptions}
        >
          <Ionicons name="add" size={25} color="#ffffff" />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryNumber}>{products.length}</Text>
          <Text style={styles.summaryLabel}>Total Products</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View>
          <Text style={styles.summaryNumber}>
            {products.filter((item) => item.automationEnabled).length}
          </Text>
          <Text style={styles.summaryLabel}>Auto Enabled</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View>
          <Text style={styles.summaryNumber}>
            {products.reduce(
              (total, item) => total + (item.timesPosted || 0),
              0
            )}
          </Text>
          <Text style={styles.summaryLabel}>Posts Created</Text>
        </View>
      </View>

      <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={styles.storeTabsScroll}
  contentContainerStyle={styles.storeTabs}
>
  {stores.map((store) => (
  <Pressable
    key={store}
    style={[
      styles.storeTab,
      selectedStore === store && styles.storeTabActive,
    ]}
    onPress={() => setSelectedStore(store)}
  >
    <Text
      numberOfLines={1}
      style={[
        styles.storeTabText,
        selectedStore === store && styles.storeTabTextActive,
      ]}
    >
      {store.includes("myshopify.com") ? "Shopify" : store}
    </Text>
  </Pressable>
))}

<Pressable
  style={styles.addStoreTab}
  onPress={() => router.push("/store-connections" as any)}
>
  <Ionicons name="add" size={18} color="#ffffff" />
  <Text style={styles.addStoreTabText}>Add Store</Text>
</Pressable>
</ScrollView>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color="#777" />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products"
          placeholderTextColor="#666"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="#777" />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.productList}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + 30 },
          filteredProducts.length === 0 && styles.listContentEmpty,
        ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadProducts(false);
              }}
              tintColor="#8b5cf6"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  eyebrow: {
    color: "#8b5cf6",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 5,
  },

  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
  },

  subtitle: {
    color: "#929292",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 290,
    marginTop: 5,
  },

  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryNumber: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  summaryLabel: {
    color: "#838383",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 3,
  },

  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#333",
  },

  storeTabsScroll: {
  flexGrow: 0,
  height: 54,
  marginBottom: 8,
},

  storeTabs: {
  paddingHorizontal: 20,
  paddingBottom: 14,
  gap: 10,
},

storeTab: {
  height: 40,
  paddingHorizontal: 18,
  borderRadius: 20,
  backgroundColor: "#171717",
  borderWidth: 1,
  borderColor: "#292929",
  justifyContent: "center",
  alignItems: "center",
  marginRight: 10,
},

storeTabActive: {
  backgroundColor: "#8b5cf6",
  borderColor: "#8b5cf6",
},

storeTabText: {
  color: "#bdbdbd",
  fontSize: 14,
  fontWeight: "700",
},

storeTabTextActive: {
  color: "#ffffff",
},

addStoreTab: {
  height: 40,
  paddingHorizontal: 16,
  borderRadius: 20,
  backgroundColor: "#2b2145",
  borderWidth: 1,
  borderColor: "#5b3fa3",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: 6,
  marginRight: 20,
},

addStoreTabText: {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: "800",
},

searchWrap: {
    marginHorizontal: 20,
    marginBottom: 14,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
  },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#888",
    fontSize: 14,
    marginTop: 12,
  },

  productList: {
  flex: 1,
},

  listContent: {
  paddingHorizontal: 20,
},

  listContentEmpty: {
    flexGrow: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 50,
  },

  emptyIconCircle: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: "#1d1730",
    borderWidth: 1,
    borderColor: "#3c2d63",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },

  emptyText: {
    color: "#999",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 24,
  },

  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  productCard: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
  },

  imageWrap: {
    width: 92,
    height: 92,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#222",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  productContent: {
    flex: 1,
    paddingLeft: 14,
  },

  productHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  productTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 21,
    paddingRight: 8,
  },

  storeText: {
    color: "#8b5cf6",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
    marginTop: 5,
  },

  priceText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
  },

  metaRow: {
    marginTop: 10,
    gap: 7,
  },

  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 99,
    paddingVertical: 5,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statusPillActive: {
    backgroundColor: "#2b2145",
  },

  statusPillInactive: {
    backgroundColor: "#292929",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },

  statusTextActive: {
    color: "#c4b5fd",
  },

  statusTextInactive: {
    color: "#aaa",
  },

  postedText: {
    color: "#777",
    fontSize: 11,
    fontWeight: "700",
  },
});
