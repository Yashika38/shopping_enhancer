const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');
const faceapi = require('@vladmandic/face-api');
const { analyzeImage, recommendClothing } = require('./utils/color_analysis'); // Adjust path as per your structure

const app = express();
const port = 3000;

mongoose.connect('mongodb://localhost:27017/colorAnalyzer', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    skinColor: String,
    eyeColor: String,
    hairColor: String,
    faceShape: String,
    eyeShape: String,
    noseShape: String,
    clothingRecommendations: [String]
});

const User = mongoose.model('User', userSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

// Endpoint to upload image and get recommendations
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const image = req.file.buffer;
        const userFeatures = await analyzeImage(image);

        const user = new User(userFeatures);
        await user.save();

        res.status(201).send(user);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
