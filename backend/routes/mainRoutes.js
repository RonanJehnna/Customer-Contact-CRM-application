var express = require('express');
var mainController = require('../controllers/mainController');
var router = express.Router();



//==============================================================
//================ Get REQUEST =============================
//=============================================================
router.route('/').get(mainController.home);
router.route('/users/register').get(mainController.register);
router.route('/users/login').get(mainController.login);
router.route('/users/dashboard').get(mainController.dashboard);
router.route('/users/logout').get(mainController.logout);


//==============================================================
//================== POST REQUEST ROUTER =======================
//==============================================================
router.route('/users/register').post(mainController.registerPost);
router.route('/users/login').post(mainController.loginPost);
// router.route('/users/register').post(mainController.registerPost);


module.exports = router;