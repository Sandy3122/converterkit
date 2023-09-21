const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const { getImageSize } = require('../utils');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use path.join to create the correct directory structure
        const dir = path.join(__dirname, '../public/imgToPdf/uploads', uuidv4());
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const filename = file.originalname.replace(/\s/g, '_');
        cb(null, filename);
    }
});

const upload = multer({ storage });

function convert(req, res) {
    try {
        console.log("Convert Function Is Called");
        const imagePaths = req.files.map(file => file.path);
        const selectedOrientation = req.body.orientation;

        const pdfFilename = path.basename(imagePaths[0]).replace(/\.[^/.]+$/, '') + '.pdf';
        const pdfPath = path.join(__dirname, '../public/imgToPdf/pdfs', pdfFilename);
        const pdfDirectory = path.dirname(pdfPath);

        console.log('PDF Path:', pdfPath);
        console.log('PDF Directory:', pdfDirectory);
        console.log('Selected Orientation:', selectedOrientation);

        fs.mkdirSync(pdfDirectory, { recursive: true });

        const doc = new PDFDocument({ layout: selectedOrientation });
        const writeStream = fs.createWriteStream(pdfPath);

        writeStream.on('finish', () => {
            res.json({ pdfUrl: `/public/imgToPdf/download/${pdfFilename}` });
        });

        doc.pipe(writeStream);

        const topMargin = 25;
        const leftMargin = 25;
        const rightMargin = 25;
        const bottomMargin = 25;

        const isLandscape = selectedOrientation === 'landscape';
        const pageWidth = isLandscape ? 792 - leftMargin - rightMargin : 612 - leftMargin - rightMargin;
        const pageHeight = isLandscape ? 612 - topMargin - bottomMargin : 792 - topMargin - bottomMargin;

        imagePaths.forEach((imagePath, index) => {
            if (index !== 0) {
                doc.addPage({
                    layout: selectedOrientation,
                    margin: {
                        top: topMargin,
                        left: leftMargin,
                        right: rightMargin,
                        bottom: bottomMargin
                    }
                });
            }

            const imageSize = getImageSize(imagePath);
            const scaleX = pageWidth / imageSize.width;
            const scaleY = pageHeight / imageSize.height;
            const scale = Math.min(scaleX, scaleY);

            // Calculate the position to center the image on the page
            const xPos = leftMargin + (pageWidth - imageSize.width * scale) / 2;
            const yPos = topMargin + (pageHeight - imageSize.height * scale) / 2;

            doc.image(imagePath, xPos, yPos, { width: imageSize.width * scale, height: imageSize.height * scale });
        });

        doc.end();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

function download(req, res) {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../public/imgToPdf/pdfs', filename);

        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', 'application/pdf');

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { convert, download };
