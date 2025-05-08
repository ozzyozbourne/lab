"use strict"

const express = require('express')
const app = express();
const PORT = 8000

app.listen(PORT)
app.use(express.static("public"))

app.get('/add', function(req, res) {
    const num1 = Number(req.query['num1']), num2 = Number(req.query['num2'])

    res.set("Content-Type", "text/plain")

    if (isNaN(num1)) { res.status(400).send(`${req.query['num1']} is not a number`) }
    else if (isNaN(num2)) { res.status(400).send(`${req.query['num2']} is not a number`) }
    else { res.send(String(num1 + num2)) }
})

app.get('/calculator', async function(req, res) {
    const operator = req.query['operator'], num1 = Number(req.query['num1']), num2 = Number(req.query['num2']) 
    let result = 0

    res.set("Content-Type", "text/plain")

    if (isNaN(num1)) { 
        res.status(400).send(`${req.query['num1']} is not a number`) 
	return    
    } else if (isNaN(num2)) {  
        res.status(400).send(`${req.query['num2']} is not a number`) 
	return     
    } else { 
    	switch (operator) {
	    case 'add':
	        result = num1 + num2
	        break
	    case 'subtract':
		result = num1 - num2
		break
	    case 'multiply':
		result = num1 * num2
		break
	    case 'divide':
		if (num2 === 0) {
		    res.status(400).send(`cannot perform division with zero since num2 is -> ${num2}`)
	            return		
		}	
		result = num1 / num2
		break	
	    default:
                res.status(400).send(`${operator} is not a valid operator, must be one of -> [add, subtract, divide, multiply]`)
                return 		    
        }	
    }

    res.send(String(result))	
})
