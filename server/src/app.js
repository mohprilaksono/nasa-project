const path = require('path');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

const api = require('./routes/api');

// Middleware
app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')))

// Routes
app.use('/v1', api);
app.get('/*', (_, res) => { 
    return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;