process.env.MONGO_URI = 'mongodb://localhost:27017/event-ats-test';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';
process.env.PORT = '5002'; // avoid conflict with dev server
