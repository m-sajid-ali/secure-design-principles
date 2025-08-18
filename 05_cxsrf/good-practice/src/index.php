<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}

/*
// List of allowed origins
$allowed_origins = [
    'http://localhost:80',
    'http://192.168.18.73',
//    'http://192.168.18.55:81'
];

// Check if Origin header is present and allowed
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    // Echo back the exact Origin allowed
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header("Access-Control-Allow-Credentials: true");
} else {
    // Origin not allowed — you can reject or just omit CORS headers
    http_response_code(403);
    echo json_encode(['error' => 'CORS origin not allowed']);
    exit;
}
*/


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
