<?php
session_start();
include "db.php";

if(isset($_SESSION['user'])) {
    header("Location: welcome.php");
    exit();
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // VULNERABLE query
    $sql = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $_SESSION['user'] = $username;
        header("Location: welcome.php");
        exit();
    } else {
        $error = "Invalid login";
    }
}
?>
<html>
<head>
<link rel="stylesheet" href="style.css">
</head>
<body>
<h2>Login (Vulnerable)</h2>
<form method="post">
  <input type="text" name="username" placeholder="username" required><br>
  <input type="password" name="password" placeholder="password" required><br>
  <button type="submit">Login</button>
</form>
<?php if(isset($error)) echo "<p style='color:red;'>$error</p>"; ?>

<h2>SQL Injection Exercises</h2>
<style>
	.space {
	  margin-top: 10px;
	  margin-bottom: 10px;
	}
</style>
<ol>
  <li><b>Authentication Bypass:</b> Try logging in with:<br>
     <ul>
	<li>
      		Username: <code>' OR '1'='1</code><br>
      		Password: <code>' OR '1'='1</code>
	</li>
	<li class="space">
		Username: admin' # <br>
		Password: anything
	</li>
     </ul>
  </li>
  <li class="space"><b>Blind SQL Injection:</b> Test boolean conditions:<br>
      Username: <code>admin' AND 1=1 # </code><br>
<!--      Username: <code>admin' AND 1=2 -- </code> -->
  </li>
</ol>

</body>
</html>

