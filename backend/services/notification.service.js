const db = require("../db");

// Create one notification
async function createNotification({
  userId,
  title,
  message,
  type,
  relatedEntityType = null,
  relatedEntityId = null,
}) {
  const query = `
    INSERT INTO notification
    (
      user_fk,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING
      notification_id,
      user_fk,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id,
      is_read,
      created_at;
  `;

  const values = [
    userId,
    title,
    message,
    type,
    relatedEntityType,
    relatedEntityId,
  ];

  const result = await db.query(query, values);

  return {
    ...result.rows[0],
    created_at: result.rows[0]?.created_at
      ? new Date(result.rows[0].created_at).toISOString()
      : null,
  };
}

// Create many notifications at once
async function createBulkNotifications(notifications) {
  if (!notifications || notifications.length === 0) return [];

  const inserted = [];

  for (const item of notifications) {
    const notification = await createNotification(item);
    inserted.push(notification);
  }

  return inserted;
}

// Get current user's notifications
async function getNotificationsForUser(userId) {
  const query = `
    SELECT
      notification_id,
      user_fk,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id,
      is_read,
      created_at
    FROM notification
    WHERE user_fk = $1
    ORDER BY created_at DESC, notification_id DESC;
  `;

  const result = await db.query(query, [userId]);

  return result.rows.map((row) => ({
    ...row,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  }));
}

// Get only unread count
async function getUnreadCount(userId) {
  const query = `
    SELECT COUNT(*)::int AS unread_count
    FROM notification
    WHERE user_fk = $1
      AND is_read = FALSE;
  `;

  const result = await db.query(query, [userId]);
  return result.rows[0]?.unread_count || 0;
}

// Mark one notification as read
async function markAsRead(notificationId, userId) {
  const query = `
    UPDATE notification
    SET is_read = TRUE
    WHERE notification_id = $1
      AND user_fk = $2
    RETURNING
      notification_id,
      user_fk,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id,
      is_read,
      created_at;
  `;

  const result = await db.query(query, [notificationId, userId]);

  if (!result.rows[0]) return null;

  return {
    ...result.rows[0],
    created_at: result.rows[0].created_at
      ? new Date(result.rows[0].created_at).toISOString()
      : null,
  };
}

// Mark all notifications as read
async function markAllAsRead(userId) {
  const query = `
    UPDATE notification
    SET is_read = TRUE
    WHERE user_fk = $1
      AND is_read = FALSE
    RETURNING
      notification_id,
      user_fk,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id,
      is_read,
      created_at;
  `;

  const result = await db.query(query, [userId]);

  return result.rows.map((row) => ({
    ...row,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  }));
}

// Delete one notification
async function deleteNotification(notificationId, userId) {
  const query = `
    DELETE FROM notification
    WHERE notification_id = $1
      AND user_fk = $2
    RETURNING
      notification_id,
      user_fk,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id,
      is_read,
      created_at;
  `;

  const result = await db.query(query, [notificationId, userId]);

  if (!result.rows[0]) return null;

  return {
    ...result.rows[0],
    created_at: result.rows[0].created_at
      ? new Date(result.rows[0].created_at).toISOString()
      : null,
  };
}

// Send notification to all admins
async function notifyAllAdmins({
  title,
  message,
  type,
  relatedEntityType = null,
  relatedEntityId = null,
}) {
  const adminQuery = `
    SELECT user_id
    FROM "user"
    WHERE role = 'admin';
  `;

  const adminResult = await db.query(adminQuery);
  const admins = adminResult.rows;

  if (!admins.length) return [];

  const notifications = admins.map((admin) => ({
    userId: admin.user_id,
    title,
    message,
    type,
    relatedEntityType,
    relatedEntityId,
  }));

  return await createBulkNotifications(notifications);
}

module.exports = {
  createNotification,
  createBulkNotifications,
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notifyAllAdmins,
};