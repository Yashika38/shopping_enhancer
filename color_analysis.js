const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');
const faceapi = require('@vladmandic/face-api');

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

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

async function analyzeImage(image) {
    const canvas = createCanvas(250, 250);
    const ctx = canvas.getContext('2d');
    const img = await loadImage(image);
    ctx.drawImage(img, 0, 0, 250, 250);

    const detections = await faceapi.detectSingleFace(canvas).withFaceLandmarks().withFaceDescriptor();

    if (!detections) {
        throw new Error('Face not detected');
    }

    const skinColor = extractSkinColor(ctx);
    const eyeColor = extractEyeColor(ctx, detections.landmarks.getLeftEye());
    const hairColor = extractHairColor(ctx, detections.landmarks.getLeftEye());
    const faceShape = extractFaceShape(detections.landmarks);
    const eyeShape = extractEyeShape(detections.landmarks);
    const noseShape = extractNoseShape(detections.landmarks);

    return {
        skinColor,
        eyeColor,
        hairColor,
        faceShape,
        eyeShape,
        noseShape,
        clothingRecommendations: recommendClothing(skinColor, eyeColor, hairColor, faceShape, eyeShape, noseShape)
    };
}

function extractSkinColor(ctx) {
    const skinRegion = ctx.getImageData(50, 50, 150, 150); // Sample area from the center of the image
    const skinColor = dominantColor(skinRegion.data);
    return skinColor;
}

function extractEyeColor(ctx, eyeLandmarks) {
    const eyeRegion = ctx.getImageData(eyeLandmarks[0].x, eyeLandmarks[0].y, 20, 20); // Sample small area around the eye
    const eyeColor = dominantColor(eyeRegion.data);
    return eyeColor;
}

function extractHairColor(ctx, hairLandmarks) {
    const hairRegion = ctx.getImageData(hairLandmarks[0].x, hairLandmarks[0].y - 30, 20, 20); // Sample small area above the eye for hair
    const hairColor = dominantColor(hairRegion.data);
    return hairColor;
}

function extractFaceShape(landmarks) {
    const jawWidth = landmarks.positions[jawRight].x - landmarks.positions[jawLeft].x;
    const faceHeight = landmarks.positions[jawBottom].y - landmarks.positions[forehead].y;
    const aspectRatio = jawWidth / faceHeight;

    if (aspectRatio > 0.8 && aspectRatio < 1.1) return 'round';
    if (aspectRatio <= 0.8) return 'oval';
    if (aspectRatio >= 1.1) return 'square';
    return 'unknown';
}

function extractEyeShape(landmarks) {
    const eyeWidth = landmarks.positions[rightEyeRight].x - landmarks.positions[rightEyeLeft].x;
    const eyeHeight = landmarks.positions[rightEyeBottom].y - landmarks.positions[rightEyeTop].y;
    const eyeAspectRatio = eyeWidth / eyeHeight;

    if (eyeAspectRatio > 1.5) return 'almond';
    if (eyeAspectRatio <= 1.5) return 'round';
    return 'unknown';
}

function extractNoseShape(landmarks) {
    const noseWidth = landmarks.positions[noseRight].x - landmarks.positions[noseLeft].x;
    const noseHeight = landmarks.positions[noseBottom].y - landmarks.positions[noseBridge].y;
    const noseAspectRatio = noseWidth / noseHeight;

    if (noseAspectRatio > 0.7) return 'straight';
    if (noseAspectRatio <= 0.7) return 'curved';
    return 'unknown';
}

function recommendClothing(skinColor, eyeColor, hairColor, faceShape, eyeShape, noseShape) {
    const recommendations = [];

    const colorPalettes = {
        fair: ['#F0E68C', '#FFB6C1', '#ADD8E6', '#FF69B4', '#E6E6FA'], // Khaki, Light Pink, Light Blue, Hot Pink, Lavender
        medium: ['#FFD700', '#FF6347', '#4682B4', '#DAA520', '#DDA0DD'], // Gold, Tomato, Steel Blue, Golden Rod, Plum
        dark: ['#8B4513', '#B22222', '#556B2F', '#8B008B', '#483D8B']  // Saddle Brown, Firebrick, Dark Olive Green, Dark Magenta, Dark Slate Blue
    };

    const clothingStyles = {
        casual: ['T-shirt', 'Jeans', 'Sweatshirt', 'Shorts'],
        formal: ['Suit', 'Blazer', 'Dress Shirt', 'Dress Pants'],
        sporty: ['Tracksuit', 'Gym Shorts', 'Sports Bra', 'Running Shoes'],
        trendy: ['Crop Top', 'Ripped Jeans', 'Leather Jacket', 'Sneakers']
    };

    let palette;
    if (skinColor === 'fair') palette = colorPalettes.fair;
    else if (skinColor === 'medium') palette = colorPalettes.medium;
    else palette = colorPalettes.dark;

    recommendations.push(`Recommended Colors: ${palette.join(', ')}`);

    if (faceShape === 'oval') {
        recommendations.push('Round neck T-shirts');
        recommendations.push('V-neck dresses');
    } else if (faceShape === 'round') {
        recommendations.push('Boat neck tops');
        recommendations.push('A-line dresses');
    } else if (faceShape === 'square') {
        recommendations.push('Scoop neck tops');
        recommendations.push('Off-shoulder dresses');
    } else if (faceShape === 'heart') {
        recommendations.push('V-neck tops');
        recommendations.push('Peplum dresses');
    }

    if (eyeShape === 'almond') {
        recommendations.push('Cat-eye sunglasses');
        recommendations.push('Halter neck tops');
    } else if (eyeShape === 'round') {
        recommendations.push('Aviator sunglasses');
        recommendations.push('Sweetheart neck tops');
    }

    if (noseShape === 'straight') {
        recommendations.push('Button-up shirts');
        recommendations.push('Structured jackets');
    } else if (noseShape === 'curved') {
        recommendations.push('Flowy blouses');
        recommendations.push('Loose cardigans');
    }

    for (let style of clothingStyles.casual) {
        recommendations.push(`${palette[0]} ${style}`);
        recommendations.push(`${palette[1]} ${style}`);
    }

    return recommendations;
}


async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('models');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('models');
    await faceapi.nets.faceRecognitionNet.loadFromDisk('models');
}

loadModels().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});
