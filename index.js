const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Multer for file upload
const upload = multer({ dest: 'uploads/' });

// In-memory storage for password
let storedPassword = '';

// Serve the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to upload a file
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.body.password || !req.file) {
        return res.status(400).send('Password and file are required.');
    }

    // Hash and store the password
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
            return res.status(500).send('Error saving password.');
        }
        storedPassword = hash;

        // Save the file information
        fs.renameSync(req.file.path, `uploads/${req.file.originalname}`);
        res.send('File uploaded and password saved!');
    });
});

// Endpoint to download the file
app.post('/download', (req, res) => {
    const { password, filename } = req.body;

    if (!password || !filename) {
        return res.status(400).send('Password and filename are required.');
    }

    // Verify password
    bcrypt.compare(password, storedPassword, (err, result) => {
        if (err || !result) {
            return res.status(401).send('Invalid password.');
        }

        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).send('File not found.');
        }
    });
});

// Start the server locally
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
