import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const BACKEND_URL = "https://artboost-ai.onrender.com";

const platforms = [
  {
    name: "Pinterest",
    description: "Auto-publish pins and artwork campaigns.",
    premium: true,
  },
  {
    name: "Facebook",
    description: "Post artwork directly to Facebook Pages.",
    premium: true,
  },
  {
    name: "Instagram",
    description: "Instagram Business publishing and captions.",
    premium: true,
  },
  {
    name: "X",
    description: "Fast text and artwork posting.",
    premium: true,
  },
];

export default function ConnectionsScreen() {
  const [connections, setConnections] = useState<any>({});
  const [loadingStatus, setLoadingStatus] = useState(false);

  const saveConnections = async (updated: any) => {
    setConnections(updated);

    await AsyncStorage.setItem(
      "artboost_connections",
      JSON.stringify(updated)
    );
  };

  const checkPinterestStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/pinterest/status`);
      const data = await response.json();

      const saved = await AsyncStorage.getItem("artboost_connections");
      const current = saved ? JSON.parse(saved) : {};

      const updated = {
        ...current,
        Pinterest: Boolean(data.connected),
      };

      await saveConnections(updated);
    } catch (error) {
      console.log("Pinterest status check failed:", error);
    }
  };

  const checkFacebookStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/facebook/test`);
      const data = await response.json();

      const saved = await AsyncStorage.getItem("artboost_connections");
      const current = saved ? JSON.parse(saved) : {};

      const updated = {
        ...current,
        Facebook: Boolean(data.connected),
      };

      await saveConnections(updated);
    } catch (error) {
      console.log("Facebook status check failed:", error);
    }
  };

  const refreshAllStatuses = async () => {
    try {
      setLoadingStatus(true);

      await checkPinterestStatus();
      await checkFacebookStatus();
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadConnections = async () => {
    const saved = await AsyncStorage.getItem("artboost_connections");

    if (saved) {
      setConnections(JSON.parse(saved));
    }

    await refreshAllStatuses();
  };

  const connectPinterest = async () => {
    await Linking.openURL(`${BACKEND_URL}/auth/pinterest`);

    Alert.alert(
      "Pinterest Login Opened",
      "After connecting Pinterest, return to ArtBoost and tap Refresh Connection Status."
    );
  };

  const connectFacebook = async () => {
    await Linking.openURL(`${BACKEND_URL}/auth/facebook`);

    Alert.alert(
      "Facebook Login Opened",
      "After connecting Facebook, return to ArtBoost and tap Refresh Connection Status."
    );
  };

  const disconnectPlatform = async (platform: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/disconnect-platform`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to disconnect ${platform}.`);
      }

      const updated = {
        ...connections,
        [platform]: false,
      };

      await saveConnections(updated);
      await refreshAllStatuses();

      Alert.alert(
        `${platform} Disconnected`,
        `${platform} has been disconnected successfully.`
      );
    } catch (err: any) {
      console.log(`${platform} disconnect failed:`, err);

      Alert.alert(
        "Disconnect Failed",
        err.message || `Failed to disconnect ${platform}.`
      );
    }
  };

  const confirmDisconnect = (platform: string) => {
    Alert.alert(
      `Disconnect ${platform}?`,
      `You will need to reconnect ${platform} before posting to it again.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => disconnectPlatform(platform),
        },
      ]
    );
  };

  const toggleConnection = async (platform: string) => {
    if (platform === "Pinterest") {
      if (connections.Pinterest) {
        confirmDisconnect("Pinterest");
      } else {
        await connectPinterest();
      }

      return;
    }

    if (platform === "Facebook") {
      if (connections.Facebook) {
        confirmDisconnect("Facebook");
      } else {
        await connectFacebook();
      }

      return;
    }

    if (connections[platform]) {
      confirmDisconnect(platform);
      return;
    }

    const updated = {
      ...connections,
      [platform]: true,
    };

    await saveConnections(updated);

    Alert.alert(
      `${platform} Connected`,
      `Your ${platform} account is now connected.`
    );
  };

  useEffect(() => {
    loadConnections();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Connections</Text>

      <Text style={styles.subheader}>
        Connect creator platforms for automated publishing and Pro workflow
        tools.
      </Text>

      <View style={styles.proBox}>
        <Text style={styles.proTitle}>ArtBoost Pro</Text>

        <Text style={styles.proText}>
          Connect platforms once, then generate and publish campaigns
          automatically.
        </Text>
      </View>

      <Pressable style={styles.refreshButton} onPress={refreshAllStatuses}>
        <Text style={styles.buttonText}>
          {loadingStatus ? "Checking Connections..." : "Refresh Connection Status"}
        </Text>
      </Pressable>

      {platforms.map((platform) => {
        const connected = connections[platform.name];

        return (
          <View key={platform.name} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.platformInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.name}>{platform.name}</Text>

                  {platform.premium && (
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.description}>{platform.description}</Text>

                <Text
                  style={[
                    styles.status,
                    connected ? styles.connectedText : styles.disconnectedText,
                  ]}
                >
                  {connected ? "Connected" : "Not Connected"}
                </Text>
              </View>

              <View style={styles.buttonColumn}>
                <Pressable
                  style={[
                    styles.button,
                    connected ? styles.reconnectButton : styles.connect,
                  ]}
                  onPress={() => toggleConnection(platform.name)}
                >
                  <Text style={styles.buttonText}>
                    {connected ? "Reconnect" : "Connect"}
                  </Text>
                </Pressable>

                {connected && (
                  <Pressable
                    style={[styles.button, styles.disconnect]}
                    onPress={() => confirmDisconnect(platform.name)}
                  >
                    <Text style={styles.buttonText}>Disconnect</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#101010",
    minHeight: "100%",
  },

  header: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 40,
    textAlign: "center",
  },

  subheader: {
    color: "#aaa",
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
    lineHeight: 22,
  },

  proBox: {
    backgroundColor: "#1b1b1b",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },

  proTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },

  proText: {
    color: "#cfcfcf",
    lineHeight: 22,
    fontSize: 14,
  },

  refreshButton: {
    backgroundColor: "#2d6cdf",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 22,
  },

  card: {
    backgroundColor: "#1b1b1b",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  platformInfo: {
    flex: 1,
    paddingRight: 12,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  description: {
    color: "#aaa",
    marginTop: 8,
    lineHeight: 20,
    fontSize: 13,
  },

  status: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
  },

  connectedText: {
    color: "#12a86b",
  },

  disconnectedText: {
    color: "#999",
  },

  buttonColumn: {
    minWidth: 112,
  },

  button: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
  },

  connect: {
    backgroundColor: "#12a86b",
  },

  reconnectButton: {
    backgroundColor: "#2d6cdf",
  },

  disconnect: {
    backgroundColor: "#a62828",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  proBadge: {
    backgroundColor: "#8b5cf6",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
  },

  proBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
});
