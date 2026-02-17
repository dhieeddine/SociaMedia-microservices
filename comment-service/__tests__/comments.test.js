const express = require('express');
const supertest = require('supertest');
const mongoose = require('mongoose');

// Mock mongoose
jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    const mockModel = {
        find: jest.fn(),
        findByIdAndDelete: jest.fn(),
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

const router = require('../comments');
const app = express();
app.use(express.json());
app.use('/', router);

describe('Comment Service Unit Tests', () => {
    let MockComment;

    beforeEach(() => {
        jest.clearAllMocks();
        MockComment = mongoose.model('Comment');
    });

    describe('GET /post/:postId', () => {
        it('should return comments for a post', async () => {
            const comments = [{ postId: 'p1', content: 'nice post' }];
            MockComment.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(comments)
            });

            const res = await supertest(app).get('/post/p1');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(comments);
        });
    });

    describe('POST /', () => {
        it('should create a new comment', async () => {
            const commentData = { postId: 'p1', userId: 'u1', username: 'user1', content: 'cool' };
            const res = await supertest(app)
                .post('/')
                .send(commentData);

            expect(res.status).toBe(201);
            expect(res.body.content).toBe(commentData.content);
        });
    });
});
