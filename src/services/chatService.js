const messageRepository = require('../repositories/messageRepository');
const userRepository = require('../repositories/userRepository');
const { v4: uuidv4 } = require('crypto');

const listContacts = (userId) => {
  return userRepository.findAllExcept(userId).map(u => ({
    id: u.id,
    name: u.name,
    online: u.online
  }));
};

const sendMessage = ({ senderId, receiverId, content, type = 'text' }) => {
  if (!receiverId || !content) {
    throw new Error('Destinatario y contenido son obligatorios');
  }

  const receiver = userRepository.findById(receiverId);
  if (!receiver) {
    throw new Error('El destinatario no existe');
  }

  if (receiverId === senderId) {
    throw new Error('No puedes enviarte mensajes a ti mismo');
  }

  if (!['text', 'image'].includes(type)) {
    throw new Error('Tipo de mensaje inválido. Solo text o image');
  }

  const message = {
    id: uuidv4(),
    senderId,
    receiverId,
    content,
    type,
    read: false,
    createdAt: new Date()
  };

  return messageRepository.create(message);
};

const getConversation = (userId, otherUserId) => {
  const other = userRepository.findById(otherUserId);
  if (!other) {
    throw new Error('El usuario no existe');
  }

  messageRepository.markAsRead(otherUserId, userId);

  return messageRepository.findByConversation(userId, otherUserId);
};

const getUnread = (userId) => {
  return messageRepository.findUnreadFor(userId);
};

module.exports = { listContacts, sendMessage, getConversation, getUnread };