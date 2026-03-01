const URL = "https://teachablemachine.withgoogle.com/models/cZhatDahS/";

let model, labelContainer, maxPredictions, webcam;

const imageInput = document.getElementById('image-input');
const imageUploadArea = document.getElementById('image-upload-area');
const faceImage = document.getElementById('face-image');
const predictBtn = document.getElementById('predict-btn');
const cameraBtn = document.getElementById('camera-btn');
const captureBtn = document.getElementById('capture-btn');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('result-section');
const uploadContent = document.querySelector('.upload-content');
const webcamContainer = document.getElementById('webcam-container');

// Load the image model
async function initModel() {
    if (model) return;
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        labelContainer = document.getElementById("label-container");
    } catch (error) {
        console.error("Error loading model:", error);
        alert("모델을 불러오는 데 실패했습니다.");
    }
}

// Handle image upload area click
imageUploadArea.addEventListener('click', () => {
    if (!webcam) imageInput.click();
});

// Handle file input change
imageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        handleImage(e.target.files[0]);
    }
});

function handleImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        faceImage.src = e.target.result;
        faceImage.style.display = 'block';
        uploadContent.style.display = 'none';
        predictBtn.disabled = false;
        if (webcam) stopWebcam();
    };
    reader.readAsDataURL(file);
}

// Webcam Logic
cameraBtn.addEventListener('click', async () => {
    cameraBtn.style.display = 'none';
    uploadContent.style.display = 'none';
    webcamContainer.style.display = 'block';
    
    const flip = true;
    webcam = new tmImage.Webcam(300, 300, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);
    
    webcamContainer.appendChild(webcam.canvas);
    captureBtn.style.display = 'block';
    predictBtn.style.display = 'none';
});

async function loop() {
    if (webcam && webcam.canvas) {
        webcam.update();
        window.requestAnimationFrame(loop);
    }
}

captureBtn.addEventListener('click', () => {
    const canvas = webcam.canvas;
    faceImage.src = canvas.toDataURL('image/png');
    faceImage.style.display = 'block';
    
    stopWebcam();
    
    captureBtn.style.display = 'none';
    predictBtn.style.display = 'block';
    predictBtn.disabled = false;
    cameraBtn.style.display = 'block';
    cameraBtn.innerHTML = '<i class="fas fa-redo"></i> 다시 촬영';
});

function stopWebcam() {
    if (webcam) {
        webcam.stop();
        webcamContainer.innerHTML = '';
        webcamContainer.style.display = 'none';
        webcam = null;
    }
}

// Predict
predictBtn.addEventListener('click', async () => {
    predictBtn.style.display = 'none';
    cameraBtn.style.display = 'none';
    loading.style.display = 'block';
    
    await initModel();

    setTimeout(async () => {
        await predict();
        loading.style.display = 'none';
        resultSection.style.display = 'block';
    }, 1200);
});

async function predict() {
    const prediction = await model.predict(faceImage);
    labelContainer.innerHTML = '';
    prediction.sort((a, b) => b.probability - a.probability);

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i].className;
        const probability = (prediction[i].probability * 100).toFixed(0);
        
        const barHtml = `
            <div class="prediction-bar">
                <div class="bar-label">
                    <span>${classPrediction}</span>
                    <span>${probability}%</span>
                </div>
                <div class="bar-outer">
                    <div class="bar-inner" style="width: ${probability}%"></div>
                </div>
            </div>
        `;
        labelContainer.innerHTML += barHtml;
    }
    
    const topResult = prediction[0].className;
    document.getElementById('result-title').innerText = `당신은 ${topResult}상 입니다!`;
}

// Drag and drop
imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!webcam) imageUploadArea.style.borderColor = "var(--primary-color)";
});

imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.style.borderColor = "var(--secondary-color)";
});

imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.style.borderColor = "var(--secondary-color)";
    if (!webcam && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImage(e.dataTransfer.files[0]);
    }
});
