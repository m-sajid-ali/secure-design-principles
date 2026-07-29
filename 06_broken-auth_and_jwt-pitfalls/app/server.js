const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require("./routes/vuln"));      // L1 decode, L2 weak-secret, L3 naive/alg:none
app.use(require("./routes/hardened"));  // L4 strong+pinned+exp, L5 sender-constrained

app.use(express.static(path.join(__dirname, "views")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Module 2 — Broken Auth & JWT on http://localhost:${PORT}`));
