document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const analyzeButton = document.getElementById('analyzeButton');
    const resultContainer = document.getElementById('resultContainer');
    const imagePreview = document.getElementById('imagePreview');
    const resultIcon = document.getElementById('resultIcon');
    const resultText = document.getElementById('resultText');
    const confidenceValue = document.getElementById('confidenceValue');
    const statusValue = document.getElementById('statusValue');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    // Handle file input change
    fileInput.addEventListener('change', handleFiles, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files: files } });
    }

    function handleFiles(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const file = files[0];
            
            // Update file info
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            
            // Show file preview for images
            if (imagePreview && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
            
            // Show file info and hide drop zone
            fileInfo.style.display = 'flex';
            dropZone.style.display = 'none';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Handle analyze button click
    if (analyzeButton) {
        analyzeButton.addEventListener('click', async function() {
            const file = fileInput.files[0];
            if (!file) return;

            // Show loading state
            analyzeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            analyzeButton.disabled = true;
            resultContainer.style.display = 'block';
            statusValue.textContent = 'Processing';
            resultIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('http://localhost:5000/api/analyze-image', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.status === 'success') {
                    // Update UI with results
                    resultIcon.innerHTML = data.prediction === 'Real' 
                        ? '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>'
                        : '<i class="fas fa-exclamation-circle" style="color: var(--error-color);"></i>';
                    
                    resultText.textContent = `Image is ${data.prediction}`;
                    confidenceValue.textContent = data.confidence;
                    statusValue.textContent = 'Completed';
                } else {
                    throw new Error(data.error || 'Analysis failed');
                }
            } catch (error) {
                // Show error state
                resultIcon.innerHTML = '<i class="fas fa-times-circle" style="color: var(--error-color);"></i>';
                resultText.textContent = 'Analysis failed';
                statusValue.textContent = 'Error';
                confidenceValue.textContent = '0';
                console.error('Error:', error);
            } finally {
                analyzeButton.innerHTML = 'Analyze Again';
                analyzeButton.disabled = false;
            }
        });
    }
}); 