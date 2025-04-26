import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export function register(req, res) {
  var newUser = new mongoose.model('User')(req.body);
  newUser.hash_password = bcrypt.hashSync(req.body.password, 10);
  newUser.save().then((user) => {
    user.hash_password = undefined;
    res.json(user);
  }).catch((err) => {
    res.status(400).send({message: err});
  });
}

export function signIn(req, res) {
  mongoose.model('User').findOne({ email: req.body.email }).then((user) =>{
    (!user || !user.comparePassword(req.body.password)) ?
      res.status(401).json({ message: "Authentication Failed."}) :
      res.json({ token: jwt.sign({ 
        email: user.email, 
        fullName: user.fullName, 
        _id: user._id}, 
      'RESTFULAPIs')});
  });
}

export function loginRequired(req, res, next) {
  if (req.user) {
    next();
  } else {
    return res.status(401).json({ message: 'Unauthorized User' });
  }
}

export function profile(req, res, next) {
  if (req.user) {
    res.send(req.user);
    next();
  } else {
   return res.status(401).json({ message: 'Invalid Token' });
  }
}