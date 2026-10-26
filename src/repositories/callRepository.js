const { calls } = require('./db');

const create = (call) => {
  calls.push(call);
  return call;
};

const findById = (id) => calls.find(c => c.id === id);

const update = (id, data) => {
  const index = calls.findIndex(c => c.id === id);
  if (index === -1) return null;
  calls[index] = { ...calls[index], ...data };
  return calls[index];
};

const findHistoryFor = (userId) => {
  return calls.filter(c => c.callerId === userId || c.receiverId === userId);
};

module.exports = { create, findById, update, findHistoryFor };