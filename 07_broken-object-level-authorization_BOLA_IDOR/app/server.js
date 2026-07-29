const express = require("express");
const path = require("path");
const { login } = require("./auth");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/login", login);              // auth done right (verified JWT)
app.use(require("./routes/bad"));       // BOLA present
app.use(require("./routes/good"));      // BOLA fixed

app.use(express.static(path.join(__dirname, "views")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Module 3 — BOLA/IDOR on http://localhost:${PORT}`));
