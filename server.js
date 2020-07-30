const express = require('express');
const app = express();
var path = require('path');
// const { pool } = require('./dbConfig');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require("express-flash");
const passport = require("passport");
var nodemailer = require('nodemailer');
var logger = require('morgan');
var mainRoutes = require('./backend/routes/mainRoutes');
// var otpGenerator = require('otp-generator')
require("dotenv").config();

const intializePassport = require("./passportConfig");

intializePassport(passport);

const PORT = process.env.port || 4000;


// var transporter = nodemailer.createTransport({
//     service: "gmail",
//     host: "smtp.gmail.com",
//     auth: {
//         user: "asj120soda@gmail.com",
//         pass: "a1s2d3f4g5h6j7k8l9"
//     },
//     tls: {
//         rejectUnauthorized: false
//     }
// });

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
// app.get("/", (req, res) => {
//     res.render('index');
// });

// app.get('/users/register', checkAuthenticated, (req,res) => {
//     res.render("register");
// });

// app.get('/users/login', checkAuthenticated, (req, res) => {
//     res.render("login");
// });

// app.get('/users/dashboard', checkNotAuthenticated, (req, res) => {
//     res.render("dashboard", {user: req.user.name});
// });

// app.get('/users/logout', (req,res) => {
//     req.logOut();
//     req.flash('success_msg', "You have logged out");
//     res.redirect('/users/login')
// });

// app.post('users/send', (req,res) => {
    
// });

// app.post('/users/register', async (req, res) => {
//     let { name, email, password, password2, otp} = req.body;

//     console.log({
//         name,
//         email,
//         password,
//         password2,
//         otp
//     });

//     let errors = [], optsent;


//     if(!name || !email || !password || !password2){
//         errors.push({message: "Please enter all fields"});
//     }

//     if(password.length < 6){
//         errors.push({message: "Password should be at least 6 characters"});
//     }

//     if(password != password2){
//         errors.push({message: "Passwords do not match"});
//     }

//     if(errors.length > 0){
//         res.render('register', { errors });
//     }else{
//         //Form validation has passed
//         let hashedPassword = await bcrypt.hash(password, 10);
//         console.log(hashedPassword);

//         pool.query(
//             `SELECT * FROM users
//             WHERE email = $1`, [email], (err, results) => {
//                 if(err){
//                     throw err;
//                 }
//                 console.log(results.rows);

//                 if(results.rows.length > 0){
//                     errors.push({message: "Email already registered"});
//                     res.render('register', { errors });
//                 }else{
//                     if(!otp){
//                         otpsent = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets:false });
//                         var mailOptions={
//                             to : email,
//                             subject : "Email verification",
//                             text : "Otp for Login : "+ otpsent
//                         }
//                         console.log(mailOptions);
//                         transporter.sendMail(mailOptions, function(err, resp){
//                             if(err){
//                                 console.log(err);
//                                 // res.end("error");
//                             }else{
//                                 console.log(otpsent);
//                                 pool.query(
//                                     `INSERT INTO otp (email, otp)
//                                     VALUES ($1,$2)
//                                     RETURNING email`,[email, otpsent], (err, results) => {
//                                         if(err){
//                                             throw err;
//                                         }
//                                         console.log(results.rows);
//                                     }
//                                 );
//                                 console.log("Message sent: " + resp.message);

//                                 res.flash("success_msg","sent");
//                             }
//                         });
//                                 console.log("chk 1");
//                                 // res.send({"otp":otpsent});
//                         // res.sendStatus(200);
//                         // res.end("success");
//                         // res.render('register', {otpsent: otpsent})
//                         res.json({status:200})

//                         console.log("chk 2");
//                     }
//                     else{
//                         pool.query(
//                             `SELECT otp FROM otp
//                             WHERE email = ($1)`,[email], (err,results) =>{
//                                 if(err){
//                                     throw err;
//                                 }
//                                 console.log(results.rows[0].otp );
//                                 if(results.rows[0].otp != otpsent){
//                                     errors.push({message: "otp did not match"});
//                                     // res.render('register', (errors));
//                                 }
//                             }
//                         );
//                         console.log("chk 3");
//                         pool.query(
//                             `INSERT INTO users (name, email, password)
//                             VALUES ($1, $2, $3)
//                             RETURNING id, password`, [name, email, hashedPassword], (err, results) => {
//                                 if(err){
//                                     throw err;
//                                 }
//                                 console.log("here");
//                                 console.log(results.rows);
//                                 req.flash('success_msg', "You are now registered. Please log in to continue");
//                                 res.redirect('/users/login');
//                             }
//                         );
//                     }
//                 }
//             }
//         );
//     }
// });

app.post("/users/login", passport.authenticate('local', {
    successRedirect: '/users/dashboard',
    failureRedirect: "/users/login",
    failureFlash: true
}));

function checkAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return res.redirect('/users/dashboard');
    }
    next();
}

function checkNotAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/users/login');
}


app.use('/', mainRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});