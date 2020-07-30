// var database = require('../models/dbConfig.js');
// var connection = require('../../config');
const { pool } = require('../models/dbConfig');
var nodemailer = require('nodemailer');
var bcrypt = require('bcrypt');
var otpGenerator = require('otp-generator')


module.exports = {
    home:home,
    login:login,
    register:register,
    dashboard:dashboard,
    logout:logout,
    registerPost:registerPost,
    loginPost:loginPost
    }


var transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: "asj120soda@gmail.com",
        pass: "a1s2d3f4g5h6j7k8l9"
    },
    tls: {
        rejectUnauthorized: false
    }
});

function home(req, res){
    res.render('index.ejs',{});
}

function login(req, res){
	checkAuthenticated(req,res);
	res.render("login");
}

function register(req,res){
	checkAuthenticated(req,res);
    res.render("register");
}

function dashboard(req,res){
	checkNotAuthenticated(req,res);
    res.render("dashboard", {user: req.user.name});
}

function logout(req,res){
    req.logOut();
    req.flash('success_msg', "You have logged out");
    res.redirect('/users/login')
}

function checkAuthenticated(req,res){
    if(req.isAuthenticated()){
        return res.redirect('/users/dashboard');
    }
}

function checkNotAuthenticated(req,res){
    if(!req.isAuthenticated()){
        res.redirect('/users/login');
    }   
}



async function registerPost(req,res){
    let { name, email, password, password2, otp} = req.body;

	console.log({ name, email, password, password2, otp});

    let errors = [], otpsent;


    if(!name || !email || !password || !password2){
        errors.push({message: "Please enter all fields"});
    }

    if(password.length < 3){
        errors.push({message: "Password should be at least 6 characters"});
    }

    if(password != password2){
        errors.push({message: "Passwords do not match"});
    }

    if(errors.length > 0){
        res.render('register', { errors });
    }else{
        //Form validation has passed
        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        pool.query(
            `SELECT * FROM users
            WHERE email = $1`, [email], (err, results) => {
                if(err){
                    throw err;
                }
                console.log(results.rows);

                if(results.rows.length > 0){
                    errors.push({message: "Email already registered"});
                    res.render('register', { errors });
                }else{
                    if(!otp){
                        otpsent = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets:false });
                        var mailOptions={
                            to : email,
                            subject : "Email verification",
                            text : "Otp for Login : "+ otpsent
                        }
                        console.log(mailOptions);
                        transporter.sendMail(mailOptions, function(err, resp){
                            if(err){
                                console.log(err);
                                // res.end("error");
                            }else{
                                console.log(otpsent);
                                pool.query(
                                    `INSERT INTO otp (email, otp)
                                    VALUES ($1,$2)
                                    RETURNING email`,[email, otpsent], (err, results) => {
                                        if(err){
                                            throw err;
                                        }
                                        console.log(results.rows);
                                    }
                                );
                                console.log("Message sent: " + resp.message);

                                res.flash("success_msg","sent");
                            }
                        });
                                console.log("chk 1");
                                // res.send({"otp":otpsent});
                        // res.sendStatus(200);
                        // res.end("success");
                        // res.render('register', {otpsent: otpsent})
                        res.json({status:200})

                        console.log("chk 2");
                    }
                    else{
                        pool.query(
                            `SELECT otp FROM otp
                            WHERE email = ($1)`,[email], (err,results) =>{
                                if(err){
                                    throw err;
                                }
                                console.log(results.rows[0].otp );
                                if(results.rows[0].otp != otpsent){
                                    errors.push({message: "otp did not match"});
                                    // res.render('register', (errors));
                                }
                            }
                        );
                        console.log("chk 3");
                        pool.query(
                            `INSERT INTO users (name, email, password)
                            VALUES ($1, $2, $3)
                            RETURNING id, password`, [name, email, hashedPassword], (err, results) => {
                                if(err){
                                    throw err;
                                }
                                console.log("here");
                                console.log(results.rows);
                                req.flash('success_msg', "You are now registered. Please log in to continue");
                                res.redirect('/users/login');
                            }
                        );
                    }
                }
            }
        );
    }
}

function loginPost(req,res){

}