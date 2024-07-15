import numpy as np
import tensorflow as tf
from tensorflow.keras import datasets, layers, models
import struct

def load_mnist_images(filename):
    with open(filename, 'rb') as f:
        _, num, rows, cols = struct.unpack(">IIII", f.read(16))
        images = np.fromfile(f, dtype=np.uint8).reshape(num, rows, cols, 1)  # Add channel dimension
    return images

def load_mnist_labels(filename):
    with open(filename, 'rb') as f:
        _, num = struct.unpack(">II", f.read(8))
        labels = np.fromfile(f, dtype=np.uint8)
    return labels

# Load training and test data
train_images = load_mnist_images('C:/Users/kkrit/OneDrive/Desktop/Myntra/backend/train-images-idx3-ubyte')
train_labels = load_mnist_labels('C:/Users/kkrit/OneDrive/Desktop/Myntra/backend/train-labels-idx1-ubyte')
test_images = load_mnist_images('C:/Users/kkrit/OneDrive/Desktop/Myntra/backend/t10k-images-idx3-ubyte')
test_labels = load_mnist_labels('C:/Users/kkrit/OneDrive/Desktop/Myntra/backend/t10k-labels-idx1-ubyte')

# Normalize pixel values to be between 0 and 1
train_images, test_images = train_images / 255.0, test_images / 255.0

# Build the model
model = models.Sequential([
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dense(10, activation='softmax')
])

# Compile the model
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# Train the model
model.fit(train_images, train_labels, epochs=10, validation_data=(test_images, test_labels))

# Save the model
model.save('models/fashion_mnist_model.h5')
