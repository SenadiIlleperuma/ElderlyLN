const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth.middleware");
const notificationService = require("../services/notification.service");

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Returns both the list and unread counter
    const notifications =
      await notificationService.getNotificationsForUser(userId);

    const unreadCount = await notificationService.getUnreadCount(userId);

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
});

// PATCH mark one notification as read
router.patch("/:id/read", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const notificationId = req.params.id;

    // Checks if the notification belongs to the user and marks it as read
    const updated = await notificationService.markAsRead(
      notificationId,
      userId
    );

    if (!updated) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      message: "Notification marked as read.",
      notification: updated,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({
      message: "Failed to mark notification as read.",
      error: error.message,
    });
  }
});

// PATCH mark all notifications as read
router.patch("/read-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const updated = await notificationService.markAllAsRead(userId);

    return res.status(200).json({
      message: "All notifications marked as read.",
      updatedCount: updated.length,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({
      message: "Failed to mark all notifications as read.",
      error: error.message,
    });
  }
});

// DELETE notification
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const notificationId = req.params.id;

    // Delete the notification if it belongs to the user
    const deleted = await notificationService.deleteNotification(
      notificationId,
      userId
    );

    if (!deleted) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      message: "Notification deleted successfully.",
      notification: deleted,
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({
      message: "Failed to delete notification.",
      error: error.message,
    });
  }
});

module.exports = router;