import Queue from 'bull'
const messageQueue = new Queue('messageQueue', {
    redis: {
        port: 6379,
        host: 'localhost',
        password: 'myStrongPassword'
    }
})
export default messageQueue
