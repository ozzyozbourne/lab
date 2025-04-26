"use strict"

const PORT = 8001

const { Pool } = require('pg')
const express = require('express')
const axios = require('axios')

const app = express()
app.use(express.json())

const pool = new Pool({
    user: 'postgres',
    password: 'mypacepostgresql',
    host: 'my-pace-postgresql.czqse8g64w7u.us-east-2.rds.amazonaws.com',
    port: 5432,
    ssl: { rejectUnauthorized: false }
})

// this return a list of airplanes
app.get('/airlines', async (req, res) => {
    try {
        const { country } = req.query
        if (!country) { return res.status(400).json({ error: 'Missing country parameter' }) }

        const countryList = country.split(',').map(c => c.trim().toUpperCase())
        const placeholder = countryList.map((_, i) => `$${i + 1}::text`).join(',')

        const query = `SELECT a.name FROM airlines a
	               join countries c on a.country=c.name
	               where c.code in (${placeholder})`

        console.log(`${query}`)

        const result = await pool.query(query, countryList)

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `No airlines found for the specified country codes ${countryList}` })
        }
        return res.json(result.rows)

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

// this return a single airline
app.get('/airline', async (req, res) => {
    try {
        const { icao, iata } = req.query
        if (!icao && !iata) { return res.status(400).json({ error: 'Please provide at least one of ICAO or IATA' }) }

        const validParams = Object.entries({ icao, iata }).filter(([_, value]) => value)
        const filter = validParams.map(([key, _], i) => `${key} = $${i + 1}::text`).join(' AND ')
        const values = validParams.map(([_, value]) => value).map(value => value.toUpperCase())

        const query = `SELECT name FROM airlines WHERE ${filter}`
        console.log(query)
        const result = await pool.query(query, values)

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No airlines found with the provided icao and iata codes' })
        }
        return res.json(result.rows)

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal Server error' })
    }
})

// Get all airports served by a specific airline
app.get('/airline/airports', async (req, res) => {
    try {
        const { code } = req.query
        if (!code) {
            return res.status(400).json({ error: 'Airline code (IATA or ICAO) is required' })
        }

        // First verify the airline exists
        const airlineQuery = `
            SELECT name, iata, icao 
            FROM airlines 
            WHERE iata = $1 OR icao = $1
        `
        console.log(airlineQuery)
        const airlineResult = await pool.query(airlineQuery, [code.toUpperCase()])

        if (airlineResult.rows.length === 0) {
            return res.status(404).json({ error: `No airline found with code ${code}` })
        }

        const airline = airlineResult.rows[0]
        const airlineCode = airline.iata || airline.icao

        // Find all unique airports this airline serves (either as departure or arrival)
        const airportsQuery = `
            SELECT DISTINCT a.name, a.city, a.country, a.iata, a.icao, a.latitude, a.longitude
            FROM airports a
            WHERE a.iata IN (
                SELECT DISTINCT departure FROM routes WHERE airline = $1
                UNION
                SELECT DISTINCT arrival FROM routes WHERE airline = $1
            )
        `
        console.log(airportsQuery)
        const airportsResult = await pool.query(airportsQuery, [airlineCode])

        if (airportsResult.rows.length === 0) {
            return res.status(404).json({
                airline: airline.name,
                message: "This airline has no registered airports in the database."
            })
        }

        // Prepare the final response
        const response = {
            airline: {
                name: airline.name,
                iata: airline.iata,
                icao: airline.icao
            },
            airports: airportsResult.rows
        }

        console.log("Sending response for airline airports")
        return res.json(response)

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

app.post('/airlines', async (req, res) => {
    try {
        const { name, iata, icao, callsign, country } = req.body

        if (!name || !callsign || !country) { return res.status(400).json({ error: 'Name, Callsign and Country are required' }) }
        console.log('checkin to see if airline already present!')

        let query = `SELECT callsign FROM airlines WHERE callsign=$1::text`
        let result = await pool.query(query, [callsign])
        if (result.rows.length !== 0) { return res.status(404).json({ error: `Airline with call sign -> ${callsign} already present!` }) }

        // constructing paramaterizied query functional style 
        const validParams = Object.entries({ name, iata, icao, callsign, country }).filter(([_, value]) => value)
        const cols = validParams.map(([key, _]) => key).join(',')
        const placeholders = validParams.map((_, i) => `$${i + 1}::text`).join(',')
        const values = validParams.map(([_, value]) => value)

        query = `INSERT INTO airlines(${cols})VALUES(${placeholders}) RETURNING *;`
        console.log(query)
        result = await pool.query(query, values)

        if (result.rows.length === 0) {
            console.log(`no rows were affected by query -> ${query}`)
            return res.status(500).json({ error: 'Internal Server Error' })
        }

        console.log(result.rows)
        return res.json({ status: 'Airline created successfully!' })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal Server error' })
    }
})

app.delete('/airlines', async (req, res) => {
    try {
        const { icao, iata } = req.query
        if (!icao && !iata) { return res.status(400).json({ error: 'need atleast icao or iata to delete' }) }

        const validParams = Object.entries({ icao, iata }).filter(([_, value]) => value)
        const filter = validParams.map(([key, _], i) => `${key} = $${i + 1}`).join(' And ')
        const values = validParams.map(([_, value]) => value)

        const query = `DELETE FROM airlines WHERE ${filter} RETURNING *`
        console.log(query)
        const result = await pool.query(query, values)

        if (result.rows.length === 0) {
            console.log(`no rows were affected by query -> ${query}`)
            return res.status(404).json({ error: 'No airline were deleted with the provided icao and/or iata codes' })
        }
        return res.json({ status: 'Airline deleted successfully!' })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
})

// The airports end points begins here -> 
app.get('/airports', async (req, res) => {
    try {
        const { country } = req.query
        if (!country) { return res.status(400).json({ error: 'Missing country parameter' }) }

        const countryList = country.split(',').map(c => c.trim().toUpperCase())
        const placeholder = countryList.map((_, i) => `$${i + 1}::text`).join(',')

        const query = `SELECT a.name, a.city, a.country, a.iata, a.icao, a.latitude, a.longitude FROM airports a
                       JOIN countries c ON a.country=c.name
                       WHERE c.code IN (${placeholder})`

        console.log(`${query}`)
        const result = await pool.query(query, countryList)

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `No airports found for the specified country codes ${countryList}` })
        }
        return res.json(result.rows)

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

app.get('/airport', async (req, res) => {
    try {
        const { icao, iata } = req.query
        if (!icao && !iata) { return res.status(400).json({ error: 'Please provide at least one of ICAO or IATA' }) }

        const validParams = Object.entries({ icao, iata }).filter(([_, value]) => value)
        const filter = validParams.map(([key, _], i) => `${key} = $${i + 1}::text`).join(' AND ')
        const values = validParams.map(([_, value]) => value).map(value => value.toUpperCase())

        const query = `SELECT name, city, country, iata, icao, latitude, longitude FROM airports WHERE ${filter}`
        console.log(query)
        const result = await pool.query(query, values)

        if (result.rows.length === 0) { return res.status(404).json({ error: 'No airport found with the provided ICAO and/or IATA codes' }) }
        const airport = result.rows[0]

        try {
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${airport.latitude}&longitude=${airport.longitude}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`
            const weatherResponse = await axios.get(weatherUrl)

            if (weatherResponse.data && weatherResponse.data.daily) {
                airport.high = weatherResponse.data.daily.temperature_2m_max[0]
                airport.low = weatherResponse.data.daily.temperature_2m_min[0]
            }
        } catch (weatherError) { console.log('Error fetching weather data:', weatherError) }
        return res.json(airport)

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal Server error' })
    }
})

app.post('/airports', async (req, res) => {
    try {
        const { name, city, country, iata, icao, latitude, longitude } = req.body

        if (!name || !city || !country) { return res.status(400).json({ error: 'Name, City, and Country are required' }) }

        let query = ''
        let result = null

        // Check to see if the airport is already present in the database    
        if (iata) {
            query = `SELECT iata FROM airports WHERE iata=$1::text`
            result = await pool.query(query, [iata.toUpperCase()])
            if (result.rows.length !== 0) { return res.status(404).json({ error: `Airport with IATA code -> ${iata} already exists!` }) }
        }

        if (icao) {
            query = `SELECT icao FROM airports WHERE icao=$1::text`
            result = await pool.query(query, [icao.toUpperCase()])
            if (result.rows.length !== 0) { return res.status(404).json({ error: `Airport with ICAO code -> ${icao} already exists!` }) }
        }

        const validParams = Object.entries({ name, city, country, iata, icao, latitude, longitude }).filter(([_, value]) => value !== undefined && value !== null && value !== '')
        const cols = validParams.map(([key, _]) => key).join(',')
        const placeholders = validParams.map((_, i) => `$${i + 1}`).join(',')
        const values = validParams.map(([_, value]) => value)

        query = `INSERT INTO airports(${cols})VALUES(${placeholders}) RETURNING *;`
        console.log(query)
        result = await pool.query(query, values)

        if (result.rows.length === 0) {
            console.log(`No rows were affected by query -> ${query}`)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
        return res.json({ status: 'Airport created successfully!' })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal Server error' })
    }
})

app.delete('/airports', async (req, res) => {
    try {
        const { icao, iata } = req.query
        if (!icao && !iata) { return res.status(400).json({ error: 'Need at least ICAO or IATA code to delete' }) }

        const validParams = Object.entries({ icao, iata }).filter(([_, value]) => value)
        const filter = validParams.map(([key, _], i) => `${key} = $${i + 1}`).join(' AND ')
        const values = validParams.map(([_, value]) => value).map(value => value.toUpperCase())

        const query = `DELETE FROM airports WHERE ${filter} RETURNING *`
        console.log(query)
        const result = await pool.query(query, values)

        if (result.rows.length === 0) {
            console.log(`No rows were affected by query -> ${query}`)
            return res.status(404).json({ error: 'No airports were deleted with the provided ICAO and/or IATA codes' })
        }
        return res.json({ status: 'Airport deleted successfully!' })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
})

// the routes endpoints begin here -> 
app.get('/routes', async (req, res) => {
    try {
        const { departure, arrival } = req.query
        if (!departure || !arrival) {
            return res.status(400).json({ error: 'Both departure and arrival airport codes are required' })
        }

        const airportQuery = `
            SELECT name, iata, latitude, longitude 
            FROM airports 
            WHERE iata IN ($1, $2)
        `
        console.log(airportQuery)
        const airportResult = await pool.query(airportQuery, [departure.toUpperCase(), arrival.toUpperCase()])

        if (airportResult.rows.length !== 2) { return res.status(404).json({ error: 'One or both airports not found' }) }

        const depAirport = airportResult.rows.find(row => row.iata.toUpperCase() === departure.toUpperCase())
        const arrAirport = airportResult.rows.find(row => row.iata.toUpperCase() === arrival.toUpperCase())

        const R = 6378 // Radius of Earth in kilometers
        const lat1 = depAirport.latitude * Math.PI / 180
        const lat2 = arrAirport.latitude * Math.PI / 180
        const lon1 = depAirport.longitude * Math.PI / 180
        const lon2 = arrAirport.longitude * Math.PI / 180

        const dLat = lat2 - lat1
        const dLon = lon2 - lon1

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        const routeQuery = `
            SELECT airline, planes 
            FROM routes 
            WHERE departure = $1 AND arrival = $2
        `
        console.log(routeQuery)
        const routeResult = await pool.query(routeQuery, [departure.toUpperCase(), arrival.toUpperCase()])
        if (routeResult.rows.length === 0) { return res.status(500).json({ error: 'Internal Server error' }) }

        const response = {
            departure: {
                code: depAirport.iata,
                name: depAirport.name
            },
            arrival: {
                code: arrAirport.iata,
                name: arrAirport.name
            },
            distance: Math.round(distance * 100) / 100,
            unit: 'km',
            routes: routeResult.rows.map(row => ({
                airline: row.airline,
                aircraft_types: row.planes ? row.planes.split(' ') : []
            }))
        }

        console.log(response)
        return res.json(response)

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

app.get('/routes/arrivals', async (req, res) => {
    try {
        const { departure } = req.query
        if (!departure) { return res.status(400).json({ error: 'Departure airport code is required' }) }

        const query = `
            SELECT DISTINCT a.name, a.city, a.country, a.iata, a.icao
            FROM routes r
            JOIN airports a ON r.arrival = a.iata
            WHERE r.departure = $1
        `
        console.log(query)
        const result = await pool.query(query, [departure.toUpperCase()])

        if (result.rows.length === 0) { return res.status(404).json({ error: `No routes found from airport with code ${departure}` }) }

        console.log(result.rows)
        return res.json(result.rows)

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

app.get('/routes/byairline', async (req, res) => {
    try {
        const { airline, aircraft } = req.query
        if (!airline || !aircraft) {
            return res.status(400).json({ error: 'Both airline IATA code and aircraft type code are required' })
        }

        const query = `
            SELECT
                r.departure,
                dep.name as departure_name,
                r.arrival,
                arr.name as arrival_name
            FROM routes r
            JOIN airports dep ON r.departure = dep.iata
            JOIN airports arr ON r.arrival = arr.iata
            WHERE r.airline = $1 AND r.planes LIKE $2
        `
        console.log(query)
        const result = await pool.query(query, [airline.toUpperCase(), `%${aircraft.toUpperCase()}%`])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `No routes found for airline ${airline} using aircraft type ${aircraft}` })
        }
        console.log(result.rows)
        return res.json(result.rows)

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

app.post('/routes', async (req, res) => {
    try {
        const { airline, departure, arrival, aircraft } = req.body

        if (!airline || !departure || !arrival || !aircraft) {
            return res.status(400).json({ error: 'Airline, departure, arrival, and aircraft are all required' })
        }

        // Airline IATA Validation     
        if (airline.length !== 2) { return res.status(400).json({ error: 'Invalid Airline IATA code' }) }
        const airlineResult = await pool.query(`SELECT iata FROM airlines WHERE iata = $1`, [airline.toUpperCase()])
        if (airlineResult.rows.length === 0) { return res.status(404).json({ error: `Airline with IATA code ${airline} not found` }) }

        // Airport IATA Validation    
        if (departure.length !== 3 || arrival.length !== 3) { return res.status(400).json({ error: 'Invalid Airport IATA Code' }) }
        const airportQuery = `SELECT iata FROM airports WHERE iata IN ($1, $2)`
        const airportResult = await pool.query(airportQuery, [departure.toUpperCase(), arrival.toUpperCase()])
        if (airportResult.rows.length !== 2) { return res.status(404).json({ error: 'One or both airports not found' }) }

        let aircraftCodes = Array.isArray(aircraft) ? aircraft : [aircraft];
        for (const code of aircraftCodes) {
            if (code.length !== 3) {
                return res.status(400).json({ error: `Invalid Aircraft code: ${code} (must be 3 characters)` })
            }
            const aircraftQuery = `SELECT code FROM planes WHERE code = $1`
            const aircraftResult = await pool.query(aircraftQuery, [code.toUpperCase()])
            if (aircraftResult.rows.length === 0) {
                return res.status(404).json({ error: `Aircraft type with code ${code} not found` })
            }
        }

        const planesString = aircraftCodes.map(code => code.toUpperCase()).join(' ');
        const routeExistsQuery = `
            SELECT * FROM routes 
            WHERE airline = $1::text 
            AND departure = $2::text 
            AND arrival = $3::text
        `
        console.log(routeExistsQuery)
        const routeExistsResult = await pool.query(routeExistsQuery, [
            airline.toUpperCase(),
            departure.toUpperCase(),
            arrival.toUpperCase()
        ])

        if (routeExistsResult.rows.length > 0) { return res.status(400).json({ error: 'This route already exists' }) }
        const insertQuery = `
            INSERT INTO routes(airline, departure, arrival, planes)
            VALUES($1, $2, $3, $4)
            RETURNING *
        `

        console.log(insertQuery)
        const insertResult = await pool.query(insertQuery, [
            airline.toUpperCase(),
            departure.toUpperCase(),
            arrival.toUpperCase(),
            planesString
        ])

        if (insertResult.rows.length === 0) { return res.status(500).json({ error: 'Internal Server Error' }) }

        console.log(insertResult.rows)
        return res.json({ status: 'Route created successfully' })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

app.delete('/routes', async (req, res) => {
    try {
        const { airline, departure, arrival } = req.query
        if (!airline || !departure || !arrival) {
            return res.status(400).json({ error: 'Airline, departure, and arrival parameters are all required' })
        }

        const query = `
            DELETE FROM routes 
            WHERE airline = $1 
            AND departure = $2 
            AND arrival = $3
            RETURNING *
        `
        console.log(query)
        const result = await pool.query(query, [
            airline.toUpperCase(),
            departure.toUpperCase(),
            arrival.toUpperCase()
        ])

        if (result.rows.length === 0) { return res.status(404).json({ error: 'No route found matching the specified criteria' }) }
        return res.json({ status: 'Route deleted successfully' })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

app.put('/routes', async (req, res) => {
    try {
        const { airline, departure, arrival, aircraft } = req.body

        if (!airline || !departure || !arrival || !aircraft) {
            return res.status(400).json({ error: 'Airline, departure, arrival, and aircraft are all required' })
        }

        let aircraftCodes = Array.isArray(aircraft) ? aircraft : [aircraft];
        for (const code of aircraftCodes) {
            if (code.length !== 3) {
                return res.status(400).json({ error: `Invalid Aircraft code: ${code} (must be 3 characters)` })
            }

            const aircraftQuery = `SELECT code FROM planes WHERE code = $1`
            const aircraftResult = await pool.query(aircraftQuery, [code.toUpperCase()])

            if (aircraftResult.rows.length === 0) {
                return res.status(404).json({ error: `Aircraft type with code ${code} not found` })
            }
        }

        const routeQuery = `
            SELECT planes
            FROM routes
            WHERE airline = $1
            AND departure = $2
            AND arrival = $3
        `
        console.log(routeQuery)
        const routeResult = await pool.query(routeQuery, [
            airline.toUpperCase(),
            departure.toUpperCase(),
            arrival.toUpperCase()
        ])

        if (routeResult.rows.length === 0) { return res.status(404).json({ error: 'Route not found' }) }

        const currentPlanes = routeResult.rows[0].planes
        const existingAircraftTypes = currentPlanes ? currentPlanes.split(' ') : []

        const newAircraftCodes = aircraftCodes
            .map(code => code.toUpperCase())
            .filter(code => !existingAircraftTypes.includes(code));

        if (newAircraftCodes.length === 0) {
            return res.json({ status: 'No changes made - all aircraft types already exist for this route' })
        }

        const updatedPlanes = [...existingAircraftTypes, ...newAircraftCodes].join(' ');
        const updateQuery = `
            UPDATE routes
            SET planes = $4
            WHERE airline = $1
            AND departure = $2
            AND arrival = $3
            RETURNING *
        `
        console.log(updateQuery)
        const updateResult = await pool.query(updateQuery, [
            airline.toUpperCase(),
            departure.toUpperCase(),
            arrival.toUpperCase(),
            updatedPlanes
        ])

        if (updateResult.rows.length === 0) { return res.status(500).json({ error: 'Failed to update route' }) }
        return res.json({
            status: 'Route updated successfully',
            planes: updatedPlanes
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

app.listen(PORT, () => console.log(`Running on port -> ${PORT}`))
