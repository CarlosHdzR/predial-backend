const { Router } = require('express');
const {
    getProperties, createProperty, updateProperty, deleteProperty,
    findPropertiesByOwnerId, getAssociatedProperties
} = require('../controllers/property.controller');
const { getHistorial } = require('../controllers/historial.controller');
const { authProperties } = require('../middlewares/authProperties');

const propertyRoutes = Router()

propertyRoutes.get("/list", getProperties)
propertyRoutes.get("/historial", getHistorial)
propertyRoutes.post("/create", authProperties, createProperty)
propertyRoutes.put("/edit/:property_id", authProperties, updateProperty)
propertyRoutes.delete("/delete/:property_id", authProperties, deleteProperty)
propertyRoutes.get("/find/:owner_id_number", findPropertiesByOwnerId)
propertyRoutes.get("/list-associated-properties/:user_id", getAssociatedProperties)

exports.propertyRoutes = propertyRoutes;