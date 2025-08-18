<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}

$to = $_POST['to'] ?? 'unknown';
$amount = $_POST['amount'] ?? 0;

echo "<h2>Transfer Complete</h2>";
echo "<p>You sent \${$amount} to {$to}</p>";
echo "<a href='index.php'>Back</a>";
