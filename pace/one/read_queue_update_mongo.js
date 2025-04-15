import { MongoClient } from 'mongodb'
import { } from 'dotenv/config'
import messageQueue from './db/bull.js'

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)

async function run() {
    messageQueue.process(async (job) => {
        console.log(`Processing -> ${job.id}`)

        const database = client.db('sample_restaurants')
        const restaurants = database.collection('restaurants')
        const query = { restaurant_id: job.data.restaurant_id }

        if (JSON.parse(job.data.updates) === 'delete') {
            await restaurants.deleteOne(query)
            console.log(`Deleted restaurant with ID -> ${job.data.restaurant_id}`)
        } else {
            await restaurants.updateOne(
                query,
                { $set: JSON.parse(job.data.updates) },
                { upsert: true }
            )
            console.log(`Upated restaurant with ID -> ${job.data.restaurant_id}`)
        }
        console.log(`Processed -> ${JSON.stringify(job.data)}`)
    })
}

run().catch(console.dir)
