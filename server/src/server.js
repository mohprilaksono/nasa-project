const http = require('http');

require('dotenv').config();

const app = require('./app');

const { mongoConnect } = require('./services/mongo');
const { getPlanetsData } = require('./models/planets.model');
const { loadLaunchesData } = require('./models/launches.model');

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

(async () => {
    await mongoConnect();
    await getPlanetsData();
    await loadLaunchesData();

    server.listen(PORT, () => {
        console.log(`server is listening on port ${PORT}`);
    });
})()