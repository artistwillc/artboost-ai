import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { supabase } from "../lib/supabase";

const API_BASE = "https://artboost-ai.onrender.com";

type Product = {
  id: string;
  user_id?: string | null;
  title: string;
  description?: string | null;
  image_url?: string | null;
  product_url?: string | null;
  price?: number | string | null;
  currency?: string | null;
  store_name?: string | null;
  store_type?: string | null;
  status?: string | null;
  automation_enabled?: boolean | null;
  times_posted?: number | null;
  last_posted_at?: string | null;
  tags?: string[] | string | null;
  categories?: string[] | string | null;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_synced_at?: string | null;
};

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  accent?: boolean;
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] =
    useState(false);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  async function loadProduct(
    productId: string,
    showLoader = true
  ) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          "Not Signed In",
          "Please sign in to view this product."
        );

        return;
      }

      const response = await fetch(
        `${API_BASE}/products/${encodeURIComponent(
          productId
        )}?userId=${encodeURIComponent(user.id)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.details ||
            data.error ||
            "Unable to load product."
        );
      }

      setProduct(data.product);
    } catch (error: any) {
      console.log("Product details load failed:", error);

      Alert.alert(
        "Unable to Load Product",
        error?.message ||
          "ArtBoost could not load this product."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const tags = useMemo(() => {
    if (!product?.tags) {
      return [];
    }

    if (Array.isArray(product.tags)) {
      return product.tags
        .map((tag) => String(tag).trim())
        .filter(Boolean);
    }

    if (typeof product.tags === "string") {
      try {
        const parsed = JSON.parse(product.tags);

        if (Array.isArray(parsed)) {
          return parsed
            .map((tag) => String(tag).trim())
            .filter(Boolean);
        }
      } catch {
        return product.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
    }

    return [];
  }, [product?.tags]);

  const visibleTags = descriptionExpanded
    ? tags
    : tags.slice(0, 18);

  function formatPrice() {
    if (
      product?.price === null ||
      product?.price === undefined ||
      product?.price === ""
    ) {
      return "Price unavailable";
    }

    const numericPrice = Number(product.price);
    const currency = product.currency || "USD";

    if (Number.isNaN(numericPrice)) {
      return String(product.price);
    }

    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(numericPrice);
    } catch {
      return `$${numericPrice.toFixed(2)}`;
    }
  }

  function formatStoreName() {
    const storeType = product?.store_type || "";
    const storeName = product?.store_name || "";

    if (storeType.toLowerCase() === "shopify") {
      return "Shopify";
    }

    if (storeName.includes("myshopify.com")) {
      return "Shopify";
    }

    return storeName || storeType || "Manual Product";
  }

  function formatStatus() {
    const status = String(product?.status || "unknown")
      .trim()
      .toLowerCase();

    if (status === "active") {
      return "Active";
    }

    if (status === "inactive") {
      return "Inactive";
    }

    return status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : "Unknown";
  }

  function formatLastPosted() {
    if (!product?.last_posted_at) {
      return "Never";
    }

    const date = new Date(product.last_posted_at);

    if (Number.isNaN(date.getTime())) {
      return "Previously";
    }

    const now = new Date();
    const differenceMs = now.getTime() - date.getTime();
    const differenceDays = Math.floor(
      differenceMs / (1000 * 60 * 60 * 24)
    );

    if (differenceDays <= 0) {
      return "Today";
    }

    if (differenceDays === 1) {
      return "Yesterday";
    }

    if (differenceDays < 7) {
      return `${differenceDays} days ago`;
    }

    return date.toLocaleDateString();
  }

  function formatSyncDate() {
    const value =
      product?.last_synced_at || product?.updated_at;

    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleString();
  }

  async function openProductLink() {
    if (!product?.product_url) {
      Alert.alert(
        "Product Link Unavailable",
        "This product does not have a store link."
      );

      return;
    }

    try {
      const supported = await Linking.canOpenURL(
        product.product_url
      );

      if (!supported) {
        throw new Error("This link cannot be opened.");
      }

      await Linking.openURL(product.product_url);
    } catch (error: any) {
      Alert.alert(
        "Unable to Open Product",
        error?.message || "The product link could not be opened."
      );
    }
  }

  function openPostNow() {
    Alert.alert(
      "Post Now",
      "Next, we will connect this button to ArtBoost's existing publishing workflow for Facebook, Instagram, X, and Pinterest when approval is available."
    );
  }

  function openSchedule() {
    Alert.alert(
      "Schedule Product",
      "Next, this button will open the campaign scheduler with this product's image, title, description, and product link already filled in."
    );
  }

  function openAutomation() {
    Alert.alert(
      "Product Automation",
      "Next, this button will configure recurring promotion settings for this product."
    );
  }

  function openEditProduct() {
    Alert.alert(
      "Edit Product",
      "Product editing will be added after posting, scheduling, and automation are connected."
    );
  }

  function ActionButton({
    icon,
    title,
    subtitle,
    onPress,
    disabled = false,
    accent = false,
  }: ActionButtonProps) {
    return (
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionButton,
          accent && styles.actionButtonAccent,
          disabled && styles.actionButtonDisabled,
          pressed && !disabled && styles.actionButtonPressed,
        ]}
      >
        <View
          style={[
            styles.actionIconWrap,
            accent && styles.actionIconWrapAccent,
          ]}
        >
          <Ionicons
            name={icon}
            size={23}
            color={accent ? "#ffffff" : "#c4b5fd"}
          />
        </View>

        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>
            {subtitle}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={21}
          color={accent ? "#ffffff" : "#676767"}
        />
      </Pressable>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#8b5cf6" />

          <Text style={styles.loadingTitle}>
            Loading product
          </Text>

          <Text style={styles.loadingText}>
            Retrieving the latest store information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!id || !product) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#ffffff"
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Product Details
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color="#a78bfa"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Product unavailable
          </Text>

          <Text style={styles.emptyText}>
            ArtBoost could not retrieve this product.
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => {
              if (id) {
                loadProduct(id);
              }
            }}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#ffffff"
            />

            <Text style={styles.retryButtonText}>
              Try Again
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const automationEnabled = Boolean(
    product.automation_enabled
  );

  const statusIsActive =
    String(product.status || "").toLowerCase() === "active";

  const syncDate = formatSyncDate();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#ffffff"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Product Details
        </Text>

        <Pressable
          style={styles.moreButton}
          onPress={() =>
            Alert.alert("Product Options", undefined, [
              {
                text: "View Product",
                onPress: openProductLink,
              },
              {
                text: "Edit Product",
                onPress: openEditProduct,
              },
              {
                text: "Cancel",
                style: "cancel",
              },
            ])
          }
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={23}
            color="#ffffff"
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProduct(product.id, false);
            }}
            tintColor="#8b5cf6"
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.imageWrap}>
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={54}
                  color="#737373"
                />

                <Text style={styles.imagePlaceholderText}>
                  No product image
                </Text>
              </View>
            )}
          </View>

          <View style={styles.heroContent}>
            <View style={styles.storeBadge}>
              <Ionicons
                name="storefront-outline"
                size={15}
                color="#c4b5fd"
              />

              <Text style={styles.storeBadgeText}>
                {formatStoreName()}
              </Text>
            </View>

            <Text style={styles.productTitle}>
              {product.title}
            </Text>

            <Text style={styles.priceText}>
              {formatPrice()}
            </Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  statusIsActive
                    ? styles.statusPillActive
                    : styles.statusPillInactive,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    statusIsActive
                      ? styles.statusDotActive
                      : styles.statusDotInactive,
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    statusIsActive
                      ? styles.statusTextActive
                      : styles.statusTextInactive,
                  ]}
                >
                  {formatStatus()}
                </Text>
              </View>

              {product.categories &&
              Array.isArray(product.categories) &&
              product.categories.length > 0 ? (
                <Text style={styles.categoryText}>
                  {product.categories[0]}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Marketing Overview
          </Text>

          <Text style={styles.sectionSubtitle}>
            Product promotion activity
          </Text>
        </View>

        <View style={styles.metricsCard}>
          <View style={styles.metricItem}>
            <View
              style={[
                styles.metricIcon,
                automationEnabled
                  ? styles.metricIconActive
                  : styles.metricIconInactive,
              ]}
            >
              <Ionicons
                name={
                  automationEnabled
                    ? "flash"
                    : "pause-outline"
                }
                size={21}
                color={
                  automationEnabled
                    ? "#c4b5fd"
                    : "#a3a3a3"
                }
              />
            </View>

            <Text style={styles.metricValue}>
              {automationEnabled ? "On" : "Off"}
            </Text>

            <Text style={styles.metricLabel}>
              Automation
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <Ionicons
                name="paper-plane-outline"
                size={21}
                color="#c4b5fd"
              />
            </View>

            <Text style={styles.metricValue}>
              {product.times_posted || 0}
            </Text>

            <Text style={styles.metricLabel}>
              Times Posted
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <Ionicons
                name="time-outline"
                size={21}
                color="#c4b5fd"
              />
            </View>

            <Text
              style={styles.metricValueSmall}
              numberOfLines={2}
            >
              {formatLastPosted()}
            </Text>

            <Text style={styles.metricLabel}>
              Last Posted
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>

          <Text style={styles.sectionSubtitle}>
            Promote and manage this product
          </Text>
        </View>

        <View style={styles.actionsWrap}>
          <ActionButton
            icon="rocket-outline"
            title="Post Now"
            subtitle="Generate content and publish immediately"
            onPress={openPostNow}
            accent
          />

          <ActionButton
            icon="calendar-outline"
            title="Schedule"
            subtitle="Choose a future date and posting time"
            onPress={openSchedule}
          />

          <ActionButton
            icon="flash-outline"
            title="Automation"
            subtitle={
              automationEnabled
                ? "Recurring promotion is currently enabled"
                : "Set up recurring product promotion"
            }
            onPress={openAutomation}
          />

          <ActionButton
            icon="open-outline"
            title="View Product"
            subtitle="Open the original store listing"
            onPress={openProductLink}
            disabled={!product.product_url}
          />

          <ActionButton
            icon="create-outline"
            title="Edit Product"
            subtitle="Update product marketing information"
            onPress={openEditProduct}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Description
          </Text>

          <Text style={styles.sectionSubtitle}>
            Product listing content
          </Text>
        </View>

        <View style={styles.contentCard}>
          {product.description ? (
            <>
              <Text
                style={styles.descriptionText}
                numberOfLines={
                  descriptionExpanded ? undefined : 7
                }
              >
                {product.description}
              </Text>

              {product.description.length > 250 ? (
                <Pressable
                  style={styles.readMoreButton}
                  onPress={() =>
                    setDescriptionExpanded(
                      (current) => !current
                    )
                  }
                >
                  <Text style={styles.readMoreText}>
                    {descriptionExpanded
                      ? "Show Less"
                      : "Read More"}
                  </Text>

                  <Ionicons
                    name={
                      descriptionExpanded
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={17}
                    color="#a78bfa"
                  />
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyContentText}>
              No description is available for this product.
            </Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tags</Text>

          <Text style={styles.sectionSubtitle}>
            Product keywords and search terms
          </Text>
        </View>

        <View style={styles.contentCard}>
          {tags.length > 0 ? (
            <>
              <View style={styles.tagsWrap}>
                {visibleTags.map((tag, index) => (
                  <View
                    style={styles.tagChip}
                    key={`${tag}-${index}`}
                  >
                    <Text style={styles.tagText}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>

              {tags.length > 18 ? (
                <Pressable
                  style={styles.showTagsButton}
                  onPress={() =>
                    setDescriptionExpanded(
                      (current) => !current
                    )
                  }
                >
                  <Text style={styles.showTagsText}>
                    {descriptionExpanded
                      ? "Show Fewer Tags"
                      : `Show All ${tags.length} Tags`}
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyContentText}>
              No tags are available for this product.
            </Text>
          )}
        </View>

        <View style={styles.syncCard}>
          <Ionicons
            name="sync-outline"
            size={20}
            color="#8b5cf6"
          />

          <View style={styles.syncTextWrap}>
            <Text style={styles.syncTitle}>
              Store Sync
            </Text>

            <Text style={styles.syncText}>
              {syncDate
                ? `Last synchronized ${syncDate}`
                : "Sync information is unavailable."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },

  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#242424",
    backgroundColor: "#0b0b0b",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
  },

  moreButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  headerSpacer: {
    width: 42,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 60,
  },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 18,
  },

  loadingText: {
    color: "#888888",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 7,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIconCircle: {
    width: 94,
    height: 94,
    borderRadius: 30,
    backgroundColor: "#1d1730",
    borderWidth: 1,
    borderColor: "#3d2f62",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 20,
  },

  emptyText: {
    color: "#929292",
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    height: 50,
    paddingHorizontal: 21,
    borderRadius: 16,
    backgroundColor: "#8b5cf6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },

  retryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },

  heroCard: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 24,
    overflow: "hidden",
  },

  imageWrap: {
    width: "100%",
    aspectRatio: 1.12,
    backgroundColor: "#222222",
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

  imagePlaceholderText: {
    color: "#777777",
    fontSize: 14,
    marginTop: 10,
  },

  heroContent: {
    padding: 18,
  },

  storeBadge: {
    alignSelf: "flex-start",
    minHeight: 31,
    borderRadius: 99,
    backgroundColor: "#2b2145",
    borderWidth: 1,
    borderColor: "#4a3779",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  storeBadgeText: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "900",
  },

  productTitle: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    marginTop: 13,
  },

  priceText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 10,
  },

  statusRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  statusPill: {
    minHeight: 30,
    borderRadius: 99,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  statusPillActive: {
    backgroundColor: "#173329",
  },

  statusPillInactive: {
    backgroundColor: "#2a2a2a",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusDotActive: {
    backgroundColor: "#4ade80",
  },

  statusDotInactive: {
    backgroundColor: "#a3a3a3",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },

  statusTextActive: {
    color: "#86efac",
  },

  statusTextInactive: {
    color: "#b5b5b5",
  },

  categoryText: {
    color: "#898989",
    fontSize: 12,
    fontWeight: "700",
  },

  sectionHeader: {
    marginTop: 27,
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "#777777",
    fontSize: 13,
    marginTop: 4,
  },

  metricsCard: {
    minHeight: 132,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    paddingVertical: 17,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  metricItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  metricDivider: {
    width: 1,
    height: 66,
    backgroundColor: "#303030",
  },

  metricIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: "#2b2145",
    alignItems: "center",
    justifyContent: "center",
  },

  metricIconActive: {
    backgroundColor: "#2b2145",
  },

  metricIconInactive: {
    backgroundColor: "#292929",
  },

  metricValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8,
  },

  metricValueSmall: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },

  metricLabel: {
    color: "#777777",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },

  actionsWrap: {
    gap: 10,
  },

  actionButton: {
    minHeight: 76,
    borderRadius: 18,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  actionButtonAccent: {
    backgroundColor: "#8b5cf6",
    borderColor: "#8b5cf6",
  },

  actionButtonDisabled: {
    opacity: 0.45,
  },

  actionButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },

  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2b2145",
    alignItems: "center",
    justifyContent: "center",
  },

  actionIconWrapAccent: {
    backgroundColor: "rgba(255,255,255,0.17)",
  },

  actionTextWrap: {
    flex: 1,
    paddingHorizontal: 13,
  },

  actionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  actionSubtitle: {
    color: "#818181",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  contentCard: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 20,
    padding: 17,
  },

  descriptionText: {
    color: "#d1d1d1",
    fontSize: 14,
    lineHeight: 22,
  },

  readMoreButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 13,
  },

  readMoreText: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "900",
  },

  emptyContentText: {
    color: "#777777",
    fontSize: 14,
    lineHeight: 21,
  },

  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tagChip: {
    minHeight: 33,
    borderRadius: 99,
    backgroundColor: "#242424",
    borderWidth: 1,
    borderColor: "#353535",
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  tagText: {
    color: "#cccccc",
    fontSize: 12,
    fontWeight: "700",
  },

  showTagsButton: {
    alignSelf: "flex-start",
    marginTop: 15,
  },

  showTagsText: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "900",
  },

  syncCard: {
    marginTop: 22,
    borderRadius: 18,
    backgroundColor: "#15121e",
    borderWidth: 1,
    borderColor: "#302541",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  syncTextWrap: {
    flex: 1,
    paddingLeft: 12,
  },

  syncTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },

  syncText: {
    color: "#777777",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
});
