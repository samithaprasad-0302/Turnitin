<?php

/**
 * RealtimeController
 * Handles Server-Sent Events (SSE) for real-time updates without polling
 */

class RealtimeController {

    /**
     * GET /api/realtime
     */
    public static function stream(array $authUser): void {
        $pdo = getDbConnection();
        $userId = (int)$authUser['id'];
        $role = $authUser['role'];

        // Get initial state hashes
        $currentFilesState = '';
        $currentCommentsCount = 0;
        $currentNotificationCount = 0;

        try {
            if ($role === 'customer') {
                $stmt = $pdo->prepare('SELECT COUNT(*) as cnt, MAX(updated_at) as last_upd FROM files WHERE customer_id = ?');
                $stmt->execute([$userId]);
                $filesInfo = $stmt->fetch();
                $currentFilesState = ($filesInfo['cnt'] ?? 0) . '_' . ($filesInfo['last_upd'] ?? '');

                $stmt = $pdo->prepare('SELECT COUNT(*) FROM comments WHERE file_id IN (SELECT id FROM files WHERE customer_id = ?)');
                $stmt->execute([$userId]);
                $currentCommentsCount = (int)$stmt->fetchColumn();
            } elseif ($role === 'checker') {
                $stmt = $pdo->prepare("SELECT COUNT(*) as cnt, MAX(updated_at) as last_upd FROM files WHERE checker_id = ? OR status = 'pending'");
                $stmt->execute([$userId]);
                $filesInfo = $stmt->fetch();
                $currentFilesState = ($filesInfo['cnt'] ?? 0) . '_' . ($filesInfo['last_upd'] ?? '');

                $stmt = $pdo->prepare('SELECT COUNT(*) FROM comments WHERE file_id IN (SELECT id FROM files WHERE checker_id = ?)');
                $stmt->execute([$userId]);
                $currentCommentsCount = (int)$stmt->fetchColumn();
            } else {
                $stmt = $pdo->query('SELECT COUNT(*) as cnt, MAX(updated_at) as last_upd FROM files');
                $filesInfo = $stmt->fetch();
                $userCount = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
                $currentFilesState = ($filesInfo['cnt'] ?? 0) . '_' . ($filesInfo['last_upd'] ?? '') . '_' . $userCount;

                $currentCommentsCount = (int)$pdo->query('SELECT COUNT(*) FROM comments')->fetchColumn();
            }

            $stmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = FALSE');
            $stmt->execute([$userId]);
            $currentNotificationCount = (int)$stmt->fetchColumn();
        } catch (Exception $e) {
            $currentFilesState = 'error';
        }

        // If requested as a short-polling fallback (standard JSON response)
        if (isset($_GET['poll']) && $_GET['poll'] === 'true') {
            Response::success([
                'filesState' => $currentFilesState,
                'notificationCount' => $currentNotificationCount,
                'commentsCount' => $currentCommentsCount
            ]);
            return;
        }

        // Otherwise, stream using Server-Sent Events (SSE)
        set_time_limit(0);
        ini_set('max_execution_time', '0');

        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no');

        while (ob_get_level() > 0) {
            ob_end_flush();
        }
        ob_implicit_flush(true);

        $lastFilesState = $currentFilesState;
        $lastNotificationCount = $currentNotificationCount;
        $lastCommentsCount = $currentCommentsCount;
        
        $heartbeatTime = time();

        echo "data: " . json_encode(['type' => 'connected', 'message' => 'Real-time sync established']) . "\n\n";
        flush();

        while (true) {
            // 1. Check if the client disconnected
            if (connection_aborted()) {
                break;
            }

            $hasChanges = false;

            try {
                // 2. Query file updates based on user role
                if ($role === 'customer') {
                    // Check customer's files
                    $stmt = $pdo->prepare('SELECT COUNT(*) as cnt, MAX(updated_at) as last_upd FROM files WHERE customer_id = ?');
                    $stmt->execute([$userId]);
                    $filesInfo = $stmt->fetch();
                    $currentFilesState = ($filesInfo['cnt'] ?? 0) . '_' . ($filesInfo['last_upd'] ?? '');

                    // Check comments on customer's files
                    $stmt = $pdo->prepare('SELECT COUNT(*) FROM comments WHERE file_id IN (SELECT id FROM files WHERE customer_id = ?)');
                    $stmt->execute([$userId]);
                    $currentCommentsCount = (int)$stmt->fetchColumn();
                } elseif ($role === 'checker') {
                    // Check checker's files OR any pending files available to accept
                    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt, MAX(updated_at) as last_upd FROM files WHERE checker_id = ? OR status = 'pending'");
                    $stmt->execute([$userId]);
                    $filesInfo = $stmt->fetch();
                    $currentFilesState = ($filesInfo['cnt'] ?? 0) . '_' . ($filesInfo['last_upd'] ?? '');

                    // Check comments on checker's files
                    $stmt = $pdo->prepare('SELECT COUNT(*) FROM comments WHERE file_id IN (SELECT id FROM files WHERE checker_id = ?)');
                    $stmt->execute([$userId]);
                    $currentCommentsCount = (int)$stmt->fetchColumn();
                } else {
                    // Admin: Check all files in system
                    $stmt = $pdo->query('SELECT COUNT(*) as cnt, MAX(updated_at) as last_upd FROM files');
                    $filesInfo = $stmt->fetch();
                    
                    // Also check users count for admin
                    $userCount = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
                    $currentFilesState = ($filesInfo['cnt'] ?? 0) . '_' . ($filesInfo['last_upd'] ?? '') . '_' . $userCount;

                    // All comments
                    $currentCommentsCount = (int)$pdo->query('SELECT COUNT(*) FROM comments')->fetchColumn();
                }

                // 3. Query unread notifications count for the user
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = FALSE');
                $stmt->execute([$userId]);
                $currentNotificationCount = (int)$stmt->fetchColumn();

                // 4. Compare states to detect updates
                if ($lastFilesState !== $currentFilesState) {
                    if ($lastFilesState !== '') { // Skip initial load trigger
                        $hasChanges = true;
                    }
                    $lastFilesState = $currentFilesState;
                }

                if ($lastNotificationCount !== $currentNotificationCount) {
                    if ($lastNotificationCount !== -1) {
                        $hasChanges = true;
                    }
                    $lastNotificationCount = $currentNotificationCount;
                }

                if ($lastCommentsCount !== $currentCommentsCount) {
                    if ($lastCommentsCount !== -1) {
                        $hasChanges = true;
                    }
                    $lastCommentsCount = $currentCommentsCount;
                }

                // 5. Send update event if changes detected
                if ($hasChanges) {
                    echo "data: " . json_encode([
                        'type' => 'update',
                        'role' => $role,
                        'timestamp' => time()
                    ]) . "\n\n";
                    if (ob_get_level() > 0) { ob_flush(); }
                    flush();
                }

                // 6. Heartbeat to keep connection alive (every 20s)
                if (time() - $heartbeatTime > 20) {
                    echo ": heartbeat\n\n";
                    if (ob_get_level() > 0) { ob_flush(); }
                    flush();
                    $heartbeatTime = time();
                }

            } catch (Exception $e) {
                // Return query error information silently and retry
            }

            // Sleep 1.5 seconds before next DB check
            usleep(1500000);
        }
    }
}
