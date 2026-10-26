const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { v4: uuidv4 } = require('crypto');

const register = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new Error('Nombre, email y contraseña son obligatorios');
  }

  const existing = userRepository.findByEmail(email);
  if (existing) {
    throw new Error('El email ya está registrado');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    online: false,
    createdAt: new Date()
  };

  userRepository.create(user);
  return { id: user.id, name: user.name, email: user.email };
};

const login = async ({ email, password }) => {
  const user = userRepository.findByEmail(email);
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error('Credenciales inválidas');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '4h' }
  );

  return { token, user: { id: user.id, name: user.name, email: user.email } };
};

module.exports = { register, login };