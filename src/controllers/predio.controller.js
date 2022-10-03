const { predioModel } = require('../models/predio.model');
const { userModel } = require('../models/user.model');
const { transporter } = require('../utils/mailer');
const { newPredioOptions } = require('../utils/emailOptions');
const { getPayload } = require('../utils/getPayload');
const { createHistorial } = require('./historial.controller');
const { updateUserPredioFields } = require('./user.controller');

// Listar predios:
exports.getPredios = async (req, res) => {
    try {
        const predios = await predioModel.find({ estado: 1 }) //Predios activos (estado: 1)
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
        const predio = await new predioModel(req.body)
        const { email_prop, nom_prop, codigo, doc_prop, direccion_predio } = req.body
        const { nro_doc } = getPayload(req.headers.authorization) // Extraer "nro_doc" del usuario que está creando el predio
        const existingPredio = await predioModel.findOne({ $or: [{ codigo }, { direccion_predio }] })
        if (!existingPredio) {
            await predio.save()
            transporter.sendMail(newPredioOptions(email_prop, nom_prop, codigo, doc_prop)) // Enviar email al propietario del predio
            const loggedUser = await userModel.findOne({ nro_doc }) // Buscar usuario que creó el predio
            loggedUser.created_predios += 1
            const user = updateUserPredioFields(loggedUser) // Actualizar campo "created_predios"
            const historial = createHistorial(loggedUser, "creó", codigo)
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
        const { codigo } = req.body
        const _id = req.params._id
        const { nro_doc } = getPayload(req.headers.authorization) // Extraer "nro_doc" del usuario que está editando el predio  
        await predioModel.updateOne({ _id }, { $set: req.body })
        const loggedUser = await userModel.findOne({ nro_doc }) // Buscar usuario que editó el predio
        loggedUser.edited_predios += 1
        updateUserPredioFields(loggedUser) // Actualizar campo "edited_predios"
        const historial = createHistorial(loggedUser, "editó", codigo)
        const users = await userModel.find({ estado: 1 }) // Obtener usuarios actualizados
        const predios = await predioModel.find({ estado: 1 }) // Obtener predios actualizados
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
        const predio = await predioModel.findOne({ _id }) // Buscar predio a eliminar
        const { nro_doc } = getPayload(req.headers.authorization) // Extraer "nro_doc" del usuario que está eliminando el predio 
        await predioModel.updateOne({ _id }, { $set: { estado: null } }) // Predio inactivo (estado: null)
        const loggedUser = await userModel.findOne({ nro_doc }) // Buscar usuario que eliminó el predio
        loggedUser.deleted_predios += 1
        const user = updateUserPredioFields(loggedUser) // Actualizar campo "deleted_predios"
        const historial = createHistorial(loggedUser, "eliminó", predio.codigo)
        return res.status(200).send({ status: "ok", msg: "Predio eliminado con exito!!!", user, historial });
    } catch (error) {
        console.log("Error eliminando predio: " + error)
        return res.send({ status: "error", msg: "El predio no pudo ser eliminado!!!" });
    }
}

// Consultar predios por Documento del Propietario:
exports.findPrediosByDoc = async (req, res) => {
    try {
        const doc_prop = req.params.doc_prop
        const predios = await predioModel.find({ doc_prop })
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
        const doc_prop = req.params.doc_prop;
        const associatedPredios = await predioModel.find({ estado: 1, doc_prop, asociado: true })
        if (associatedPredios !== null && associatedPredios.length > 0) {
            return res.status(200).send({ status: "ok", msg: "Predios visualizados!!!", associatedPredios });
        }
        return res.send({ status: "error", msg: "Predios NO encontrados!!!" });
    } catch (error) {
        console.log("Error listando predios asociados: " + error)
        return res.send({ status: "error", msg: "Predios NO encontrados!!!" });
    }
}
