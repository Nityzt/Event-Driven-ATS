const EventEmitter = require('events');

const eventEmitter = new EventEmitter();

// Optional: increase listener limit if needed
eventEmitter.setMaxListeners(20);

module.exports = eventEmitter;
