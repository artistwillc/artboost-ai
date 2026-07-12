import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>

        <Text style={styles.headerTitle}>Product Details</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Ionicons name="cube-outline" size={52} color="#8b5cf6" />

        <Text style={styles.title}>Product page connected</Text>

        <Text style={styles.subtitle}>
          Product ID:
        </Text>

        <Text style={styles.productId}>
          {id || "No product ID received"}
        </Text>
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
  },

  subtitle: {
    color: "#888888",
    fontSize: 14,
    marginTop: 18,
  },

  productId: {
    color: "#c4b5fd",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 7,
    textAlign: "center",
  },
});
