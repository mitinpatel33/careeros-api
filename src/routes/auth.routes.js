const express = require('express');
const {
  signup,
  login,
  refreshToken,
  logout,
} = require('../controllers/auth.controller');

const router = express.Router();

/**
 *    title: 'Register a new candidate',
 *    description: 'Create a new candidate account',
 *    requestBody: {
 *        email: 'user@example.com',
 *        password: 'secret',
 *        name: 'John Doe'
 *    },
 *    responses: {
 *        201: { description: 'User created', schema: { success: true, token: 'jwt...' } }
 *    }
 */
router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

module.exports = router;
