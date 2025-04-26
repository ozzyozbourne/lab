import express from 'express';
import { register, signIn, loginRequired, profile } from './controllers/userController.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import {} from "dotenv/config";
import {} from './models/userModel.js';

const PORT = process.env.PORT || 8000;
const app = express();

await mongoose.connect(process.env.MONGODB_URI, {dbName: 'Users'});

app.use(express.json());
app.use(function(req, res, next) {
  if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
    jwt.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode) {
      if (err) req.user = undefined;
      req.user = decode;
      next();
    });
  } else {
    req.user = undefined;
    next();
  }
});

app.route('/profile').get(loginRequired, profile);
app.route('/auth/register').post(register);
app.route('/auth/sign_in').post(signIn);

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
