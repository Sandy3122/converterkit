const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv')

// To access the .env 
dotenv.config();

// Enable CORS for all routes
const corsOptions = {
    origin: '*',
};

app.use(cors(corsOptions));

app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve the index.html as the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/main.html'));
});

const imgToPdfRoutes = require('./public/imgToPdf/routers/routers')

app.use('/public/imgToPdf', imgToPdfRoutes)

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on PORT ${port}`);
});