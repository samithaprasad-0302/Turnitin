<?php

class Uid {
    /**
     * Generate a secure, unique, human-readable identifier.
     * Format: PREFIX-XXXXXX (where XXXXXX is 6 random uppercase hex characters)
     */
    public static function generate(string $prefix, PDO $pdo, string $table, string $column = 'uid'): string {
        do {
            $randomHex = strtoupper(bin2hex(random_bytes(3))); // 6 character hex
            $uid = $prefix . '-' . $randomHex;
            $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE {$column} = ?");
            $stmt->execute([$uid]);
        } while ($stmt->fetch());
        return $uid;
    }
}
