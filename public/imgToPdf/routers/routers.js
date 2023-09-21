// imgToPdf/routers.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const imgToPdfController = require('../controllers/imgToPdfController.js');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads'; // Store files in the 'uploads' directory
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const filename = file.originalname.replace(/\s/g, '_');
        cb(null, filename);
    }
});

const upload = multer({ storage });


// Define routes for imgToPdf functionality
// router.get('/pdf', imgToPdfController.land)
router.post('/convert', upload.array('images'), imgToPdfController.convert);
router.get('/download/:filename', imgToPdfController.download);

module.exports = router;
