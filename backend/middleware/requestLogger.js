const morgan = require('morgan');
const {v4: uuidv4} = require('uuid');

const correlationId = (req, res, next) => {
    req.correlationId = uuidv4();
    res.setHeader('X-Correlation-ID', req.correlationId);
    next();
}

morgan.token('correlationId', (req) => req.correlationId);

const morganFormat = 
':correlationId :method :url :status :res[content-length] - :response-time ms';

module.exports = {
    correlationId,
    morganLogger: morgan(morganFormat)
};