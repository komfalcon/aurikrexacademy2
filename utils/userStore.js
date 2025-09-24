const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_PATH = path.join(__dirname, '../../data/users.json');

async function getUsers() {
  try {
    const data = await fs.readFile(USERS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users file:', err.message);
    return [];
  }
}

async function saveUsers(users) {
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));
}

// 🔑 This ensures admin stays, and new users get added instead of replacing
async function addUser(fullName, email, password, role = 'user') {
  const users = await getUsers();

  // don’t allow duplicate email
  if (users.find(u => u.email === email)) {
    throw new Error('Email already exists');
  }

  const hashed = await bcrypt.hash(password, 12);

  const newUser = {
    id: Date.now().toString(),
    fullName,
    email,
    password: hashed,
    role,
    phone: "",
    gender: "",
    dob: null,
    school: "",
    classLevel: "",
    verified: false,
    verificationCode: null,
    codeSentAt: null,
    subjects: []
  };

  users.push(newUser);
  await saveUsers(users);

  return newUser;
}

module.exports = { getUsers, saveUsers, addUser };
