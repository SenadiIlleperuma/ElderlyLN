const db = require("../db");
const notificationService = require("./notification.service");

const getProfileId = async (userId, role) => {
  const table = role === "family" ? "family" : "caregiver";
  const idColumn = role === "family" ? "family_id" : "caregiver_id";

  const sql = `SELECT ${idColumn} FROM ${table} WHERE user_fk = $1`;
  const result = await db.query(sql, [userId]);

  if (result.rows.length === 0) {
    throw new Error(`Profile not found for user role: ${role}`);
  }

  return result.rows[0][idColumn];
};

const createBooking = async (userId, caregiverId, serviceDate, notes) => {
  const familyId = await getProfileId(userId, "family");

  const caregiverCheck = await db.query(
    `
    SELECT caregiver_id, user_fk
    FROM caregiver
    WHERE caregiver_id = $1
    `,
    [caregiverId]
  );

  if (caregiverCheck.rows.length === 0) {
    throw new Error("Invalid caregiverId: caregiver profile not found.");
  }

  const caregiverUserId = caregiverCheck.rows[0].user_fk;

  const parsedDate = new Date(serviceDate);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid serviceDate format.");
  }

  const sql = `
    INSERT INTO booking (
      family_fk,
      caregiver_fk,
      service_date,
      booking_status
    )
    VALUES ($1, $2, $3, $4)
    RETURNING booking_id, family_fk, caregiver_fk, service_date, booking_status, requested_at
  `;

  const values = [familyId, caregiverId, parsedDate, "Requested"];
  const result = await db.query(sql, values);

  const booking = result.rows[0];

  // Notify caregiver about new booking request
  if (caregiverUserId) {
    await notificationService.createNotification({
      userId: caregiverUserId,
      title: "New booking request",
      message: "You have received a new booking request from a family.",
      type: "BOOKING",
      relatedEntityType: "booking",
      relatedEntityId: booking.booking_id,
    });
  }

  return booking;
};

const updateBookingStatus = async ({
  bookingId,
  newStatus,
  actorUserId,
  actorRole,
}) => {
  if (!["caregiver", "family"].includes(actorRole)) {
    throw new Error("Forbidden: Only family/caregiver can update booking status.");
  }

  const ALL_STATUSES = [
    "Requested",
    "Accepted",
    "Declined",
    "Completed",
    "Cancelled",
  ];

  if (!ALL_STATUSES.includes(newStatus)) {
    throw new Error("Invalid status value.");
  }

  const sqlCheck = `
    SELECT
      b.booking_id,
      b.booking_status,
      b.family_fk,
      b.caregiver_fk,
      f.user_fk AS family_user_fk,
      c.user_fk AS caregiver_user_fk
    FROM booking b
    LEFT JOIN family f ON b.family_fk = f.family_id
    LEFT JOIN caregiver c ON b.caregiver_fk = c.caregiver_id
    WHERE b.booking_id = $1
  `;

  const checkResult = await db.query(sqlCheck, [bookingId]);
  const bookingDetails = checkResult.rows[0];

  if (!bookingDetails) {
    throw new Error("Booking not found!");
  }

  if (actorRole === "family" && bookingDetails.family_user_fk !== actorUserId) {
    throw new Error("Forbidden: This booking is not yours (family).");
  }

  if (actorRole === "caregiver" && bookingDetails.caregiver_user_fk !== actorUserId) {
    throw new Error("Forbidden: This booking is not yours (caregiver).");
  }

  const currentStatus = bookingDetails.booking_status;

  const FINAL = ["Completed", "Declined", "Cancelled"];
  if (FINAL.includes(currentStatus)) {
    throw new Error(`This booking is already ${currentStatus} and cannot be changed.`);
  }

  const familyAllowedTransitions = {
    Requested: ["Cancelled"],
    Accepted: ["Cancelled"],
  };

  const caregiverAllowedTransitions = {
    Requested: ["Accepted", "Declined"],
    Accepted: ["Completed"],
  };

  const allowed =
    actorRole === "family"
      ? familyAllowedTransitions[currentStatus] || []
      : caregiverAllowedTransitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid transition: ${actorRole} cannot change ${currentStatus} -> ${newStatus}`
    );
  }

  const updateSql = `
    UPDATE booking
    SET booking_status = $1
    WHERE booking_id = $2
    RETURNING booking_id, booking_status, service_date, requested_at, family_fk, caregiver_fk
  `;

  const result = await db.query(updateSql, [newStatus, bookingId]);
  const updatedBooking = result.rows[0];

  const familyUserId = bookingDetails.family_user_fk;
  const caregiverUserId = bookingDetails.caregiver_user_fk;

  // Notifications based on new status
  if (newStatus === "Accepted" && familyUserId) {
    await notificationService.createNotification({
      userId: familyUserId,
      title: "Booking accepted",
      message: "Your caregiver has accepted the booking request.",
      type: "BOOKING",
      relatedEntityType: "booking",
      relatedEntityId: bookingId,
    });
  }

  if (newStatus === "Declined" && familyUserId) {
    await notificationService.createNotification({
      userId: familyUserId,
      title: "Booking declined",
      message: "Your caregiver has declined the booking request.",
      type: "BOOKING",
      relatedEntityType: "booking",
      relatedEntityId: bookingId,
    });
  }

  if (newStatus === "Cancelled" && caregiverUserId) {
    await notificationService.createNotification({
      userId: caregiverUserId,
      title: "Booking cancelled",
      message: "A family has cancelled the booking request.",
      type: "BOOKING",
      relatedEntityType: "booking",
      relatedEntityId: bookingId,
    });
  }

  if (newStatus === "Completed") {
    if (familyUserId) {
      await notificationService.createNotification({
        userId: familyUserId,
        title: "Booking completed",
        message: "Your booking has been marked as completed.",
        type: "BOOKING",
        relatedEntityType: "booking",
        relatedEntityId: bookingId,
      });
    }

    if (caregiverUserId) {
      await notificationService.createNotification({
        userId: caregiverUserId,
        title: "Booking completed",
        message: "The booking has been marked as completed.",
        type: "BOOKING",
        relatedEntityType: "booking",
        relatedEntityId: bookingId,
      });
    }
  }

  return updatedBooking;
};

const getBookingsByUser = async (userId, userRole) => {
  const isFamily = userRole === "family";
  const profileId = await getProfileId(userId, isFamily ? "family" : "caregiver");
  const fkColumn = isFamily ? "family_fk" : "caregiver_fk";

  const sql = `
    SELECT
      b.booking_id,
      b.family_fk,
      b.caregiver_fk,
      b.requested_at,
      b.service_date,
      b.booking_status,

      EXISTS (
        SELECT 1
        FROM complaint cp
        WHERE cp.booking_fk = b.booking_id
      ) AS has_complaint,

      EXISTS (
        SELECT 1
        FROM review rv
        WHERE rv.booking_fk = b.booking_id
      ) AS has_review,

      b.payment_status,

      f.full_name AS family_name,
      f.district AS family_district,

      c.full_name AS caregiver_name,
      c.district AS caregiver_district,

      c.service_type AS caregiver_service_type,
      c.availability_period AS caregiver_time_period,
      COALESCE(array_to_string(c.languages_spoken, ', '), '') AS caregiver_languages
    FROM booking b
    LEFT JOIN family f ON b.family_fk = f.family_id
    LEFT JOIN caregiver c ON b.caregiver_fk = c.caregiver_id
    WHERE b.${fkColumn} = $1
    ORDER BY b.requested_at DESC
  `;

  const result = await db.query(sql, [profileId]);
  return result.rows;
};

module.exports = {
  createBooking,
  updateBookingStatus,
  getBookingsByUser,
};