/* Five-level JWT console. Each page sets window.LEVELS (e.g. ['l1','l2','l3']). */

// ---------- base64url ----------
function b64urlFromBytes(b){ let s=btoa(String.fromCharCode.apply(null,b)); return s.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64urlFromString(s){ return b64urlFromBytes(new TextEncoder().encode(s)); }
function b64urlToString(b){ b=b.replace(/-/g,'+').replace(/_/g,'/'); return decodeURIComponent(escape(atob(b))); }

// ---------- level config ----------
const CONFIG = {
  l1: { badge:'bad', title:'decode() — no verification',
        desc:'Reads the token without checking it. Tampering alone wins — no secret needed.',
        loginPath:'/vuln/login', callPath:'/l1/account', attacks:['tamperRole','tamperSub'] },
  l2: { badge:'bad', title:'verify() with a weak, hardcoded secret (no expiry)',
        desc:'The signature IS checked, so plain tampering fails. But the secret is literally "secret", so a forged, validly-signed admin token still wins — and the token never expires.',
        loginPath:'/vuln/login', callPath:'/l2/account', attacks:['tamperRole','forgeSigned'] },
  l3: { badge:'bad', title:'naive / legacy verifier (trusts the alg header)',
        desc:'Mimics old libraries and hand-rolled checks that honour alg:none. Modern jsonwebtoken rejects this by default — which is exactly why you pin algorithms and use a maintained library.',
        loginPath:'/vuln/login', callPath:'/l3/account', attacks:['tamperRole','forgeNone'] },
  l4: { badge:'good', title:'verify() + strong env secret + pinned alg + expiry',
        desc:'The integrity fixes. Every forgery is rejected, and expired tokens are refused.',
        loginPath:'/hardened/login', callPath:'/l4/account', attacks:['tamperRole','forgeSigned','forgeNone','expired'] },
  l5: { badge:'good', title:'sender-constrained (proof-of-possession)',
        desc:'Even a stolen, perfectly valid token fails elsewhere: every request needs a fresh proof signed by a private key that never leaves this browser.',
        loginPath:'/l5/login', callPath:'/l5/account', dpop:true, attacks:['stolenNoProof'] },
};

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const el = (lid, part) => $(lid + '-' + part);
const creds = (lid) => ({ username: el(lid,'user').value, password: el(lid,'pass').value });
const getTok = (lid) => el(lid,'token').value.trim();
function setTok(lid, t){ el(lid,'token').value = t; decode(lid, t); }
function decode(lid, t){
  try { const [h,p] = t.split('.');
    el(lid,'decoded').innerHTML = '<b>header</b> '+b64urlToString(h)+'<br><b>payload</b> '+b64urlToString(p);
  } catch(e){ el(lid,'decoded').textContent = '(cannot decode token)'; }
}

// ---------- login ----------
async function login(lid){
  if (CONFIG[lid].dpop) return l5Login(lid);
  const r = await fetch(CONFIG[lid].loginPath, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(creds(lid))});
  const d = await r.json(); if (d.token) setTok(lid, d.token); else alert(d.message || 'login failed');
}
async function loginExpired(lid){
  const r = await fetch(CONFIG[lid].loginPath, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...creds(lid), expired:true})});
  const d = await r.json(); if (d.token) setTok(lid, d.token);
}

// ---------- attacks (operate on the level's token box) ----------
function tamper(lid, changes){
  const parts = getTok(lid).split('.');
  if (parts.length < 2) return alert('Log in first to get a token.');
  const payload = JSON.parse(b64urlToString(parts[1]));
  Object.assign(payload, changes);
  parts[1] = b64urlFromString(JSON.stringify(payload));
  setTok(lid, parts.join('.'));
}
function forgeNone(lid){
  setTok(lid, b64urlFromString(JSON.stringify({alg:'none',typ:'JWT'})) + '.' +
    b64urlFromString(JSON.stringify({sub:1,username:'attacker',role:'admin'})) + '.');
}
// Precomputed: {sub:1,username:'attacker',role:'admin'} signed HS256 with the weak secret
// "secret". Deterministic, so no browser crypto is needed — this works over http/IP too,
// representing a token the attacker forged offline once the weak secret was cracked.
function forgeSigned(lid){
  setTok(lid, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYXR0YWNrZXIiLCJyb2xlIjoiYWRtaW4ifQ.DwYfo2SgaiXYJvgC4fyODBUd15Sb_Bgrh9K2p4_Mp7A');
}

// ---------- L5 sender-constrained (DPoP-style) ----------
const L5STATE = {};
async function l5Login(lid){
  if (!window.crypto || !crypto.subtle){
    alert('Level 5 needs Web Crypto, which browsers only expose in a secure context. Open the app at http://localhost:3000 (not a machine IP) or serve it over HTTPS.');
    return;
  }
  const kp = await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'}, true, ['sign','verify']);
  const full = await crypto.subtle.exportKey('jwk', kp.publicKey);
  const jwk = { crv:full.crv, kty:full.kty, x:full.x, y:full.y };
  L5STATE[lid] = { priv: kp.privateKey, jwk };
  const r = await fetch('/l5/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...creds(lid), jwk})});
  const d = await r.json(); if (d.token) setTok(lid, d.token); else alert(d.message || 'login failed');
}
async function l5Proof(lid){
  const st = L5STATE[lid]; if (!st) throw new Error('log in first');
  const header = { typ:'dpop+jwt', alg:'ES256', jwk: st.jwk };
  const now = Math.floor(Date.now()/1000);
  const payload = { htm:'GET', htu:'/l5/account', iat:now, exp:now+60, jti: (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())) };
  const input = b64urlFromString(JSON.stringify(header)) + '.' + b64urlFromString(JSON.stringify(payload));
  const sig = new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'}, st.priv, new TextEncoder().encode(input)));
  return input + '.' + b64urlFromBytes(sig);
}

// ---------- call the protected endpoint ----------
async function callAccount(lid, opts){
  opts = opts || {};
  const cfg = CONFIG[lid];
  const headers = { Authorization: 'Bearer ' + getTok(lid) };
  if (cfg.dpop && !opts.noProof) headers['DPoP'] = await l5Proof(lid);
  const r = await fetch(cfg.callPath, { headers });
  render(lid, await r.json());
}

// ---------- render result ----------
function render(lid, d){
  const v = el(lid,'verdict'), f = el(lid,'facts'), raw = el(lid,'raw');
  v.style.display = ''; raw.textContent = JSON.stringify(d, null, 2);
  if (!d.ok){
    v.className = 'verdict safe';
    v.textContent = '🔒 Rejected' + (d.reason ? ' — ' + d.reason : '') + (d.message ? ' (' + d.message + ')' : '');
    f.innerHTML = ''; return;
  }
  const facts = [];
  facts.push('<span class="k">signature verified:</span> ' + (d.verified ? '✅ true' : '❌ false — token trusted as-is'));
  if (d.senderConstrained) facts.push('<span class="k">sender-constrained:</span> ✅ proof matched the bound key');
  if (d.identity) facts.push('<span class="k">token says:</span> sub=' + d.identity.sub + ', role=' + d.identity.role);
  if (d.account) facts.push('<span class="k">account returned:</span> ' + d.account.username + ' — “' + d.account.secret_note + '”');
  if (d.adminPanel) facts.push('<span class="k">admin panel:</span> ' + d.adminPanel.length + ' users exposed (' + d.adminPanel.map(u=>u.username).join(', ') + ')');
  f.innerHTML = facts.map(x => '<div class="facts">' + x + '</div>').join('');
  const escalated = d.adminPanel || d.verified === false;
  v.className = 'verdict ' + (escalated ? 'win' : 'safe');
  v.textContent = escalated ? '🔓 Server trusted the token — data exposed'
                : (d.senderConstrained ? '✅ Authenticated (sender-constrained)' : '200 OK');
}

// ---------- attack button registry ----------
const ATTACKS = {
  tamperRole:   { label:"Tamper → role: admin",            fn:(lid)=>tamper(lid,{role:'admin'}) },
  tamperSub:    { label:"Tamper → sub: 2 (become Bob)",    fn:(lid)=>tamper(lid,{sub:2}) },
  forgeSigned:  { label:"Forge signed with 'secret'",      fn:(lid)=>forgeSigned(lid) },
  forgeNone:    { label:"Forge alg:none admin",            fn:(lid)=>forgeNone(lid) },
  expired:      { label:"Mint expired token",              fn:(lid)=>loginExpired(lid), plain:true },
  stolenNoProof:{ label:"Simulate stolen token (no proof)",fn:(lid)=>callAccount(lid,{noProof:true}) },
};

// ---------- render cards ----------
function card(lid){
  const cfg = CONFIG[lid];
  const badge = lid.toUpperCase() + ' ' + (cfg.badge==='bad' ? '❌' : '✅');
  const attacks = cfg.attacks.map(a =>
    `<button class="ghost ${ATTACKS[a].plain?'':'attack'}" onclick="ATTACKS['${a}'].fn('${lid}')">${ATTACKS[a].label}</button>`).join('');
  const callLabel = cfg.dpop ? "Legit request (with proof) →" : "GET " + cfg.callPath + " →";
  return `
  <div class="level">
    <div class="level-head"><span class="tag ${cfg.badge}">${badge}</span><h2>${cfg.title}</h2></div>
    <p class="desc">${cfg.desc}</p>
    <div class="row">
      <div><label>Username</label><input id="${lid}-user" value="alice"></div>
      <div><label>Password</label><input id="${lid}-pass" value="S3cret-Alice!"></div>
    </div>
    <button onclick="login('${lid}')">${cfg.dpop ? 'Log in (generate key)' : 'Log in'}</button>
    <label class="mt">Token</label>
    <textarea id="${lid}-token" placeholder="log in first, or forge one"></textarea>
    <div id="${lid}-decoded" class="decoded"></div>
    <div>${attacks}</div>
    <div><button onclick="callAccount('${lid}')">${callLabel}</button></div>
    <div id="${lid}-verdict" class="verdict" style="display:none"></div>
    <div id="${lid}-facts"></div>
    <pre id="${lid}-raw"></pre>
  </div>`;
}

document.getElementById('levels').innerHTML = (window.LEVELS || []).map(card).join('');