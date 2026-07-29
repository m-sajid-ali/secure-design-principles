// window.TARGET is "bad" or "good" (set per page).
const $ = (id) => document.getElementById(id);
let TOKEN = null, ME = null;

async function login() {
  const r = await fetch("/login", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: $("username").value, password: $("password").value }) });
  const d = await r.json();
  if (!d.ok) return alert(d.message || "login failed");
  TOKEN = d.token; ME = d.user;
  $("who").innerHTML = "You are logged in as <b>" + ME.username + "</b> (user id " + ME.id + ").";
  loadMyOrders();
}

function authHeaders() { return { Authorization: "Bearer " + TOKEN }; }

async function loadMyOrders() {
  const r = await fetch("/" + TARGET + "/orders", { headers: authHeaders() });
  const d = await r.json();
  if (!d.ok) return;
  $("myorders").innerHTML = "<div class='who'>Your orders:</div><ul class='orders'>" +
    d.orders.map(o => "<li>#" + o.id + " — " + o.item + " ($" + o.amount + ") — " + o.status + "</li>").join("") + "</ul>";
}

async function getOrder(id) {
  if (!TOKEN) return alert("Log in first.");
  const oid = id || $("oid").value;
  const r = await fetch("/" + TARGET + "/orders/" + oid, { headers: authHeaders() });
  render(await r.json(), "read");
}

async function cancelOrder() {
  if (!TOKEN) return alert("Log in first.");
  const oid = $("oid").value;
  const r = await fetch("/" + TARGET + "/orders/" + oid + "/cancel", { method: "POST", headers: authHeaders() });
  render(await r.json(), "cancel");
}

function render(d, kind) {
  const v = $("verdict"), f = $("facts"), raw = $("raw");
  v.style.display = ""; raw.textContent = JSON.stringify(d, null, 2);

  if (!d.ok) {
    v.className = "verdict safe";
    v.textContent = "🔒 Blocked — " + (d.message || "not allowed") + " (this order isn't yours)";
    f.innerHTML = ""; return;
  }

  if (kind === "cancel") {
    // On the vulnerable side a cancel on someone else's order succeeds.
    v.className = "verdict win";
    v.textContent = "🔓 BOLA — you cancelled order #" + d.id + " (write access to an object you may not own)";
    f.innerHTML = ""; return;
  }

  // read
  const o = d.order;
  const mine = o.owner_id === ME.id;
  const facts = [
    "<div class='facts'><span class='k'>order:</span> #" + o.id + " — " + o.item + " ($" + o.amount + ")</div>",
    "<div class='facts'><span class='k'>owner:</span> " + o.owner_username + (mine ? " (you)" : "") + "</div>",
    "<div class='facts'><span class='k'>ship to:</span> " + o.ship_address + "</div>",
    "<div class='facts'><span class='k'>card:</span> **** " + o.card_last4 + "</div>",
  ];
  f.innerHTML = facts.join("");
  if (mine) { v.className = "verdict safe"; v.textContent = "200 — your own order"; }
  else { v.className = "verdict win"; v.textContent = "🔓 BOLA — you read " + o.owner_username + "'s order (address + card leaked)"; }
}
