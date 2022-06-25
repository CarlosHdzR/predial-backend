const { Router } = require('express');
const {
    login, getUsers, createUser, updateUser,
    deleteUser, changePassword, getResetLink, resetPassword
} = require('../controllers/user.controller');
const { authUsers } = require('../middlewares/authUsers');
const { upload } = require('../middlewares/fileUpload');

const userRoutes = Router()

userRoutes.post("/login", login)
userRoutes.get("/list", getUsers)
userRoutes.post("/create", authUsers, upload, createUser)
userRoutes.post("/register", createUser)
userRoutes.put("/edit/:_id", authUsers, upload, updateUser)
userRoutes.delete("/delete/:_id", authUsers, upload, deleteUser)
userRoutes.post("/change-password", changePassword)
userRoutes.post("/get-reset-link", getResetLink)
userRoutes.post("/reset-password", resetPassword)

exports.userRoutes = userRoutes;
