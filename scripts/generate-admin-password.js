// Script to generate bcrypt hash for admin password
// Usage: node scripts/generate-admin-password.js <password>

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  console.log('\nPassword:', password);
  console.log('Hash:', hash);
  console.log('\nSQL to update admin password:');
  console.log(`UPDATE public.admin_credentials SET password_hash = '${hash}' WHERE username = 'admin';`);
});
