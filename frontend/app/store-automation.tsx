import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

const API_BASE = "https://artboost-ai.onrender.com";

type Frequency =
  | "daily"
  | "weekdays"
  | "weekly";

type SelectionMode =
  | "never_posted_first"
  | "least_recently_posted"
  | "random";

type PlatformOption = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  available: boolean;
};

const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    id: "facebook",
    label: "Facebook",
    icon: "logo-facebook",
    available: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "logo-instagram",
    available: true,
  },
  {
    id: "pinterest",
    label: "Pinterest",
    icon: "logo-pinterest",
    available: true,
  },
  {
    id: "x",
    label: "X",
    icon: "logo-twitter",
    available: true,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "logo-linkedin",
    available: false,
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: "logo-tiktok",
    available: false,
  },
];

const FREQUENCY_OPTIONS: {
  id: Frequency;
  label: string;
  description: string;
}[] = [
  {
    id: "daily",
    label: "Every Day",
    description: "Post one different product each day.",
  },
  {
    id: "weekdays",
    label: "Weekdays",
    description: "Post Monday through Friday.",
  },
  {
    id: "weekly",
    label: "Weekly",
    description: "Post one product each week.",
  },
];

const SELECTION_OPTIONS: {
  id: SelectionMode;
  label: string;
  description: string;
}[] = [
  {
    id: "never_posted_first",
    label: "Never Posted First",
    description:
      "Promote products that have never been posted before anything else.",
  },
  {
    id: "least_recently_posted",
    label: "Least Recently Posted",
    description:
      "Choose the product that has gone the longest without promotion.",
  },
  {
    id: "random",
    label: "Random",
    description:
      "Choose randomly from products outside the repeat-delay window.",
  },
];

function formatPlatformLabel(
  value?: string
) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (cleanValue === "shopify") {
    return "Shopify";
  }

  if (cleanValue === "etsy") {
    return "Etsy";
  }

  if (cleanValue === "ebay") {
    return "eBay";
  }

  if (cleanValue === "redbubble") {
    return "Redbubble";
  }

  if (
    cleanValue === "fine_art_america" ||
    cleanValue === "fineartamerica"
  ) {
    return "Fine Art America";
  }

  if (cleanValue === "artpal") {
    return "ArtPal";
  }

  if (cleanValue === "gumroad") {
    return "Gumroad";
  }

  if (!cleanValue) {
    return "Connected Store";
  }

  return cleanValue
    .split(/[_\-\s]+/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatStoreName(
  storeName: string,
  platformLabel: string
) {
  if (
    storeName
      .toLowerCase()
      .includes("myshopify.com")
  ) {
    return platformLabel;
  }

  return storeName;
}

function normalizeTimeInput(
  value: string
) {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(
    2,
    4
  )}`;
}

function validateTime(
  value: string
) {
  const match = value.match(
    /^(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    return false;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  return (
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

function displayTime(
  value: string
) {
  if (!validateTime(value)) {
    return value || "09:00";
  }

  const [hourValue, minute] =
    value.split(":");

  const hour = Number(hourValue);

  const displayHour =
    hour === 0
      ? 12
      : hour > 12
        ? hour - 12
        : hour;

  const suffix =
    hour >= 12 ? "PM" : "AM";

  return `${displayHour}:${minute} ${suffix}`;
}

export default function StoreAutomationScreen() {
  const params = useLocalSearchParams<{
    storeId?: string;
    storeName?: string;
    storeType?: string;
    productCount?: string;
  }>();

  const storeId = params.storeId || "";
  const storeName =
    params.storeName || "Connected Store";
  const storeType =
    params.storeType || "store";

  const productCount = useMemo(() => {
    const count = Number(
      params.productCount
    );

    return Number.isNaN(count)
      ? 0
      : count;
  }, [params.productCount]);

  const platformLabel =
    useMemo(
      () =>
        formatPlatformLabel(
          storeType
        ),
      [storeType]
    );

  const displayStoreName =
    useMemo(
      () =>
        formatStoreName(
          storeName,
          platformLabel
        ),
      [storeName, platformLabel]
    );

  const [enabled, setEnabled] =
    useState(false);

  const [frequency, setFrequency] =
    useState<Frequency>("daily");

  const [postingTime, setPostingTime] =
    useState("09:00");

  const [timezone] = useState(
    "America/Chicago"
  );

  const [
    selectedPlatforms,
    setSelectedPlatforms,
  ] = useState<string[]>([
    "facebook",
    "instagram",
    "pinterest",
    "x",
  ]);

  const [
    selectionMode,
    setSelectionMode,
  ] = useState<SelectionMode>(
    "never_posted_first"
  );

  const [
    repeatDelayDays,
    setRepeatDelayDays,
  ] = useState("30");

  const [saving, setSaving] =
    useState(false);

  const nextRunText = useMemo(() => {
    if (!enabled) {
      return "Enable automation to calculate the next run.";
    }

    const frequencyLabel =
      frequency === "daily"
        ? "Tomorrow"
        : frequency === "weekdays"
          ? "Next weekday"
          : "Next week";

    return `${frequencyLabel} at ${displayTime(
      postingTime
    )}`;
  }, [
    enabled,
    frequency,
    postingTime,
  ]);

  function togglePlatform(
    platform: PlatformOption
  ) {
    if (!platform.available) {
      Alert.alert(
        "Coming Soon",
        `${platform.label} automation will be added in a future update.`
      );

      return;
    }

    setSelectedPlatforms(
      (current) => {
        if (
          current.includes(
            platform.id
          )
        ) {
          return current.filter(
            (item) =>
              item !== platform.id
          );
        }

        return [
          ...current,
          platform.id,
        ];
      }
    );
  }

  function decreaseRepeatDelay() {
    const currentValue = Math.max(
      Number(repeatDelayDays) || 0,
      0
    );

    setRepeatDelayDays(
      String(
        Math.max(
          currentValue - 1,
          0
        )
      )
    );
  }

  function increaseRepeatDelay() {
    const currentValue = Math.max(
      Number(repeatDelayDays) || 0,
      0
    );

    setRepeatDelayDays(
      String(currentValue + 1)
    );
  }

  async function saveAutomation() {
  if (!storeId) {
    Alert.alert(
      "Missing Store",
      "This screen was opened without a store connection ID."
    );

    return;
  }

  if (
    enabled &&
    selectedPlatforms.length === 0
  ) {
    Alert.alert(
      "Select Platforms",
      "Choose at least one social platform before enabling automation."
    );

    return;
  }

  if (!validateTime(postingTime)) {
    Alert.alert(
      "Invalid Posting Time",
      "Enter the posting time in 24-hour format, such as 09:00 or 18:30."
    );

    return;
  }

  const parsedRepeatDelay =
    Number(repeatDelayDays);

  if (
    Number.isNaN(parsedRepeatDelay) ||
    parsedRepeatDelay < 0
  ) {
    Alert.alert(
      "Invalid Repeat Delay",
      "Repeat delay must be zero or more days."
    );

    return;
  }

  try {
    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!user) {
      throw new Error(
        "You must be signed in to save an automation."
      );
    }

    const response = await fetch(
      `${API_BASE}/automations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          storeId,
          storeName,
          storeType,
          automationName:
            "Daily Store Rotation",
          enabled,
          frequency,
          postingTime: `${postingTime}:00`,
          timezone,
          platforms: selectedPlatforms,
          selectionMode,
          repeatDelayDays:
            parsedRepeatDelay,
        }),
      }
    );

    const responseText = await response.text();

let data: any;

try {
  data = JSON.parse(responseText);
} catch {
  throw new Error(
    `Backend returned ${response.status}: ${responseText.slice(0, 150)}`
  );
}

    if (!response.ok || !data.success) {
      throw new Error(
        data.details ||
          data.error ||
          "ArtBoost could not save the automation."
      );
    }

    Alert.alert(
      "Automation Saved",
      enabled
        ? `${platformLabel} will promote a different eligible product automatically.`
        : `${platformLabel} automation was saved in the off position.`,
      [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]
    );
  } catch (error: any) {
    console.log(
      "Store automation save failed:",
      error
    );

    Alert.alert(
      "Save Failed",
      error?.message ||
        "ArtBoost could not save the store automation."
    );
  } finally {
    setSaving(false);
  }
}

  return (
    <SafeAreaView
      style={styles.screen}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#ffffff"
            />
          </Pressable>

          <View
            style={
              styles.headerTextWrap
            }
          >
            <Text
              style={styles.eyebrow}
            >
              STORE MARKETING
            </Text>

            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              Automation
            </Text>
          </View>

          <View
            style={
              styles.headerIcon
            }
          >
            <Ionicons
              name="flash"
              size={22}
              color="#c4b5fd"
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.storeCard}
          >
            <View
              style={
                styles.storeIconWrap
              }
            >
              <Ionicons
                name="storefront-outline"
                size={32}
                color="#c4b5fd"
              />
            </View>

            <View
              style={
                styles.storeInfo
              }
            >
              <Text
                style={
                  styles.platformText
                }
              >
                {platformLabel}
              </Text>

              <Text
                style={
                  styles.storeNameText
                }
                numberOfLines={2}
              >
                {displayStoreName}
              </Text>

              <Text
                style={
                  styles.productCountText
                }
              >
                {productCount}{" "}
                {productCount === 1
                  ? "product"
                  : "products"}{" "}
                available
              </Text>
            </View>
          </View>

          <View
            style={styles.sectionCard}
          >
            <View
              style={
                styles.sectionHeaderRow
              }
            >
              <View
                style={styles.sectionIcon}
              >
                <Ionicons
                  name="flash-outline"
                  size={22}
                  color="#a78bfa"
                />
              </View>

              <View
                style={
                  styles.sectionHeading
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Store Automation
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  Promote a different
                  product automatically.
                </Text>
              </View>

              <Switch
                value={enabled}
                onValueChange={
                  setEnabled
                }
                trackColor={{
                  false: "#353535",
                  true: "#6547b5",
                }}
                thumbColor={
                  enabled
                    ? "#ffffff"
                    : "#b1b1b1"
                }
              />
            </View>

            <View
              style={
                styles.statusBanner
              }
            >
              <View
                style={[
                  styles.statusDot,
                  enabled
                    ? styles.statusDotActive
                    : styles.statusDotInactive,
                ]}
              />

              <Text
                style={[
                  styles.statusBannerText,
                  enabled
                    ? styles.statusBannerTextActive
                    : styles.statusBannerTextInactive,
                ]}
              >
                {enabled
                  ? "Automation is enabled"
                  : "Automation is currently off"}
              </Text>
            </View>
          </View>

          <View
            style={styles.sectionCard}
          >
            <Text
              style={styles.sectionTitle}
            >
              Posting Schedule
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Choose how often and when
              ArtBoost should create a
              product promotion.
            </Text>

            <Text
              style={styles.fieldLabel}
            >
              Frequency
            </Text>

            <View
              style={
                styles.optionStack
              }
            >
              {FREQUENCY_OPTIONS.map(
                (option) => {
                  const selected =
                    frequency ===
                    option.id;

                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.radioCard,
                        selected &&
                          styles.radioCardSelected,
                      ]}
                      onPress={() =>
                        setFrequency(
                          option.id
                        )
                      }
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          selected &&
                            styles.radioOuterSelected,
                        ]}
                      >
                        {selected ? (
                          <View
                            style={
                              styles.radioInner
                            }
                          />
                        ) : null}
                      </View>

                      <View
                        style={
                          styles.radioTextWrap
                        }
                      >
                        <Text
                          style={[
                            styles.radioTitle,
                            selected &&
                              styles.radioTitleSelected,
                          ]}
                        >
                          {option.label}
                        </Text>

                        <Text
                          style={
                            styles.radioDescription
                          }
                        >
                          {
                            option.description
                          }
                        </Text>
                      </View>
                    </Pressable>
                  );
                }
              )}
            </View>

            <Text
              style={styles.fieldLabel}
            >
              Posting Time
            </Text>

            <View
              style={styles.inputRow}
            >
              <View
                style={styles.inputIcon}
              >
                <Ionicons
                  name="time-outline"
                  size={21}
                  color="#a78bfa"
                />
              </View>

              <TextInput
                value={postingTime}
                onChangeText={(value) =>
                  setPostingTime(
                    normalizeTimeInput(
                      value
                    )
                  )
                }
                placeholder="09:00"
                placeholderTextColor="#666666"
                keyboardType="number-pad"
                maxLength={5}
                style={styles.textInput}
              />

              <Text
                style={
                  styles.inputHint
                }
              >
                {displayTime(
                  postingTime
                )}
              </Text>
            </View>

            <Text
              style={styles.fieldHelp}
            >
              Enter time in 24-hour
              format.
            </Text>

            <Text
              style={styles.fieldLabel}
            >
              Timezone
            </Text>

            <View
              style={
                styles.readOnlyRow
              }
            >
              <Ionicons
                name="globe-outline"
                size={21}
                color="#a78bfa"
              />

              <Text
                style={
                  styles.readOnlyText
                }
              >
                {timezone}
              </Text>

              <View
                style={styles.autoPill}
              >
                <Text
                  style={
                    styles.autoPillText
                  }
                >
                  DEFAULT
                </Text>
              </View>
            </View>
          </View>

          <View
            style={styles.sectionCard}
          >
            <Text
              style={styles.sectionTitle}
            >
              Social Platforms
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              ArtBoost will prepare and
              publish platform-specific
              content for each selected
              account.
            </Text>

            <View
              style={
                styles.platformGrid
              }
            >
              {PLATFORM_OPTIONS.map(
                (platform) => {
                  const selected =
                    selectedPlatforms.includes(
                      platform.id
                    );

                  return (
                    <Pressable
                      key={platform.id}
                      style={[
                        styles.platformCard,
                        selected &&
                          styles.platformCardSelected,
                        !platform.available &&
                          styles.platformCardDisabled,
                      ]}
                      onPress={() =>
                        togglePlatform(
                          platform
                        )
                      }
                    >
                      <View
                        style={[
                          styles.platformIconWrap,
                          selected &&
                            styles.platformIconWrapSelected,
                        ]}
                      >
                        <Ionicons
                          name={
                            platform.icon
                          }
                          size={24}
                          color={
                            selected
                              ? "#ffffff"
                              : platform.available
                                ? "#a78bfa"
                                : "#666666"
                          }
                        />
                      </View>

                      <Text
                        style={[
                          styles.platformLabel,
                          selected &&
                            styles.platformLabelSelected,
                          !platform.available &&
                            styles.platformLabelDisabled,
                        ]}
                      >
                        {platform.label}
                      </Text>

                      {platform.available ? (
                        <View
                          style={[
                            styles.checkbox,
                            selected &&
                              styles.checkboxSelected,
                          ]}
                        >
                          {selected ? (
                            <Ionicons
                              name="checkmark"
                              size={15}
                              color="#ffffff"
                            />
                          ) : null}
                        </View>
                      ) : (
                        <Text
                          style={
                            styles.soonText
                          }
                        >
                          SOON
                        </Text>
                      )}
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>

          <View
            style={styles.sectionCard}
          >
            <Text
              style={styles.sectionTitle}
            >
              Product Selection
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Control how ArtBoost chooses
              the next product from your
              store.
            </Text>

            <View
              style={
                styles.optionStack
              }
            >
              {SELECTION_OPTIONS.map(
                (option) => {
                  const selected =
                    selectionMode ===
                    option.id;

                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.radioCard,
                        selected &&
                          styles.radioCardSelected,
                      ]}
                      onPress={() =>
                        setSelectionMode(
                          option.id
                        )
                      }
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          selected &&
                            styles.radioOuterSelected,
                        ]}
                      >
                        {selected ? (
                          <View
                            style={
                              styles.radioInner
                            }
                          />
                        ) : null}
                      </View>

                      <View
                        style={
                          styles.radioTextWrap
                        }
                      >
                        <Text
                          style={[
                            styles.radioTitle,
                            selected &&
                              styles.radioTitleSelected,
                          ]}
                        >
                          {option.label}
                        </Text>

                        <Text
                          style={
                            styles.radioDescription
                          }
                        >
                          {
                            option.description
                          }
                        </Text>
                      </View>
                    </Pressable>
                  );
                }
              )}
            </View>

            <Text
              style={styles.fieldLabel}
            >
              Repeat Delay
            </Text>

            <View
              style={
                styles.counterRow
              }
            >
              <Pressable
                style={
                  styles.counterButton
                }
                onPress={
                  decreaseRepeatDelay
                }
              >
                <Ionicons
                  name="remove"
                  size={23}
                  color="#ffffff"
                />
              </Pressable>

              <View
                style={
                  styles.counterInputWrap
                }
              >
                <TextInput
                  value={
                    repeatDelayDays
                  }
                  onChangeText={(
                    value
                  ) =>
                    setRepeatDelayDays(
                      value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  keyboardType="number-pad"
                  maxLength={4}
                  style={
                    styles.counterInput
                  }
                />

                <Text
                  style={
                    styles.counterSuffix
                  }
                >
                  days
                </Text>
              </View>

              <Pressable
                style={
                  styles.counterButton
                }
                onPress={
                  increaseRepeatDelay
                }
              >
                <Ionicons
                  name="add"
                  size={23}
                  color="#ffffff"
                />
              </Pressable>
            </View>

            <Text
              style={styles.fieldHelp}
            >
              A product will not be reused
              until this many days have
              passed.
            </Text>
          </View>

          <View
            style={styles.previewCard}
          >
            <View
              style={
                styles.previewHeader
              }
            >
              <View
                style={
                  styles.previewIconWrap
                }
              >
                <Ionicons
                  name="sparkles"
                  size={23}
                  color="#c4b5fd"
                />
              </View>

              <View
                style={
                  styles.previewHeading
                }
              >
                <Text
                  style={
                    styles.previewTitle
                  }
                >
                  Automation Preview
                </Text>

                <Text
                  style={
                    styles.previewSubtitle
                  }
                >
                  Your next store promotion
                </Text>
              </View>
            </View>

            <View
              style={
                styles.previewDivider
              }
            />

            <View
              style={
                styles.previewRow
              }
            >
              <Text
                style={
                  styles.previewLabel
                }
              >
                Store
              </Text>

              <Text
                style={
                  styles.previewValue
                }
                numberOfLines={1}
              >
                {displayStoreName}
              </Text>
            </View>

            <View
              style={
                styles.previewRow
              }
            >
              <Text
                style={
                  styles.previewLabel
                }
              >
                Next Product
              </Text>

              <Text
                style={
                  styles.previewValue
                }
              >
                Selected automatically
              </Text>
            </View>

            <View
              style={
                styles.previewRow
              }
            >
              <Text
                style={
                  styles.previewLabel
                }
              >
                Next Run
              </Text>

              <Text
                style={[
                  styles.previewValue,
                  enabled &&
                    styles.previewValueActive,
                ]}
              >
                {nextRunText}
              </Text>
            </View>

            <View
              style={
                styles.previewRow
              }
            >
              <Text
                style={
                  styles.previewLabel
                }
              >
                Platforms
              </Text>

              <Text
                style={
                  styles.previewValue
                }
              >
                {selectedPlatforms.length}
                {" selected"}
              </Text>
            </View>

            <View
              style={
                styles.previewNotice
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={19}
                color="#a78bfa"
              />

              <Text
                style={
                  styles.previewNoticeText
                }
              >
                ArtBoost will select a
                different eligible product,
                generate unique content for
                each platform, and add it to
                the campaign scheduler.
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.saveButton,
              saving &&
                styles.saveButtonDisabled,
            ]}
            onPress={saveAutomation}
            disabled={saving}
          >
            <Ionicons
              name={
                saving
                  ? "hourglass-outline"
                  : "save-outline"
              }
              size={22}
              color="#ffffff"
            />

            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? "Saving..."
                : "Save Automation"}
            </Text>
          </Pressable>

          <Text
            style={styles.footerText}
          >
            You can change or disable this
            automation at any time.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1d1d1d",
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextWrap: {
    flex: 1,
    paddingHorizontal: 14,
  },

  eyebrow: {
    color: "#8b5cf6",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 3,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#2b2145",
    borderWidth: 1,
    borderColor: "#4c3979",
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },

  storeCard: {
    borderRadius: 22,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#302641",
    padding: 17,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  storeIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 19,
    backgroundColor: "#2b2145",
    borderWidth: 1,
    borderColor: "#4c3979",
    alignItems: "center",
    justifyContent: "center",
  },

  storeInfo: {
    flex: 1,
    paddingLeft: 14,
  },

  platformText: {
    color: "#a78bfa",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  storeNameText: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    marginTop: 3,
  },

  productCountText: {
    color: "#858585",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },

  sectionCard: {
    borderRadius: 22,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    padding: 17,
    marginBottom: 16,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#2b2145",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeading: {
    flex: 1,
    paddingHorizontal: 12,
  },

  sectionTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },

  sectionDescription: {
    color: "#8b8b8b",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  statusBanner: {
    minHeight: 42,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "#202020",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    marginRight: 9,
  },

  statusDotActive: {
    backgroundColor: "#4ade80",
  },

  statusDotInactive: {
    backgroundColor: "#777777",
  },

  statusBannerText: {
    fontSize: 12,
    fontWeight: "900",
  },

  statusBannerTextActive: {
    color: "#86efac",
  },

  statusBannerTextInactive: {
    color: "#aaaaaa",
  },

  fieldLabel: {
    color: "#d7d7d7",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 20,
    marginBottom: 10,
  },

  fieldHelp: {
    color: "#6f6f6f",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },

  optionStack: {
    gap: 10,
  },

  radioCard: {
    minHeight: 73,
    borderRadius: 16,
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor: "#303030",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  radioCardSelected: {
    backgroundColor: "#241b3b",
    borderColor: "#6649a8",
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: "#686868",
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterSelected: {
    borderColor: "#a78bfa",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: "#a78bfa",
  },

  radioTextWrap: {
    flex: 1,
    paddingLeft: 12,
  },

  radioTitle: {
    color: "#d1d1d1",
    fontSize: 14,
    fontWeight: "900",
  },

  radioTitleSelected: {
    color: "#ffffff",
  },

  radioDescription: {
    color: "#858585",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  inputRow: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor: "#303030",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  inputIcon: {
    width: 35,
    alignItems: "flex-start",
  },

  textInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },

  inputHint: {
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: "900",
  },

  readOnlyRow: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor: "#303030",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  readOnlyText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  autoPill: {
    borderRadius: 99,
    backgroundColor: "#2b2145",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  autoPillText: {
    color: "#c4b5fd",
    fontSize: 9,
    fontWeight: "900",
  },

  platformGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  platformCard: {
    width: "48%",
    minHeight: 70,
    borderRadius: 17,
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor: "#303030",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  platformCardSelected: {
    backgroundColor: "#241b3b",
    borderColor: "#6649a8",
  },

  platformCardDisabled: {
    opacity: 0.55,
  },

  platformIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },

  platformIconWrapSelected: {
    backgroundColor: "#8b5cf6",
  },

  platformLabel: {
    flex: 1,
    color: "#d0d0d0",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 9,
  },

  platformLabelSelected: {
    color: "#ffffff",
  },

  platformLabelDisabled: {
    color: "#777777",
  },

  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#5f5f5f",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor: "#8b5cf6",
    borderColor: "#8b5cf6",
  },

  soonText: {
    color: "#777777",
    fontSize: 8,
    fontWeight: "900",
  },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  counterButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#2b2145",
    borderWidth: 1,
    borderColor: "#4c3979",
    alignItems: "center",
    justifyContent: "center",
  },

  counterInputWrap: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor: "#303030",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  counterInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  counterSuffix: {
    color: "#8a8a8a",
    fontSize: 12,
    fontWeight: "800",
  },

  previewCard: {
    borderRadius: 22,
    backgroundColor: "#1d1730",
    borderWidth: 1,
    borderColor: "#3c2d63",
    padding: 17,
    marginBottom: 18,
  },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  previewIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#2b2145",
    alignItems: "center",
    justifyContent: "center",
  },

  previewHeading: {
    flex: 1,
    paddingLeft: 12,
  },

  previewTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  previewSubtitle: {
    color: "#a99dbb",
    fontSize: 11,
    marginTop: 3,
  },

  previewDivider: {
    height: 1,
    backgroundColor: "#3c3150",
    marginVertical: 15,
  },

  previewRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  previewLabel: {
    color: "#91859f",
    fontSize: 12,
    fontWeight: "700",
  },

  previewValue: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },

  previewValueActive: {
    color: "#c4b5fd",
  },

  previewNotice: {
    borderRadius: 15,
    backgroundColor: "#2b2145",
    padding: 13,
    marginTop: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  previewNoticeText: {
    flex: 1,
    color: "#b9afc7",
    fontSize: 11,
    lineHeight: 17,
  },

  saveButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#8b5cf6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  footerText: {
    color: "#6f6f6f",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 12,
  },
});