import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";

const mainTabs = [
  { name: "index", title: "Create", icon: "color-palette" },
  { name: "products", title: "Products", icon: "cube" },
  { name: "connections", title: "Connect", icon: "link" },
  { name: "pro", title: "Pro", icon: "diamond" },
];

const moreItems = [
  { title: "Schedule", icon: "calendar", route: "/schedule" },
  { title: "Analytics", icon: "bar-chart", route: "/analytics" },
  { title: "Saved Campaigns", icon: "bookmark", route: "/saved" },
  { title: "Brand Kit", icon: "brush", route: "/brand" },
  { title: "Campaign History", icon: "time", route: "/history" },
  { title: "Notifications", icon: "notifications", route: "/notifications" },
  { title: "Social Connections", icon: "radio", route: "/connections" },
  { title: "Explore Tools", icon: "compass", route: "/explore" },
  { title: "Settings", icon: "settings", route: "/pro" },
];

function CustomTabBar({ state, navigation }: any) {
  const { width } = useWindowDimensions();
  const desktopWeb = Platform.OS === "web" && width >= 900;
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (moreOpen || desktopWeb) loadUnreadCount();
  }, [moreOpen, desktopWeb]);

  async function loadUnreadCount() {
    try {
      const response = await fetch("https://artboost-ai.onrender.com/notifications/all");
      const data = await response.json();
      setUnreadCount(data.notifications?.filter((item: any) => item.unread).length || 0);
    } catch (error) {
      console.log("Unread count failed:", error);
    }
  }

  function goToTab(name: string) {
    const route = state.routes.find((item: any) => item.name === name);
    if (route) navigation.navigate(route.name);
  }

  function isActive(name: string) {
    return state.routes[state.index]?.name === name;
  }

  if (desktopWeb) {
    return (
      <View style={styles.desktopSidebar}>
        <View style={styles.desktopBrand}>
          <View style={styles.brandMark}>
            <Ionicons name="color-palette" size={24} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.brandName}>ArtBoost AI</Text>
            <Text style={styles.brandSubtitle}>Artist Workspace</Text>
          </View>
        </View>

        <View style={styles.desktopNav}>
          {mainTabs.map((tab) => {
            const active = isActive(tab.name);
            return (
              <Pressable
                key={tab.name}
                style={[styles.desktopItem, active && styles.desktopItemActive]}
                onPress={() => goToTab(tab.name)}
              >
                <Ionicons name={tab.icon as any} size={20} color={active ? "#ffffff" : "#9ca3af"} />
                <Text style={[styles.desktopText, active && styles.desktopTextActive]}>{tab.title}</Text>
              </Pressable>
            );
          })}

          <View style={styles.desktopDivider} />
          <Text style={styles.desktopSection}>WORKSPACE</Text>

          {moreItems.map((item) => (
            <Pressable key={item.title} style={styles.desktopItem} onPress={() => router.push(item.route as any)}>
              <Ionicons name={item.icon as any} size={19} color="#9ca3af" />
              <Text style={styles.desktopText}>{item.title}</Text>
              {item.title === "Notifications" && unreadCount > 0 ? (
                <View style={styles.inlineBadge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.tabBar}>
        {mainTabs.map((tab) => {
          const active = isActive(tab.name);
          return (
            <Pressable key={tab.name} style={styles.tabItem} onPress={() => goToTab(tab.name)}>
              <Ionicons name={tab.icon as any} size={22} color={active ? "#8b5cf6" : "#888"} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.title}</Text>
            </Pressable>
          );
        })}
        <Pressable style={styles.tabItem} onPress={() => setMoreOpen(true)}>
          <View style={styles.moreIconWrap}>
            <Ionicons name="menu" size={24} color="#888" />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.tabText}>More</Text>
        </Pressable>
      </View>

      <Modal visible={moreOpen} transparent animationType="fade" onRequestClose={() => setMoreOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setMoreOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.moreMenu}>
                <View style={styles.handle} />
                <Text style={styles.moreTitle}>More Tools</Text>
                <Text style={styles.moreSubtitle}>Manage campaigns, analytics, brand tools, and settings.</Text>
                {moreItems.map((item) => (
                  <Pressable
                    key={item.title}
                    style={styles.moreItem}
                    onPress={() => {
                      setMoreOpen(false);
                      router.push(item.route as any);
                      setTimeout(loadUnreadCount, 800);
                    }}
                  >
                    <View style={styles.moreIconBox}>
                      <Ionicons name={item.icon as any} size={21} color="#ffffff" />
                    </View>
                    <View style={styles.moreItemTextWrap}>
                      <Text style={styles.moreItemText}>{item.title}</Text>
                      {item.title === "Notifications" && unreadCount > 0 ? (
                        <View style={styles.inlineBadge}>
                          <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#777" />
                  </Pressable>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="connections" />
      <Tabs.Screen name="brand" />
      <Tabs.Screen name="pro" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  desktopSidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: "#101010",
    borderRightWidth: 1,
    borderRightColor: "#262626",
    paddingHorizontal: 16,
    paddingTop: 22,
    zIndex: 100,
  },
  desktopBrand: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8, marginBottom: 26 },
  brandMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#8b5cf6", alignItems: "center", justifyContent: "center" },
  brandName: { color: "#fff", fontSize: 18, fontWeight: "900" },
  brandSubtitle: { color: "#777", fontSize: 11, fontWeight: "700", marginTop: 2 },
  desktopNav: { gap: 4 },
  desktopItem: { minHeight: 44, borderRadius: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  desktopItemActive: { backgroundColor: "#7c3aed" },
  desktopText: { color: "#b3b3b3", fontSize: 14, fontWeight: "700", flex: 1 },
  desktopTextActive: { color: "#fff" },
  desktopDivider: { height: 1, backgroundColor: "#292929", marginVertical: 12 },
  desktopSection: { color: "#666", fontSize: 10, fontWeight: "900", letterSpacing: 1.3, paddingHorizontal: 12, marginBottom: 5 },
  tabBar: { height: 74, backgroundColor: "#101010", borderTopWidth: 1, borderTopColor: "#222", flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingBottom: 8, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  tabText: { color: "#888", fontSize: 11, fontWeight: "700" },
  tabTextActive: { color: "#8b5cf6" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  moreMenu: { backgroundColor: "#151515", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34, borderTopWidth: 1, borderColor: "#2b2b2b" },
  handle: { width: 48, height: 5, borderRadius: 99, backgroundColor: "#444", alignSelf: "center", marginBottom: 18 },
  moreTitle: { color: "#ffffff", fontSize: 24, fontWeight: "900", marginBottom: 4 },
  moreSubtitle: { color: "#aaa", fontSize: 14, lineHeight: 20, marginBottom: 18 },
  moreItem: { backgroundColor: "#202020", borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#2d2d2d" },
  moreIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#8b5cf6", alignItems: "center", justifyContent: "center", marginRight: 12 },
  moreItemTextWrap: { flex: 1, flexDirection: "row", alignItems: "center" },
  moreItemText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  moreIconWrap: { position: "relative" },
  badge: { position: "absolute", top: -8, right: -12, backgroundColor: "#ef4444", minWidth: 18, height: 18, borderRadius: 99, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  inlineBadge: { backgroundColor: "#ef4444", minWidth: 20, height: 20, borderRadius: 99, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, marginLeft: 8 },
  badgeText: { color: "#ffffff", fontSize: 10, fontWeight: "900" },
});
