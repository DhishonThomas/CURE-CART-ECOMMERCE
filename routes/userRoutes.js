const express = require('express')
const router = express.Router();
const userAuthMiddileware = require('../app/middilewares/userAuth')
const userControllers = require('../app/controllers/userControllers')




router.get('/signUp',userControllers.signUp)

router.post("/signUp",userControllers.signUpSignIn);



module.exports = router
