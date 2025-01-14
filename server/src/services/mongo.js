const mongoose = require('mongoose');

const MONGODB_URL = process.env.MONGODB_URL;

mongoose.connection.once('open', () => {
    console.log('MongoDB is connected');
});

mongoose.connection.on('error', err => {
    console.error(err);
});

async function mongoConnect() {
    await mongoose.connect(MONGODB_URL);
}

async function mongoDisconnect() {
    await mongoose.disconnect();
}

module.exports = { mongoConnect, mongoDisconnect };