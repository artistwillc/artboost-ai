import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const BACKEND_URL = "https://artboost-ai.onrender.com";

type AnalyticsData = {
  total: number;
  totalCampaigns: number;
  scheduled: number;
  published: number;
  failed: number;
  saved: number;
  ended: number;
  active: number;
  paused: number;
  totalPosts: number;
  successRate: number;
  averagePostsPerCampaign: number;
  pinterestPosts: number;
  facebookPosts: number;
  instagramPosts: number;
  xPosts: number;
  referralCount: number;
  freeMonthsEarned: number;
  subscriptionTier: string;
  monthlyCampaignCount: number;
  unread: number;
  pinterestConnected: boolean;
  upcoming: any | null;
};

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadAnalytics() {
  try {
    setError("");

    const response = await fetch(`${BACKEND_URL}/analytics`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load analytics.");
    }

    let unread = 0;
    let pinterestConnected = false;

    try {
      const notificationsRes = await fetch(`${BACKEND_URL}/notifications/all`);
      const notificationsData = await notificationsRes.json();

      unread =
        notificationsData.notifications?.filter((n: any) => n.unread)
          .length || 0;
    } catch {
      unread = 0;
    }

    try {
      const pinterestRes = await fetch(`${BACKEND_URL}/pinterest/status`);
      const pinterestData = await pinterestRes.json();

      pinterestConnected = pinterestData.connected || false;
    } catch {
      pinterestConnected = false;
    }

    setAnalytics({
      total: data.total || 0,
      totalCampaigns: data.totalCampaigns || 0,
      scheduled: data.scheduled || 0,
      published: data.published || 0,
      failed: data.failed || 0,
      saved: data.saved || 0,
      ended: data.ended || 0,
      active: data.active || 0,
      paused: data.paused || 0,
      totalPosts: data.totalPosts || 0,
      successRate: data.successRate || 0,
      averagePostsPerCampaign: data.averagePostsPerCampaign || 0,
      pinterestPosts: data.pinterestPosts || 0,
      facebookPosts: data.facebookPosts || 0,
      instagramPosts: data.instagramPosts || 0,
      xPosts: data.xPosts || 0,
      referralCount: data.referralCount || 0,
      freeMonthsEarned: data.freeMonthsEarned || 0,
      subscriptionTier: data.subscriptionTier || "free",
      monthlyCampaignCount: data.monthlyCampaignCount || 0,
      unread,
      pinterestConnected,
      upcoming: data.upcoming || null,
    });
  } catch (err: any) {
    setError(err.message || "Something went wrong.");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}

  useEffect(() => {
    loadAnalytics();
  }, []);

  function formatDate(value?: string) {
    if (!value) return "No upcoming posts";

    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadAnalytics();
          }}
        />
      }
    >
      <Text style={styles.title}>Analytics Dashboard</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Section title="Campaign Metrics">
        <View style={styles.grid}>
          <StatCard label="Total Campaigns" value={analytics?.totalCampaigns || 0} />
          <StatCard label="Scheduled" value={analytics?.scheduled || 0} />
          <StatCard label="Published" value={analytics?.published || 0} />
          <StatCard label="Failed" value={analytics?.failed || 0} />
          <StatCard label="Saved" value={analytics?.saved || 0} />
          <StatCard label="Ended" value={analytics?.ended || 0} />
          <StatCard label="Active" value={analytics?.active || 0} />
          <StatCard label="Paused" value={analytics?.paused || 0} />
        </View>
      </Section>

      <Section title="Performance">
        <View style={styles.grid}>
          <StatCard label="Success Rate %" value={analytics?.successRate || 0} />
          <StatCard label="Total Posts" value={analytics?.totalPosts || 0} />
          <StatCard
            label="Avg Posts/Campaign"
            value={analytics?.averagePostsPerCampaign || 0}
          />
          <StatCard label="Unread Alerts" value={analytics?.unread || 0} />
        </View>
      </Section>

      <Section title="Platform Breakdown">
        <View style={styles.grid}>
          <StatCard label="Pinterest" value={analytics?.pinterestPosts || 0} />
          <StatCard label="Facebook" value={analytics?.facebookPosts || 0} />
          <StatCard label="Instagram" value={analytics?.instagramPosts || 0} />
          <StatCard label="X" value={analytics?.xPosts || 0} />
        </View>
      </Section>

      <Section title="Referral Metrics">
        <View style={styles.grid}>
          <StatCard label="Successful Referrals" value={analytics?.referralCount || 0} />
          <StatCard label="Free Months" value={analytics?.freeMonthsEarned || 0} />
        </View>
      </Section>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Subscription</Text>
        <Text style={styles.panelText}>
          Tier: {(analytics?.subscriptionTier || "free").toUpperCase()}
        </Text>
        <Text style={styles.panelSubText}>
          Monthly Campaign Count: {analytics?.monthlyCampaignCount || 0}
        </Text>
        <Text style={styles.panelSubText}>
          Pinterest: {analytics?.pinterestConnected ? "Connected" : "Not Connected"}
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Next Scheduled Post</Text>
        <Text style={styles.panelText}>
          {analytics?.upcoming
            ? analytics.upcoming.title
            : "No upcoming campaign found"}
        </Text>
        <Text style={styles.panelSubText}>
          {analytics?.upcoming
            ? formatDate(analytics.upcoming.publish_at)
            : "Schedule a campaign"}
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B0F19",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
  },
  error: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#3A1111",
    color: "#FFB4B4",
    marginBottom: 16,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    backgroundColor: "#151B2B",
    padding: 18,
    borderRadius: 18,
  },
  cardValue: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
  },
  cardLabel: {
    color: "#AAB2C0",
    marginTop: 4,
  },
  panel: {
    backgroundColor: "#151B2B",
    padding: 18,
    borderRadius: 18,
    marginTop: 18,
  },
  panelTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
  panelText: {
    color: "#fff",
    fontWeight: "700",
    marginTop: 8,
  },
  panelSubText: {
    color: "#AAB2C0",
    marginTop: 5,
  },
<<<<<<< HEAD
});
=======
});
>>>>>>> 82856e9 (Improve analytics dashboard UI)
