import React, { useCallback, useEffect, useState } from "react";
import {View,Text,StyleSheet,Pressable, ScrollView,Modal,TextInput,Alert,RefreshControl,ActivityIndicator,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { theme } from "../../constants/theme";
import { AuthStackParamList } from "../../RootNavigator";
import FamilyBottomNav from "../../components/FamilyBottomNav";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "MyBookings">;
type BookingRow = {
  booking_id: string;
  family_fk: string;
  caregiver_fk: string;
  requested_at: string;
  service_date: string;
  booking_status: "Requested" | "Accepted" | "Declined" | "Completed" | "Cancelled";
  has_complaint: boolean | null;
  has_review?: boolean | null;
  payment_status: string | null;
  caregiver_name?: string | null;
  caregiver_district?: string | null;
  family_name?: string | null;
  family_district?: string | null;
  caregiver_service_type?: string | null;
  caregiver_time_period?: string | null;
  caregiver_languages?: string | null;
};

type ComplaintCategory = "Punctuality" | "Safety Concern" | "Service Quality" | "Other";

// Formats ISO date values into a readable date and time string for booking display
function formatPrettyDate(iso: string, language: string) {
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return iso;

  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsSi = ["ජන", "පෙබ", "මාර්", "අප්‍රේ", "මැයි", "ජූනි", "ජූලි", "අගෝ", "සැප්", "ඔක්", "නොවැ", "දෙසැ"];
  const monthsTa = ["ஜன", "பிப்", "மார்", "ஏப்", "மே", "ஜூன்", "ஜூலை", "ஆக்", "செப்", "அக்", "நவ", "டிச"];

  const day = d.getDate();
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const isPm = hours >= 12;
  hours = hours % 12 || 12;

  const lang = String(language || "en").toLowerCase();
  const isSinhala = lang.startsWith("si");
  const isTamil = lang.startsWith("ta");

  const monthName = isSinhala
    ? monthsSi[d.getMonth()]
    : isTamil
    ? monthsTa[d.getMonth()]
    : monthsEn[d.getMonth()];

  const ampm = isSinhala
    ? isPm
      ? "ප.ව."
      : "පෙ.ව."
    : isTamil
    ? isPm
      ? "பி.ப."
      : "மு.ப."
    : isPm
    ? "PM"
    : "AM";

  return `${day} ${monthName} ${year} • ${hours}:${minutes} ${ampm}`;
}

// Cleans nullable or placeholder values before rendering them in the UI
function clean(v: any) {
  const s = String(v ?? "").trim();
  if (!s || s === "not_set" || s === "null" || s === "undefined") return "";
  return s;
}

export default function MyBookingsScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();

  const [openId, setOpenId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);

  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState<ComplaintCategory | null>(null);
  const [complaintText, setComplaintText] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [showRating, setShowRating] = useState(false);
  const [stars, setStars] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const translateDistrict = useCallback(
    (value: any) => {
      const raw = clean(value);
      if (!raw) return "";
      return t(`district_${raw.toLowerCase().replace(/\s+/g, "_")}`, {
        defaultValue: raw,
      });
    },
    [t]
  );

  const formatBookingDate = useCallback(
    (iso: string) => formatPrettyDate(iso, i18n.language),
    [i18n.language]
  );

  const getStatusLabel = useCallback(
    (status: BookingRow["booking_status"]) => {
      return status === "Requested"
        ? t("status_requested")
        : status === "Accepted"
        ? t("accepted")
        : status === "Completed"
        ? t("status_completed")
        : status === "Declined"
        ? t("declined")
        : t("status_cancelled");
    },
    [t]
  );

  // Retrieves all bookings related to the logged-in family user
  const fetchBookings = useCallback(async () => {
    try {
      // Requests the booking list from the backend service
      const res = await api.get("/booking/myBookings");
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.log("Fetch bookings error:", err?.response?.data || err?.message);
      Alert.alert(
        t("error"),
        err?.response?.data?.message || t("failed_load_bookings")
      );
    }
  }, [t]);

  // Loads bookings when the screen is first opened
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchBookings();
      setLoading(false);
    })();
  }, [fetchBookings]);

  // Reloads bookings through pull-to-refresh interaction
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  // Creates a visual badge based on the current booking status
  const StatusBadge = ({ status }: { status: BookingRow["booking_status"] }) => {
    const bg =
      status === "Requested" ? "#FFF2E0" :
      status === "Accepted" ? "#E8F1FF" :
      status === "Completed" ? "#E7F8EE" :
      status === "Declined" ? "#FEE2E2" :
      "#E5E7EB";

    const txt =
      status === "Requested" ? "#B25B00" :
      status === "Accepted" ? "#2E6BFF" :
      status === "Completed" ? "#1F8A4C" :
      status === "Declined" ? "#B91C1C" :
      "#374151";

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: txt }]}>{getStatusLabel(status)}</Text>
      </View>
    );
  };

  // Opens the complaint modal and resets previous complaint input values
  const openComplaintModal = (b: BookingRow) => {
    setSelectedBooking(b);
    setComplaintCategory(null);
    setComplaintText("");
    setShowComplaint(true);
  };

  // Opens the rating modal and clears previous review input values
  const openRatingModal = (b: BookingRow) => {
    setSelectedBooking(b);
    setStars(0);
    setReviewText("");
    setShowRating(true);
  };

  // Confirms the cancellation action before updating the booking status
  const confirmCancel = (b: BookingRow) => {
    Alert.alert(
      t("cancel_booking"),
      t("cancel_booking_msg"),
      [
        { text: t("no"), style: "cancel" },
        {
          text: t("yes_cancel"),
          style: "destructive",
          onPress: async () => {
            try {
              // Updates the selected booking status to Cancelled in the backend
              await api.put(`/booking/status/${b.booking_id}`, { status: "Cancelled" });
              Alert.alert(
                t("cancelled"),
                t("cancelled_msg")
              );
              await fetchBookings();
            } catch (err: any) {
              console.log("Cancel error:", err?.response?.data || err?.message);
              Alert.alert(
                t("cancel_failed"),
                err?.response?.data?.message || t("could_not_cancel")
              );
            }
          },
        },
      ]
    );
  };

  // Validates and submits a complaint linked to the selected booking
  const submitComplaint = async () => {
    if (!selectedBooking) return;

    // Ensures a complaint category is selected before submission
    if (!complaintCategory) {
      Alert.alert(
        t("select_category"),
        t("choose_issue_before_submit")
      );
      return;
    }

    try {
      setSubmittingComplaint(true);

      // Combines the selected category with the optional complaint description
      const reason =
        clean(complaintText)
          ? `${complaintCategory}: ${clean(complaintText)}`
          : `${complaintCategory}`;

      // Sends the complaint record to the governance module
      await api.post("/governance/fileComplaint", {
        bookingId: selectedBooking.booking_id,
        reason,
      });

      setShowComplaint(false);
      setSelectedBooking(null);
      setComplaintCategory(null);
      setComplaintText("");

      Alert.alert(
        t("complaint_submitted_title"),
        t("complaint_submitted_msg")
      );
      await fetchBookings();
    } catch (err: any) {
      console.log("Complaint submit error:", err?.response?.data || err?.message);
      Alert.alert(
        t("failed"),
        err?.response?.data?.message || t("complaint_failed")
      );
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Validates and submits a rating and optional written review
  const submitReview = async () => {
    if (!selectedBooking) return;

    // Requires at least one star rating before allowing submission
    if (stars < 1) {
      Alert.alert(
        t("add_rating"),
        t("select_star_msg")
      );
      return;
    }

    try {
      setSubmittingReview(true);

      // Sends rating and feedback data to the review service
      await api.post("/review/add", {
        bookingId: selectedBooking.booking_id,
        ratingScore: stars,
        comment: clean(reviewText) || null,
      });

      setShowRating(false);
      setSelectedBooking(null);
      setStars(0);
      setReviewText("");

      Alert.alert(
        t("review_submitted_title"),
        t("review_submitted_msg")
      );
      await fetchBookings();
    } catch (err: any) {
      console.log("Review submit error:", err?.response?.data || err?.message);
      Alert.alert(
        t("failed"),
        err?.response?.data?.message || t("review_failed")
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("my_bookings")}</Text>

        <Pressable onPress={() => navigation.replace("Login", { role: "family" })} style={styles.headerBtn}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.muted} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: theme.colors.muted, fontWeight: "700" }}>
            {t("loading_bookings")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {bookings.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={28} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>{t("no_bookings_yet")}</Text>
              <Text style={styles.emptySub}>{t("no_bookings_sub")}</Text>
            </View>
          ) : (
            bookings.map((b) => {
              // Tracks whether the current booking card is expanded
              const open = openId === b.booking_id;

              // Only requested or accepted bookings can be cancelled
              const canCancel = b.booking_status === "Requested" || b.booking_status === "Accepted";

              const caregiverName = clean(b.caregiver_name) || t("caregiver_generic");
              const caregiverDistrict = translateDistrict(b.caregiver_district);

              // Prevents duplicate complaints for the same booking
              const complaintLocked = b.has_complaint === true;

              // Allows review submission only once after booking completion
              const canRate = b.booking_status === "Completed" && b.has_review !== true;

              return (
                <Pressable
                  key={b.booking_id}
                  onPress={() => setOpenId(open ? null : b.booking_id)}
                  style={styles.card}
                >
                  <View style={styles.topRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{caregiverName}</Text>
                      <Text style={styles.sub}>{formatBookingDate(b.service_date)}</Text>
                      {!!caregiverDistrict && <Text style={styles.subSmall}>{caregiverDistrict}</Text>}
                    </View>
                    <StatusBadge status={b.booking_status} />
                  </View>

                  <View style={styles.line} />

                  <View style={styles.moneyRow}>
                    <Text style={styles.mLabel}>{t("payment")}</Text>
                    <Text style={styles.money}>{b.payment_status ?? t("na")}</Text>
                  </View>

                  {open && (
                    <View style={styles.detailBox}>
                      <Text style={styles.dTitle}>{t("booking_details")}</Text>
                      <Text style={styles.dText}>{t("status")}: {getStatusLabel(b.booking_status)}</Text>
                      <Text style={styles.dText}>{t("requested_at")}: {formatBookingDate(b.requested_at)}</Text>

                      <View style={{ height: 10 }} />

                      {canCancel && (
                        <Pressable
                          style={[styles.smallBtn, { borderColor: "#fecaca", backgroundColor: "#fff1f2" }]}
                          onPress={() => confirmCancel(b)}
                        >
                          <Text style={[styles.smallBtnText, { color: "#b91c1c" }]}>
                            {t("cancel_booking_btn")}
                          </Text>
                        </Pressable>
                      )}

                      <Pressable
                        style={[styles.smallBtn, complaintLocked && { opacity: 0.55 }]}
                        disabled={complaintLocked}
                        onPress={() => openComplaintModal(b)}
                      >
                        <Text style={styles.smallBtnText}>
                          {complaintLocked
                            ? t("complaint_already_filed")
                            : t("report_issue")}
                        </Text>
                      </Pressable>

                      {b.booking_status === "Completed" && (
                        <Pressable
                          style={[
                            styles.smallBtn,
                            { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                            !canRate && { opacity: 0.55 },
                          ]}
                          disabled={!canRate}
                          onPress={() => openRatingModal(b)}
                        >
                          <Text style={[styles.smallBtnText, { color: "white" }]}>
                            {canRate
                              ? t("rate_review")
                              : t("already_reviewed")}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      <FamilyBottomNav active="bookings" navigation={navigation} />

      {/* Bottom sheet for filing a complaint related to a booking */}
      <Modal visible={showComplaint} transparent animationType="slide" onRequestClose={() => setShowComplaint(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <Pressable onPress={() => setShowComplaint(false)} style={styles.sheetClose}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>

            <Text style={styles.sheetTitleDanger}>{t("report_issue")}</Text>
            <Text style={styles.sheetSubtitle}>{t("admins_respond_24h")}</Text>

            {(["Punctuality", "Safety Concern", "Service Quality", "Other"] as ComplaintCategory[]).map((c) => {
              const active = complaintCategory === c;
              const labelKey =
                c === "Punctuality" ? "complaint_punctuality" :
                c === "Safety Concern" ? "complaint_safety" :
                c === "Service Quality" ? "complaint_quality" :
                "complaint_other";

              return (
                <Pressable
                  key={c}
                  onPress={() => setComplaintCategory(c)}
                  style={[styles.choice, active && styles.choiceActive]}
                >
                  <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}

            <TextInput
              value={complaintText}
              onChangeText={setComplaintText}
              placeholder={t("complaint_desc_ph")}
              placeholderTextColor="#9aa3af"
              multiline
              style={styles.reviewInput}
            />

            <Pressable onPress={submitComplaint} style={styles.primaryBtn} disabled={submittingComplaint}>
              {submittingComplaint ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t("file_official_report")}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Bottom sheet for submitting a caregiver rating and written review */}
      <Modal visible={showRating} transparent animationType="slide" onRequestClose={() => setShowRating(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <Pressable onPress={() => setShowRating(false)} style={styles.sheetClose}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>

            <Text style={styles.sheetTitle}>{t("how_was_care")}</Text>
            <Text style={styles.sheetSubtitle}>{t("feedback_improves")}</Text>

            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                const filled = value <= stars;
                return (
                  <Pressable key={value} onPress={() => setStars(value)} style={{ padding: 6 }}>
                    <Ionicons
                      name={filled ? "star" : "star-outline"}
                      size={34}
                      color={filled ? theme.colors.primary : "#cbd5e1"}
                    />
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder={t("write_brief_review")}
              placeholderTextColor="#9aa3af"
              multiline
              style={styles.reviewInput}
            />

            <View style={styles.sheetActions}>
              <Pressable onPress={() => setShowRating(false)} style={styles.secondaryBtn} disabled={submittingReview}>
                <Text style={styles.secondaryBtnText}>{t("later")}</Text>
              </Pressable>

              <Pressable onPress={submitReview} style={[styles.primaryBtn, { flex: 1 }]} disabled={submittingReview}>
                {submittingReview ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.primaryBtnText}>{t("submit_review")}</Text>
                    <Ionicons name="send" size={18} color="#fff" />
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "900", color: theme.colors.text },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: theme.spacing.xl },

  emptyBox: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { fontWeight: "900", color: theme.colors.text, fontSize: 16 },
  emptySub: { color: theme.colors.muted, fontWeight: "700", textAlign: "center" },

  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  name: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
  sub: { marginTop: 2, color: theme.colors.muted, fontWeight: "700" },
  subSmall: { marginTop: 2, color: theme.colors.muted, fontWeight: "700", fontSize: 12 },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontWeight: "900", fontSize: 12 },

  line: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },

  moneyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mLabel: { color: theme.colors.muted, fontWeight: "900", fontSize: 12 },
  money: { fontWeight: "900", color: theme.colors.text },

  detailBox: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dTitle: { fontWeight: "900", color: theme.colors.text, marginBottom: 8 },
  dText: { color: "#475467", fontWeight: "700", marginTop: 4 },

  smallBtn: {
    marginTop: 10,
    backgroundColor: "white",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  smallBtnText: { fontWeight: "900", color: theme.colors.text },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16 },
  sheetClose: { alignSelf: "flex-start", padding: 6 },

  sheetTitle: { fontSize: 22, fontWeight: "900", color: theme.colors.text, marginTop: 4 },
  sheetTitleDanger: { fontSize: 22, fontWeight: "900", color: "#ef4444", marginTop: 4 },
  sheetSubtitle: { color: theme.colors.muted, fontWeight: "700", marginTop: 6 },

  choice: {
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
  },
  choiceActive: { borderColor: "#fecaca", backgroundColor: "#fff1f2" },
  choiceText: { fontWeight: "900", color: theme.colors.text },
  choiceTextActive: { color: "#b91c1c" },

  primaryBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  starsRow: { flexDirection: "row", justifyContent: "center", marginTop: 16, gap: 10 },

  reviewInput: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    minHeight: 90,
    fontWeight: "700",
    color: theme.colors.text,
  },

  sheetActions: { flexDirection: "row", gap: 12, marginTop: 16, marginBottom: 6 },
  secondaryBtn: { width: 110, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { fontWeight: "900", color: theme.colors.muted },
});