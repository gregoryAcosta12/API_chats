const { users } = require('./db');

const findByEmail = (email) => users.find(u => u.email === email);

const findById = (id) => users.find(u => u.id === id);

const create = (user) => {
  users.push(user);
  return user;
};

const findAllExcept = (id) => users.filter(u => u.id !== id);

module.exports = { findByEmail, findById, create, findAllExcept };