const { userModel } = require('../models/user.model');
const { propertyModel } = require('../models/property.model');
const { compare } = require('bcryptjs');
const { transporter } = require('../utils/mailer');
const { newUserOptions, resetPasswordOptions } = require('../utils/emailOptions');
const { generateAuthToken } = require('../utils/generateAuthToken');
const { getPayload } = require('../utils/getPayload');
const { deleteImage } = require('../utils/cloudinary');
const crypto = require('crypto');
const { uploadAvatar, deleteAvatar } = require('./avatar.controller');

// Iniciar sesión:
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email, active: true }) // Validar usuario
        if (!user) {
            return res.send({ msg: "Credenciales NO válidas. Intentelo de nuevo!!!", error: "Unvalid credentials" });
        }
        const passOK = await compare(password, user.password) // Validar contraseña
        if (passOK) {
            const token = generateAuthToken(user);
            return res.status(200).send({ user, token });
        } else {
            return res.send({ msg: "Credenciales NO válidas. Intentelo de nuevo!!!", error: "Unvalid credentials" });
        }
    } catch (error) {
        console.log("Error iniciando sesión: " + error)
        return res.send({ msg: "No es posible validar las credenciales!!!", error: error.message });
    }
}

// Listar usuarios:
exports.getUsers = async (req, res) => {
    try {
        const users = await userModel.find({ active: true })
        if (users !== null && users.length > 0) {
            return res.status(200).send({ msg: "Usuarios encontrados!!!", users });
        }
        return res.send({ msg: "No existen usuarios activos en la base de datos!!!" });
    } catch (error) {
        console.log("Error listando usuarios: " + error)
        return res.status(500).send();
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
                return res.status(200).send({ msg: "Usuario creado con éxito!!!", user });
            } else { // Si es usuario externo (3)
                const newUser = await userModel.findOne({ id_number });
                return res.status(200).send({ msg: "Su cuenta fue creada con éxito. Ya puede iniciar sesión!!!", user: newUser });
            }
        } else {
            if (user.role === 2) {
                return res.send({ msg: "Ya existe un Usuario inactivo con ese Número de Documento o Email, en la Base de Datos!!!", error: "Duplicated key" });
            }
            return res.send({ msg: "Ya existe una cuenta inactiva con ese Número de Documento o Email!!!", error: "Duplicated key" });
        }
    } catch (error) {
        console.log("Error creando usuario: " + error)
        return res.send({ msg: "El usuario no pudo ser creado!!!", error: error.message });
    }
}

// Editar usuario:
exports.updateUser = async (req, res) => {
    try {
        const data = req.body;
        const { user_id } = req.params;
        const { role } = getPayload(req.headers.authorization);
        const foundUser = await userModel.findOne({ _id: user_id }); // Buscar usuario a editar
        if (req.files?.image) { // Editar avatar de usuario
            const result = await uploadAvatar(req, foundUser)
            data.avatar = { public_id: result.public_id, secure_url: result.secure_url }
        } else { // Eliminar avatar de usuario
            data.avatar = await deleteAvatar(data, foundUser);
        }
        await userModel.updateOne({ _id: user_id }, { $set: data });
        const msg = role === 1 ? "Usuario actualizado con éxito!!!" : "Perfil actualizado con éxito!!!";
        const users = await userModel.find({ active: true }); // Obtener usuarios actualizados
        return res.status(200).send({ msg, users });
    } catch (error) {
        console.log("Error editando usuario: " + error)
        return res.send({ msg: "El usuario no pudo ser actualizado!!!", error: error.message });
    }
}

// Eliminar usuario:
exports.deleteUser = async (req, res) => {
    try {
        const { user_id } = req.params
        const user = await userModel.findOne({ _id: user_id }) // Buscar usuario a eliminar
        if (user.avatar.public_id) {
            await deleteImage(user.avatar.public_id) // Eliminar imágen de Cloudinary
        }
        await user.updateOne({ $set: { active: false, avatar: "", user_properties: [] } }) // Usuario inactivo - Limpiar avatar y predios asociados
        await propertyModel.updateMany({ owner: user_id }, { $unset: { owner: 1 } }); // Eliminar propietario
        return res.status(200).send({ msg: "Usuario eliminado con éxito!!!" });
    } catch (error) {
        console.log("Error eliminando usuario: " + error)
        return res.send({ msg: "El usuario no pudo ser eliminado!!!", error: error.message });
    }
}

// Cambiar contraseña:
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        const { user_id } = req.params;
        const user = await userModel.findOne({ _id: user_id }) // Buscar usuario a actualizar
        const passOK = await compare(currentPassword, user.password) // Validar password actual
        if (passOK) {
            user.password = newPassword
            await user.save()
            return res.status(200).send({ msg: "Contraseña actualizada con éxito. Por favor, inicie sesión nuevamente!!!" });
        } else {
            return res.send({ msg: "Ingrese correctamente su contraseña actual!!!", error: "Wrong password" });
        }
    } catch (error) {
        console.log("Error cambiando contraseña: " + error)
        return res.send({ msg: "No se pudo actualizar la contraseña!!!", error: error.message });
    }
}

// Solicitar one-time-link para restablecer contraseña:
exports.getResetLink = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email: email }) // Buscar usuario en la DB
        if (!user) {
            return res.send({ msg: "Por favor, revise su correo!!!" })
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
        return res.status(200).send({ msg: "Por favor, revise su correo!!!" })
    } catch (error) {
        console.log("Error enviando one-time-link: " + error)
        res.send({ msg: "Ocurrió un error. Por favor, intentelo de nuevo!!!", error: error.message });
    }
}

// Configurar nueva contraseña por medio del one-time-link:
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword, sentToken } = req.body
        const user = await userModel.findOne({ reset_token: sentToken, expire_token: { $gt: Date.now() } }) // Validar "reset_token"
        if (!user) {
            return res.send({ msg: "El link que está utilizando para restablecer su contraseña caducó. Por favor, solicite uno nuevo!!!", error: "Link expired" })
        }
        user.password = newPassword
        user.reset_token = undefined
        user.expire_token = undefined
        await user.save()
        res.status(200).send({ msg: "Contraseña restablecida con éxito. Ya puede iniciar sesión!!!" })
    } catch (error) {
        console.log("Error restableciendo contraseña: " + error)
        res.send({ msg: "No se pudo actualizar la contraseña!!!", error: error.message });
    }
}

// Asociar predios a usuario:
exports.associateProperty = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { property_id } = req.body;
        await userModel.updateOne({ _id: user_id },
            {
                $push: { user_properties: property_id }
            });
        await propertyModel.updateOne({ _id: property_id },
            {
                $set: {
                    owner: user_id
                }
            }
        );
        const associatedProperty = await propertyModel.findOne({ _id: property_id });
        res.send({ msg: "Predio asociado con éxito!!!", associatedProperty });
    } catch (error) {
        console.log("Error asociando predio: " + error)
        res.send({ msg: "No fue posible asociar el predio!!!", error: error.message });
    }
}
