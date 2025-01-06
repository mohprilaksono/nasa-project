const request = require('supertest');
require('dotenv').config();

const app = require('../../app');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo');
const { getPlanetsData } = require('../../models/planets.model');

describe('Test Launches API', () => {
    beforeAll(async () => {
        await mongoConnect();
        await getPlanetsData();
    });

    afterAll(async () => {
        await mongoDisconnect();
    });

    describe('Test GET launches endpoints', () => {
        test('it should respond with 200 success', async () => {
            const response = await request(app)
                        .get('/v1/launches')
                        .expect('Content-Type', /json/)
                        .expect(200);
    
            expect(response.statusCode).toEqual(200);
        });
    });

    describe('Test POST launches endpoints', () => {
        const launchDataWithoutDate = {
            mission: "Fakhri to the Moooon",
            target: "Kepler-442 b",
            rocket: "Falcon 9",
        };
    
        const completeLaunchData = {...launchDataWithoutDate, launchDate: 'January 4, 2030'};
    
        test('it should respond with 201 created', async () => {
            const response = await request(app)
                                .post('/v1/launches')
                                .send(completeLaunchData)
                                .expect('Content-Type', /json/)
                                .expect(201);
    
            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
    
            expect(requestDate).toBe(responseDate);
    
            expect(response.body).toMatchObject(launchDataWithoutDate);
        });
    
        describe('Test catch missing required properties', () => {
            test('it should catch missing required launch date', async () => {
                const response = await request(app)
                                    .post('/v1/launches')
                                    .send(launchDataWithoutDate)
                                    .expect('Content-Type', /json/)
                                    .expect(400);
        
                expect(response.body?.launchDate).toBeUndefined();
                expect(response.body).toStrictEqual({
                    error: 'Missing required launch data'
                });
            });
    
            test('it should catch missing required target', async () => {
                delete completeLaunchData.target;
    
                const response = await request(app)
                                    .post('/v1/launches')
                                    .send(completeLaunchData)
                                    .expect('Content-Type', /json/)
                                    .expect(400);
        
                expect(response.body?.target).toBeUndefined();
                expect(response.body).toStrictEqual({
                    error: 'Missing required launch data'
                });
            });
    
            test('it should catch missing required mission', async () => {
                delete completeLaunchData.mission;
    
                const response = await request(app)
                                    .post('/v1/launches')
                                    .send(completeLaunchData)
                                    .expect('Content-Type', /json/)
                                    .expect(400);
        
                expect(response.body?.mission).toBeUndefined();
                expect(response.body).toStrictEqual({
                    error: 'Missing required launch data'
                });
            });
    
            test('it should catch missing required rrocket', async () => {
                delete completeLaunchData.rocket;
    
                const response = await request(app)
                                    .post('/v1/launches')
                                    .send(completeLaunchData)
                                    .expect('Content-Type', /json/)
                                    .expect(400);
        
                expect(response.body?.rocket).toBeUndefined();
                expect(response.body).toStrictEqual({
                    error: 'Missing required launch data'
                });
            });
        });
    
        test('it should catch invalid date', async () => {
            const response = await request(app)
                                .post('/v1/launches')
                                .send({
                                    mission: "ZTM100",
                                    target: "Kepler-442 b",
                                    rocket: "Falcon Heavy", 
                                    launchDate: "SIIUUUUU"
                                })
                                .expect('Content-Type', /json/)
                                .expect(400);
        
            expect(response.body).toStrictEqual({
                error: 'Invalid date format'
            });
        });
    });
});