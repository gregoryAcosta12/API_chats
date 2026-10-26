const callRepository = require('../repositories/callRepository');
const userRepository = require('../repositories/userRepository');
const { v4: uuidv4 } = require('crypto');

const startCall = ({ callerId, receiverId, type = 'audio' }) => {
  if (!receiverId) {
    throw new Error('El destinatario es obligatorio');
  }

  const receiver = userRepository.findById(receiverId);
  if (!receiver) {
    throw new Error('El destinatario no existe');
  }

  if (receiverId === callerId) {
    throw new Error('No puedes llamarte a ti mismo');
  }

  if (!['audio', 'video'].includes(type)) {
    throw new Error('Tipo de llamada inválido. Solo audio o video');
  }

  const call = {
    id: uuidv4(),
    callerId,
    receiverId,
    type,
    status: 'ringing',
    startedAt: new Date(),
    endedAt: null,
    duration: 0
  };

  return callRepository.create(call);
};

const updateCall = (callId, userId, status) => {
  const call = callRepository.findById(callId);
  if (!call) {
    throw new Error('Llamada no encontrada');
  }

  if (call.callerId !== userId && call.receiverId !== userId) {
    throw new Error('No participaste en esta llamada');
  }

  const validStatuses = ['accepted', 'rejected', 'ended'];
  if (!validStatuses.includes(status)) {
    throw new Error('Estado inválido');
  }

  const data = { status };

  if (status === 'accepted') {
    data.startedAt = new Date();
  }

  if (status === 'ended' || status === 'rejected') {
    data.endedAt = new Date();
    if (call.status === 'accepted') {
      data.duration = Math.floor((data.endedAt - call.startedAt) / 1000);
    }
  }

  return callRepository.update(callId, data);
};

const getHistory = (userId) => {
  return callRepository.findHistoryFor(userId);
};

module.exports = { startCall, updateCall, getHistory };