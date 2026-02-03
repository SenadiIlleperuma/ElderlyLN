const express = require("express");
const router = express.Router();

const bookingService = require("../services/booking.service");
const { authenticateToken } = require("../middleware/auth.middleware");

router.use(authenticateToken);

//POST /api/booking/create
 
router.post("/create", async (req, res) => {
  try {
    const { caregiverId, serviceDate, notes } = req.body;

    if (req.user.role !== "family") {
      return res
        .status(403)
        .json({ message: "Forbidden: Only family users can create bookings." });
    }

    if (!caregiverId || !serviceDate) {
      return res.status(400).json({
        message: "Missing required fields: caregiverId and serviceDate are required.",
      });
    }

    const booking = await bookingService.createBooking(
      req.user.user_id,
      caregiverId,
      serviceDate,
      notes
    );

    res.status(201).json({
      message: "Booking request sent successfully.",
      booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error.message);
    res.status(500).json({ message: "Failed to create booking.", error: error.message });
  }
});

// PUT /api/booking/status/:bookingId
 
router.put("/status/:bookingId", async (req, res) => {
  try {
    const { status } = req.body;
    const { bookingId } = req.params;

    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }

    const updatedBooking = await bookingService.updateBookingStatus({
      bookingId,
      newStatus: status,
      actorUserId: req.user.user_id,
      actorRole: req.user.role,
    });

    res.status(200).json({ message: "Booking status updated.", booking: updatedBooking });
  } catch (error) {
    console.error("Booking update error:", error.message);
    res.status(403).json({ message: error.message });
  }
});

//GET /api/booking/myBookings
router.get("/myBookings", async (req, res) => {
  try {
    const bookings = await bookingService.getBookingsByUser(req.user.user_id, req.user.role);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error.message);
    res.status(500).json({ message: "Failed to retrieve bookings." });
  }
});

module.exports = router;
