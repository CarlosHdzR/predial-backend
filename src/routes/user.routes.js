const { Router } = require('express');
const {
    login, getUsers, createUser, updateUser, deleteUser, 
    changePassword, getResetLink, resetPassword
} = require('../controllers/user.controller');
const { authUsers } = require('../middlewares/authUsers');
const { upload } = require('../middlewares/fileUpload');

const userRoutes = Router()

userRoutes.post("/login", login)
userRoutes.get("/list", getUsers)
userRoutes.post("/create", authUsers, upload, createUser)
userRoutes.post("/register", createUser)
userRoutes.put("/edit/:user_id", authUsers, upload, updateUser)
userRoutes.put("/delete/:user_id", authUsers, upload, deleteUser)
userRoutes.put("/change-password/:user_id", authUsers, changePassword)
userRoutes.put("/get-reset-link", getResetLink)
userRoutes.put("/reset-password", resetPassword)

exports.userRoutes = userRoutes;
