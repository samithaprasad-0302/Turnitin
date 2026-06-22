<?php

/**
 * ReportController
 * Equivalent to backend/src/controllers/reportController.js
 */

class ReportController {

    /**
     * POST /api/reports/upload  (Checker only)
     * Saves AI and plagiarism report files to disk, stores paths in DB.
     */
    public static function uploadReport(array $authUser): void {
        $fileId               = $_POST['file_id'] ?? null;
        $aiPercentage         = (float)($_POST['ai_percentage'] ?? 0);
        $plagiarismPercentage = (float)($_POST['plagiarism_percentage'] ?? 0);
        $remarks              = $_POST['remarks'] ?? null;

        $aiReportFile         = $_FILES['ai_report'] ?? null;
        $plagiarismReportFile  = $_FILES['plagiarism_report'] ?? null;

        if (empty($fileId)) {
            Response::badRequest('file_id is required');
        }

        $hasAiFile  = $aiReportFile && $aiReportFile['error'] === UPLOAD_ERR_OK;
        $hasPlagFile = $plagiarismReportFile && $plagiarismReportFile['error'] === UPLOAD_ERR_OK;

        if (!$hasAiFile && !$hasPlagFile) {
            Response::badRequest('At least one report file (ai_report or plagiarism_report) is required');
        }

        $pdo = getDbConnection();

        // Verify file belongs to this checker
        $stmt = $pdo->prepare(
            'SELECT f.*, u.email FROM files f JOIN users u ON f.customer_id = u.id WHERE f.id = ? AND f.checker_id = ?'
        );
        $stmt->execute([$fileId, $authUser['id']]);
        $file = $stmt->fetch();

        if (!$file) {
            Response::notFound('File not found or not assigned to you');
        }

        // Save reports to disk under uploads/reports/
        $uploadDir = rtrim($_ENV['UPLOAD_PATH'] ?? 'uploads', '/') . '/reports/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $aiReportFilename            = null;
        $aiReportOriginalName        = null;
        $plagiarismReportFilename    = null;
        $plagiarismReportOriginalName = null;

        if ($hasAiFile) {
            $ext                    = pathinfo($aiReportFile['name'], PATHINFO_EXTENSION);
            $aiReportOriginalName   = $aiReportFile['name'];  // keep original name for download
            $aiReportFilename       = 'ai-' . time() . '-' . mt_rand(100000, 999999) . '.' . $ext;
            if (!move_uploaded_file($aiReportFile['tmp_name'], $uploadDir . $aiReportFilename)) {
                Response::error('Failed to save AI report file');
            }
        }

        if ($hasPlagFile) {
            $ext                         = pathinfo($plagiarismReportFile['name'], PATHINFO_EXTENSION);
            $plagiarismReportOriginalName = $plagiarismReportFile['name'];  // keep original name for download
            $plagiarismReportFilename     = 'plag-' . time() . '-' . mt_rand(100000, 999999) . '.' . $ext;
            if (!move_uploaded_file($plagiarismReportFile['tmp_name'], $uploadDir . $plagiarismReportFilename)) {
                Response::error('Failed to save plagiarism report file');
            }
        }

        // Upsert report record
        $stmt = $pdo->prepare('SELECT id, ai_report_file, plagiarism_report_file FROM reports WHERE file_id = ?');
        $stmt->execute([$fileId]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Delete old disk files if replacing
            if ($aiReportFilename && $existing['ai_report_file']) {
                $old = $uploadDir . $existing['ai_report_file'];
                if (file_exists($old)) unlink($old);
            }
            if ($plagiarismReportFilename && $existing['plagiarism_report_file']) {
                $old = $uploadDir . $existing['plagiarism_report_file'];
                if (file_exists($old)) unlink($old);
            }

            $stmt = $pdo->prepare(
                'UPDATE reports
                 SET ai_report_file             = COALESCE(?, ai_report_file),
                     ai_report_original_name    = COALESCE(?, ai_report_original_name),
                     plagiarism_report_file     = COALESCE(?, plagiarism_report_file),
                     plagiarism_report_original_name = COALESCE(?, plagiarism_report_original_name),
                     ai_percentage              = ?,
                     plagiarism_percentage      = ?,
                     remarks                    = ?
                 WHERE file_id = ?'
            );
            $stmt->execute([
                $aiReportFilename,
                $aiReportOriginalName,
                $plagiarismReportFilename,
                $plagiarismReportOriginalName,
                $aiPercentage,
                $plagiarismPercentage,
                $remarks,
                $fileId,
            ]);
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO reports
                    (file_id, ai_report_file, ai_report_original_name,
                     plagiarism_report_file, plagiarism_report_original_name,
                     ai_percentage, plagiarism_percentage, remarks)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $fileId,
                $aiReportFilename,
                $aiReportOriginalName,
                $plagiarismReportFilename,
                $plagiarismReportOriginalName,
                $aiPercentage,
                $plagiarismPercentage,
                $remarks,
            ]);
        }

        // If a dispute was open, resolve it now that checker has re-uploaded
        $pdo->prepare("UPDATE files SET dispute_status = 'resolved' WHERE id = ? AND dispute_status = 'reported'")
            ->execute([$fileId]);

        Response::success(['message' => 'Report uploaded successfully']);
    }

    /**
     * GET /api/reports/:file_id/download/:type  (Customer or Checker)
     * type = 'ai' | 'plagiarism'
     */
    public static function downloadReport(array $authUser, int $fileId, string $type): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare(
            'SELECT r.*, f.customer_id, f.checker_id
             FROM reports r
             JOIN files f ON r.file_id = f.id
             WHERE r.file_id = ?'
        );
        $stmt->execute([$fileId]);
        $report = $stmt->fetch();

        if (!$report) {
            Response::notFound('Report not found');
        }

        // Permission check
        if ($authUser['role'] === 'customer' && (int)$report['customer_id'] !== (int)$authUser['id']) {
            Response::forbidden('Forbidden');
        }
        if ($authUser['role'] === 'checker' && (int)$report['checker_id'] !== (int)$authUser['id']) {
            Response::forbidden('Forbidden');
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

    /**
     * POST /api/reports/mark-completed  (Checker only)
     */
    public static function markCompleted(array $authUser): void {
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];
        $fileId = $body['file_id'] ?? null;

        if (empty($fileId)) {
            Response::badRequest('file_id is required');
        }

        $pdo = getDbConnection();

        // Verify file belongs to this checker and get customer info
        $stmt = $pdo->prepare(
            'SELECT f.*, u.email, u.name as customer_name
             FROM files f JOIN users u ON f.customer_id = u.id
             WHERE f.id = ? AND f.checker_id = ?'
        );
        $stmt->execute([$fileId, $authUser['id']]);
        $file = $stmt->fetch();

        if (!$file) {
            Response::notFound('File not found');
        }

        // Check that at least one report file was uploaded
        $stmt = $pdo->prepare(
            'SELECT id FROM reports WHERE file_id = ? AND (ai_report_file IS NOT NULL OR plagiarism_report_file IS NOT NULL)'
        );
        $stmt->execute([$fileId]);
        if (!$stmt->fetch()) {
            Response::error('Report files not uploaded yet', 400);
        }

        // Mark as completed
        $stmt = $pdo->prepare("UPDATE files SET status = 'completed', completed_at = NOW() WHERE id = ?");
        $stmt->execute([$fileId]);

        // Notify customer
        $stmt = $pdo->prepare(
            'INSERT INTO notifications (user_id, file_id, title, message, type) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $file['customer_id'],
            $fileId,
            'Reports Ready',
            "Your document \"{$file['title']}\" has been checked. Your reports are ready to download.",
            'success',
        ]);

        // Send email (non-critical)
        Email::sendNotification(
            $file['email'],
            'Reports Ready for Download',
            'Your document has been checked. Please login to download your reports.'
        );

        Response::success(['message' => 'File marked as completed']);
    }

    /**
     * GET /api/reports/:file_id  (Authenticated)
     */
    public static function getReport(array $authUser, int $fileId): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare(
            'SELECT r.*, f.customer_id, f.checker_id FROM reports r JOIN files f ON r.file_id = f.id WHERE r.file_id = ?'
        );
        $stmt->execute([$fileId]);
        $report = $stmt->fetch();

        if (!$report) {
            Response::notFound('Report not found');
        }

        // Check permissions
        if ($authUser['role'] === 'customer' && (int)$report['customer_id'] !== (int)$authUser['id']) {
            Response::forbidden('Forbidden');
        }

        if ($authUser['role'] === 'checker'
            && (int)$report['checker_id'] !== (int)$authUser['id']
            && $authUser['role'] !== 'admin') {
            Response::forbidden('Forbidden');
        }

        Response::success(['report' => $report]);
    }

    /**
     * POST /api/reports/comment  (Authenticated)
     */
    public static function addComment(array $authUser): void {
        $body    = json_decode(file_get_contents('php://input'), true) ?? [];
        $fileId  = $body['file_id'] ?? null;
        $comment = trim($body['comment'] ?? '');

        if (empty($fileId) || empty($comment)) {
            Response::badRequest('file_id and comment are required');
        }

        $pdo = getDbConnection();

        // Check user has access to this file
        $stmt = $pdo->prepare(
            'SELECT * FROM files WHERE id = ? AND (customer_id = ? OR checker_id = ?)'
        );
        $stmt->execute([$fileId, $authUser['id'], $authUser['id']]);
        if (!$stmt->fetch()) {
            Response::notFound('File not found or access denied');
        }

        $stmt = $pdo->prepare('INSERT INTO comments (file_id, user_id, comment) VALUES (?, ?, ?)');
        $stmt->execute([$fileId, $authUser['id'], $comment]);

        Response::success(['message' => 'Comment added successfully'], 201);
    }

    /**
     * GET /api/reports/:file_id/comments  (Authenticated)
     */
    public static function getComments(array $authUser, int $fileId): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare("
            SELECT c.*, u.name, u.role
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.file_id = ?
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$fileId]);
        $comments = $stmt->fetchAll();

        Response::success(['comments' => $comments]);
    }
}
