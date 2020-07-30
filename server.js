const express = require('express');
const app = express();
var path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require("express-flash");
const passport = require("passport");
var nodemailer = require('nodemailer');
var logger = require('morgan');
var mainRoutes = require('./backend/routes/mainRoutes');
require("dotenv").config();

const intializePassport = require("./passportConfig");

intializePassport(passport);

const PORT = process.env.port || 4000;

app.use(express.static(path.resolve(__dirname, 'client')))
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.set('views', __dirname + '/client/views');

app.use(session({
    secret: 'secret',

    resave: false,

    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(logger('dev'));

app.post("/users/login", passport.authenticate('local', {
    successRedirect: '/users/dashboard',
    failureRedirect: "/users/login",
    failureFlash: true
}));

app.use('/', mainRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});