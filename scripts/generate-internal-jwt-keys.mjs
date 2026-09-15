import { generateKeyPairSync } from 'node:crypto';

const SERVICES = ['AUTH', 'CORE', 'DOCUMENT'];

const toBase64Pem = (pem) => Buffer.from(pem, 'utf8').toString('base64');

for (const service of SERVICES) {
  const { privateKey, publicKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  console.log(`INTERNAL_JWT_PRIVATE_KEY_${service}=${toBase64Pem(privateKey)}`);
  console.log(`INTERNAL_JWT_PUBLIC_KEY_${service}=${toBase64Pem(publicKey)}`);
}
