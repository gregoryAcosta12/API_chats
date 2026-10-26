const chatService = require('../services/chatService');

const listContacts = (req, res) => {
  const contacts = chatService.listContacts(req.user.id);
  res.json(contacts);
};

const sendMessage = (req, res) => {
  try {
    const message = chatService.sendMessage({
      senderId: req.user.id,
      receiverId: req.body.receiverId,
      content: req.body.content,
      type: req.body.type
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getConversation = (req, res) => {
  try {
    const messages = chatService.getConversation(req.user.id, req.params.userId);
    res.json(messages);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getUnread = (req, res) => {
  const unread = chatService.getUnread(req.user.id);
  res.json(unread);
};

module.exports = { listContacts, sendMessage, getConversation, getUnread };