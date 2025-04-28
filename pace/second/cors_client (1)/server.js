"use strict";

const express = require('express');
const app = express();
app.use(express.static("public"));
const PORT = process.env.PORT || 8001;
app.listen(PORT);
