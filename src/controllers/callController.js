const callService = require('../services/callService');

const start = (req, res) => {
  try {
    const call = callService.startCall({
      callerId: req.user.id,
      receiverId: req.body.receiverId,
      type: req.body.type
    });
    res.status(201).json(call);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const update = (req, res) => {
  try {
    const call = callService.updateCall(
      req.params.id,
      req.user.id,
      req.body.status
    );
    res.json(call);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const history = (req, res) => {
  const calls = callService.getHistory(req.user.id);
  res.json(calls);
};

module.exports = { start, update, history };