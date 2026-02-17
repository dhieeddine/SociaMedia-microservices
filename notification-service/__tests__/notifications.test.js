const express = require('express');
const supertest = require('supertest');
const mongoose = require('mongoose');

// Mock mongoose
jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    const mockModel = {
        find: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    };

    function MockModel(data) {
        Object.assign(this, data);
        this.save = jest.fn().mockResolvedValue(this);
    }
    Object.assign(MockModel, mockModel);

    return {
        ...actualMongoose,
        Schema: actualMongoose.Schema,
        model: jest.fn().mockReturnValue(MockModel),
        connect: jest.fn().mockResolvedValue(null),
    };
});

const router = require('../notifications');
const app = express();
app.use(express.json());
app.use('/', router);

describe('Notification Service Unit Tests', () => {
    let MockNotification;

    beforeEach(() => {
        jest.clearAllMocks();
        MockNotification = mongoose.model('Notification');
    });

    describe('GET /:userId', () => {
        it('should return notifications for a user', async () => {
            const notifications = [{ userId: 'u1', message: 'test' }];
            MockNotification.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(notifications)
            });

            const res = await supertest(app).get('/u1');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(notifications);
        });
    });

    describe('POST /', () => {
        it('should create a new notification', async () => {
            const notifData = { userId: 'u1', message: 'test' };
            const res = await supertest(app)
                .post('/')
                .send(notifData);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe(notifData.message);
        });
    });
});
