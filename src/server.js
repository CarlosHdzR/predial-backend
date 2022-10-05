const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectToDB } = require('./utils/mongoose');
const { router } = require('./routes/index.routes');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

//Middlewares:
app.use(morgan("dev"))
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Router:
app.use(router)

// Conección a Base de Datos:
connectToDB();

// Iniciar servidor:
app.listen(PORT, function () {
    console.log(`********** SERVER LISTENING ON PORT ${PORT} **********\n`);
})
