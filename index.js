const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const path = require('path');

const app = express();
const port = 3000;

app.use('/public', express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = `uploads/${uuidv4()}`;
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Replace spaces with underscores in filenames
        const filename = file.originalname.replace(/\s/g, '_');
        cb(null, filename);
    }
});

const upload = multer({ storage });


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,  '/main.html'))
})

app.post('/convert', upload.array('images'), (req, res) => {
    console.log("Inside The Convert Function")
    const imagePaths = req.files.map(file => file.path);
    const selectedOrientation = req.body.orientation; // Get the selected orientation from the request

    // Determine the PDF filename based on the first uploaded image
    const pdfFilename = path.basename(imagePaths[0]).replace(/\.[^/.]+$/, '') + '.pdf';
    const pdfPath = path.join(__dirname, 'pdfs', pdfFilename);
    const pdfDirectory = path.dirname(pdfPath);

    console.log('PDF Path:', pdfPath);
    console.log('PDF Directory:', pdfDirectory);
    console.log('Selected Orientation:', selectedOrientation); // Log the selected orientation


    // Ensure the directory exists
    fs.mkdirSync(pdfDirectory, { recursive: true });

   // Create a PDF document using pdfkit with the selected orientation
const doc = new PDFDocument({ layout: selectedOrientation });
const writeStream = fs.createWriteStream(pdfPath);

writeStream.on('finish', () => {
    // Send a JSON response with the PDF URL
    res.json({ pdfUrl: `/download/${pdfFilename}` });
});

doc.pipe(writeStream);

// Define your desired margin values (in points)
const topMargin = 25;
const leftMargin = 25;
const rightMargin = 25;
const bottomMargin = 25;

// Determine the page width and height based on the selected orientation
const isLandscape = selectedOrientation === 'landscape';
const pageWidth = isLandscape ? 792 - leftMargin - rightMargin : 612 - leftMargin - rightMargin;
const pageHeight = isLandscape ? 612 - topMargin - bottomMargin : 792 - topMargin - bottomMargin;

// Add each image to the PDF with margins
imagePaths.forEach((imagePath, index) => {
    if (index !== 0) {
        doc.addPage({
            margin: {
                top: topMargin,
                left: leftMargin,
                right: rightMargin,
                bottom: bottomMargin
            }
        });
    }

    // Get image dimensions
    const imageSize = getImageSize(imagePath);

    // Calculate the scaling factor to fit the image within the available page area
    const scaleX = pageWidth / imageSize.width;
    const scaleY = pageHeight / imageSize.height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate the position to center the image on the page
    const xPos = leftMargin + (pageWidth - imageSize.width * scale) / 2;
    const yPos = topMargin + (pageHeight - imageSize.height * scale) / 2;

    doc.image(imagePath, xPos, yPos, { width: imageSize.width * scale, height: imageSize.height * scale });
});

// Finalize the PDF and close the write stream
doc.end();

// Function to get image dimensions
function getImageSize(imagePath) {
    const sizeOf = require('image-size');
    const dimensions = sizeOf(imagePath);
    return {
        width: dimensions.width,
        height: dimensions.height
    };
}

});

// Serve PDF files for download
app.get('/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'pdfs', filename);

    // Set response headers for download
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/pdf');

    // Stream the PDF file directly to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});