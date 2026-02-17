const express = require('express');
const supertest = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Mock mongoose
jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    const mockModel = {
        findOne: jest.fn(),
        find: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
        updateOne: jest.fn(),
        save: jest.fn(),
    };
    return {
        ...actualMongoose,
        Schema: actualMongoose.Schema,
        model: jest.fn().mockReturnValue(mockModel),
        connect: jest.fn().mockResolvedValue(null),
    };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
}));

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve({}),
});

const router = require('../users');
const app = express();
app.use(express.json());
app.use('/', router);

describe('User Service Unit Tests', () => {
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = mongoose.model('User');
    });

    describe('GET /', () => {
        it('should return all users without passwords', async () => {
            const users = [{ name: 'User 1' }, { name: 'User 2' }];
            mockUser.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(users)
            });

            const res = await supertest(app).get('/');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(users);
            expect(mockUser.find).toHaveBeenCalled();
        });
    });

    describe('GET /username/:username', () => {
        it('should return a user if found', async () => {
            const user = { username: 'test' };
            mockUser.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(user)
            });

            const res = await supertest(app).get('/username/test');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(user);
        });

        it('should return 404 if not found', async () => {
            mockUser.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            const res = await supertest(app).get('/username/unknown');
            expect(res.status).toBe(404);
        });
    });

    describe('POST /login', () => {
        it('should login successfully with correct credentials', async () => {
            const user = { email: 'test@test.com', password: 'hashedPassword', _id: '123' };
            mockUser.findOne.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(true);

            const res = await supertest(app)
                .post('/login')
                .send({ email: 'test@test.com', password: 'password' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Connexion réussie');
        });
    });
});
