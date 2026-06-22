<?php

/**
 * FileController
 * Equivalent to backend/src/controllers/fileController.js
 */

class FileController {

    /**
     * Allowed MIME types — PDF and DOCX only
     */
    private static array $allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    private static array $allowedExtensions = ['pdf', 'docx'];

    /**
     * POST /api/files/upload  (Customer only)
     */
    public static function upload(array $authUser): void {
        if (empty($_FILES['file'])) {
            Response::badRequest('No file uploaded');
        }

        $uploadedFile = $_FILES['file'];

        // Validate extension first (fast check)
        $ext = strtolower(pathinfo($uploadedFile['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, self::$allowedExtensions, true)) {
            Response::badRequest('Invalid file type. Only PDF (.pdf) and Word (.docx) files are accepted.');
        }

        // Validate MIME type (deep check against actual file content)
        $finfo    = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($uploadedFile['tmp_name']);
        if (!in_array($mimeType, self::$allowedMimes, true)) {
            Response::badRequest('Invalid file type. Only PDF (.pdf) and Word (.docx) files are accepted.');
        }

        // Validate file size (max 50 MB)
        $maxSize = (int)($_ENV['MAX_FILE_SIZE'] ?? 52428800);
        if ($uploadedFile['size'] > $maxSize) {
            Response::badRequest('File too large. Maximum size is 50 MB.');
        }

        $title       = trim($_POST['title'] ?? '');
        $description = $_POST['description'] ?? null;
        $serviceType = $_POST['service_type'] ?? '';

        // Auto-generate title from filename if not provided
        if (empty($title)) {
            $title = pathinfo($uploadedFile['name'], PATHINFO_FILENAME);
        }

        if (!in_array($serviceType, ['ai_detection', 'plagiarism_check', 'both'], true)) {
            Response::badRequest('Invalid service_type');
        }

        // Capture size and display type
        $fileSize = (int)$uploadedFile['size'];
        $fileType = strtoupper($ext); // 'PDF' or 'DOCX'

        // Save file
        $uploadDir = rtrim($_ENV['UPLOAD_PATH'] ?? 'uploads', '/') . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext      = pathinfo($uploadedFile['name'], PATHINFO_EXTENSION);
        $filename = time() . '-' . mt_rand(100000000, 999999999) . '.' . $ext;
        $filepath = $uploadDir . $filename;

        $pdo = getDbConnection();

        // ── Check customer file check limit ──
        $limitStmt = $pdo->prepare("
            SELECT u.file_limit,
                   COUNT(f.id) as checked_count
            FROM users u
            LEFT JOIN files f ON u.id = f.customer_id AND f.status = 'completed' AND f.customer_paid = 0
            WHERE u.id = ?
            GROUP BY u.id, u.file_limit
        ");
        $limitStmt->execute([$authUser['id']]);
        $limitData = $limitStmt->fetch();

        if ($limitData) {
            $fileLimit = (int)$limitData['file_limit'];
            $checkedCount = (int)$limitData['checked_count'];

            if ($checkedCount >= $fileLimit) {
                Response::error("You have reached your limit of {$fileLimit} checked files. Please complete payment of your due balance with the administrator to reset your check limit and upload new documents.", 400);
            }
        }

        if (!move_uploaded_file($uploadedFile['tmp_name'], $filepath)) {
            Response::error('Failed to save uploaded file');
        }

        // Generate unique Document UID
        $uid = Uid::generate('DOC', $pdo, 'files');

        // Insert file record (including size, type and original filename)
        $stmt = $pdo->prepare(
            'INSERT INTO files (uid, customer_id, title, description, service_type, original_file, original_filename, file_size, file_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$uid, $authUser['id'], $title, $description, $serviceType, $filename, $uploadedFile['name'], $fileSize, $fileType, 'pending']);
        $fileId = (int)$pdo->lastInsertId();

        // Notify all checkers
        $stmt = $pdo->prepare(
            "INSERT INTO notifications (user_id, file_id, title, message, type)
             SELECT id, ?, ?, ?, ? FROM users WHERE role = 'checker'"
        );
        $stmt->execute([
            $fileId,
            'New File Available',
            "New document \"{$title}\" is available for checking",
            'info',
        ]);

        Response::success([
            'message'  => 'File uploaded successfully',
            'fileId'   => $fileId,
            'filename' => $filename,
        ], 201);
    }

    /**
     * GET /api/files/pending  (Checker only)
     */
    public static function getPendingFiles(array $authUser): void {
        $pdo  = getDbConnection();

        // Files available to be picked up (pending, not yet assigned)
        $stmt = $pdo->prepare("
            SELECT f.*, u.name as customer_name, u.email as customer_email, u.uid as customer_uid
            FROM files f
            JOIN users u ON f.customer_id = u.id
            WHERE f.status = 'pending'
            ORDER BY f.upload_date DESC
        ");
        $stmt->execute();
        $files = $stmt->fetchAll();

        // How many active jobs does this checker already have?
        $capStmt = $pdo->prepare(
            "SELECT COUNT(*) as active_count
             FROM files
             WHERE checker_id = ?
               AND status IN ('accepted', 'in_progress')"
        );
        $capStmt->execute([$authUser['id']]);
        $activeCount = (int)$capStmt->fetch()['active_count'];

        Response::success([
            'files'       => $files,
            'activeCount' => $activeCount,   // checker's current workload (max 3)
            'maxJobs'     => 3,
        ]);
    }

    /**
     * POST /api/files/:id/accept  (Checker only)
     */
    public static function acceptFile(array $authUser, int $fileId): void {
        $pdo = getDbConnection();
        $pdo->beginTransaction();

        try {
            // Lock the row to prevent race conditions
            $stmt = $pdo->prepare('SELECT * FROM files WHERE id = ? FOR UPDATE');
            $stmt->execute([$fileId]);
            $file = $stmt->fetch();

            if (!$file) {
                $pdo->rollBack();
                Response::notFound('File not found');
            }

            if ($file['status'] !== 'pending') {
                $pdo->rollBack();
                Response::error('File is no longer available', 400);
            }

            if ($file['checker_id'] !== null) {
                $pdo->rollBack();
                Response::error('File already accepted by another checker', 400);
            }

            // ── Capacity check: max 3 active files per checker ──
            $capStmt = $pdo->prepare(
                "SELECT COUNT(*) as active_count
                 FROM files
                 WHERE checker_id = ?
                   AND status IN ('accepted', 'in_progress')"
            );
            $capStmt->execute([$authUser['id']]);
            $activeCount = (int)$capStmt->fetch()['active_count'];

            if ($activeCount >= 3) {
                $pdo->rollBack();
                Response::error(
                    'You have reached your limit of 3 active jobs. Please complete your current jobs before accepting new ones.',
                    400
                );
            }

            // Assign checker and update status
            $stmt = $pdo->prepare(
                "UPDATE files SET checker_id = ?, status = 'accepted', accepted_at = NOW() WHERE id = ?"
            );
            $stmt->execute([$authUser['id'], $fileId]);

            // Get customer info
            $stmt = $pdo->prepare('SELECT email, name FROM users WHERE id = ?');
            $stmt->execute([$file['customer_id']]);
            $customer = $stmt->fetch();

            // Notify customer
            $stmt = $pdo->prepare(
                "INSERT INTO notifications (user_id, file_id, title, message, type) VALUES (?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $file['customer_id'],
                $fileId,
                'File Accepted',
                "Your file \"{$file['title']}\" has been accepted for processing",
                'success',
            ]);

            $pdo->commit();

            // Send email (after commit, non-critical)
            Email::sendNotification(
                $customer['email'],
                'File Accepted',
                "Your file \"{$file['title']}\" has been accepted and is being processed."
            );

            Response::success([
                'message' => 'File accepted successfully',
                'file'    => ['id' => $fileId, 'status' => 'accepted'],
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error($e->getMessage());
        }
    }

    /**
     * GET /api/files/my-files  (Customer only)
     */
    public static function getCustomerFiles(array $authUser): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare("
            SELECT f.*,
                   COALESCE(r.ai_percentage, 0) as ai_percentage,
                   COALESCE(r.plagiarism_percentage, 0) as plagiarism_percentage
            FROM files f
            LEFT JOIN reports r ON f.id = r.file_id
            WHERE f.customer_id = ?
            ORDER BY f.upload_date DESC
        ");
        $stmt->execute([$authUser['id']]);
        $files = $stmt->fetchAll();

        Response::success(['files' => $files]);
    }

    /**
     * GET /api/files/accepted  (Checker only)
     */
    public static function getAcceptedFiles(array $authUser): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare("
            SELECT f.*, u.name as customer_name, u.email as customer_email, u.uid as customer_uid
            FROM files f
            JOIN users u ON f.customer_id = u.id
            WHERE f.checker_id = ? AND f.status IN ('accepted', 'in_progress')
            ORDER BY f.accepted_at DESC
        ");
        $stmt->execute([$authUser['id']]);
        $files = $stmt->fetchAll();

        Response::success(['files' => $files]);
    }

    /**
     * GET /api/files/completed  (Checker only — their own completed jobs)
     */
    public static function getCompletedFiles(array $authUser): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare("
            SELECT f.*,
                   u.name  as customer_name,
                   u.email as customer_email,
                   u.uid   as customer_uid,
                   r.ai_report, r.plagiarism_report
            FROM files f
            JOIN users u ON f.customer_id = u.id
            LEFT JOIN reports r ON f.id = r.file_id
            WHERE f.checker_id = ? AND f.status = 'completed'
            ORDER BY f.accepted_at DESC
        ");
        $stmt->execute([$authUser['id']]);
        $files = $stmt->fetchAll();

        Response::success(['files' => $files]);
    }

    /**
     * GET /api/files/:id  (Authenticated)
     */
    public static function getFileDetails(array $authUser, int $fileId): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare("
            SELECT f.*,
                   u.name as customer_name,
                   u.uid  as customer_uid,
                   COALESCE(c.name, 'Unassigned') as checker_name,
                   COALESCE(c.uid, '') as checker_uid,
                   r.ai_report, r.plagiarism_report, r.remarks
            FROM files f
            JOIN users u ON f.customer_id = u.id
            LEFT JOIN users c ON f.checker_id = c.id
            LEFT JOIN reports r ON f.id = r.file_id
            WHERE f.id = ?
        ");
        $stmt->execute([$fileId]);
        $file = $stmt->fetch();

        if (!$file) {
            Response::notFound('File not found');
        }

        Response::success(['file' => $file]);
    }

    /**
     * GET /api/files/:id/download  (Authenticated)
     * Checkers must have accepted the job before they can download.
     */
    public static function downloadFile(array $authUser, int $fileId): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare('SELECT * FROM files WHERE id = ?');
        $stmt->execute([$fileId]);
        $file = $stmt->fetch();

        if (!$file) {
            Response::notFound('File not found');
        }

        // Customer can only download their own files
        if ($authUser['role'] === 'customer' && (int)$file['customer_id'] !== (int)$authUser['id']) {
            Response::forbidden('Forbidden');
        }

        // Checker must have accepted this specific file — no browse-and-download
        if ($authUser['role'] === 'checker') {
            if ((int)$file['checker_id'] !== (int)$authUser['id']) {
                Response::forbidden('You must accept this job before you can download the document.');
            }
        }

        $uploadDir = rtrim($_ENV['UPLOAD_PATH'] ?? 'uploads', '/') . '/';
        $filepath  = $uploadDir . $file['original_file'];

        if (!file_exists($filepath)) {
            Response::notFound('File not found on server');
        }

        // Serve with the customer's original filename (not the hashed disk name)
        $downloadName = $file['original_filename'] ?? ($file['title'] . '.' . pathinfo($file['original_file'], PATHINFO_EXTENSION));

        // Remove global JSON content-type before streaming
        header_remove('Content-Type');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . addslashes($downloadName) . '"');
        header('Content-Length: ' . filesize($filepath));
        header('Cache-Control: no-cache');
        readfile($filepath);
        exit;
    }

    /**
     * POST /api/files/:id/dispute  (Customer only)
     * Sends a fixed "wrong file" alert to the checker — no free-text messaging.
     */
    public static function reportDispute(array $authUser, int $fileId): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare(
            'SELECT f.*, u.id as checker_user_id FROM files f
             LEFT JOIN users u ON f.checker_id = u.id
             WHERE f.id = ?'
        );
        $stmt->execute([$fileId]);
        $file = $stmt->fetch();

        if (!$file) {
            Response::notFound('File not found');
        }

        // Only the customer who owns the file may dispute
        if ((int)$file['customer_id'] !== (int)$authUser['id']) {
            Response::forbidden('You can only report issues with your own files');
        }

        // Only completed files can be disputed
        if ($file['status'] !== 'completed') {
            Response::error('You can only report an issue on a completed file', 400);
        }

        // Already reported — don't send duplicate
        if ($file['dispute_status'] === 'reported') {
            Response::error('You have already reported an issue for this file. Please wait for the checker to re-upload.', 400);
        }

        // Mark dispute as reported and set status back to accepted so checker can re-upload
        $stmt = $pdo->prepare("UPDATE files SET dispute_status = 'reported', status = 'accepted' WHERE id = ?");
        $stmt->execute([$fileId]);

        // Notify the checker with a fixed system message
        if ($file['checker_id']) {
            $stmt = $pdo->prepare(
                'INSERT INTO notifications (user_id, file_id, title, message, type) VALUES (?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $file['checker_id'],
                $fileId,
                '⚠️ Wrong File Reported',
                "The customer has reported that the reports for document \"{$file['title']}\" appear to be incorrect or incomplete. Please review and re-upload the correct report files.",
                'warning',
            ]);
        }

        Response::success(['message' => 'Issue reported. The checker has been notified.']);
    }

    /**
     * DELETE /api/files/:id  (Authenticated)
     */
    public static function deleteFile(array $authUser, int $fileId): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare('SELECT * FROM files WHERE id = ?');
        $stmt->execute([$fileId]);
        $file = $stmt->fetch();

        if (!$file) {
            Response::notFound('File not found');
        }

        // Check permissions
        if ($authUser['role'] === 'customer' && (int)$file['customer_id'] !== (int)$authUser['id']) {
            Response::forbidden('Forbidden');
        }

        // Delete physical file
        $uploadDir = rtrim($_ENV['UPLOAD_PATH'] ?? 'uploads', '/') . '/';
        $filepath  = $uploadDir . $file['original_file'];
        if (file_exists($filepath)) {
            unlink($filepath);
        }

        // Delete from DB (cascade will remove reports, notifications, comments)
        $stmt = $pdo->prepare('DELETE FROM files WHERE id = ?');
        $stmt->execute([$fileId]);

        Response::success(['message' => 'File deleted successfully']);
    }

    /**
     * POST /api/files/:id/cancel  (Customer only)
     * Only allowed when the file is still 'pending' (no checker has accepted it).
     */
    public static function cancelFile(array $authUser, int $fileId): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare('SELECT * FROM files WHERE id = ?');
        $stmt->execute([$fileId]);
        $file = $stmt->fetch();

        if (!$file) {
            Response::notFound('File not found');
        }

        // Only the owner can cancel
        if ((int)$file['customer_id'] !== (int)$authUser['id']) {
            Response::forbidden('You can only cancel your own files');
        }

        // Only pending files can be cancelled
        if ($file['status'] !== 'pending') {
            Response::error('Only pending files can be cancelled. A checker has already accepted this job.', 400);
        }

        $stmt = $pdo->prepare("UPDATE files SET status = 'cancelled' WHERE id = ?");
        $stmt->execute([$fileId]);

        Response::success(['message' => 'Order cancelled successfully']);
    }

    /**
     * GET /api/system/temporary-links/:token (Public)
     */
    public static function getTemporaryLinkDetails(string $token): void {
        $pdo = getDbConnection();
        
        // Fetch temporary link
        $stmt = $pdo->prepare("
            SELECT id, token, file_limit, created_at,
                   (SELECT COUNT(*) FROM files WHERE temporary_link_id = temporary_links.id) as uploaded_count
            FROM temporary_links
            WHERE token = ?
        ");
        $stmt->execute([$token]);
        $link = $stmt->fetch();

        if (!$link) {
            Response::notFound('Invalid or expired temporary upload link.');
        }

        // Fetch associated files
        $stmt = $pdo->prepare("
            SELECT f.id, f.uid, f.title, f.description, f.service_type, f.original_filename, f.file_size, f.file_type, f.status, f.upload_date, f.completed_at,
                   r.ai_percentage, r.plagiarism_percentage, r.ai_report_file, r.ai_report_original_name, r.plagiarism_report_file, r.plagiarism_report_original_name
            FROM files f
            LEFT JOIN reports r ON f.id = r.file_id
            WHERE f.temporary_link_id = ?
            ORDER BY f.upload_date DESC
        ");
        $stmt->execute([$link['id']]);
        $files = $stmt->fetchAll();

        Response::success([
            'link' => $link,
            'files' => $files
        ]);
    }

    /**
     * POST /api/system/temporary-links/:token/upload (Public)
     */
    public static function uploadViaTemporaryLink(string $token): void {
        if (empty($_FILES['file'])) {
            Response::badRequest('No file uploaded');
        }

        $uploadedFile = $_FILES['file'];

        // Validate extension first (fast check)
        $ext = strtolower(pathinfo($uploadedFile['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, self::$allowedExtensions, true)) {
            Response::badRequest('Invalid file type. Only PDF (.pdf) and Word (.docx) files are accepted.');
        }

        // Validate MIME type (deep check against actual file content)
        $finfo    = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($uploadedFile['tmp_name']);
        if (!in_array($mimeType, self::$allowedMimes, true)) {
            Response::badRequest('Invalid file type. Only PDF (.pdf) and Word (.docx) files are accepted.');
        }

        // Validate file size (max 50 MB)
        $maxSize = (int)($_ENV['MAX_FILE_SIZE'] ?? 52428800);
        if ($uploadedFile['size'] > $maxSize) {
            Response::badRequest('File too large. Maximum size is 50 MB.');
        }

        $title       = trim($_POST['title'] ?? '');
        $description = $_POST['description'] ?? null;
        $serviceType = $_POST['service_type'] ?? '';

        // Auto-generate title from filename if not provided
        if (empty($title)) {
            $title = pathinfo($uploadedFile['name'], PATHINFO_FILENAME);
        }

        if (!in_array($serviceType, ['ai_detection', 'plagiarism_check', 'both'], true)) {
            Response::badRequest('Invalid service_type');
        }

        $pdo = getDbConnection();

        // 1. Fetch temporary link details
        $stmt = $pdo->prepare("
            SELECT id, file_limit,
                   (SELECT COUNT(*) FROM files WHERE temporary_link_id = temporary_links.id) as uploaded_count
            FROM temporary_links
            WHERE token = ?
        ");
        $stmt->execute([$token]);
        $link = $stmt->fetch();

        if (!$link) {
            Response::notFound('Invalid temporary link');
        }

        $fileLimit = (int)$link['file_limit'];
        $uploadedCount = (int)$link['uploaded_count'];

        if ($uploadedCount >= $fileLimit) {
            Response::badRequest("Upload limit reached. This link only allows checking up to {$fileLimit} files.");
        }

        // 2. Fetch Retail Customer placeholder user
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute(['retail@system.com']);
        $retailUser = $stmt->fetch();
        if (!$retailUser) {
            // Fallback: create if missing
            $new_hash = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT, ['cost' => 10]);
            $uid = 'USR-RETAIL';
            $stmt = $pdo->prepare("INSERT INTO users (uid, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$uid, 'Retail Customer', 'retail@system.com', $new_hash, 'customer', 'active']);
            $retailUserId = (int)$pdo->lastInsertId();
        } else {
            $retailUserId = (int)$retailUser['id'];
        }

        // 3. Save file physically
        $fileSize = (int)$uploadedFile['size'];
        $fileType = strtoupper($ext); // 'PDF' or 'DOCX'
        
        $uploadDir = rtrim($_ENV['UPLOAD_PATH'] ?? 'uploads', '/') . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filename = time() . '-' . mt_rand(100000000, 999999999) . '.' . $ext;
        $filepath = $uploadDir . $filename;

        if (!move_uploaded_file($uploadedFile['tmp_name'], $filepath)) {
            Response::error('Failed to save uploaded file');
        }

        // 4. Insert file record with temporary_link_id and customer_paid = 1 (retail paid upfront)
        $uid = Uid::generate('DOC', $pdo, 'files');
        $stmt = $pdo->prepare(
            'INSERT INTO files (uid, customer_id, temporary_link_id, title, description, service_type, original_file, original_filename, file_size, file_type, status, customer_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
        );
        $stmt->execute([$uid, $retailUserId, $link['id'], $title, $description, $serviceType, $filename, $uploadedFile['name'], $fileSize, $fileType, 'pending']);
        $fileId = (int)$pdo->lastInsertId();

        // 5. Notify all checkers
        $stmt = $pdo->prepare(
            "INSERT INTO notifications (user_id, file_id, title, message, type)
             SELECT id, ?, ?, ?, ? FROM users WHERE role = 'checker'"
        );
        $stmt->execute([
            $fileId,
            'New Retail File Available',
            "New document \"{$title}\" (Retail Customer) is available for checking",
            'info',
        ]);

        Response::success([
            'message'  => 'File uploaded successfully via temporary link',
            'fileId'   => $fileId,
            'filename' => $filename,
        ], 201);
    }

    /**
     * GET /api/system/temporary-links/:token/download/:file_id/:type (Public)
     */
    public static function downloadReportViaTemporaryLink(string $token, int $fileId, string $type): void {
        $pdo = getDbConnection();
        
        // 1. Verify token exists
        $stmt = $pdo->prepare("SELECT id FROM temporary_links WHERE token = ?");
        $stmt->execute([$token]);
        $link = $stmt->fetch();
        if (!$link) {
            Response::notFound('Invalid or expired temporary upload link.');
        }

        // 2. Fetch report and verify it is associated with this link
        $stmt = $pdo->prepare("
            SELECT r.*, f.temporary_link_id
            FROM reports r
            JOIN files f ON r.file_id = f.id
            WHERE r.file_id = ? AND f.temporary_link_id = ?
        ");
        $stmt->execute([$fileId, $link['id']]);
        $report = $stmt->fetch();

        if (!$report) {
            Response::notFound('Report not found for this temporary link.');
        }

        $uploadDir = rtrim($_ENV['UPLOAD_PATH'] ?? 'uploads', '/') . '/reports/';

        if ($type === 'ai') {
            $diskFilename    = $report['ai_report_file'] ?? null;
            $originalName    = $report['ai_report_original_name'] ?? null;
        } elseif ($type === 'plagiarism') {
            $diskFilename    = $report['plagiarism_report_file'] ?? null;
            $originalName    = $report['plagiarism_report_original_name'] ?? null;
        } else {
            Response::badRequest('Invalid report type. Use "ai" or "plagiarism".');
            return;
        }

        if (!$diskFilename) {
            Response::notFound("No {$type} report file found for this job");
        }

        $filepath = $uploadDir . $diskFilename;
        if (!file_exists($filepath)) {
            Response::notFound('Report file not found on server');
        }

        // Serve with the original filename the checker uploaded
        $downloadName = $originalName ?: $diskFilename;
        $mimeType     = mime_content_type($filepath) ?: 'application/octet-stream';

        header_remove('Content-Type');
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: attachment; filename="' . addslashes($downloadName) . '"');
        header('Content-Length: ' . filesize($filepath));
        header('Cache-Control: no-cache');
        readfile($filepath);
        exit;
    }
}

