const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const b64uToObj = (seg) => JSON.parse(Buffer.from(seg, "base64url").toString());

// L3: naive/legacy verifier — trusts the header's `alg`, accepts alg:none.
// This mimics old libraries / hand-rolled checks. Modern jsonwebtoken rejects
// alg:none by default; that is exactly why pinning + a maintained lib matter.
function naiveVerify(token, secret) {
  const [h, p, s] = token.split(".");
  const header = b64uToObj(h);
  const payload = b64uToObj(p);
  if (header.alg === "none") return payload;                 // <-- the bug
  if (header.alg === "HS256") {
    const expected = crypto.createHmac("sha256", secret).update(h + "." + p).digest("base64url");
    const eb = Buffer.from(expected), sb = Buffer.from(s || "");
    if (eb.length === sb.length && crypto.timingSafeEqual(eb, sb)) return payload;
    throw new Error("bad signature");
  }
  throw new Error("unsupported alg");
}

// RFC 7638 JWK thumbprint (EC): members crv,kty,x,y in lexicographic order.
function ecThumbprint(jwk) {
  const canon = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
  return crypto.createHash("sha256").update(canon).digest("base64url");
}

// Verify a DPoP-style sender proof; returns the thumbprint of the proof's key.
function verifyProof(proof, method, path) {
  const header = b64uToObj(proof.split(".")[0]);
  if (header.typ !== "dpop+jwt" || header.alg !== "ES256" || !header.jwk) throw new Error("malformed proof");
  const pub = crypto.createPublicKey({ key: header.jwk, format: "jwk" });
  const claims = jwt.verify(proof, pub, { algorithms: ["ES256"] }); // checks signature + exp
  if (claims.htm !== method) throw new Error("proof method mismatch");
  if (claims.htu !== path) throw new Error("proof path mismatch");
  return { jkt: ecThumbprint(header.jwk), jti: claims.jti };
}

module.exports = { b64uToObj, naiveVerify, ecThumbprint, verifyProof };
