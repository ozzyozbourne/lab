"use strict";

const express = require('express');

const cors = require('cors');
const corsConfig = {
    origin: 'http://localhost:8001',
    optionsSuccessStatus: 200,
};

const app = express();
app.use(cors(corsConfig));
const PORT = process.env.PORT || 8000;
app.listen(PORT);

app.get('/helloworld', function(req, res) {
    res.set("Content-Type", "text/plain");
    res.send('Hello, World!');
});
