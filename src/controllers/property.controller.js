const { propertyModel } = require('../models/property.model');
const { userModel } = require('../models/user.model');
const { transporter } = require('../utils/mailer');
const { newPredioOptions } = require('../utils/emailOptions');
const { getPayload } = require('../utils/getPayload');
const { createHistorial } = require('./historial.controller');
const { updateUserPredioFields } = require('./user.controller');

// Listar predios:
exports.getPredios = async (req, res) => {
    try {
        const predios = await propertyModel.find({ active: true }) //Predios activos (active: true)
        if (predios !== null) {
            return res.status(200).send({ status: "ok", msg: "Predios visualizados!!!", predios });
        } else {
            return res.send({ status: "error", msg: "Predios NO encontrados!!!" });
        }
    } catch (error) {
        console.log(error)
    }
}

// Guardar predios:
exports.createPredio = async (req, res) => {
    try {
        const predio = await new propertyModel(req.body)
        const { owner_email, owner_name, code, owner_id_number, property_address } = req.body
        const { id_number } = getPayload(req.headers.authorization) // Extraer "id_number" del usuario que está creando el predio
        const existingPredio = await propertyModel.findOne({ $or: [{ code }, { property_address }] })
        if (!existingPredio) {
            await predio.save()
            transporter.sendMail(newPredioOptions(owner_email, owner_name, code, owner_id_number)) // Enviar email al propietario del predio
            const loggedUser = await userModel.findOne({ id_number }) // Buscar usuario que creó el predio
            loggedUser.created_properties += 1
            const user = updateUserPredioFields(loggedUser) // Actualizar campo "created_properties"
            const historial = createHistorial(loggedUser, "creó", code)
            return res.status(200).send({ status: "ok", msg: "Predio creado con exito!!!", predio, user, historial });
        } else {
            return res.send({ status: "error", msg: "Ya existe un Predio inactivo con ese Código o Dirección, en la Base de Datos!!!" });
        }
    } catch (error) {
        console.log("Error creando predio: " + error)
        return res.send({ status: "error", msg: "El predio no pudo ser creado!!!" });
    }
}

// Editar predios:
exports.updatePredio = async (req, res) => {
    try {
        const { code } = req.body
        const _id = req.params._id
        const { id_number } = getPayload(req.headers.authorization) // Extraer "id_number" del usuario que está editando el predio  
        await propertyModel.updateOne({ _id }, { $set: req.body })
        const loggedUser = await userModel.findOne({ id_number }) // Buscar usuario que editó el predio
        loggedUser.edited_properties += 1
        updateUserPredioFields(loggedUser) // Actualizar campo "edited_properties"
        const historial = createHistorial(loggedUser, "editó", code)
        const users = await userModel.find({ active: true }) // Obtener usuarios actualizados
        const predios = await propertyModel.find({ active: true }) // Obtener predios actualizados
        return res.status(200).send({ status: "ok", msg: "Predio actualizado con exito!!!", predios, users, historial });
    } catch (error) {
        console.log("Error editando predio: " + error)
        return res.send({ status: "error", msg: "El predio no pudo ser actualizado!!!" });
    }
}

// Eliminar predios:
exports.deletePredio = async (req, res) => {
    try {
        const _id = req.params._id
        const predio = await propertyModel.findOne({ _id }) // Buscar predio a eliminar
        const { id_number } = getPayload(req.headers.authorization) // Extraer "id_number" del usuario que está eliminando el predio 
        await propertyModel.updateOne({ _id }, { $set: { active: false } }) // Predio inactivo (active: false)
        const loggedUser = await userModel.findOne({ id_number }) // Buscar usuario que eliminó el predio
        loggedUser.deleted_properties += 1
        const user = updateUserPredioFields(loggedUser) // Actualizar campo "deleted_properties"
        const historial = createHistorial(loggedUser, "eliminó", predio.code)
        return res.status(200).send({ status: "ok", msg: "Predio eliminado con exito!!!", user, historial });
    } catch (error) {
        console.log("Error eliminando predio: " + error)
        return res.send({ status: "error", msg: "El predio no pudo ser eliminado!!!" });
    }
}

// Consultar predios por Documento del Propietario:
exports.findPrediosByDoc = async (req, res) => {
    try {
        const { owner_id_number } = req.params
        const predios = await propertyModel.find({ owner_id_number, active: true })
        if (predios !== null) {
            return res.send({ status: "ok", msg: "Predios Encontrados", data: predios });
        } else {
            return res.send({ status: "error", msg: "Predios NO encontrados", data: [] });
        }
    } catch (error) {
        console.log("Error consultando predios: " + error)
        return res.send({ status: "error", msg: "Predios NO encontrados", data: [] });
    }
}

// Listar predios asociados de un usuario:
exports.getAssociatedPredios = async (req, res) => {
    try {
        const { user_id } = req.params;
        const associatedPredios = await propertyModel.find({ owner: user_id, active: true })
        if (associatedPredios !== null && associatedPredios.length > 0) {
            return res.status(200).send({ status: "ok", msg: "Predios visualizados!!!", associatedPredios });
        }
        return res.send({ status: "error", msg: "Predios NO encontrados!!!" });
    } catch (error) {
        console.log("Error listando predios asociados: " + error)
        return res.send({ status: "error", msg: "Predios NO encontrados!!!" });
    }
}
