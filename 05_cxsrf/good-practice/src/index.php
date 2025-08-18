<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}

// CSRF token generation
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrf = $_SESSION['csrf_token'];
?>

<h2>Welcome, <?= $_SESSION['user'] ?>!</h2>
<a href="logout.php">Logout</a>

<form method="POST" action="transfer.php">
    <h3>Transfer Money (CSRF Protected)</h3>
    <input type="text" name="to" placeholder="To (username)" required>
    <input type="number" name="amount" placeholder="Amount" required>
    <input type="hidden" name="csrf_token" value="<?= $csrf ?>">
    <button type="submit">Transfer</button>
</form>
