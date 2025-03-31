import express from "express"
import cors from "cors"
import db from "./db/connection.js"

const PORT = process.env.PORT || 8000
const app = express()

app.use(cors())
app.use(express.json())

app.get('/restaurants/:id', function(req, res) {
    const restaurant_id = req.params["id"]
    db.collection("restaurants").findOne({
        restaurant_id: restaurant_id,
    }).then(value => { if (!value) { res.status(404).send("Not Found") } else { res.send(value) } })
        .catch(() => res.status(500).send("Not Found"))
})

app.get('/restaurants', function(req, res) {
    const { borough, cuisine } = req.query

    if (!borough || !cuisine) { return res.status(400).send("Both borough and cuisine parameters are required") }
    db.collection("restaurants").find({
        borough: { $regex: new RegExp(borough, 'i') },
        cuisine: { $regex: new RegExp(cuisine, 'i') }
    }).toArray()
        .then(restaurants => {
            if (!restaurants || restaurants.length === 0) {
                return res.status(404).send(`No restaurants found matching the criteria -> ${borough} ${cuisine}`)
            }
            res.send(restaurants)
        })
        .catch(() => res.status(500).send("Internal Server Error"))
})

app.post('/restaurants', function(req, res) {
    const { restaurant_id, name, borough, cuisine } = req.body
    db.collection("restaurants").insertOne({
        restaurant_id: restaurant_id,
        name: name,
        borough: borough,
        cuisine: cuisine,
    }).then(result => result.acknowledged ? res.send({ restaurant_id, name, borough, cuisine }) : res.status(500).send("Failed"))
        .catch(() => res.status(500).send("Failed"))
})

app.delete('/restaurants/:id', function(req, res) {
    const restaurant_id = req.params["id"]
    db.collection('restaurants').deleteOne({
        restaurant_id: restaurant_id,
    })
        .then(result => result.acknowledged && result.deletedCount >= 1 ? res.send("Success") : res.status(500).send("Failed"))
        .catch(() => res.status(500).send("Not Found"))
})

app.listen(PORT, () => { console.log(`Server started on PORT -> ${PORT}`) })
