import db from "./db/connection.js"

const resolvers = {
    Query: {
        async restaurant(_, { restaurant_id }) {
            return await db.collection("restaurants").findOne({ restaurant_id: restaurant_id })
        },

        async restaurants(_, { borough, cuisine }) {
            return await db.collection("restaurants").find({
                borough: { $regex: new RegExp(borough, 'i') },
                cuisine: { $regex: new RegExp(cuisine, 'i') }
            }).toArray()
        }
    },

    Mutation: {
        async createRestaurant(_, { restaurant_id, name, borough, cuisine }, context) {
            const insert = await db.collection("restaurants").insertOne({
                restaurant_id: restaurant_id,
                name: name,
                borough: borough,
                cuisine: cuisine
            })
            if (insert.acknowledged) {
                return { restaurant_id, name, borough, cuisine }
            }
            return null
        },

        async deleteRestaurant(_, { restaurant_id }, context) {
            const DBdeleted = await db.collection("restaurants").deleteOne({ restaurant_id: restaurant_id })
            return DBdeleted.acknowledged && DBdeleted.deletedCount === 1 ? true : false
        }
    }
}

export default resolvers
