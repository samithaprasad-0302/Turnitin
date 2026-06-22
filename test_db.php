<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Database Connection Test</h2>";

// Load environment variables
$envPath = __DIR__ . '/api/.env';
if (!file_exists($envPath)) {
    echo "❌ Error: .env file not found at: " . htmlspecialchars($envPath) . "<br>";
    exit;
}

echo "✓ Found .env file.<br>";

// Parse .env manually for this test
$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$env = [];
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    list($name, $value) = explode('=', $line, 2);
    $env[trim($name)] = trim($value, " \t\n\r\0\x0B\"'");
}

$host = $env['DB_HOST'] ?? 'localhost';
$port = $env['DB_PORT'] ?? '3306';
$dbname = $env['DB_NAME'] ?? '';
$user = $env['DB_USER'] ?? '';
$password = $env['DB_PASSWORD'] ?? '';

echo "Attempting to connect with:<br>";
echo "- Host: <strong>" . htmlspecialchars($host) . "</strong><br>";
echo "- Database: <strong>" . htmlspecialchars($dbname) . "</strong><br>";
echo "- User: <strong>" . htmlspecialchars($user) . "</strong><br>";

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    $pdo = new PDO($dsn, $user, $password, $options);
    echo "<br>🟢 <strong>SUCCESS: Connected to database successfully!</strong>";
} catch (PDOException $e) {
    echo "<br>❌ <strong>CONNECTION FAILED:</strong><br>";
    echo "<pre style='background:#fee; padding:15px; border:1px solid #fcc; color:#900;'>" . htmlspecialchars($e->getMessage()) . "</pre>";
    echo "<p>💡 <em>Tip: Double-check your Host, Username, Password, and Database Name in your api/.env file. Also verify that you entered the correct host address (Hostinger databases sometimes use a remote host address shown in your database info panel instead of 'localhost').</em></p>";
}
