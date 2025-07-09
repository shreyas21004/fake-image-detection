from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import io
import numpy as np
import torchvision.models as models
import os

app = Flask(__name__)
CORS(app)

# Define the model architecture
model = models.resnet18(pretrained=False)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 2)  # 2 classes: real and fake

# Load the model weights
try:
    state_dict = torch.load('deepfake_resnet18.pth', map_location=torch.device('cpu'))
    model.load_state_dict(state_dict)
    model.eval()
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {str(e)}")
    raise

# Define image transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.route('/')
def home():
    return jsonify({
        'message': 'Deepfake Detection API is running',
        'endpoints': {
            '/api/analyze-image': 'POST - Upload an image for deepfake detection'
        }
    })

@app.route('/favicon.ico')
def favicon():
    return '', 204  # No content response

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided', 'status': 'error'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected', 'status': 'error'}), 400
    
    # Check file type
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        return jsonify({'error': 'Invalid file type. Please upload a PNG, JPG, or JPEG image.', 'status': 'error'}), 400
    
    try:
        # Read and preprocess the image
        image = Image.open(io.BytesIO(file.read())).convert('RGB')
        image = transform(image).unsqueeze(0)
        
        # Make prediction
        with torch.no_grad():
            output = model(image)
            probabilities = torch.nn.functional.softmax(output, dim=1)
            prediction = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][prediction].item()
        
        # Return results
        result = {
            'prediction': 'Real' if prediction == 1 else 'Fake',
            'confidence': round(confidence * 100, 2),
            'status': 'success'
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'error': f'Error processing image: {str(e)}',
            'status': 'error'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 