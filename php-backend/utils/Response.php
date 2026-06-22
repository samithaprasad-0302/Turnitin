<?php

/**
 * JSON Response Helper
 * Equivalent to res.json() / res.status().json() in Express
 */

class Response {

    /**
     * Send a success response
     */
    public static function success(array $data = [], int $statusCode = 200): void {
        http_response_code($statusCode);
        echo json_encode(array_merge(['success' => true], $data));
        exit;
    }

    /**
     * Send an error response
     */
    public static function error(string $message, int $statusCode = 500, array $extra = []): void {
        http_response_code($statusCode);
        echo json_encode(array_merge([
            'success' => false,
            'message' => $message
        ], $extra));
        exit;
    }

    /**
     * Send a 400 Bad Request
     */
    public static function badRequest(string $message = 'Bad Request'): void {
        self::error($message, 400);
    }

    /**
     * Send a 401 Unauthorized
     */
    public static function unauthorized(string $message = 'Unauthorized'): void {
        self::error($message, 401);
    }

    /**
     * Send a 403 Forbidden
     */
    public static function forbidden(string $message = 'Forbidden'): void {
        self::error($message, 403);
    }

    /**
     * Send a 404 Not Found
     */
    public static function notFound(string $message = 'Not Found'): void {
        self::error($message, 404);
    }
}
