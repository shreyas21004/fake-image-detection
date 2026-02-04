import gradio as gr
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import torchvision.models as models

# Load model
model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 2)

try:
    state_dict = torch.load('deepfake_resnet18.pth', map_location=torch.device('cpu'))
    model.load_state_dict(state_dict)
    model.eval()
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {str(e)}")

# Image transforms
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def predict(image):
    if image is None:
        return "Please upload an image", 0, 0
    
    # Convert to PIL if needed
    if not isinstance(image, Image.Image):
        image = Image.fromarray(image)
    
    image = image.convert('RGB')
    img_tensor = transform(image).unsqueeze(0)
    
    with torch.no_grad():
        output = model(img_tensor)
        probabilities = torch.nn.functional.softmax(output, dim=1)
        prediction = torch.argmax(probabilities, dim=1).item()
        
        fake_prob = probabilities[0][0].item()
        real_prob = probabilities[0][1].item()
    
    # Class 0 = Fake, Class 1 = Real
    if prediction == 1:
        result = f"✅ REAL IMAGE ({real_prob*100:.1f}% confidence)"
    else:
        result = f"⚠️ FAKE/AI GENERATED ({fake_prob*100:.1f}% confidence)"
    
    return result, real_prob, fake_prob

# Gradio Interface
with gr.Blocks(title="Deepfake Detection", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # 🔍 AI Deepfake Detection
    ### Detect AI-generated and manipulated images using deep learning
    
    Upload an image to analyze whether it's real or AI-generated/manipulated.
    """)
    
    with gr.Row():
        with gr.Column():
            image_input = gr.Image(label="Upload Image", type="pil")
            analyze_btn = gr.Button("🔬 Analyze Image", variant="primary")
        
        with gr.Column():
            result_text = gr.Textbox(label="Result", lines=2)
            with gr.Row():
                real_score = gr.Number(label="Real Probability")
                fake_score = gr.Number(label="Fake Probability")
    
    analyze_btn.click(
        fn=predict,
        inputs=[image_input],
        outputs=[result_text, real_score, fake_score]
    )
    
    gr.Markdown("""
    ---
    **How it works:** This model uses a ResNet18 neural network trained to detect deepfakes 
    and AI-generated images by analyzing facial features and pixel patterns.
    """)

if __name__ == "__main__":
    demo.launch()
