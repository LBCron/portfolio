import { hashPassword } from '../src/lib/auth/password';

const password = process.argv[2];

if (!password || password.length < 16) {
  console.error('Usage: bun run admin:hash "<password of 16+ characters>"');
  process.exit(1);
}

console.log(await hashPassword(password));
