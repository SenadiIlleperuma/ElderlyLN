import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./screens/auth/SplashScreen";
import LanguageSelectScreen from "./screens/auth/LanguageSelectScreen";
import RoleSelectScreen from "./screens/auth/RoleSelectScreen";
import LoginScreen from "./screens/auth/LoginScreen";
import RegisterScreen from "./screens/auth/SignupScreen";

import CaregiverHomeScreen from "./screens/cargiver/CaregiverHomeScreen";
import JobRequestsScreen from "./screens/cargiver/JobRequestsScreen";
import RequestDetailsScreen from "./screens/cargiver/RequestDetailsScreen";
import CaregiverEditProfileScreen from "./screens/cargiver/CaregiverEditProfileScreen";
import CaregiverAlertsScreen from "./screens/cargiver/CaregiverAlertsScreen";

import FamilyHomeScreen from "./screens/family/FamilyHomeScreen";
import FindCaregiverScreen from "./screens/family/FindCaregiverscreen";
import TopMatchesScreen from "./screens/family/TopMatchesScreen";
import CaregiverProfileScreen from "./screens/family/CaregiverProfileScreen";
import MyBookingsScreen from "./screens/family/MyBookingsScreen";
import BookServiceScreen from "./screens/family/BookServiceScreen";
import EditProfileScreen from "./screens/family/EditProfileScreen";

import AdminHomeScreen from "./screens/admin/AdminHomeScreen";
import AdminHubScreen from "./screens/admin/AdminHubScreen";
import VerifyCaregiverScreen from "./screens/admin/VerifyCaregiverScreen";


export type CareRequest = {
  id: string;
  familyName: string;
  dateLabel: string;
  location: string;
  typeLabel: string;
  matchPercent: number;
  needsText: string;
  scheduleText: string;
  salaryText: string;
  requirements: string[];
};

export type BookingRow = {
  booking_id: string;
  family_fk: string;
  caregiver_fk: string;

  requested_at: string;
  service_date: string;
  booking_status: "Requested" | "Accepted" | "Declined" | "Completed" | "Cancelled";

  family_name?: string | null;
  family_district?: string | null;
  family_care_needs?: string[] | null;

  caregiver_service_type?: string | null;
  caregiver_time_period?: string | null;
  caregiver_languages?: string | null;
  caregiver_expected_rate?: number | null;
};


export type VerifyCaregiverPayload = {
  caregiver: {
    id: string;
    name: string;
    appliedDateLabel: string;
    nicStatus: "AUTO_PASS" | "MANUAL_REVIEW";
    policeStatus: "AUTO_PASS" | "MANUAL_REVIEW";
    docs: { id: string; filename: string; sizeLabel: string; type: "pdf" | "jpg" }[];
  };
};

export type MatchCaregiver = {
  caregiver_id: number;
  user_fk: number;
  full_name: string;
  age?: number;
  gender?: string;
  district?: string;
  qualifications?: string[];
  experience_years?: number;
  languages_spoken?: string[];
  care_category?: string[];
  expected_rate?: number;
  avg_rating?: number;
  verification_badges?: string[];
  match_score?: number;
};

export type AuthStackParamList = {
  Splash: undefined;
  LanguageSelect: undefined;
  RoleSelect: undefined;

  Login: { role: "family" | "caregiver" | "admin" };
  Register: { role: "family" | "caregiver" | "admin" };

  // Family
  FamilyHome: undefined;
  FindCaregiver: undefined;
  TopMatches: {
    matches: any[];
    filters: {
      district?: string;
      careCategory?: string;
      serviceType?: string;
      timePeriod?: string;
      needs?: string;
    };
  };

  CaregiverProfile: {
    caregiver: any;
    filters?: {
      district?: string;
      careCategory?: string;
      serviceType?: string;
      timePeriod?: string;
      needs?: string;
    };
  };

  BookService: {
    caregiver: any;
  };

  MyBookings: {
    newBooking?: {
      id: string;
      caregiverName: string;
      dateLabel: string;
      status: "UPCOMING" | "COMPLETED" | "REQUESTED";
      paidAmount: number;
      notes?: string;
    };
  };

  EditProfile: undefined;

  // Caregiver
  CaregiverHome: undefined;
  JobRequests: undefined;

  // RequestDetails 
  RequestDetails: { booking: BookingRow };

  CaregiverEditProfile: undefined;
  CaregiverAlerts: undefined;

  // Admin
  AdminHome: undefined;
  AdminHub: undefined;
  VerifyCaregiver: VerifyCaregiverPayload;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Auth */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Family */}
      <Stack.Screen name="FamilyHome" component={FamilyHomeScreen} />
      <Stack.Screen name="FindCaregiver" component={FindCaregiverScreen} />
      <Stack.Screen name="TopMatches" component={TopMatchesScreen} />
      <Stack.Screen name="CaregiverProfile" component={CaregiverProfileScreen} />
      <Stack.Screen name="BookService" component={BookServiceScreen} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

      {/* Caregiver */}
      <Stack.Screen name="CaregiverHome" component={CaregiverHomeScreen} />
      <Stack.Screen name="JobRequests" component={JobRequestsScreen} />
      <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
      <Stack.Screen name="CaregiverEditProfile" component={CaregiverEditProfileScreen} />
      <Stack.Screen name="CaregiverAlerts" component={CaregiverAlertsScreen} />

      {/* Admin */}
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AdminHub" component={AdminHubScreen} />
      <Stack.Screen name="VerifyCaregiver" component={VerifyCaregiverScreen} />
    </Stack.Navigator>
  );
}
