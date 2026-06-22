<?php

/**
 * AdminController
 * Equivalent to backend/src/controllers/adminController.js
 */

class AdminController {

    /**
     * GET /api/admin/users  (Admin only)
     */
    public static function getAllUsers(array $authUser): void {
        $role   = $_GET['role'] ?? null;
        $status = $_GET['status'] ?? null;
        $search = $_GET['search'] ?? null;
        $page   = max(1, (int)($_GET['page'] ?? 1));
        $limit  = max(1, (int)($_GET['limit'] ?? 10));
        $offset = ($page - 1) * $limit;

        $pdo    = getDbConnection();
        $query  = "SELECT id, uid, name, email, role, status, phone, company, per_file_charge, file_limit,
                          (SELECT COUNT(*) FROM files WHERE customer_id = users.id AND status = 'completed' AND customer_paid = 0) as unpaid_checks,
                          (SELECT COUNT(*) FROM files WHERE customer_id = users.id AND status = 'completed' AND customer_paid = 0) * per_file_charge as due_balance,
                          (SELECT COUNT(*) FROM files WHERE customer_id = users.id AND status IN ('pending', 'accepted', 'in_progress')) as customer_active_checks,
                          (SELECT COUNT(*) FROM files WHERE checker_id = users.id AND status IN ('accepted', 'in_progress')) as checker_active_jobs,
                          (SELECT COUNT(*) FROM files WHERE checker_id = users.id AND status = 'completed' AND checker_paid = 0) as checker_unpaid_checks,
                          (SELECT COUNT(*) FROM files WHERE checker_id = users.id AND status = 'completed' AND checker_paid = 0) * 0.60 as checker_due_balance,
                          created_at FROM users WHERE email != 'retail@system.com'";
        $params = [];

        if ($role !== null) {
            $query  .= ' AND role = ?';
            $params[] = $role;
        }

        if ($status !== null) {
            $query  .= ' AND status = ?';
            $params[] = $status;
        }

        if ($search !== null && trim($search) !== '') {
            $search = trim($search);
            $query  .= ' AND (uid = ? OR name LIKE ? OR email LIKE ?)';
            $params[] = $search;
            $params[] = '%' . $search . '%';
            $params[] = '%' . $search . '%';
        }

        $query   .= ' ORDER BY (role = \'admin\') DESC, created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $users = $stmt->fetchAll();

        Response::success([
            'users' => $users,
            'page'  => $page,
            'limit' => $limit,
        ]);
    }

    /**
     * POST /api/admin/users  (Admin only)
     */
    public static function createUser(array $authUser): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $name     = trim($body['name'] ?? '');
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $role     = $body['role'] ?? 'customer';
        $company  = empty(trim($body['company'] ?? '')) ? null : trim($body['company']);
        $phone    = empty(trim($body['phone'] ?? '')) ? null : trim($body['phone']);
        $per_file_charge = isset($body['per_file_charge']) ? (float)$body['per_file_charge'] : 400.00;
        $file_limit      = isset($body['file_limit']) ? (int)$body['file_limit'] : 10;

        // Validate
        if (empty($name) || empty($email) || empty($password)) {
            Response::badRequest('Name, email, and password are required');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::badRequest('Invalid email address');
        }

        if (!in_array($role, ['customer', 'checker'], true)) {
            Response::badRequest('Invalid role. Must be customer or checker');
        }

        if (strlen($password) < 6) {
            Response::badRequest('Password must be at least 6 characters');
        }

        $pdo = getDbConnection();

        // Check if email already exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            Response::error('Email already registered', 400);
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

        // Generate unique User UID
        $uid = Uid::generate('USR', $pdo, 'users');

        // Insert user
        $stmt = $pdo->prepare(
            'INSERT INTO users (uid, name, email, password, role, company, phone, per_file_charge, file_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$uid, $name, $email, $hashedPassword, $role, $company, $phone, $per_file_charge, $file_limit]);
        $userId = (int)$pdo->lastInsertId();

        Response::success([
            'message' => 'User created successfully',
            'user'    => [
                'id'    => $userId,
                'uid'   => $uid,
                'name'  => $name,
                'email' => $email,
                'role'  => $role
            ]
        ], 201);
    }

    /**
     * PUT /api/admin/users/status  (Admin only)
     */
    public static function updateUserStatus(array $authUser): void {
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = $body['user_id'] ?? null;
        $status = $body['status'] ?? null;

        if (!in_array($status, ['active', 'suspended'], true)) {
            Response::badRequest('Invalid status. Must be active or suspended');
        }

        if (empty($userId)) {
            Response::badRequest('user_id is required');
        }

        $pdo  = getDbConnection();

        // Check target user role
        $roleStmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
        $roleStmt->execute([$userId]);
        $targetRole = $roleStmt->fetchColumn();

        if ($targetRole === 'admin' && $status === 'suspended') {
            Response::badRequest('Administrator accounts cannot be suspended');
        }

        $stmt = $pdo->prepare('UPDATE users SET status = ? WHERE id = ?');
        $stmt->execute([$status, $userId]);

        Response::success(['message' => "User {$status} successfully"]);
    }

    /**
     * GET /api/admin/stats  (Admin only)
     */
    public static function getAdminStats(array $authUser): void {
        $pdo = getDbConnection();

        // User counts by role (excluding temporary links placeholder)
        $stmt = $pdo->query("SELECT role, COUNT(*) as count FROM users WHERE email != 'retail@system.com' GROUP BY role");
        $roleRows = $stmt->fetchAll();
        $users = [
            'admin' => 0,
            'customer' => 0,
            'checker' => 0
        ];
        foreach ($roleRows as $row) {
            $users[$row['role']] = (int)$row['count'];
        }

        // File statistics
        $stmt = $pdo->query("
            SELECT
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN status = 'pending'     THEN 1 ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN status = 'accepted'    THEN 1 ELSE 0 END), 0) as accepted,
                COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress,
                COALESCE(SUM(CASE WHEN status = 'completed'   THEN 1 ELSE 0 END), 0) as completed
            FROM files
            WHERE status != 'cancelled'
              AND NOT (status = 'completed' AND customer_paid = 1 AND checker_paid = 1)
        ");
        $fileStats = $stmt->fetch();

        // Checker performance
        $stmt = $pdo->query("
            SELECT
                u.id, u.uid, u.name, u.email,
                COUNT(f.id) as total_files,
                SUM(CASE WHEN f.status = 'completed' THEN 1 ELSE 0 END) as completed_files,
                SUM(CASE WHEN f.status = 'completed' AND f.checker_paid = 0 THEN 1 ELSE 0 END) as unpaid_completed_files,
                SUM(CASE WHEN f.status = 'completed' AND f.checker_paid = 0 THEN 0.60 ELSE 0.00 END) as due_amount,
                SUM(CASE WHEN f.status IN ('accepted', 'in_progress') THEN 1 ELSE 0 END) as active_checking_jobs
            FROM users u
            LEFT JOIN files f ON u.id = f.checker_id
            WHERE u.role = 'checker'
            GROUP BY u.id, u.uid, u.name, u.email
        ");
        $checkerPerformance = $stmt->fetchAll();

        // Customer file stats (with billing info)
        $stmt = $pdo->query("
            SELECT
                u.id, u.uid, u.name, u.email, u.per_file_charge, u.file_limit,
                COUNT(f.id) as total_files,
                SUM(CASE WHEN f.status = 'completed' THEN 1 ELSE 0 END) as completed_files,
                SUM(CASE WHEN f.status = 'completed' AND f.customer_paid = 0 THEN 1 ELSE 0 END) as unpaid_checks,
                SUM(CASE WHEN f.status = 'completed' AND f.customer_paid = 0 THEN 1 ELSE 0 END) * u.per_file_charge as due_balance,
                SUM(CASE WHEN f.status IN ('pending', 'accepted', 'in_progress') THEN 1 ELSE 0 END) as active_checking_files
            FROM users u
            LEFT JOIN files f ON u.id = f.customer_id AND f.status IS NOT NULL AND f.status != 'cancelled'
            WHERE u.role = 'customer' AND u.email != 'retail@system.com'
            GROUP BY u.id, u.uid, u.name, u.email, u.per_file_charge, u.file_limit
        ");
        $customerPerformance = $stmt->fetchAll();

        // Detailed list of all files with who checked whose file
        $stmt = $pdo->query("
            SELECT
                f.id, f.uid, f.title, f.original_filename, f.original_file, f.status, f.upload_date,
                f.customer_paid, f.checker_paid, f.temporary_link_id,
                cust.name as customer_name, cust.email as customer_email, cust.uid as customer_uid,
                COALESCE(checkr.name, 'Unassigned') as checker_name,
                COALESCE(checkr.email, '') as checker_email,
                COALESCE(checkr.uid, '') as checker_uid
            FROM files f
            JOIN users cust ON f.customer_id = cust.id
            LEFT JOIN users checkr ON f.checker_id = checkr.id
            ORDER BY f.upload_date DESC
        ");
        $fileDetails = $stmt->fetchAll();

        Response::success([
            'stats' => [
                'users'              => $users,
                'files'              => $fileStats,
                'checkerPerformance' => $checkerPerformance,
                'customerPerformance'=> $customerPerformance,
                'fileDetails'        => $fileDetails,
            ],
        ]);
    }

    /**
     * GET /api/admin/customer-stats  (Authenticated customer)
     */
    public static function getCustomerStats(array $authUser): void {
        $pdo  = getDbConnection();
        
        // Fetch stats counts
        $stmt = $pdo->prepare("
            SELECT
                COALESCE(SUM(CASE WHEN customer_paid = 0 THEN 1 ELSE 0 END), 0) as total_uploads,
                COALESCE(SUM(CASE WHEN status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN status = 'completed' AND customer_paid = 0 THEN 1 ELSE 0 END), 0) as completed,
                COALESCE(SUM(CASE WHEN status = 'completed' AND customer_paid = 0 THEN 1 ELSE 0 END), 0) as unpaid_completed_count
            FROM files
            WHERE customer_id = ? AND status != 'cancelled'
        ");
        $stmt->execute([$authUser['id']]);
        $counts = $stmt->fetch();

        // Fetch customer pricing and limit info
        $userStmt = $pdo->prepare("
            SELECT per_file_charge, file_limit FROM users WHERE id = ?
        ");
        $userStmt->execute([$authUser['id']]);
        $userInfo = $userStmt->fetch();

        $unpaidCompleted = (int)($counts['unpaid_completed_count'] ?? 0);
        $perFileCharge   = (float)($userInfo['per_file_charge'] ?? 10.00);
        $fileLimit       = (int)($userInfo['file_limit'] ?? 10);
        $dueAmount       = $unpaidCompleted * $perFileCharge;

        Response::success(['stats' => [
            'total_uploads'          => (int)($counts['total_uploads'] ?? 0),
            'pending'                => (int)($counts['pending'] ?? 0),
            'completed'              => (int)($counts['completed'] ?? 0),
            'unpaid_completed_count' => $unpaidCompleted,
            'per_file_charge'        => $perFileCharge,
            'file_limit'             => $fileLimit,
            'due_amount'             => $dueAmount,
        ]]);
    }

    /**
     * GET /api/admin/checker-stats  (Authenticated checker)
     */
    public static function getCheckerStats(array $authUser): void {
        $pdo = getDbConnection();

        // Available jobs = all pending files not yet accepted by anyone
        $stmt = $pdo->query("
            SELECT COUNT(*) as available_jobs
            FROM files
            WHERE status = 'pending'
              AND checker_id IS NULL
        ");
        $availableRow = $stmt->fetch();

        // This checker's own accepted and completed jobs
        $stmt = $pdo->prepare("
            SELECT
                SUM(CASE WHEN status IN ('accepted', 'in_progress') THEN 1 ELSE 0 END) as accepted_jobs,
                SUM(CASE WHEN status = 'completed' AND checker_paid = 0 THEN 1 ELSE 0 END) as completed_jobs,
                SUM(CASE WHEN status = 'completed' AND checker_paid = 0 THEN 1 ELSE 0 END) as unpaid_completed_jobs,
                SUM(CASE WHEN status = 'completed' AND checker_paid = 1 THEN 1 ELSE 0 END) as paid_completed_jobs,
                SUM(CASE WHEN status = 'completed' AND checker_paid = 0 THEN 0.60 ELSE 0.00 END) as due_amount,
                SUM(CASE WHEN status = 'completed' AND checker_paid = 1 THEN 0.60 ELSE 0.00 END) as paid_amount
            FROM files
            WHERE checker_id = ?
        ");
        $stmt->execute([$authUser['id']]);
        $myStats = $stmt->fetch();

        Response::success(['stats' => [
            'available_jobs'        => (int)($availableRow['available_jobs'] ?? 0),
            'accepted_jobs'         => (int)($myStats['accepted_jobs']  ?? 0),
            'completed_jobs'        => (int)($myStats['completed_jobs'] ?? 0),
            'unpaid_completed_jobs' => (int)($myStats['unpaid_completed_jobs'] ?? 0),
            'paid_completed_jobs'   => (int)($myStats['paid_completed_jobs'] ?? 0),
            'due_amount'            => (float)($myStats['due_amount'] ?? 0),
            'paid_amount'           => (float)($myStats['paid_amount'] ?? 0),
        ]]);
    }

    /**
     * POST /api/admin/payout  (Admin only)
     */
    public static function processPayout(array $authUser): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $checkerId = $body['checker_id'] ?? null;

        if (empty($checkerId)) {
            Response::badRequest('checker_id is required');
        }

        $pdo = getDbConnection();

        // Verify checker exists
        $stmt = $pdo->prepare("SELECT id, name FROM users WHERE id = ? AND role = 'checker'");
        $stmt->execute([$checkerId]);
        $checker = $stmt->fetch();

        if (!$checker) {
            Response::notFound('Checker not found');
        }

        // Mark completed unpaid files as paid
        $stmt = $pdo->prepare("
            UPDATE files
            SET checker_paid = 1
            WHERE checker_id = ? AND status = 'completed' AND checker_paid = 0
        ");
        $stmt->execute([$checkerId]);
        $rows = $stmt->rowCount();

        Response::success([
            'message' => "Successfully processed payout for {$checker['name']}.",
            'reset_files_count' => $rows
        ]);
    }

    /**
     * PUT /api/admin/users/settings  (Admin only)
     */
    public static function updateCustomerSettings(array $authUser): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = $body['user_id'] ?? null;
        $perFileCharge = isset($body['per_file_charge']) ? (float)$body['per_file_charge'] : null;
        $fileLimit = isset($body['file_limit']) ? (int)$body['file_limit'] : null;

        if (empty($userId)) {
            Response::badRequest('user_id is required');
        }

        if ($perFileCharge === null || $perFileCharge < 0) {
            Response::badRequest('Valid per_file_charge is required');
        }

        if ($fileLimit === null || $fileLimit < 1) {
            Response::badRequest('Valid file_limit is required (minimum 1)');
        }

        $pdo  = getDbConnection();
        $stmt = $pdo->prepare('UPDATE users SET per_file_charge = ?, file_limit = ? WHERE id = ? AND role = \'customer\'');
        $stmt->execute([$perFileCharge, $fileLimit, $userId]);

        Response::success(['message' => 'Customer settings updated successfully']);
    }

    /**
     * POST /api/admin/customer-payout  (Admin only)
     */
    public static function processCustomerPayout(array $authUser): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $customerId = $body['customer_id'] ?? null;

        if (empty($customerId)) {
            Response::badRequest('customer_id is required');
        }

        $pdo = getDbConnection();

        // Verify customer exists
        $stmt = $pdo->prepare("SELECT id, name FROM users WHERE id = ? AND role = 'customer'");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch();

        if (!$customer) {
            Response::notFound('Customer not found');
        }

        // Mark completed unpaid files as paid
        $stmt = $pdo->prepare("
            UPDATE files
            SET customer_paid = 1
            WHERE customer_id = ? AND status = 'completed' AND customer_paid = 0
        ");
        $stmt->execute([$customerId]);
        $rows = $stmt->rowCount();

        Response::success([
            'message' => "Successfully processed customer payment for {$customer['name']}.",
            'reset_files_count' => $rows
        ]);
    }

    /**
     * GET /api/admin/storage-stats  (Admin only)
     */
    public static function getStorageStats(array $authUser): void {
        $pdo = getDbConnection();

        // 1. Get database size
        $dbSize = 0;
        try {
            $dbname = $_ENV['DB_NAME'] ?? 'plagiarism_checker';
            $stmt = $pdo->prepare("
                SELECT SUM(data_length + index_length) AS total_size
                FROM information_schema.TABLES
                WHERE table_schema = ?
            ");
            $stmt->execute([$dbname]);
            $dbSize = (int)($stmt->fetch()['total_size'] ?? 0);
        } catch (Exception $e) {
            // Ignore/fallback
        }

        // 2. Get uploads folder size
        $uploadPath = rtrim($_ENV['UPLOAD_PATH'] ?? 'uploads', '/');
        $uploadsSize = self::getDirSize($uploadPath);

        // 3. Query counts of completed files
        $totalCompleted = 0;
        $eligibleCount = 0;
        try {
            $totalCompleted = (int)$pdo->query("SELECT COUNT(*) FROM files WHERE status = 'completed'")->fetchColumn();
            $eligibleCount = (int)$pdo->query("SELECT COUNT(*) FROM files WHERE status = 'completed' AND completed_at <= DATE_SUB(NOW(), INTERVAL 24 HOUR)")->fetchColumn();
        } catch (Exception $e) {
            // Ignore/fallback
        }

        Response::success([
            'db_size' => $dbSize,
            'db_size_formatted' => self::formatSize($dbSize),
            'uploads_size' => $uploadsSize,
            'uploads_size_formatted' => self::formatSize($uploadsSize),
            'total_completed' => $totalCompleted,
            'clearing_eligible_count' => $eligibleCount
        ]);
    }

    /**
     * POST /api/admin/clear-completed-files  (Admin only)
     */
    public static function clearCompletedFiles(array $authUser): void {
        $pdo = getDbConnection();
        
        $deletedCount = 0;
        try {
            // Fetch all completed files older than 24 hours along with their reports
            $stmt = $pdo->query("
                SELECT f.id, f.original_file, r.ai_report_file, r.plagiarism_report_file
                FROM files f
                LEFT JOIN reports r ON f.id = r.file_id
                WHERE f.status = 'completed' AND f.completed_at <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            $filesToDelete = $stmt->fetchAll();
            
            $uploadDir = rtrim($_ENV['UPLOAD_PATH'] ?? 'uploads', '/') . '/';
            
            foreach ($filesToDelete as $file) {
                // Delete original file
                if (!empty($file['original_file'])) {
                    $origPath = $uploadDir . $file['original_file'];
                    if (file_exists($origPath)) {
                        @unlink($origPath);
                    }
                }
                
                // Delete AI report
                if (!empty($file['ai_report_file'])) {
                    $aiPath = $uploadDir . 'reports/' . $file['ai_report_file'];
                    if (file_exists($aiPath)) {
                        @unlink($aiPath);
                    }
                }
                
                // Delete Plagiarism report
                if (!empty($file['plagiarism_report_file'])) {
                    $plagPath = $uploadDir . 'reports/' . $file['plagiarism_report_file'];
                    if (file_exists($plagPath)) {
                        @unlink($plagPath);
                    }
                }
                
                // Delete from database
                $delStmt = $pdo->prepare("DELETE FROM files WHERE id = ?");
                $delStmt->execute([$file['id']]);
                $deletedCount++;
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
            return;
        }
        
        Response::success([
            'message' => "Successfully cleared {$deletedCount} completed files older than 24 hours from database and disk.",
            'deleted_count' => $deletedCount
        ]);
    }

    private static function getDirSize(string $dir): int {
        $size = 0;
        if (!is_dir($dir)) return 0;
        $files = scandir($dir);
        if ($files === false) return 0;
        
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                $size += self::getDirSize($path);
            } else {
                $size += filesize($path);
            }
        }
        return $size;
    }

    private static function formatSize(int $bytes): string {
        if ($bytes <= 0) return '0 B';
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = (int)floor(log($bytes, 1024));
        return round($bytes / pow(1024, $i), 2) . ' ' . $units[$i];
    }

    /**
     * GET /api/system/settings (Public)
     */
    public static function getSystemSettings(): void {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT key_value FROM settings WHERE key_name = 'maintenance_mode'");
        $stmt->execute();
        $val = $stmt->fetchColumn();

        Response::success([
            'maintenance_mode' => ($val === '1' || $val === 'true')
        ]);
    }

    /**
     * PUT /api/admin/settings/maintenance (Admin only)
     */
    public static function updateMaintenanceMode(array $authUser): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $enabled = isset($body['enabled']) ? $body['enabled'] : null;

        if ($enabled === null) {
            Response::badRequest('enabled field is required');
        }

        $val = $enabled ? '1' : '0';

        $pdo = getDbConnection();
        $stmt = $pdo->prepare("UPDATE settings SET key_value = ? WHERE key_name = 'maintenance_mode'");
        $stmt->execute([$val]);

        Response::success([
            'message' => 'Maintenance mode updated successfully',
            'maintenance_mode' => $enabled
        ]);
    }

    /**
     * GET /api/admin/temporary-links (Admin only)
     */
    public static function getTemporaryLinks(array $authUser): void {
        $pdo = getDbConnection();
        $stmt = $pdo->query("
            SELECT tl.id, tl.token, tl.file_limit, tl.created_at,
                   (SELECT COUNT(*) FROM files WHERE temporary_link_id = tl.id) as uploaded_count
            FROM temporary_links tl
            ORDER BY tl.created_at DESC
        ");
        $links = $stmt->fetchAll();
        Response::success(['links' => $links]);
    }

    /**
     * POST /api/admin/temporary-links (Admin only)
     */
    public static function createTemporaryLink(array $authUser): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $fileLimit = isset($body['file_limit']) ? (int)$body['file_limit'] : 5;

        if ($fileLimit < 1) {
            Response::badRequest('File limit must be at least 1');
        }

        $token = bin2hex(random_bytes(16)); // 32 chars hex

        $pdo = getDbConnection();
        $stmt = $pdo->prepare("INSERT INTO temporary_links (token, file_limit) VALUES (?, ?)");
        $stmt->execute([$token, $fileLimit]);
        $id = $pdo->lastInsertId();

        Response::success([
            'message' => 'Temporary link generated successfully',
            'link' => [
                'id' => $id,
                'token' => $token,
                'file_limit' => $fileLimit,
                'uploaded_count' => 0,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ], 201);
    }

    /**
     * DELETE /api/admin/temporary-links/:token (Admin only)
     */
    public static function deleteTemporaryLink(array $authUser, string $token): void {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("DELETE FROM temporary_links WHERE token = ?");
        $stmt->execute([$token]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Link not found');
        }

        Response::success(['message' => 'Temporary link deleted successfully']);
    }
}


