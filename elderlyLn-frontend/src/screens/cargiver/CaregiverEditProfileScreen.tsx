import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import { AuthStackParamList } from "../../RootNavigator";
import { theme } from "../../constants/theme";
import { api } from "../../api/api";

type Props = NativeStackScreenProps<AuthStackParamList, "CaregiverEditProfile">;
type Chip = { id: string; label: string };
type DocType = "NIC" | "POLICE" | "CERTIFICATE" | "OTHER";

const CARE_CATEGORY_MAP: Record<string, string> = {
  elderly: "Elderly care",
  child: "Child care",
  disability: "Disability care",
  patient: "Patient care",
  palliative: "Palliative care",
  domestic: "Domestic support",
};

const LANG_MAP: Record<string, string> = {
  si: "Sinhala",
  ta: "Tamil",
  en: "English",
};

const WORK_SLOT_OPTIONS = [
  "Half-day- අර්ධ දවසේ සේවය",
  "Full-day - සම්පූර්ණ දවසේ සේවය",
  "Hourly basis- පැය මත පදනම්ව සේවය",
  "Live-in Caregiver- පදිංචිව සිටින රැකබලා ගන්නා",
  "Other",
];

type DocRow = {
  document_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size_kb: number | null;
  mime_type: string | null;
  verification_status: string;
  uploaded_at: string;
};

function normalizeStatus(value: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function formatKb(kb: number | null) {
  if (!kb || kb < 0) return "";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function formatDate(v: string) {
  if (!v) return "-";
  try {
    return String(v).slice(0, 10);
  } catch {
    return "-";
  }
}

function documentTypeLabel(type: string) {
  const t = normalizeStatus(type);
  if (t === "NIC") return "NIC";
  if (t === "POLICE") return "Police Clearance";
  if (t === "CERTIFICATE") return "Certificate";
  if (t === "OTHER") return "Other Document";
  return type || "-";
}

function statusMeta(profileStatus: string, t: any) {
  const s = normalizeStatus(profileStatus);

  if (s === "VERIFIED") {
    return {
      title: t("verified"),
      hint: t("already_verified_msg"),
      color: "#16A34A",
      bg: "#ECFDF5",
      border: "#BBF7D0",
      icon: "checkmark-circle" as const,
    };
  }

  if (s === "PENDING_VERIFICATION" || s === "PENDING") {
    return {
      title: t("pending_verification"),
      hint: t("waiting_admin_review"),
      color: "#F97316",
      bg: "#FFF7ED",
      border: "#FED7AA",
      icon: "time" as const,
    };
  }

  if (s === "REJECTED") {
    return {
      title: t("rejected_title"),
      hint: t("reupload_and_resubmit"),
      color: "#EF4444",
      bg: "#FEF2F2",
      border: "#FECACA",
      icon: "close-circle" as const,
    };
  }

  return {
    title: t("not_submitted"),
    hint: t("upload_nic_police_hint"),
    color: theme.colors.muted,
    bg: "#F3F4F6",
    border: "#E5E7EB",
    icon: "information-circle" as const,
  };
}

export default function CaregiverEditProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const careCategoriesList: Chip[] = useMemo(
    () => [
      { id: "elderly", label: t("care_elderly") },
      { id: "child", label: t("care_child") },
      { id: "disability", label: t("care_disability") },
      { id: "patient", label: t("care_patient") },
      { id: "palliative", label: t("care_palliative") },
      { id: "domestic", label: t("care_domestic") },
    ],
    [t]
  );

  const languagesList: Chip[] = useMemo(
    () => [
      { id: "si", label: t("lang_si") },
      { id: "ta", label: t("lang_ta") },
      { id: "en", label: t("lang_en") },
    ],
    [t]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [rate, setRate] = useState("");
  const [expYears, setExpYears] = useState("");
  const [location, setLocation] = useState("");
  const [qualificationsText, setQualificationsText] = useState("");
  const [workSlot, setWorkSlot] = useState<string>("");
  const [otherWorkSlotText, setOtherWorkSlotText] = useState("");

  const [selectedCareCategories, setSelectedCareCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const [profileStatus, setProfileStatus] = useState<string>("");
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");

  const [docsLoading, setDocsLoading] = useState(false);
  const [docsUploading, setDocsUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);
  const [showPhotoOptionsModal, setShowPhotoOptionsModal] = useState(false);

  const toggle = (id: string, selected: string[], setSelected: (x: string[]) => void) => {
    if (!editMode) return;
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id));
    else setSelected([...selected, id]);
  };

  const normalizedStatus = normalizeStatus(profileStatus);
  const isPendingVerification =
    normalizedStatus === "PENDING_VERIFICATION" || normalizedStatus === "PENDING";
  const isVerified = normalizedStatus === "VERIFIED";
  const isRejected = normalizedStatus === "REJECTED";

  const docsLocked = isVerified || (isPendingVerification && docs.length > 0);

  const hasAnyDocument = docs.length > 0;
  const canSubmitVerification =
    hasAnyDocument &&
    !isVerified &&
    !submitting &&
    !docsUploading &&
    !(isPendingVerification && !isRejected);

  const loadProfile = async () => {
    const res = await api.get("/profile/caregiver/me");
    const c = res.data;

    setDisplayName(c.full_name ?? "");
    setRate(c.expected_rate != null ? String(c.expected_rate) : "");
    setExpYears(c.experience_years != null ? String(c.experience_years) : "");
    setLocation(c.district ?? "");
    setProfileStatus(c.profile_status ?? "");
    setProfileImageUrl(c.profile_image_url ?? "");

    const dbQuals: string[] = Array.isArray(c.qualifications) ? c.qualifications : [];
    setQualificationsText(dbQuals.join(", "));

    const dbCategories: string[] = Array.isArray(c.care_category) ? c.care_category : [];
    const uiCategories = Object.keys(CARE_CATEGORY_MAP).filter((k) =>
      dbCategories.includes(CARE_CATEGORY_MAP[k])
    );
    setSelectedCareCategories(uiCategories);

    const dbLangs: string[] = Array.isArray(c.languages_spoken) ? c.languages_spoken : [];
    const uiLangs = Object.keys(LANG_MAP).filter((k) => dbLangs.includes(LANG_MAP[k]));
    setSelectedLanguages(uiLangs);

    const dbWorkSlot = c.availability_period ?? "";
    if (WORK_SLOT_OPTIONS.includes(dbWorkSlot)) {
      setWorkSlot(dbWorkSlot);
      setOtherWorkSlotText("");
    } else if (dbWorkSlot) {
      setWorkSlot("Other");
      setOtherWorkSlotText(dbWorkSlot);
    } else {
      setWorkSlot("");
      setOtherWorkSlotText("");
    }
  };

  const loadDocs = async () => {
    try {
      setDocsLoading(true);
      const res = await api.get("/documents/caregiver/me");

      const caregiver = res.data?.caregiver;
      const documents = Array.isArray(res.data?.documents) ? res.data.documents : [];

      if (caregiver?.profile_status) {
        setProfileStatus(caregiver.profile_status);
      }

      setDocs(documents);
    } catch (e: any) {
      setDocs([]);
      console.log("loadDocs error:", e?.response?.data || e?.message);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadProfile(), loadDocs()]);
      } catch (e: any) {
        Alert.alert(t("error_title"), e?.response?.data?.message || t("failed_load_caregiver_profile"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const onSave = async () => {
    const expected_rate = rate.trim() ? Number(rate) : null;
    const experience_years = expYears.trim() ? Number(expYears) : null;

    if (!displayName.trim() || !location.trim()) {
      Alert.alert(t("failed_title"), t("display_name_required_msg"));
      return;
    }

    if (expected_rate != null && Number.isNaN(expected_rate)) {
      Alert.alert(t("failed_title"), t("hourly_rate_number_msg"));
      return;
    }

    if (experience_years != null && Number.isNaN(experience_years)) {
      Alert.alert(t("failed_title"), t("experience_number_msg"));
      return;
    }

    const care_category = selectedCareCategories
      .map((id) => CARE_CATEGORY_MAP[id])
      .filter(Boolean);

    const languages_spoken = selectedLanguages
      .map((id) => LANG_MAP[id])
      .filter(Boolean);

    const qualifications = qualificationsText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const finalAvailabilityPeriod =
      workSlot === "Other" ? otherWorkSlotText.trim() : workSlot || null;

    if (workSlot === "Other" && !otherWorkSlotText.trim()) {
      Alert.alert(t("failed_title"), t("enter_other_working_slot") || "Please enter the other working slot.");
      return;
    }

    try {
      setSaving(true);
      await api.put("/profile/caregiver/me", {
        full_name: displayName.trim(),
        district: location.trim(),
        qualifications,
        expected_rate,
        experience_years,
        care_category,
        languages_spoken,
        availability_period: finalAvailabilityPeriod,
      });

      Alert.alert(t("success_title"), t("caregiver_profile_updated"));
      setEditMode(false);
      await loadProfile();
    } catch (e: any) {
      Alert.alert(t("failed_title"), e?.response?.data?.message || t("failed_save_profile"));
    } finally {
      setSaving(false);
    }
  };

  const pickAndUploadProfileImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t("permission_required"), t("allow_photo_access"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert(t("error_title"), "No image selected.");
        return;
      }

      const name = asset.fileName || asset.uri.split("/").pop() || `profile_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || "image/jpeg";

      const form = new FormData();
      form.append("file", {
        uri: asset.uri,
        name,
        type: mimeType,
      } as any);

      setImageUploading(true);

      await api.post("/profile/caregiver/profileImage", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setShowPhotoOptionsModal(false);
      Alert.alert(t("success_title"), t("profile_photo_updated"));
      await loadProfile();
    } catch (e: any) {
      Alert.alert(t("error_title"), e?.response?.data?.message || t("photo_upload_failed"));
    } finally {
      setImageUploading(false);
    }
  };

  const removeProfileImage = async () => {
    try {
      setImageUploading(true);
      await api.delete("/profile/caregiver/profileImage");
      setShowPhotoOptionsModal(false);
      Alert.alert(t("success_title"), t("profile_photo_updated"));
      await loadProfile();
    } catch (e: any) {
      Alert.alert(
        t("error_title"),
        e?.response?.data?.message ||
          "Profile photo remove endpoint is not ready yet on backend."
      );
    } finally {
      setImageUploading(false);
    }
  };

  const pickAndUpload = async (document_type: DocType) => {
    if (!editMode) {
      Alert.alert(t("edit_mode_title"), t("edit_mode_upload_msg"));
      return;
    }

    if (docsLocked) {
      Alert.alert(
        t("locked_title"),
        isVerified ? t("already_verified_msg") : t("under_review_msg")
      );
      return;
    }

    try {
      setDocsUploading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert(t("error_title"), "No file selected.");
        return;
      }

      const name = asset.name || `document_${Date.now()}`;
      const mimeType =
        asset.mimeType || (name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");

      const form = new FormData();
      form.append("document_type", document_type);
      form.append("file", {
        uri: asset.uri,
        name,
        type: mimeType,
      } as any);

      await api.post("/documents/caregiver/upload", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setShowDocTypeModal(false);
      Alert.alert(t("success_title"), `${documentTypeLabel(document_type)} uploaded.`);
      await Promise.all([loadDocs(), loadProfile()]);
    } catch (e: any) {
      Alert.alert(t("error_title"), e?.response?.data?.message || t("upload_failed"));
    } finally {
      setDocsUploading(false);
    }
  };

  const submitForVerification = async () => {
    if (!editMode) {
      Alert.alert(t("edit_mode_title"), t("edit_mode_submit_msg"));
      return;
    }

    if (isVerified) {
      Alert.alert(t("notice_title"), t("already_verified_msg"));
      return;
    }

    if (!hasAnyDocument) {
      Alert.alert(t("error_title"), "Please upload at least one document before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/documents/caregiver/submit");
      Alert.alert(t("submitted_title"), t("sent_to_admin_msg"));
      await Promise.all([loadProfile(), loadDocs()]);
      setEditMode(false);
    } catch (e: any) {
      const backendMsg = e?.response?.data?.message || "Failed to submit.";
      Alert.alert(t("error_title"), backendMsg);
      console.log("submitForVerification error:", e?.response?.data || e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const banner = statusMeta(profileStatus, t);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.bg,
        }}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 10, fontWeight: "800", color: theme.colors.muted }}>
          {t("loading")}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{t("edit_profile")}</Text>

        <Pressable style={styles.headerBtn} onPress={() => setEditMode((v) => !v)}>
          <Ionicons
            name={editMode ? "close" : "create-outline"}
            size={22}
            color={theme.colors.text}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.photoWrap}>
          <View style={styles.photo}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.photoImg} />
            ) : (
              <View style={styles.photoFallback}>
                <Ionicons name="person" size={44} color="#94A3B8" />
              </View>
            )}
          </View>

          <Pressable
            onPress={() => {
              if (!editMode || imageUploading) return;
              setShowPhotoOptionsModal(true);
            }}
            style={[styles.cameraBtn, (!editMode || imageUploading) && { opacity: 0.5 }]}
            disabled={!editMode || imageUploading}
          >
            {imageUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="camera" size={18} color="#fff" />
            )}
          </Pressable>
        </View>

        <Text style={styles.label}>{t("display_name")}</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={[styles.input, !editMode && styles.inputLocked]}
          placeholder={t("display_name_ph")}
          editable={editMode}
        />

        <View style={styles.gridRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t("hourly_rate_lkr")}</Text>
            <TextInput
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
              style={[styles.input, !editMode && styles.inputLocked]}
              editable={editMode}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t("years_of_exp")}</Text>
            <TextInput
              value={expYears}
              onChangeText={setExpYears}
              keyboardType="numeric"
              style={[styles.input, !editMode && styles.inputLocked]}
              editable={editMode}
            />
          </View>
        </View>

        <Text style={styles.label}>{t("service_location")}</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          style={[styles.input, !editMode && styles.inputLocked]}
          editable={editMode}
          placeholder={t("service_location_ph")}
        />

        <Text style={styles.label}>{t("qualifications")} (comma separated)</Text>
        <TextInput
          value={qualificationsText}
          onChangeText={setQualificationsText}
          style={[styles.input, !editMode && styles.inputLocked]}
          editable={editMode}
          placeholder="NVQ, First Aid, Elderly Care Training"
        />

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          {t("care_category_label")}
        </Text>
        <View style={styles.chipsWrap}>
          {careCategoriesList.map((c) => {
            const active = selectedCareCategories.includes(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => toggle(c.id, selectedCareCategories, setSelectedCareCategories)}
                style={[styles.chip, active && styles.chipActive, !editMode && { opacity: 0.7 }]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{t("languages_supported")}</Text>
        <View style={styles.chipsWrap}>
          {languagesList.map((c) => {
            const active = selectedLanguages.includes(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => toggle(c.id, selectedLanguages, setSelectedLanguages)}
                style={[styles.chip, active && styles.chipActive, !editMode && { opacity: 0.7 }]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>
          {t("time_period_label")}
        </Text>
        <View style={styles.chipsWrap}>
          {WORK_SLOT_OPTIONS.map((slot) => {
            const active = workSlot === slot;
            const label =
              slot === "Half-day- අර්ධ දවසේ සේවය"
                ? t("half_day")
                : slot === "Full-day - සම්පූර්ණ දවසේ සේවය"
                ? t("full_day")
                : slot === "Hourly basis- පැය මත පදනම්ව සේවය"
                ? t("hourly")
                : slot === "Live-in Caregiver- පදිංචිව සිටින රැකබලා ගන්නා"
                ? t("live_in")
                : t("other");

            return (
              <Pressable
                key={slot}
                onPress={() => editMode && setWorkSlot(slot)}
                style={[styles.chip, active && styles.chipActive, !editMode && { opacity: 0.7 }]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {workSlot === "Other" && (
          <>
            <Text style={styles.label}>{t("other")}</Text>
            <TextInput
              value={otherWorkSlotText}
              onChangeText={setOtherWorkSlotText}
              style={[styles.input, !editMode && styles.inputLocked]}
              placeholder={t("other")}
              editable={editMode}
            />
          </>
        )}

        <View
          style={[
            styles.statusBanner,
            { backgroundColor: banner.bg, borderColor: banner.border },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name={banner.icon as any} size={18} color={banner.color} />
            <Text style={[styles.statusTitle, { color: banner.color }]}>{banner.title}</Text>
          </View>
          <Text style={styles.statusHint}>{banner.hint}</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>{t("uploaded_documents")}</Text>

        <View style={styles.docsCard}>
          <Text style={styles.docsHint}>
            {t("upload_document_hint")}
          </Text>

          <Pressable
            onPress={() => setShowDocTypeModal(true)}
            style={[
              styles.uploadMainBtn,
              (!editMode || docsUploading || docsLocked) && { opacity: 0.6 },
            ]}
            disabled={!editMode || docsUploading || docsLocked}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            <Text style={styles.uploadMainBtnText}>{t("upload_document")}</Text>
          </Pressable>

          {!isVerified && editMode && (
            <>
              <View style={styles.requirementBox}>
                <Text
                  style={[
                    styles.requirementText,
                    { color: hasAnyDocument ? "#16A34A" : "#EF4444" },
                  ]}
                >
                  {hasAnyDocument
                    ? "✓ At least one document uploaded"
                    : "✗ Upload at least one document to submit"}
                </Text>
              </View>

              <Pressable
                onPress={submitForVerification}
                style={[
                  styles.submitBtn,
                  !canSubmitVerification && {
                    opacity: 0.6,
                  },
                ]}
                disabled={!canSubmitVerification}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="send-outline" size={18} color="#fff" />
                )}
                <Text style={styles.submitText}>
                  {isRejected ? "Resubmit for Verification" : t("submit_for_verification")}
                </Text>
              </Pressable>
            </>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 16, fontSize: 14 }]}>
            {t("uploaded_documents")}
          </Text>

          {docsLoading ? (
            <View style={{ paddingVertical: 14 }}>
              <ActivityIndicator />
            </View>
          ) : docs.length === 0 ? (
            <Text style={{ marginTop: 8, color: theme.colors.muted, fontWeight: "800" }}>
              {t("no_uploaded_documents_yet")}
            </Text>
          ) : (
            <View style={{ marginTop: 10, gap: 10 }}>
              {docs.map((d) => (
                <View key={d.document_id} style={styles.docListItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docListName}>{d.file_name}</Text>
                    <Text style={styles.docListMeta}>
                      {documentTypeLabel(d.document_type)} • {formatKb(d.file_size_kb)} •{" "}
                      {formatDate(d.uploaded_at)}
                    </Text>
                  </View>
                  <Text style={styles.docListStatus}>
                    {normalizeStatus(d.verification_status)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {editMode && (
        <View style={styles.bottomBar}>
          <Pressable onPress={onSave} style={styles.saveBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="save-outline" size={18} color="#fff" />
            )}
            <Text style={styles.saveText}>{t("save_changes")}</Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={showDocTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDocTypeModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("choose_document_type")}</Text>

            <Pressable onPress={() => pickAndUpload("NIC")} style={styles.modalOption}>
              <Text style={styles.modalOptionText}>NIC</Text>
            </Pressable>

            <Pressable onPress={() => pickAndUpload("POLICE")} style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Police Clearance</Text>
            </Pressable>

            <Pressable onPress={() => pickAndUpload("CERTIFICATE")} style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Certificate</Text>
            </Pressable>

            <Pressable onPress={() => pickAndUpload("OTHER")} style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Other Document</Text>
            </Pressable>

            <Pressable onPress={() => setShowDocTypeModal(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>{t("close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPhotoOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoOptionsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("profile")}</Text>

            <Pressable onPress={pickAndUploadProfileImage} style={styles.modalOption}>
              <Text style={styles.modalOptionText}>
                {profileImageUrl ? "Change Photo" : "Upload Photo"}
              </Text>
            </Pressable>

            {!!profileImageUrl && (
              <Pressable onPress={removeProfileImage} style={styles.modalOption}>
                <Text style={[styles.modalOptionText, { color: "#DC2626" }]}>
                  Remove Photo
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowPhotoOptionsModal(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseText}>{t("close")}</Text>
            </Pressable>
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
    justifyContent: "space-between",
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: theme.colors.text },

  content: { padding: theme.spacing.xl, paddingBottom: 140 },

  photoWrap: { alignSelf: "center", marginTop: 10, marginBottom: 16 },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 22,
    backgroundColor: "#EEF2F6",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoImg: { width: "100%", height: "100%" },
  photoFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  label: { marginTop: 10, fontWeight: "900", color: theme.colors.muted },
  input: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontWeight: "800",
    color: theme.colors.text,
  },
  inputLocked: { backgroundColor: "#F3F4F6" },

  gridRow: { flexDirection: "row", gap: 12, marginTop: 6 },

  sectionTitle: { marginTop: 16, fontSize: 16, fontWeight: "900", color: theme.colors.text },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: { borderColor: theme.colors.primary, backgroundColor: "#EEF2FF" },
  chipText: { fontWeight: "900", color: theme.colors.muted, fontSize: 12 },
  chipTextActive: { color: theme.colors.primary },

  statusBanner: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14 },
  statusTitle: { fontWeight: "900", fontSize: 14 },
  statusHint: { marginTop: 6, color: theme.colors.muted, fontWeight: "800", lineHeight: 20 },

  docsCard: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  docsHint: { color: theme.colors.muted, fontWeight: "800", lineHeight: 20 },

  uploadMainBtn: {
    marginTop: 14,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  uploadMainBtnText: { color: "#fff", fontWeight: "900" },

  requirementBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  requirementText: {
    fontWeight: "900",
    fontSize: 13,
  },

  submitBtn: {
    marginTop: 12,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2E6BFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  submitText: { fontWeight: "900", color: "#fff" },

  docListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
  },
  docListName: { fontWeight: "900", color: theme.colors.text },
  docListMeta: { marginTop: 4, color: theme.colors.muted, fontWeight: "700", fontSize: 12 },
  docListStatus: { color: "#2563EB", fontWeight: "900", fontSize: 12 },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveBtn: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#0B1220",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  saveText: { color: "#fff", fontWeight: "900" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 12,
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalOptionText: {
    fontWeight: "800",
    color: theme.colors.text,
  },
  modalCloseBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontWeight: "900",
    color: theme.colors.muted,
  },
});