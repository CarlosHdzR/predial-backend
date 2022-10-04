const { userModel } = require('../models/user.model');
const { compare } = require('bcryptjs');
const { transporter } = require('../utils/mailer');
const { newUserOptions, resetPasswordOptions } = require('../utils/emailOptions');
const { generateAuthToken } = require('../utils/generateAuthToken');
const { getPayload } = require('../utils/getPayload');
const { deleteImage } = require('../utils/cloudinary');
const crypto = require('crypto');
const { uploadAvatar, deleteAvatar } = require('./avatar.controller');
const { predioModel } = require('../models/predio.model');

// Iniciar sesión:
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email, estado: 1 }) // Validar usuario
        if (!user) {
            return res.send({ status: "error", msg: "Credenciales NO válidas. Intentelo de nuevo!!!" });
        }
        const passOK = await compare(password, user.password) // Validar contraseña
        if (passOK) {
            const token = generateAuthToken(user);
            return res.status(200).send({ status: "ok", user, token });
        } else {
            return res.send({ status: "error", msg: "Credenciales NO válidas. Intentelo de nuevo!!!" });
        }
    } catch (error) {
        console.log("Error iniciando sesión: " + error)
    }
}

// Listar usuarios:
exports.getUsers = async (req, res) => {
    try {
        const users = await userModel.find({ estado: 1 }) // Usuarios activos (estado: 1)
        if (users !== null) {
            return res.status(200).send({ status: "ok", msg: "Usuarios encontrados!!!", users });
        } else {
            return res.send({ status: "error", msg: "Usuarios NO encontrados!!!" });
        }
    } catch (error) {
        console.log(error)
    }
}

// Guardar usuario:
exports.createUser = async (req, res) => {
    try {
        const user = await new userModel(req.body)
        user.avatar = ""
        const { nro_doc, email, nombres, password } = req.body
        const existingUser = await userModel.findOne({ $or: [{ nro_doc }, { email }] }) // Validar si el usuario ya existe
        if (!existingUser) {
            if (req.files?.imagen) { // Subir avatar de usuario
                const result = await uploadAvatar(req, user)
                user.setAvatar({ public_id: result.public_id, secure_url: result.secure_url })
            }
            await user.save()
            if (user.rol === 2) { // Si es un usuario interno (2), enviar email con credenciales
                try {
                    transporter.sendMail(newUserOptions(email, nombres, password))
                } catch (error) {
                    console.log("Error enviando email: " + error)
                }
                return res.status(200).send({ status: "ok", msg: "Usuario creado con éxito!!!", user });
            } else { // Si es usuario externo (3)
                const newUser = await userModel.findOne({ nro_doc });
                return res.status(200).send({ status: "ok", msg: "Su cuenta fue creada con éxito. Ya puede iniciar sesión!!!", user: newUser });
            }
        } else {
            if (user.rol === 2) {
                return res.send({ status: "error", msg: "Ya existe un Usuario inactivo con ese Número de Documento o Email, en la Base de Datos!!!" });
            }
            return res.send({ status: "error", msg: "Ya existe una cuenta inactiva con ese Número de Documento o Email!!!" });
        }
    } catch (error) {
        console.log("Error creando usuario: " + error)
        return res.send({ status: "error", msg: "El usuario no pudo ser creado!!!" });
    }
}

// Editar usuario:
exports.updateUser = async (req, res) => {
    try {
        const data = req.body;
        const _id = req.params._id;
        const { rol } = getPayload(req.headers.authorization);
        const foundUser = await userModel.findOne({ _id }); // Buscar usuario a editar
        if (req.files?.imagen) { // Editar avatar de usuario
            const result = await uploadAvatar(req, foundUser)
            data.avatar = { public_id: result.public_id, secure_url: result.secure_url }
        } else { // Eliminar avatar de usuario
            data.avatar = await deleteAvatar(data, foundUser);
        }
        await userModel.updateOne({ _id }, { $set: data });
        const msg = rol === 1 ? "Usuario actualizado con éxito!!!" : "Perfil actualizado con éxito!!!";
        const users = await userModel.find({ estado: 1 }); // Obtener usuarios actualizados
        return res.status(200).send({ status: "ok", msg, users });
    } catch (error) {
        console.log("Error editando usuario: " + error)
        return res.send({ status: "error", msg: "El usuario no pudo ser actualizado!!!" });
    }
}

// Actualizar campos de Actividad de Predios en usuario:
exports.updateUserPredioFields = (user) => {
    try {
        user.updateOne({
            $set: {
                created_predios: user.created_predios,
                edited_predios: user.edited_predios,
                deleted_predios: user.deleted_predios
            }
        }, (error) => {
            if (error) console.log("Error actualizando campos de Actividad de Predios: " + error)
        })
        return user;
    } catch (error) {
        console.log(error)
    }
}

// Eliminar usuario:
exports.deleteUser = async (req, res) => {
    try {
        const _id = req.params._id
        const user = await userModel.findOne({ _id }) // Buscar usuario a eliminar
        if (user.avatar.public_id) {
            await deleteImage(user.avatar.public_id) // Eliminar imágen de Cloudinary
        }
        await userModel.updateOne({ _id }, { $set: { estado: null, avatar: "" } }) // Usuario inactivo (estado: null)
        return res.status(200).send({ status: "ok", msg: "Usuario eliminado con éxito!!!" });
    } catch (error) {
        console.log("Error eliminando usuario: " + error)
        return res.send({ status: "error", msg: "El usuario no pudo ser eliminado!!!" });
    }
}

// Cambiar contraseña:
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        const { nro_doc } = getPayload(req.headers.authorization)
        const user = await userModel.findOne({ nro_doc }) // Buscar usuario a actualizar
        const passOK = await compare(currentPassword, user.password) // Validar password actual
        if (passOK) {
            user.password = newPassword
            await user.save()
            return res.status(200).send({ status: "ok", msg: "Contraseña actualizada con éxito. Por favor, inicie sesión nuevamente!!!" });
        } else {
            return res.send({ status: "error", msg: "Ingrese correctamente su contraseña actual!!!" });
        }
    } catch (error) {
        console.log("Error cambiando contraseña: " + error)
        return res.send({ status: "error", msg: "No se pudo actualizar la contraseña!!!" });
    }
}

// Solicitar one-time-link para restablecer contraseña:
exports.getResetLink = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email: email }) // Buscar usuario en la DB
        if (!user) {
            return res.send({ status: "ok", msg: "Por favor, revise su correo!!!" })
        }
        const resetToken = crypto.randomBytes(32).toString('hex') // Generar token        
        await userModel.updateOne({ email },
            {
                $set: {
                    reset_token: resetToken,
                    expire_token: Date.now() + 3600000 // (Hora actual + 1h)
                }
            })
        const { nombres } = user
        transporter.sendMail(resetPasswordOptions(email, nombres, resetToken)) // Enviar one-time-link al "email" del usuario
        return res.status(200).send({ status: "ok", msg: "Por favor, revise su correo!!!" })
    } catch (error) {
        console.log("Error enviando one-time-link: " + error)
        res.send({ status: "error", msg: "Ocurrió un error. Por favor, intentelo de nuevo!!!" });
    }
}

// Configurar nueva contraseña por medio del one-time-link:
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword, sentToken } = req.body
        const user = await userModel.findOne({ reset_token: sentToken, expire_token: { $gt: Date.now() } }) // Validar "reset_token"
        if (!user) {
            return res.send({ status: "error", msg: "El link que está utilizando para restablecer su contraseña caducó. Por favor, solicite uno nuevo!!!" })
        }
        user.password = newPassword
        user.reset_token = undefined
        user.expire_token = undefined
        await user.save()
        res.status(200).send({ status: "ok", msg: "Contraseña restablecida con éxito. Ya puede iniciar sesión!!!" })
    } catch (error) {
        console.log("Error restableciendo contraseña: " + error)
        res.send({ status: "error", msg: "No se pudo actualizar la contraseña" });
    }
}

// Asociar predios a usuario:
exports.associatePredio = async (req, res) => {
    try {
        const user_id = req.params._id;
        const { predio_id } = req.body;
        const predioToAssociate = await predioModel.findOne({ _id: predio_id });
        if (!predioToAssociate.asociado) {
            await userModel.updateOne({ _id: user_id },
                {
                    $push: { predios: predio_id }
                });
            await predioModel.updateOne({ _id: predio_id },
                {
                    $push: { owner: user_id },
                    $set: { asociado: true }
                }
            );
            const associatedPredio = await predioModel.findOne({ _id: predio_id });
            res.send({ status: "ok", msg: "Predio asociado con éxito!!!", associatedPredio });
        } else {
            res.send({ status: "error", msg: "El predio ya fue asociado!!!" });
        }
    } catch (error) {
        console.log("Error asociando predio: " + error)
        res.send({ status: "error", msg: "No fue posible asociar el predio" });
    }
}
