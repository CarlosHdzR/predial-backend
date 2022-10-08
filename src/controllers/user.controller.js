const { userModel } = require('../models/user.model');
const { compare } = require('bcryptjs');
const { transporter } = require('../utils/mailer');
const { newUserOptions, resetPasswordOptions } = require('../utils/emailOptions');
const { generateAuthToken } = require('../utils/generateAuthToken');
const { getPayload } = require('../utils/getPayload');
const { deleteImage } = require('../utils/cloudinary');
const crypto = require('crypto');
const { uploadAvatar, deleteAvatar } = require('./avatar.controller');
const { propertyModel } = require('../models/predio.model');

// Iniciar sesión:
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email, active: true }) // Validar usuario
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
        const users = await userModel.find({ active: true }) // Usuarios activos (active: true)
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
        const { id_number, email, name, password } = req.body
        const existingUser = await userModel.findOne({ $or: [{ id_number }, { email }] }) // Validar si el usuario ya existe
        if (!existingUser) {
            if (req.files?.image) { // Subir avatar de usuario
                const result = await uploadAvatar(req, user)
                user.setAvatar({ public_id: result.public_id, secure_url: result.secure_url })
            }
            await user.save()
            if (user.role === 2) { // Si es un usuario interno (2), enviar email con credenciales
                try {
                    transporter.sendMail(newUserOptions(email, name, password))
                } catch (error) {
                    console.log("Error enviando email: " + error)
                }
                return res.status(200).send({ status: "ok", msg: "Usuario creado con éxito!!!", user });
            } else { // Si es usuario externo (3)
                const newUser = await userModel.findOne({ id_number });
                return res.status(200).send({ status: "ok", msg: "Su cuenta fue creada con éxito. Ya puede iniciar sesión!!!", user: newUser });
            }
        } else {
            if (user.role === 2) {
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
        const { role } = getPayload(req.headers.authorization);
        const foundUser = await userModel.findOne({ _id }); // Buscar usuario a editar
        if (req.files?.image) { // Editar avatar de usuario
            const result = await uploadAvatar(req, foundUser)
            data.avatar = { public_id: result.public_id, secure_url: result.secure_url }
        } else { // Eliminar avatar de usuario
            data.avatar = await deleteAvatar(data, foundUser);
        }
        await userModel.updateOne({ _id }, { $set: data });
        const msg = role === 1 ? "Usuario actualizado con éxito!!!" : "Perfil actualizado con éxito!!!";
        const users = await userModel.find({ active: true }); // Obtener usuarios actualizados
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
                created_properties: user.created_properties,
                edited_properties: user.edited_properties,
                deleted_properties: user.deleted_properties
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
        await userModel.updateOne({ _id }, { $set: { active: false, avatar: "" } }) // Usuario inactivo (active: false)
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
        const { id_number } = getPayload(req.headers.authorization)
        const user = await userModel.findOne({ id_number }) // Buscar usuario a actualizar
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
        const { name } = user
        transporter.sendMail(resetPasswordOptions(email, name, resetToken)) // Enviar one-time-link al "email" del usuario
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
        const { property_id } = req.body;
        const predioToAssociate = await propertyModel.findOne({ _id: property_id });
        if (!predioToAssociate.associated) {
            await userModel.updateOne({ _id: user_id },
                {
                    $push: { user_properties: property_id }
                });
            await propertyModel.updateOne({ _id: property_id },
                {
                    $set: { 
                        associated: true,
                        owner: user_id
                    }
                }
            );
            const associatedPredio = await propertyModel.findOne({ _id: property_id });
            res.send({ status: "ok", msg: "Predio asociado con éxito!!!", associatedPredio });
        } else {
            res.send({ status: "error", msg: "El predio ya fue asociado!!!" });
        }
    } catch (error) {
        console.log("Error asociando predio: " + error)
        res.send({ status: "error", msg: "No fue posible asociar el predio" });
    }
}
