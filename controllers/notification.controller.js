const pool = require('../config/db');
const asyncHandler = require('../middlewares/asyncHandler');
const { success, error } = require('../utils/response');

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        `SELECT id, title, message, type, is_read, created_at
         FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
        [req.user.id]
    );

    // Unread count
    const [countResult] = await pool.query(
        'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = false',
        [req.user.id]
    );

    return success(res, 200, 'Notifications fetched', {
        unread_count: countResult[0].unread_count,
        notifications: rows,
    });
});

// PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
    const [existing] = await pool.query(
        'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Notification not found');
    }

    await pool.query('UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    return success(res, 200, 'Notification marked as read');
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
    const [existing] = await pool.query(
        'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
    );

    if (existing.length === 0) {
        return error(res, 404, 'Notification not found');
    }

    await pool.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    return success(res, 200, 'Notification deleted');
});

module.exports = { getNotifications, markAsRead, deleteNotification };
