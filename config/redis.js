const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
});

client.on('error', (err) => {
  console.log('Redis Client Error', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

(async () => {
  await client.connect();
})();

module.exports = client;
