const { Router } = require('express');
const { userRoutes } = require('./user.routes');
const { predioRoutes } = require('./predio.routes');

const router = Router();

// Ruta principal
router.get('/', (req, res) => {
    res.send("Plataforma de Gestión Catastral - Backend")
})

router.use("/users", userRoutes);
router.use("/predios", predioRoutes);

exports.router = router;
