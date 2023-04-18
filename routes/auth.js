const express = require('express')
const router = express.Router()
const authenticateUser = require('../middleware/authentication')
const { register, login, updateUser } = require('../controllers/auth')
const testUser = require('../middleware/testUser')

const rateLimiter = require('express-rate-limit')

const apiLimiter = rateLimiter({

    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        msg: 'Too many request from this IP, please try again after 15 min'
    }
})

router.post('/register', register);
router.post('/login',apiLimiter, login);
router.patch('/updateUser',authenticateUser,updateUser);

module.exports = router
