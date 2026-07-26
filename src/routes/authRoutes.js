const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { requireAuth } = require('../middlewares/auth');
const AddressController = require('../controllers/AddressController');
const NotificationController = require('../controllers/NotificationController');

router.get('/', AuthController.home);

router.get('/login', AuthController.showLogin);

router.get('/lobby', requireAuth, AuthController.showLobby);

router.get('/logout', AuthController.logout);

router.get('/register', AuthController.showRegister);

router.get('/profile', requireAuth, AuthController.showProfile);

router.get('/change-password', requireAuth, AuthController.showChangePassword);

router.get('/addresses', requireAuth, AddressController.list);

router.get('/addresses/new', requireAuth, AddressController.showNew);

router.get('/addresses/:id/edit', requireAuth, AddressController.showEdit);

router.get('/notifications', requireAuth, NotificationController.list);

router.post('/register', AuthController.register);

router.post('/login', AuthController.login);

router.post('/profile', requireAuth, AuthController.updateProfile);

router.post('/change-password', requireAuth, AuthController.changePassword);

router.post('/addresses', requireAuth, AddressController.create);

router.post('/addresses/:id', requireAuth, AddressController.update);

router.post('/addresses/:id/delete', requireAuth, AddressController.destroy);

router.post('/notifications/:id/read', requireAuth, NotificationController.markAsRead);

module.exports = router;