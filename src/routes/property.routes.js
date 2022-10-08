const { Router } = require('express');
const {
    getPredios, createPredio, updatePredio,
    deletePredio, findPrediosByDoc, getAssociatedPredios
} = require('../controllers/property.controller');
const { getHistorial } = require('../controllers/historial.controller');
const { authPredios } = require('../middlewares/authProperties');

const propertyRoutes = Router()

propertyRoutes.get("/list", getPredios)
propertyRoutes.get("/historial", getHistorial)
propertyRoutes.post("/create", authPredios, createPredio)
propertyRoutes.put("/edit/:_id", authPredios, updatePredio)
propertyRoutes.delete("/delete/:_id", authPredios, deletePredio)
propertyRoutes.get("/find/:owner_id_number", findPrediosByDoc)
propertyRoutes.get("/list-associated-predios/:user_id", getAssociatedPredios)

exports.propertyRoutes = propertyRoutes;