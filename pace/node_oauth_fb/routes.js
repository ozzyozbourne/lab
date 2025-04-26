const passport = require('passport');
const express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('pages/index.ejs'); // load the index.ejs file
});

router.get('/profile', isLoggedIn, function(req, res) {
    res.render('pages/profile.ejs', {
        user: req.user // get the user out of session and pass to template
    });
});

router.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['public_profile']
}));

router.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}

module.exports = router;
