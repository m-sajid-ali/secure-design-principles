<?php
$host = getenv("DB_HOST") ?: "db";
$db   = getenv("MYSQL_DATABASE") ?: "sql_injection";
$user = getenv("MYSQL_USER") ?: 'app_user';
$pass = getenv("MYSQL_PASSWORD") ?: 'app_user';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
