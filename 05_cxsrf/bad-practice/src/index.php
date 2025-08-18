<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}
?>

<h2>Welcome, <?= $_SESSION['user'] ?>!</h2>
<a href="logout.php">Logout</a>

<form method="POST" action="transfer.php">
    <h3>Transfer Money</h3>
    <input type="text" name="to" placeholder="To (username)" required>
    <input type="number" name="amount" placeholder="Amount" required>
    <button type="submit">Transfer</button>
</form>
