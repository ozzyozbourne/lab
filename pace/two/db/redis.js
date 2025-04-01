import redis from 'redis'
const redisClient = redis.createClient({
    password: 'myStrongPassword',
    socket: {
        host: 'localhost',
        port: 6379
    }
})
await redisClient.connect()
export default redisClient
