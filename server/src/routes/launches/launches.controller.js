const { 
    getAllLaunches, 
    scheduleNewLaunch, 
    isLaunchExists, 
    deleteLaunchById 
} = require('../../models/launches.model');
const { getPagination } = require('../../services/query');

async function httpGetAllLaunches(req, res) {
    try {
        const { skip, limit } = await getPagination(req.query)
        const launches = await getAllLaunches(skip, limit);

        return res.status(200).json(launches);
    } catch (error) {
        return res.status(400).json({ error });
    }
}

async function httpAddNewLaunch(req, res) {
    try {
        const launch = await new Promise((resolve, reject) => {
            const launch = req.body;
            
            if (
                ! launch.mission || 
                ! launch.launchDate ||
                ! launch.rocket ||
                ! launch.target
            ) {
                return reject('Missing required launch data');
            }

            launch.launchDate = new Date(launch.launchDate);

            if (isNaN(launch.launchDate)) {
                return reject('Invalid date format');
            }

            return resolve(launch);
        });

        await scheduleNewLaunch(launch);

        return res.status(201).json(launch);
    } catch (error) {
        res.status(400).json({ error });
    }
}

async function httpDeleteLaunch(req, res) {
    const launchId = parseInt(req.params.id);

    const isLaunchExist = await isLaunchExists(launchId);
    if (! isLaunchExist) {
        return res.status(404).json({
            error: "launch data doesn't exists"
        });
    }

    const isAborted = await deleteLaunchById(launchId);
    if (! isAborted) {
        return res.status(400).json({
            error: 'Something went wrong'
        });
    }

    return res.status(200).json({
        Ok: true
    });
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpDeleteLaunch,
};