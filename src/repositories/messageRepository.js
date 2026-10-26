const { messages } = require('./db');

const create = (message) => {
  messages.push(message);
  return message;
};

const findByConversation = (userA, userB) => {
  return messages.filter(m =>
    (m.senderId === userA && m.receiverId === userB) ||
    (m.senderId === userB && m.receiverId === userA)
  );
};

const findUnreadFor = (receiverId) => {
  return messages.filter(m => m.receiverId === receiverId && !m.read);
};

const markAsRead = (senderId, receiverId) => {
  messages.forEach(m => {
    if (m.senderId === senderId && m.receiverId === receiverId) {
      m.read = true;
    }
  });
};

module.exports = { create, findByConversation, findUnreadFor, markAsRead };