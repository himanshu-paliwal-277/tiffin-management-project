require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const users = [
  {
    name: 'Himanshu',
    email: 'hpaliwal364@gmail.com',
    password: '12345678',
    role: 'owner',
  },
  {
    name: 'Chotu',
    email: 'chotu@gmail.com',
    password: '12345678',
    role: 'member',
  },
  {
    name: 'Rupesh',
    email: 'rupesh@gmail.com',
    password: '12345678',
    role: 'member',
  },
];

const seed = async () => {
  await connectDB();

  console.log('Seeding users...');

  for (const userData of users) {
    const exists = await User.findOne({ email: userData.email });
    if (exists) {
      console.log(`  [skip] ${userData.email} already exists`);
      continue;
    }
    await User.create(userData);
    console.log(`  [created] ${userData.email} (${userData.role})`);
  }

  console.log('Seed complete.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
