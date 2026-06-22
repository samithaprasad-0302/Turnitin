<?php

/**
 * index.php — Main Router
 * Equivalent to server.js in the Node.js/Express backend
 *
 * All requests are routed here via .htaccess mod_rewrite
 */

declare(strict_types=1);

// ─── Load Composer Autoloader ────────────────────────────────────────────────
require_once __DIR__ . '/vendor/autoload.php';

// ─── Load Environment Variables ──────────────────────────────────────────────
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// ─── Load App Files ──────────────────────────────────────────────────────────
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/Uid.php';
require_once __DIR__ . '/utils/Email.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/FileController.php';
require_once __DIR__ . '/controllers/ReportController.php';
require_once __DIR__ . '/controllers/AdminController.php';
require_once __DIR__ . '/controllers/NotificationController.php';

// ─── CORS Headers ────────────────────────────────────────────────────────────
$appUrl = $_ENV['APP_URL'] ?? 'http://localhost:3000';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Allow localhost:3000 for dev, and production APP_URL
$allowedOrigins = [$appUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'];
$allowedOrigin  = in_array($origin, $allowedOrigins) ? $origin : $appUrl;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Expose-Headers: Content-Disposition');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ─── Parse Request ───────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];

// Strip query string and get clean path
$requestUri  = $_SERVER['REQUEST_URI'];
$scriptName  = $_SERVER['SCRIPT_NAME'];
$basePath    = dirname($scriptName);
$path        = parse_url($requestUri, PHP_URL_PATH);

// Remove base path prefix if running in a subdirectory
if ($basePath !== '/' && str_starts_with($path, $basePath)) {
    $path = substr($path, strlen($basePath));
}

// Normalize path and ensure it always starts with /api
$path = '/' . trim($path, '/');
if (!str_starts_with($path, '/api')) {
    $path = '/api' . $path;
}

// ─── Health Check ────────────────────────────────────────────────────────────
if ($path === '/api/health' && $method === 'GET') {
    Response::success(['message' => 'Server is running', 'status' => 'OK']);
}

// ─── Route Matching Helper ───────────────────────────────────────────────────

/**
 * Match a route pattern against the current path.
 * Supports named segments like :id, :file_id
 *
 * @param string $pattern  e.g. '/api/files/:id/download'
 * @param string $path     e.g. '/api/files/42/download'
 * @return array|null      Named params or null if no match
 */
function matchRoute(string $pattern, string $path): ?array {
    $patternParts = explode('/', trim($pattern, '/'));
    $pathParts    = explode('/', trim($path, '/'));

    if (count($patternParts) !== count($pathParts)) {
        return null;
    }

    $params = [];
    foreach ($patternParts as $i => $part) {
        if (str_starts_with($part, ':')) {
            $params[ltrim($part, ':')] = $pathParts[$i];
        } elseif ($part !== $pathParts[$i]) {
            return null;
        }
    }

    return $params;
}

// ─── Maintenance Mode Check ──────────────────────────────────────────────────
$isMaintenance = false;
try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT key_value FROM settings WHERE key_name = 'maintenance_mode'");
    $stmt->execute();
    $val = $stmt->fetchColumn();
    $isMaintenance = ($val === '1' || $val === 'true');
} catch (Exception $e) {
    // Proceed if table doesn't exist yet
}

if ($isMaintenance) {
    $allowedRoutes = ['/api/system/settings', '/api/auth/login', '/api/health'];
    if (!in_array($path, $allowedRoutes, true)) {
        try {
            $user = authenticate();
            if (($user['role'] ?? '') !== 'admin') {
                Response::error('System is under maintenance. Please try again later.', 503);
            }
        } catch (Exception $e) {
            Response::error('System is under maintenance. Please try again later.', 503);
        }
    }
}

// GET /api/system/settings
if ($path === '/api/system/settings' && $method === 'GET') {
    AdminController::getSystemSettings();
}

// PUT /api/admin/settings/maintenance
if ($path === '/api/admin/settings/maintenance' && $method === 'PUT') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::updateMaintenanceMode($user);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// ── Auth Routes ──────────────────────────────────────────────────────────────
// POST /api/auth/register
if ($path === '/api/auth/register' && $method === 'POST') {
    AuthController::register();
}

// POST /api/auth/login
if ($path === '/api/auth/login' && $method === 'POST') {
    AuthController::login();
}

// GET /api/auth/me
if ($path === '/api/auth/me' && $method === 'GET') {
    $user = authenticate();
    AuthController::getCurrentUser($user);
}

// PUT /api/auth/profile
if ($path === '/api/auth/profile' && $method === 'PUT') {
    $user = authenticate();
    AuthController::updateProfile($user);
}

// ── File Routes ──────────────────────────────────────────────────────────────
// POST /api/files/upload  (customer)
if ($path === '/api/files/upload' && $method === 'POST') {
    $user = authenticate();
    requireRole($user, 'customer');
    FileController::upload($user);
}

// GET /api/files/pending  (checker)
if ($path === '/api/files/pending' && $method === 'GET') {
    $user = authenticate();
    requireRole($user, 'checker');
    FileController::getPendingFiles($user);
}

// GET /api/files/accepted  (checker)
if ($path === '/api/files/accepted' && $method === 'GET') {
    $user = authenticate();
    requireRole($user, 'checker');
    FileController::getAcceptedFiles($user);
}

// GET /api/files/completed  (checker — their own completed jobs)
if ($path === '/api/files/completed' && $method === 'GET') {
    $user = authenticate();
    requireRole($user, 'checker');
    FileController::getCompletedFiles($user);
}

// GET /api/files/my-files  (customer)
if ($path === '/api/files/my-files' && $method === 'GET') {
    $user = authenticate();
    requireRole($user, 'customer');
    FileController::getCustomerFiles($user);
}

// POST /api/files/:id/accept  (checker)
if ($params = matchRoute('/api/files/:id/accept', $path)) {
    if ($method === 'POST') {
        $user = authenticate();
        requireRole($user, 'checker');
        FileController::acceptFile($user, (int)$params['id']);
    }
}

// POST /api/files/:id/cancel  (customer)
if ($params = matchRoute('/api/files/:id/cancel', $path)) {
    if ($method === 'POST') {
        $user = authenticate();
        requireRole($user, 'customer');
        FileController::cancelFile($user, (int)$params['id']);
    }
}

// POST /api/files/:id/dispute  (customer)
if ($params = matchRoute('/api/files/:id/dispute', $path)) {
    if ($method === 'POST') {
        $user = authenticate();
        requireRole($user, 'customer');
        FileController::reportDispute($user, (int)$params['id']);
    }
}

// GET /api/files/:id/download  (authenticated) — must come before /:id
if ($params = matchRoute('/api/files/:id/download', $path)) {
    if ($method === 'GET') {
        $user = authenticate();
        FileController::downloadFile($user, (int)$params['id']);
    }
}

// GET /api/files/:id  (authenticated)
if ($params = matchRoute('/api/files/:id', $path)) {
    if ($method === 'GET') {
        $user = authenticate();
        FileController::getFileDetails($user, (int)$params['id']);
    }

    // DELETE /api/files/:id  (authenticated)
    if ($method === 'DELETE') {
        $user = authenticate();
        FileController::deleteFile($user, (int)$params['id']);
    }
}

// ── Report Routes ────────────────────────────────────────────────────────────
// POST /api/reports/upload  (checker)
if ($path === '/api/reports/upload' && $method === 'POST') {
    $user = authenticate();
    requireRole($user, 'checker');
    ReportController::uploadReport($user);
}

// POST /api/reports/mark-completed  (checker)
if ($path === '/api/reports/mark-completed' && $method === 'POST') {
    $user = authenticate();
    requireRole($user, 'checker');
    ReportController::markCompleted($user);
}

// POST /api/reports/comment  (authenticated) — must come before /:file_id
if ($path === '/api/reports/comment' && $method === 'POST') {
    $user = authenticate();
    ReportController::addComment($user);
}

// GET /api/reports/:file_id/download/:type  (authenticated) — ai or plagiarism
if ($params = matchRoute('/api/reports/:file_id/download/:type', $path)) {
    if ($method === 'GET') {
        $user = authenticate();
        ReportController::downloadReport($user, (int)$params['file_id'], $params['type']);
    }
}

// GET /api/reports/:file_id/comments  (authenticated)
if ($params = matchRoute('/api/reports/:file_id/comments', $path)) {
    if ($method === 'GET') {
        $user = authenticate();
        ReportController::getComments($user, (int)$params['file_id']);
    }
}

// GET /api/reports/:file_id  (authenticated)
if ($params = matchRoute('/api/reports/:file_id', $path)) {
    if ($method === 'GET') {
        $user = authenticate();
        ReportController::getReport($user, (int)$params['file_id']);
    }
}

// ── Admin Routes ─────────────────────────────────────────────────────────────
// GET /api/admin/users  (admin)
if ($path === '/api/admin/users' && $method === 'GET') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::getAllUsers($user);
}

// POST /api/admin/users  (admin)
if ($path === '/api/admin/users' && $method === 'POST') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::createUser($user);
}

// PUT /api/admin/users/status  (admin)
if ($path === '/api/admin/users/status' && $method === 'PUT') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::updateUserStatus($user);
}

// PUT /api/admin/users/settings  (admin)
if ($path === '/api/admin/users/settings' && $method === 'PUT') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::updateCustomerSettings($user);
}

// POST /api/admin/customer-payout  (admin)
if ($path === '/api/admin/customer-payout' && $method === 'POST') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::processCustomerPayout($user);
}


// GET /api/admin/stats  (admin)
if ($path === '/api/admin/stats' && $method === 'GET') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::getAdminStats($user);
}

// POST /api/admin/payout  (admin)
if ($path === '/api/admin/payout' && $method === 'POST') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::processPayout($user);
}

// GET /api/admin/storage-stats  (admin)
if ($path === '/api/admin/storage-stats' && $method === 'GET') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::getStorageStats($user);
}

// POST /api/admin/clear-completed-files  (admin)
if ($path === '/api/admin/clear-completed-files' && $method === 'POST') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::clearCompletedFiles($user);
}

// GET /api/admin/temporary-links  (admin)
if ($path === '/api/admin/temporary-links' && $method === 'GET') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::getTemporaryLinks($user);
}

// POST /api/admin/temporary-links  (admin)
if ($path === '/api/admin/temporary-links' && $method === 'POST') {
    $user = authenticate();
    requireRole($user, 'admin');
    AdminController::createTemporaryLink($user);
}

// DELETE /api/admin/temporary-links/:token  (admin)
if ($params = matchRoute('/api/admin/temporary-links/:token', $path)) {
    if ($method === 'DELETE') {
        $user = authenticate();
        requireRole($user, 'admin');
        AdminController::deleteTemporaryLink($user, $params['token']);
    }
}

// GET /api/system/temporary-links/:token  (public)
if ($params = matchRoute('/api/system/temporary-links/:token', $path)) {
    if ($method === 'GET') {
        FileController::getTemporaryLinkDetails($params['token']);
    }
}

// POST /api/system/temporary-links/:token/upload  (public)
if ($params = matchRoute('/api/system/temporary-links/:token/upload', $path)) {
    if ($method === 'POST') {
        FileController::uploadViaTemporaryLink($params['token']);
    }
}

// GET /api/system/temporary-links/:token/download/:file_id/:type  (public)
if ($params = matchRoute('/api/system/temporary-links/:token/download/:file_id/:type', $path)) {
    if ($method === 'GET') {
        FileController::downloadReportViaTemporaryLink($params['token'], (int)$params['file_id'], $params['type']);
    }
}

// GET /api/admin/customer-stats  (customer)
if ($path === '/api/admin/customer-stats' && $method === 'GET') {
    $user = authenticate();
    requireRole($user, 'customer');
    AdminController::getCustomerStats($user);
}

// GET /api/admin/checker-stats  (checker)
if ($path === '/api/admin/checker-stats' && $method === 'GET') {
    $user = authenticate();
    requireRole($user, 'checker');
    AdminController::getCheckerStats($user);
}

// ── Notification Routes ───────────────────────────────────────────────────────
// GET /api/notifications/unread-count  (authenticated) — must come before /:id/read
if ($path === '/api/notifications/unread-count' && $method === 'GET') {
    $user = authenticate();
    NotificationController::getUnreadCount($user);
}

// PUT /api/notifications/mark-all-read  (authenticated)
if ($path === '/api/notifications/mark-all-read' && $method === 'PUT') {
    $user = authenticate();
    NotificationController::markAllAsRead($user);
}

// GET /api/notifications  (authenticated)
if ($path === '/api/notifications' && $method === 'GET') {
    $user = authenticate();
    NotificationController::getNotifications($user);
}

// PUT /api/notifications/:id/read  (authenticated)
if ($params = matchRoute('/api/notifications/:id/read', $path)) {
    if ($method === 'PUT') {
        $user = authenticate();
        NotificationController::markAsRead($user, (int)$params['id']);
    }
}

// ─── 404 Fallback ────────────────────────────────────────────────────────────
Response::notFound('Route not found');
