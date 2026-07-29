const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Two clearly separated code paths, same database.
app.use("/bad", require("./routes/bad"));    // POST /bad/login   (vulnerable)
app.use("/good", require("./routes/good"));  // POST /good/login  (secure)

// Front page + demo pages (index.html, bad.html, good.html, style.css)
app.use(express.static(path.join(__dirname, "views")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Module 1 — SQL Injection on http://localhost:${PORT}`));
