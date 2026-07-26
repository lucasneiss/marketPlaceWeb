const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { requireAuth } = require('../middlewares/auth');

router.get('/', AuthController.home);

router.get('/login', AuthController.showLogin);

router.get('/lobby', requireAuth, AuthController.showLobby);

router.get('/logout', AuthController.logout);

router.get('/register', AuthController.showRegister);

router.get('/profile', requireAuth, AuthController.showProfile);

router.get('/change-password', requireAuth, AuthController.showChangePassword);

router.post('/register', AuthController.register);

router.post('/login', AuthController.login);

router.post('/profile', requireAuth, AuthController.updateProfile);

router.post('/change-password', requireAuth, AuthController.changePassword);

module.exports = router;