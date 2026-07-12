import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { supabase } from "../lib/supabase";

const API_BASE = "https://artboost-ai.onrender.com";

type Product = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  product_url?: string | null;
  price?: number | null;
  currency?: string | null;
  store_name?: string | null;
  store_type?: string | null;
  status?: string | null;
  automation_enabled?: boolean;
  times_posted?: number;
  last_posted_at?: string | null;
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  async function loadProduct(productId: string) {
    try {
      setLoading(true);

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
        error?.message || "The product could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading product...</Text>
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

          <Text style={styles.headerTitle}>Product Details</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Ionicons
            name="alert-circle-outline"
            size={52}
            color="#8b5cf6"
          />

          <Text style={styles.title}>Product unavailable</Text>

          <Text style={styles.subtitle}>
            ArtBoost could not load this product.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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

        <Text style={styles.headerTitle}>Product Details</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Ionicons name="checkmark-circle" size={52} color="#8b5cf6" />

        <Text style={styles.title}>Product data loaded</Text>

        <Text style={styles.subtitle}>Product title:</Text>

        <Text style={styles.productTitle}>{product.title}</Text>

        <Text style={styles.subtitle}>Product ID:</Text>

        <Text style={styles.productId}>{product.id}</Text>
      </View>
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
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#171717",
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

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#888888",
    fontSize: 14,
    marginTop: 12,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center",
  },

  subtitle: {
    color: "#888888",
    fontSize: 14,
    marginTop: 18,
  },

  productTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 7,
    textAlign: "center",
  },

  productId: {
    color: "#c4b5fd",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 7,
    textAlign: "center",
  },
});
