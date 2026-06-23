<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

/**
 * Auth Middleware
 * Equivalent to authMiddleware + roleMiddleware in Node.js
 */

/**
 * Verify JWT token and return decoded user data.
 * Equivalent to authMiddleware in middleware/auth.js
 *
 * @return array  The decoded user payload (id, email, role, name)
 */
function authenticate(): array {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = '';

    if (!empty($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
        $token = trim(substr($authHeader, 7));
    } elseif (!empty($_GET['token'])) {
        $token = trim($_GET['token']);
    }

    if (empty($token)) {
        Response::unauthorized('No token provided');
    }

    try {
        $secret = $_ENV['JWT_SECRET'] ?? 'secret';
        $decoded = JWT::decode($token, new Key($secret, 'HS256'));
        return (array) $decoded;
    } catch (ExpiredException $e) {
        Response::unauthorized('Token has expired');
    } catch (SignatureInvalidException $e) {
        Response::unauthorized('Invalid token signature');
    } catch (Exception $e) {
        Response::unauthorized('Invalid token');
    }

    return []; // Never reached
}

/**
 * Check that the authenticated user has one of the required roles.
 * Equivalent to roleMiddleware(...roles) in middleware/auth.js
 *
 * @param array  $user   The decoded user from authenticate()
 * @param string ...$roles  Allowed roles
 */
function requireRole(array $user, string ...$roles): void {
    if (!in_array($user['role'] ?? '', $roles, true)) {
        Response::forbidden('Forbidden: Insufficient permissions');
    }
}
