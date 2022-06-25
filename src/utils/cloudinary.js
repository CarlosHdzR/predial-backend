const cloudinary = require('cloudinary').v2;
const { config } = require('../config');

const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = config.CLOUD

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET,
    secure: true
})

exports.uploadImage = async (filePath) => {
    return await cloudinary.uploader.upload(filePath, { folder: 'app-predial-avatars' });
}

exports.deleteImage = async (publicId) => {
    return await cloudinary.uploader.destroy(publicId);
}
