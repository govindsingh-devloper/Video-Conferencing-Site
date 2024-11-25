const express=require('express');
const router=express.Router();

const {register,login,getUserHistory,addToHistory}=require("../controllers/Auth")

router.post('/login',login)
router.post('/register',register)
router.post('/add_to_activity',addToHistory)
router.get('get_all_activity',getUserHistory)


// Export the router for use in the main application
module.exports = router