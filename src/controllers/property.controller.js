const { propertyModel } = require('../models/property.model');
const { transporter } = require('../utils/mailer');
const { newPropertyOptions } = require('../utils/emailOptions');
const { getPayload } = require('../utils/getPayload');
const { createRecord } = require('./record.controller');
const { userModel } = require('../models/user.model');

// Listar predios:
exports.getProperties = async (req, res) => {
    try {
        const properties = await propertyModel.find({ active: true })
        if (properties !== null && properties.length > 0) {
            return res.status(200).send({ msg: "Predios encontrados!!!", properties });
        }
        return res.send({ msg: "No existen predios activos en la base de datos!!!" });
    } catch (error) {
        console.log(error)
        return res.status(500).send();
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
            return res.status(200).send({ msg: "Predio creado con exito!!!", property, record });
        } else {
            return res.send({ msg: "Ya existe un Predio inactivo con ese Código o Dirección, en la Base de Datos!!!", error: "Duplicated key" });
        }
    } catch (error) {
        console.log("Error creando predio: " + error)
        return res.send({ msg: "El predio no pudo ser creado!!!", error: error.message });
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
        return res.status(200).send({ msg: "Predio actualizado con exito!!!", properties, record });
    } catch (error) {
        console.log("Error editando predio: " + error)
        return res.send({ msg: "El predio no pudo ser actualizado!!!", error: error.message });
    }
}

// Eliminar predios:
exports.deleteProperty = async (req, res) => {
    try {
        const { property_id } = req.params
        const user_id = getPayload(req.headers.authorization)._id; // Extraer "id_number" del usuario que está eliminando el predio 
        const property = await propertyModel.findOneAndUpdate(
            { _id: property_id }, { $set: { active: false, tax_paid: false}, $unset: { owner: 1 } } // Predio inactivo - Eliminar propietario
        );
        await userModel.updateOne({ _id: property.owner }, { $pull: { user_properties: property_id } }) // Desasociar predio
        const record = await createRecord(user_id, "eliminó", property.code);
        return res.status(200).send({ msg: "Predio eliminado con exito!!!", record });
    } catch (error) {
        console.log("Error eliminando predio: " + error)
        return res.send({ msg: "El predio no pudo ser eliminado!!!", error: error.message });
    }
}

// Consultar predios por Nro. de Documento del Propietario:
exports.findPropertiesByOwnerId = async (req, res) => {
    try {
        const { owner_id_number } = req.params
        const foundProperties = await propertyModel.find({ owner_id_number, active: true })
        if (foundProperties !== null && foundProperties.length > 0) {
            return res.status(200).send({ msg: "Predios Encontrados", foundProperties });
        }
        return res.send({ msg: "No se encontraron resultados para el documento" });
    } catch (error) {
        console.log("Error consultando predios: " + error)
        return res.status(500).send();
    }
}

// Asociar predios a usuario:
exports.associateProperty = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { property_id } = req.body;
        await userModel.updateOne({ _id: user_id }, { $push: { user_properties: property_id } });
        const associatedProperty = await propertyModel.findOneAndUpdate(
            { _id: property_id }, { $set: { owner: user_id } }, { new: true }
        );
        res.send({ msg: "Predio asociado con éxito!!!", associatedProperty });
    } catch (error) {
        console.log("Error asociando predio: " + error)
        res.send({ msg: "No fue posible asociar el predio!!!", error: error.message });
    }
}

// Listar predios asociados de un usuario:
exports.getAssociatedProperties = async (req, res) => {
    try {
        const { user_id } = req.params;
        const associatedProperties = await propertyModel.find({ owner: user_id, active: true })
        if (associatedProperties !== null && associatedProperties.length > 0) {
            return res.status(200).send({ msg: "Predios visualizados!!!", associatedProperties });
        }
        return res.send({ msg: "Predios NO encontrados!!!" });
    } catch (error) {
        console.log("Error listando predios asociados: " + error)
        return res.status(500).send();
    }
}

// Pagar impuesto predial:
exports.payTax = async (req, res) => {
    try {
        const { code } = req.body;
        const property = await propertyModel.findOneAndUpdate({ code }, { $set: { tax_paid: true } }, { new: true });
        res.status(200).send({ msg: "Pago procesado exitosamente!!!", property });
    } catch (error) {
        console.log("Error pagando impuesto: " + error);
        res.send({ msg: "No fue posible procesar el pago!!!", error: error.message });
    }
}
