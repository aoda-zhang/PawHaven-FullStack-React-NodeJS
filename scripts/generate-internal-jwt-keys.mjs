import { generateKeyPairSync } from 'node:crypto';

// Generates a SINGLE shared ES256 (P-256) keypair used by all internal services.
//
// - The PRIVATE key signs internal JWTs (set INTERNAL_JWT_PRIVATE_KEY on the
//   signers: gateway + core-service).
// - The PUBLIC key verifies them (set INTERNAL_JWT_PUBLIC_KEY on the verifiers:
//   auth-service + core-service + document-service).
//
// Every service's env/index.json uses keyId "internal-v1" and reads the SINGULAR
// env vars "${INTERNAL_JWT_PRIVATE_KEY}" / "${INTERNAL_JWT_PUBLIC_KEY}", so all
// services must share ONE keypair. Generating per-service keys would break
// cross-service signature verification (gateway signs with pair A, a verifier
// checks against pair B).
//
// Output is base64-encoded PEM. decodePem() in backend-core accepts both raw and
// base64 PEM, but base64 avoids newline issues when the value is substituted into
// the JSON config.

const toBase64Pem = (pem) => Buffer.from(pem, 'utf8').toString('base64');

const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log(`INTERNAL_JWT_PRIVATE_KEY=${toBase64Pem(privateKey)}`);
console.log(`INTERNAL_JWT_PUBLIC_KEY=${toBase64Pem(publicKey)}`);
