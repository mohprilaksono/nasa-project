const axios = require('axios');

const launchDatabase = require('./launches.mongo');
const planetDatabase = require('./planets.mongo');

const DEFAULT_LATEST_FLIGHT_NUMBER = 100;
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    console.log('Downloading launches data');
    
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name: 1,
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    });

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap(payload => {
            return payload['customers'];
        });

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers,
        };

        await saveLaunch(launch);
    }
}

async function loadLaunchesData() {
    const isLaunchDataExists = await findLaunch({
        flightNumber: 1,
        mission: "FalconSat",
        rocket: "Falcon 1",
    });

    if (isLaunchDataExists) {
        console.log('launch data already exists');
    } else {
        await populateLaunches();
    }
}

async function getAllLaunches(skip, limit) {
    return await launchDatabase.find({}, { 
        '_id': 0,
        '__v': 0,
    }).sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
    await launchDatabase.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, launch, 
    {
        upsert: true,    
    });
}

async function getLatestFlightNumber() {
    const launch = await launchDatabase.findOne().sort('-flightNumber');

    if (! launch) {
        return DEFAULT_LATEST_FLIGHT_NUMBER;
    }

    return launch.flightNumber;
}

async function scheduleNewLaunch(launch) {
    const planet = await planetDatabase.findOne({
        keplerName: launch.target,
    });

    if (! planet) {
        throw new Error('No matching planet found');
    }

    const latestFlightNumber = await getLatestFlightNumber() + 1;

    const newLaunch = Object.assign(launch, {
            flightNumber: latestFlightNumber,
            success: true,
            upcoming: true,
            customer: ['Zero to Mastery', 'NASA'],
        });

    await saveLaunch(newLaunch);
}

async function findLaunch(filter) {
    return await launchDatabase.findOne(filter);
}

async function isLaunchExists(launchId) {
    return await findLaunch({
        flightNumber: launchId
    });
}


async function deleteLaunchById(launchId) {
   const aborted = await launchDatabase.updateOne({
       flightNumber: launchId
   }, {
       upcoming: false,
       success: false,
   });

   return aborted.modifiedCount === 1;
}

module.exports = {
    loadLaunchesData,
    getAllLaunches,
    scheduleNewLaunch,
    isLaunchExists,
    deleteLaunchById,
};