const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

// OWASP baseline for scrypt: N=2^14 (CPU/memory cost), r=8, p=1.
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/**
 * Hashes a password with scrypt and a random salt.
 * Format: scrypt$N$r$p$<salt base64>$<hash base64> — parameters travel with the hash,
 * so they can be raised later without invalidating existing passwords.
 */
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, KEY_LENGTH, PARAMS);
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$');
};

const verifyPassword = async (password, stored) => {
  if (typeof stored !== 'string') return false;
  const [algorithm, N, r, p, salt, hash] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;

  const expected = Buffer.from(hash, 'base64');
  const actual = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return crypto.timingSafeEqual(actual, expected);
};

/** Pre-computed hash used to keep login timing constant when the e-mail does not exist. */
let dummyHash;
const getDummyHash = async () => {
  dummyHash ??= await hashPassword(crypto.randomBytes(12).toString('hex'));
  return dummyHash;
};

module.exports = { hashPassword, verifyPassword, getDummyHash };
