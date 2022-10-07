const { deleteImage, uploadImage } = require('../utils/cloudinary');
const fs = require('fs-extra');

exports.uploadAvatar = async (req, user) => {
    if (user.avatar.public_id) { // Verificar si el usuario ya tiene "avatar"
        await deleteImage(user.avatar.public_id) // Eliminar imágen de Cloudinary
    }
    const result = await uploadImage(req.files.image.tempFilePath) // Subir imagen a Cloudinary
    await fs.unlink(req.files.image.tempFilePath) // Borrar archivo de la carpeta temporal
    return result
}

exports.deleteAvatar = async (data, user) => {
    if (data.avatar === "delete") {
        if (user.avatar.public_id) {
            await deleteImage(user.avatar.public_id) // Eliminar imágen de Cloudinary
        }
        return "" // Limpiar "avatar" en la DB
    } else {
        return user.avatar // Devolver "avatar" existente
    }
}
