const { propertyModel } = require('../models/property.model');
const { transporter } = require('../utils/mailer');
const { newPropertyOptions } = require('../utils/emailOptions');
const { getPayload } = require('../utils/getPayload');
const { createRecord } = require('./record.controller');

// Listar predios:
exports.getProperties = async (req, res) => {
    try {
        const properties = await propertyModel.find({ active: true })
        if (properties !== null) {
            return res.status(200).send({ status: "ok", msg: "Predios visualizados!!!", properties });
        } else {
            return res.send({ status: "error", msg: "Predios NO encontrados!!!" });
        }
    } catch (error) {
        console.log(error)
    }
}

// Guardar predios:
exports.createProperty = async (req, res) => {
    try {
        const property = await new propertyModel(req.body)
        const { owner_email, owner_name, code, owner_id_number, address } = req.body
        const user_id = getPayload(req.headers.authorization)._id; // Extraer "_id" del usuario que está creando el predio
        const existingProperty = await propertyModel.findOne({ $or: [{ code }, { address }] })
        if (!existingProperty) {
            await property.save()
            transporter.sendMail(newPropertyOptions(owner_email, owner_name, code, owner_id_number)) // Enviar email al propietario del predio
            const record = await createRecord(user_id, "creó", code);
            return res.status(200).send({ status: "ok", msg: "Predio creado con exito!!!", property, record });
        } else {
            return res.send({ status: "error", msg: "Ya existe un Predio inactivo con ese Código o Dirección, en la Base de Datos!!!" });
        }
    } catch (error) {
        console.log("Error creando predio: " + error)
        return res.send({ status: "error", msg: "El predio no pudo ser creado!!!" });
    }
}

// Editar predios:
exports.updateProperty = async (req, res) => {
    try {
        const { property_id } = req.params
        const { code } = req.body
        const user_id = getPayload(req.headers.authorization)._id // Extraer "_id" del usuario que está editando el predio  
        await propertyModel.updateOne({ _id: property_id }, { $set: req.body })
        const properties = await propertyModel.find({ active: true }) // Obtener predios actualizados
        const record = await createRecord(user_id, "editó", code);
        return res.status(200).send({ status: "ok", msg: "Predio actualizado con exito!!!", properties, record });
    } catch (error) {
        console.log("Error editando predio: " + error)
        return res.send({ status: "error", msg: "El predio no pudo ser actualizado!!!" });
    }
}

// Eliminar predios:
exports.deleteProperty = async (req, res) => {
    try {
        const { property_id } = req.params
        const property = await propertyModel.findOne({ _id: property_id }) // Buscar predio a eliminar
        const user_id = getPayload(req.headers.authorization)._id; // Extraer "id_number" del usuario que está eliminando el predio 
        await propertyModel.updateOne({ _id: property_id }, { $set: { active: false } }) // Predio inactivo (active: false)
        const record = await createRecord(user_id, "eliminó", property.code);
        return res.status(200).send({ status: "ok", msg: "Predio eliminado con exito!!!", record });
    } catch (error) {
        console.log("Error eliminando predio: " + error)
        return res.send({ status: "error", msg: "El predio no pudo ser eliminado!!!" });
    }
}

// Consultar predios por Nro. de Documento del Propietario:
exports.findPropertiesByOwnerId = async (req, res) => {
    try {
        const { owner_id_number } = req.params
        const foundProperties = await propertyModel.find({ owner_id_number, active: true })
        if (foundProperties !== null && foundProperties.length > 0) {
            return res.send({ status: "ok", msg: "Predios Encontrados", foundProperties });
        }
        return res.send({ status: "ok", msg: "No se encontraron resultados para el documento", foundProperties: [] });
    } catch (error) {
        console.log("Error consultando predios: " + error)
        return res.send({ status: "error", msg: "Server error" });
    }
}

// Listar predios asociados de un usuario:
exports.getAssociatedProperties = async (req, res) => {
    try {
        const { user_id } = req.params;
        const associatedProperties = await propertyModel.find({ owner: user_id, active: true })
        if (associatedProperties !== null && associatedProperties.length > 0) {
            return res.status(200).send({ status: "ok", msg: "Predios visualizados!!!", associatedProperties });
        }
        return res.send({ status: "error", msg: "Predios NO encontrados!!!" });
    } catch (error) {
        console.log("Error listando predios asociados: " + error)
        return res.send({ status: "error", msg: error.message });
    }
}
