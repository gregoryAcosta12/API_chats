const express = require('express');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const callRoutes = require('./routes/callRoutes');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/calls', callRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;