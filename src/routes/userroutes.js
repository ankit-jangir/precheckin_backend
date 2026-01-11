const router = require("express").Router()
const UsersController = require("../controllers/UsersController");
const validateToken = require("../middleware/authMiddleware ");



// router.post("/add",UserController.addUser);
// router.get("/",UserController.allUser);


router.post('/register-with-phone', UsersController.registerWithPhone);
router.post('/verifyOTP',UsersController.verifyOTP);
router.post('/Logout',validateToken, UsersController.UserLogout);

module.exports = router