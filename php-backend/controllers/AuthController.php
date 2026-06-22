<?php

use Firebase\JWT\JWT;

/**
 * AuthController
 * Equivalent to backend/src/controllers/authController.js
 */

class AuthController {

    /**
     * Generate JWT token for a user
     */
    private static function generateToken(array $user): string {
        $secret  = $_ENV['JWT_SECRET'] ?? 'secret';
        $expire  = (int)($_ENV['JWT_EXPIRE'] ?? 604800); // 7 days default

        $payload = [
            'id'    => $user['id'],
            'email' => $user['email'],
            'role'  => $user['role'],
            'name'  => $user['name'],
            'iat'   => time(),
            'exp'   => time() + $expire,
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    /**
     * POST /api/auth/register
     */
    public static function register(): void {
        Response::error('Self-registration is currently disabled.', 403);
    }

    /**
     * POST /api/auth/login
     */
    public static function login(): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (empty($email) || empty($password)) {
            Response::badRequest('Email and password are required');
        }

        $pdo  = getDbConnection();
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Invalid credentials', 401);
        }

        // Verify password (compatible with bcryptjs hashes from Node.js)
        if (!password_verify($password, $user['password'])) {
            Response::error('Invalid credentials', 401);
        }

        if ($user['status'] === 'suspended') {
            Response::error('Account suspended', 403);
        }

        // Check maintenance mode
        try {
            $stmtMaint = $pdo->prepare("SELECT key_value FROM settings WHERE key_name = 'maintenance_mode'");
            $stmtMaint->execute();
            $valMaint = $stmtMaint->fetchColumn();
            $isMaint = ($valMaint === '1' || $valMaint === 'true');
            if ($isMaint && $user['role'] !== 'admin') {
                Response::error('System is under maintenance. Please try again later.', 503);
            }
        } catch (Exception $e) {
            // Proceed if settings query fails
        }

        $token = self::generateToken($user);

        Response::success([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => [
                'id'    => $user['id'],
                'uid'   => $user['uid'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role'],
            ],
        ]);
    }

    /**
     * GET /api/auth/me
     */
    public static function getCurrentUser(array $authUser): void {
        $pdo  = getDbConnection();
        $stmt = $pdo->prepare(
            'SELECT id, uid, name, email, role, status, phone, company, created_at FROM users WHERE id = ?'
        );
        $stmt->execute([$authUser['id']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::notFound('User not found');
        }

        Response::success(['user' => $user]);
    }

    /**
     * PUT /api/auth/profile
     */
    public static function updateProfile(array $authUser): void {
        $body    = json_decode(file_get_contents('php://input'), true) ?? [];
        $name    = $body['name'] ?? $authUser['name'];
        $phone   = $body['phone'] ?? null;
        $company = $body['company'] ?? null;

        $pdo  = getDbConnection();
        $stmt = $pdo->prepare(
            'UPDATE users SET name = ?, phone = ?, company = ? WHERE id = ?'
        );
        $stmt->execute([$name, $phone, $company, $authUser['id']]);

        Response::success(['message' => 'Profile updated successfully']);
    }
}
