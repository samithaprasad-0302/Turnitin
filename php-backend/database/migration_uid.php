<?php
require_once __DIR__ . '/../vendor/autoload.php';
Dotenv\Dotenv::createImmutable(__DIR__ . '/..')->load();
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Uid.php';

try {
    $pdo = getDbConnection();
    
    echo "Running migration: adding uid columns...\n";
    
    // Add columns if they do not exist
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN uid VARCHAR(20) NULL AFTER id");
        echo "✓ uid column added to users table\n";
    } catch (PDOException $e) {
        if (str_contains($e->getMessage(), 'Duplicate column')) {
            echo "✓ uid column already exists in users table\n";
        } else {
            throw $e;
        }
    }
    
    try {
        $pdo->exec("ALTER TABLE files ADD COLUMN uid VARCHAR(20) NULL AFTER id");
        echo "✓ uid column added to files table\n";
    } catch (PDOException $e) {
        if (str_contains($e->getMessage(), 'Duplicate column')) {
            echo "✓ uid column already exists in files table\n";
        } else {
            throw $e;
        }
    }
    
    echo "Generating unique IDs for existing rows...\n";
    
    // Backfill users
    $users = $pdo->query("SELECT id FROM users WHERE uid IS NULL")->fetchAll();
    foreach ($users as $u) {
        $uid = Uid::generate('USR', $pdo, 'users');
        $pdo->prepare("UPDATE users SET uid = ? WHERE id = ?")->execute([$uid, $u['id']]);
        echo "Assigned UID {$uid} to user ID {$u['id']}\n";
    }
    
    // Backfill files
    $files = $pdo->query("SELECT id FROM files WHERE uid IS NULL")->fetchAll();
    foreach ($files as $f) {
        $uid = Uid::generate('DOC', $pdo, 'files');
        $pdo->prepare("UPDATE files SET uid = ? WHERE id = ?")->execute([$uid, $f['id']]);
        echo "Assigned UID {$uid} to file ID {$f['id']}\n";
    }
    
    echo "Backfill completed. Modifying columns to NOT NULL and UNIQUE...\n";
    
    $pdo->exec("ALTER TABLE users MODIFY COLUMN uid VARCHAR(20) NOT NULL UNIQUE");
    $pdo->exec("ALTER TABLE files MODIFY COLUMN uid VARCHAR(20) NOT NULL UNIQUE");
    
    echo "✓ Constraints applied successfully!\n";
    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
