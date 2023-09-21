// imgToPdf/utils.js
const sizeOf = require('image-size');

function getImageSize(imagePath) {
    const dimensions = sizeOf(imagePath);
    return {
        width: dimensions.width,
        height: dimensions.height
    };
}

module.exports = { getImageSize };
