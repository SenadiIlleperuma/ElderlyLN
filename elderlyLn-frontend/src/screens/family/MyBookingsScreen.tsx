import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
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

function formatPrettyDate(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} • ${hh}:${mi}`;
}

function clean(v: any) {
  const s = String(v ?? "").trim();
  if (!s || s === "not_set" || s === "null" || s === "undefined") return "";
  return s;
}

export default function MyBookingsScreen({ navigation }: Props) {
  const { t } = useTranslation();

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

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get("/booking/myBookings");
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.log("Fetch bookings error:", err?.response?.data || err?.message);
      Alert.alert(t("error") || "Error", err?.response?.data?.message || (t("failed_load_bookings") || "Failed to load bookings."));
    }
  }, [t]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchBookings();
      setLoading(false);
    })();
  }, [fetchBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

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
        <Text style={[styles.badgeText, { color: txt }]}>{status}</Text>
      </View>
    );
  };

  const openComplaintModal = (b: BookingRow) => {
    setSelectedBooking(b);
    setComplaintCategory(null);
    setComplaintText("");
    setShowComplaint(true);
  };

  const openRatingModal = (b: BookingRow) => {
    setSelectedBooking(b);
    setStars(0);
    setReviewText("");
    setShowRating(true);
  };

  const confirmCancel = (b: BookingRow) => {
    Alert.alert(t("cancel_booking") || "Cancel booking?", t("cancel_booking_msg") || "This will mark the request as Cancelled.", [
      { text: t("no") || "No", style: "cancel" },
      {
        text: t("yes_cancel") || "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await api.put(`/booking/status/${b.booking_id}`, { status: "Cancelled" });
            Alert.alert(t("cancelled") || "Cancelled", t("cancelled_msg") || "Booking was cancelled.");
            await fetchBookings();
          } catch (err: any) {
            console.log("Cancel error:", err?.response?.data || err?.message);
            Alert.alert(t("cancel_failed") || "Cancel failed", err?.response?.data?.message || (t("could_not_cancel") || "Could not cancel booking."));
          }
        },
      },
    ]);
  };

  const submitComplaint = async () => {
    if (!selectedBooking) return;

    if (!complaintCategory) {
      Alert.alert(t("select_category") || "Select a category", t("choose_issue_before_submit") || "Please choose an issue type before submitting.");
      return;
    }

    try {
      setSubmittingComplaint(true);

      const reason =
        clean(complaintText)
          ? `${complaintCategory}: ${clean(complaintText)}`
          : `${complaintCategory}`;

      await api.post("/governance/fileComplaint", {
        bookingId: selectedBooking.booking_id,
        reason,
      });

      setShowComplaint(false);
      setSelectedBooking(null);
      setComplaintCategory(null);
      setComplaintText("");

      Alert.alert(t("complaint_submitted_title") || "Complaint submitted", t("complaint_submitted_msg") || "Your complaint was submitted successfully.");
      await fetchBookings();
    } catch (err: any) {
      console.log("Complaint submit error:", err?.response?.data || err?.message);
      Alert.alert(t("failed") || "Failed", err?.response?.data?.message || (t("complaint_failed") || "Could not submit complaint."));
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const submitReview = async () => {
    if (!selectedBooking) return;

    if (stars < 1) {
      Alert.alert(t("add_rating") || "Add a rating", t("select_star_msg") || "Please select at least 1 star.");
      return;
    }

    try {
      setSubmittingReview(true);

      await api.post("/review/add", {
        bookingId: selectedBooking.booking_id,
        ratingScore: stars,
        comment: clean(reviewText) || null,
      });

      setShowRating(false);
      setSelectedBooking(null);
      setStars(0);
      setReviewText("");

      Alert.alert(t("review_submitted_title") || "Review submitted", t("review_submitted_msg") || "Thanks! Your review was submitted.");
      await fetchBookings();
    } catch (err: any) {
      console.log("Review submit error:", err?.response?.data || err?.message);
      Alert.alert(t("failed") || "Failed", err?.response?.data?.message || (t("review_failed") || "Could not submit review."));
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

        <Text style={styles.headerTitle}>{t("my_bookings") || "My Bookings"}</Text>

        <Pressable onPress={() => navigation.replace("Login", { role: "family" })} style={styles.headerBtn}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.muted} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: theme.colors.muted, fontWeight: "700" }}>
            {t("loading_bookings") || "Loading bookings..."}
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
              <Text style={styles.emptyTitle}>{t("no_bookings_yet") || "No bookings yet"}</Text>
              <Text style={styles.emptySub}>{t("no_bookings_sub") || "Book a caregiver and your requests will appear here."}</Text>
            </View>
          ) : (
            bookings.map((b) => {
              const open = openId === b.booking_id;
              const canCancel = b.booking_status === "Requested" || b.booking_status === "Accepted";

              const caregiverName = clean(b.caregiver_name) || (t("caregiver_generic") || "Caregiver");
              const caregiverDistrict = clean(b.caregiver_district);

              const complaintLocked = b.has_complaint === true;
              const canRate = b.booking_status === "Completed" && b.has_review !== true;

              return (
                <Pressable
                  key={b.booking_id}
                  onPress={() => setOpenId(open ? null : b.booking_id)}
                  style={styles.card}
                >
                  <View style={styles.row}>
                    <View style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{caregiverName}</Text>
                      <Text style={styles.sub}>{formatPrettyDate(b.service_date)}</Text>
                      {!!caregiverDistrict && <Text style={styles.subSmall}>{caregiverDistrict}</Text>}
                    </View>
                    <StatusBadge status={b.booking_status} />
                  </View>

                  <View style={styles.line} />

                  <View style={styles.moneyRow}>
                    <Text style={styles.mLabel}>{t("payment") || "PAYMENT"}</Text>
                    <Text style={styles.money}>{b.payment_status ?? (t("na") || "N/A")}</Text>
                  </View>

                  {open && (
                    <View style={styles.detailBox}>
                      <Text style={styles.dTitle}>{t("booking_details") || "Booking Details"}</Text>
                      <Text style={styles.dText}>{t("status") || "Status"}: {b.booking_status}</Text>
                      <Text style={styles.dText}>{t("requested_at") || "Requested At"}: {formatPrettyDate(b.requested_at)}</Text>

                      <View style={{ height: 10 }} />

                      {canCancel && (
                        <Pressable
                          style={[styles.smallBtn, { borderColor: "#fecaca", backgroundColor: "#fff1f2" }]}
                          onPress={() => confirmCancel(b)}
                        >
                          <Text style={[styles.smallBtnText, { color: "#b91c1c" }]}>{t("cancel_booking_btn") || "Cancel Booking"}</Text>
                        </Pressable>
                      )}

                      <Pressable
                        style={[styles.smallBtn, complaintLocked && { opacity: 0.55 }]}
                        disabled={complaintLocked}
                        onPress={() => openComplaintModal(b)}
                      >
                        <Text style={styles.smallBtnText}>
                          {complaintLocked ? (t("complaint_already_filed") || "Complaint already filed") : (t("report_issue") || "Report Issue")}
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
                            {canRate ? (t("rate_review") || "Rate & Review") : (t("already_reviewed") || "Already reviewed")}
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

      <Modal visible={showComplaint} transparent animationType="slide" onRequestClose={() => setShowComplaint(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <Pressable onPress={() => setShowComplaint(false)} style={styles.sheetClose}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>

            <Text style={styles.sheetTitleDanger}>{t("report_issue") || "Report Issue"}</Text>
            <Text style={styles.sheetSubtitle}>{t("admins_respond_24h") || "Admins will investigate and respond within 24 hours."}</Text>

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
                  <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{t(labelKey) || c}</Text>
                </Pressable>
              );
            })}

            <TextInput
              value={complaintText}
              onChangeText={setComplaintText}
              placeholder={t("complaint_desc_ph") || "Describe the issue (optional)..."}
              placeholderTextColor="#9aa3af"
              multiline
              style={styles.reviewInput}
            />

            <Pressable onPress={submitComplaint} style={styles.primaryBtn} disabled={submittingComplaint}>
              {submittingComplaint ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t("file_official_report") || "File Official Report"}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showRating} transparent animationType="slide" onRequestClose={() => setShowRating(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <Pressable onPress={() => setShowRating(false)} style={styles.sheetClose}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>

            <Text style={styles.sheetTitle}>{t("how_was_care") || "How was the care?"}</Text>
            <Text style={styles.sheetSubtitle}>{t("feedback_improves") || "Your feedback helps improve our community."}</Text>

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
              placeholder={t("write_brief_review") || "Write a brief review..."}
              placeholderTextColor="#9aa3af"
              multiline
              style={styles.reviewInput}
            />

            <View style={styles.sheetActions}>
              <Pressable onPress={() => setShowRating(false)} style={styles.secondaryBtn} disabled={submittingReview}>
                <Text style={styles.secondaryBtnText}>{t("later") || "Later"}</Text>
              </Pressable>

              <Pressable onPress={submitReview} style={[styles.primaryBtn, { flex: 1 }]} disabled={submittingReview}>
                {submittingReview ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.primaryBtnText}>{t("submit_review") || "Submit Review"}</Text>
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
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: "#EEF2F6" },
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
