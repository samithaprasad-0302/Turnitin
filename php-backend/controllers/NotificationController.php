<?php

/**
 * NotificationController
 * Equivalent to backend/src/controllers/notificationController.js
 */

class NotificationController {

    /**
     * GET /api/notifications  (Authenticated)
     */
    public static function getNotifications(array $authUser): void {
        $isRead = $_GET['is_read'] ?? null;
        $page   = max(1, (int)($_GET['page'] ?? 1));
        $limit  = max(1, (int)($_GET['limit'] ?? 20));
        $offset = ($page - 1) * $limit;

        $pdo    = getDbConnection();
        $query  = 'SELECT * FROM notifications WHERE user_id = ?';
        $params = [$authUser['id']];

        if ($isRead !== null) {
            $query   .= ' AND is_read = ?';
            $params[] = ($isRead === 'true' || $isRead === '1') ? 1 : 0;
        }

        $query   .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $notifications = $stmt->fetchAll();

        // Cast is_read to boolean for JSON output
        foreach ($notifications as &$n) {
            $n['is_read'] = (bool)$n['is_read'];
        }

        Response::success([
            'notifications' => $notifications,
            'page'          => $page,
            'limit'         => $limit,
        ]);
    }

    /**
     * PUT /api/notifications/:id/read  (Authenticated)
     */
    public static function markAsRead(array $authUser, int $notificationId): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?'
        );
        $stmt->execute([$notificationId, $authUser['id']]);

        Response::success(['message' => 'Notification marked as read']);
    }

    /**
     * PUT /api/notifications/mark-all-read  (Authenticated)
     */
    public static function markAllAsRead(array $authUser): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE'
        );
        $stmt->execute([$authUser['id']]);

        Response::success(['message' => 'All notifications marked as read']);
    }

    /**
     * GET /api/notifications/unread-count  (Authenticated)
     */
    public static function getUnreadCount(array $authUser): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE'
        );
        $stmt->execute([$authUser['id']]);
        $result = $stmt->fetch();

        Response::success(['unreadCount' => (int)$result['count']]);
    }
}
