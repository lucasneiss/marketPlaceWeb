const express = require('express');
const AuthController = require('../controllers/AuthController');
const AddressController = require('../controllers/AddressController');
const NotificationController = require('../controllers/NotificationController');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', AuthController.home);
router.get('/login', AuthController.showLogin);
router.post('/login', AuthController.login);
router.get('/register', AuthController.showRegister);
router.post('/register', AuthController.register);
router.get('/logout', AuthController.logout);
router.post('/logout', AuthController.logout);
router.get('/lobby', requireAuth, AuthController.showLobby);
router.get('/profile', requireAuth, AuthController.showProfile);
router.post('/profile', requireAuth, AuthController.updateProfile);
router.get('/change-password', requireAuth, AuthController.showChangePassword);
router.post('/change-password', requireAuth, AuthController.changePassword);

router.get('/addresses', requireRole('CLIENT'), AddressController.list);
router.get('/addresses/new', requireRole('CLIENT'), AddressController.showNew);
router.get('/addresses/:id/edit', requireRole('CLIENT'), AddressController.showEdit);
router.post('/addresses', requireRole('CLIENT'), AddressController.create);
router.post('/addresses/:id', requireRole('CLIENT'), AddressController.update);
router.post('/addresses/:id/delete', requireRole('CLIENT'), AddressController.destroy);

router.get('/notifications', requireAuth, NotificationController.list);
router.patch('/notifications/read-all', requireAuth, NotificationController.markAllAsRead);
router.patch('/notifications/:id/read', requireAuth, NotificationController.markAsRead);
router.post('/notifications/:id/read', requireAuth, NotificationController.markAsRead);

module.exports = router;
