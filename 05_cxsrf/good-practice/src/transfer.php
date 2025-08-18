<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}

if ($_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    echo "<h2>CSRF Detected!</h2>";
    exit;
}

$to = $_POST['to'] ?? 'unknown';
$amount = $_POST['amount'] ?? 0;

echo "<h2>Transfer Complete</h2>";
echo "<p>You sent \${$amount} to {$to}</p>";
echo "<a href='index.php'>Back</a>";
