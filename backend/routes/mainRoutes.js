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
router.route('/users/userinfo').get(mainController.userInfo);
router.route('/users/commScreen').get(mainController.commScreen);


//==============================================================
//================== POST REQUEST ROUTER =======================
//==============================================================
router.route('/users/register').post(mainController.registerPost);
router.route('/users/login').post(mainController.loginPost);
router.route('/users/userinfo').post(mainController.userInfoPost);
// router.route('/users/commScreen').post(mainController.commScreenPost);
router.route('/users/commScreenData').post(mainController.commScreenData);
router.route('/users/addComment').post(mainController.addComment);
router.route('/users/commScreenSendMail').post(mainController.commScreenSendMail);
router.route('/users/sendEmailSchedule').post(mainController.sendEmailSchedule);
// router.route('/users/register').post(mainController.registerPost);


module.exports = router;