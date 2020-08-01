// var database = require('../models/dbConfig.js');
// var connection = require('../../config');
const { pool } = require('../models/dbConfig');
var nodemailer = require('nodemailer');
var bcrypt = require('bcrypt');
var otpGenerator = require('otp-generator');
var fs = require("fs");
const kue = require("./kue");
require("./worker");

require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

var htmlpage = require("../../client/views/commScreenSend.html");
module.exports = {
    home:home,
    login:login,
    register:register,
    dashboard:dashboard,
    logout:logout,
    registerPost:registerPost,
    loginPost:loginPost,
    userInfo:userInfo,
    userInfoPost:userInfoPost,
    commScreen:commScreen,
    commScreenData:commScreenData,
    // commScreenPost:commScreenPost,
    addComment:addComment,
    commScreenSendMail:commScreenSendMail,
    sendEmailSchedule:sendEmailSchedule
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
    console.log(req.user);
    let { name, email, phone, address, gst} = req.user;
    res.render("dashboard", {name: name, email:email, phone:phone, address:address, gst:gst});
}

function userInfo(req,res){
    checkNotAuthenticated(req,res);
    pool.query(
        `SELECT * FROM users
        WHERE email = ($1)`,[req.user.email], (err,results) => {
            if(err){
                throw err;
            }

            let {name, email, phone, address, gst} = req.user;
            res.render('userinfo',{name:name, email:email, phone:phone, address:address, gst:gst});
        }
    );
}

function commScreen(req,res){
    checkNotAuthenticated(req,res);
    pool.query(
        `SELECT * FROM users
        WHERE email = ($1)`,[req.user.email], (err,results) => {
            if(err){
                throw err;
            }
            let {name, email, phone, address, gst, commHistory} = results.rows[0];
            // console.log({name, email, phone, address, gst, commHistory})
            res.render('commScreen',{name:name, email:email, phone:phone, address:address, gst:gst, commHistory:commHistory});
        }
    );
}

function commScreenData(req,res){
    checkNotAuthenticated(req,res);
    pool.query(
        `SELECT * FROM users
        WHERE email = ($1)`,[req.user.email], (err,results) => {
            if(err){
                throw err;
            }
            console.log(results.rows[0])
            let {name, email, phone, address, gst, commhistory} = results.rows[0];
            console.log({name, email, phone, address, gst, commhistory})
            res.json({name:name, email:email, phone:phone, address:address, gst:gst, commHistory:commhistory});
        }
    );
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
                                // console.log("chk 1");
                        res.json({status:200})

                        // console.log("chk 2");
                    }
                    else{
                        pool.query(
                            `SELECT otp FROM otp
                            WHERE email = ($1)`,[email], (err,results) =>{
                                if(err){
                                    throw err;
                                }
                                console.log(results.rows[0].otp );
                                if(results.rows[0].otp != otp){
                                    errors.push({message: "otp did not match"});
                                    res.render('register', (errors));
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

function userInfoPost(req,res){

    console.log(req.body);
    let { chngname, chngemail, chngphone, chngaddress, chnggst, chngfoar} = req.body;
    console.log({ chngname, chngemail, chngphone, chngaddress, chnggst, chngfoar});
    let { name, email, phone, address, gst, foar} = req.user;
    console.log({ name, email, phone, address, gst});
    let errors = [];
    if(!chngname){
        name = name;
    }
    if(!chngemail){
        email = email;
    }
    if(!chngphone){
        phone = phone;
    }
    if(!chngaddress){
        address = address;
    }
    if(!chnggst){
        gst = gst;
    }
    if(!chngfoar){

    }
    
    pool.query(
        `UPDATE users
        SET name = ($1),
        email = ($2),
        phone = ($3),
        address = ($4),
        gst = ($5),
        foar = ($6)
        WHERE email = ($7)`,[chngname,chngemail,chngphone,chngaddress,chnggst,chngfoar,email], (err,results) => {
            if(err){
                throw err;
            }
            res.redirect('dashboard');
        }
    );
}

function addComment(req, res){
    let {comment, time} = req.body;
    console.log({comment, time});
    email = req.user.email;
    console.log(email);
    let commhistory, comments = [comment, time];
    // pool.query(
    //     `SELECT commhistory FROM users WHERE email = $1`,[req.user.email], (err,results) =>{
    //         if(err){
    //             throw err
    //         }
    //         console.log(results.rows[0]);
    //         commhistory = results.rows[0];
    //         comments.push(commhistory);
            // console.log(comments.toString());
            // comments = '{' + comment.toString() + ',' + time.toString() + '}'
            console.log(comments);
    //     }
    // );
    pool.query(
        `UPDATE users
        SET commhistory = commhistory || ARRAY[[$1,$2]]
        WHERE email = ($3)`,[comment, time, email], (err, results) => {
            if(err){
                throw err;
            }
            res.render('commScreen');
        }
    );
}

function commScreenSendMail(req,res){
    let email;
    pool.query(
        `SELECT email FROM users
        WHERE email = $1`,[req.user.email], (err, results) =>{
            if(err){
                throw err;
            }
            email = results.rows[0];
        }
    );
    var mailOptions={
        to : req.user.email,
        subject : "Customer Information",
        text : "Follow up is user information",
        html : htmlpage
    }
    console.log(mailOptions);
    transporter.sendMail(mailOptions, function(err, resp){
        if(err){
            console.log(err);
            // res.end("error");
        }else{
            // console.log(otpsent);
            // pool.query(
            //     `INSERT INTO otp (email, otp)
            //     VALUES ($1,$2)
            //     RETURNING email`,[email, otpsent], (err, results) => {
            //         if(err){
            //             throw err;
            //         }
            //         console.log(results.rows);
            //     }
            // );
            // console.log("Message sent: " + resp.message);

            res.sendStatus(200);
        }
    });
}

async function sendEmailSchedule(req, res){
    let args = {
        jobName: "sendEmail",
        time: 1000,
        params: {
          email: req.body.email,
          subject: "Booking Confirmed",
          body: "Your booking is confirmed!!"
        }
    };
    kue.scheduleJob(args);
     
    // Schedule Job to send email 10 minutes before the movie
    args = {
        jobName: "sendEmail",
        time: 20000, // (Start time - 10 minutes) in millieconds
        params: {
          email: req.body.email,
          subject: "Movie starts in 10 minutes",
          body:
            "Your movie will start in 10 minutes. Hurry up and grab your snacks."
        }
    };
    kue.scheduleJob(args);
     
    // Return a response
    return res.status(200).json({ response: "Booking Successful!" });
}

function loginPost(req,res){

}