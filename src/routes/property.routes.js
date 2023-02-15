const { Router } = require('express');
const {
    getProperties, createProperty, updateProperty, deleteProperty,
    findPropertiesByOwnerId, getAssociatedProperties, associateProperty, payTax
} = require('../controllers/property.controller');
const { getRecords } = require('../controllers/record.controller');
const { authProperties } = require('../middlewares/authProperties');

const propertyRoutes = Router()

propertyRoutes.get("/list", getProperties)
propertyRoutes.get("/records", getRecords)
propertyRoutes.post("/create", authProperties, createProperty)
propertyRoutes.put("/edit/:property_id", authProperties, updateProperty)
propertyRoutes.put("/delete/:property_id", authProperties, deleteProperty)
propertyRoutes.get("/find/:owner_id_number", findPropertiesByOwnerId)
propertyRoutes.get("/list-associated-properties/:user_id", getAssociatedProperties)
propertyRoutes.put("/associate-property/:user_id", associateProperty)
propertyRoutes.put("/pay-tax", payTax)

exports.propertyRoutes = propertyRoutes;