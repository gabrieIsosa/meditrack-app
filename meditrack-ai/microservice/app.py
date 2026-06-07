import os
import tempfile
import torch
import librosa
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor

app = FastAPI(
    title="Meditrack Fatigue Detection API",
    description="Microservicio para la clasificación acústica binaria de fatiga mediante Wav2Vec2-XLS-R.",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.environ.get("MODEL_PATH", "gabrieIsosa/modelo-fatiga-wav2vec")

model = None
feature_extractor = None

@app.on_event("startup")
def load_model():
    global model, feature_extractor
    print(f"Cargando modelo desde: {MODEL_PATH} ...")
    try:
        model = AutoModelForAudioClassification.from_pretrained(MODEL_PATH)
        feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_PATH)
        model.eval()
        print("¡Modelo cargado correctamente!")
    except Exception as e:
        print(f"Error al cargar el modelo: {str(e)}")

@app.get("/")
def read_root():
    status = "READY" if model is not None else "MODEL_NOT_LOADED"
    return {
        "status": status,
        "message": "Meditrack AI Fatigue Service is running",
        "api_version": "1.0"
    }

@app.post("/predict")
async def predecir_fatiga(file: UploadFile = File(...)):
    if model is None or feature_extractor is None:
        raise HTTPException(status_code=503, detail="El modelo de IA aún no ha sido cargado en el servidor.")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.wav', '.mp3', '.m4a', '.ogg', '.aac', '.flac']:
        raise HTTPException(status_code=400, detail="Formato de audio no soportado. Usa WAV, MP3, M4A u OGG.")
        
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        speech, sr = librosa.load(temp_path, sr=16000)
        
        if len(speech) < sr * 1.0:
            raise HTTPException(status_code=400, detail="El archivo de audio está vacío o es demasiado corto.")
            
        if np.max(np.abs(speech)) < 0.01:
            raise HTTPException(status_code=400, detail="No se detecta sonido en la grabación. Por favor, hable más fuerte.")
            
        inputs = feature_extractor(speech, sampling_rate=16000, return_tensors="pt")
        
        with torch.no_grad():
            logits = model(**inputs).logits
            
        temperatura = 1.5
        logits_suavizados = logits / temperatura
        probabilidades = torch.softmax(logits_suavizados, dim=-1).squeeze().tolist()
        
        prob_alerta = probabilidades[0]
        prob_fatiga = probabilidades[1]
        nivel_fatiga_porcentaje = prob_fatiga * 100
        
        if nivel_fatiga_porcentaje < 30:
            riesgo = "BAJO"
            estado_predominante = "Alerta Activa"
        elif nivel_fatiga_porcentaje < 70:
            riesgo = "MODERADO"
            estado_predominante = "Cansancio Leve / Monitoreo"
        else:
            riesgo = "CRÍTICO"
            estado_predominante = "Somnolencia Extrema"
            
        return {
            "success": True,
            "filename": file.filename,
            "nivel_fatiga": round(nivel_fatiga_porcentaje, 2),
            "nivel_alerta": round(prob_alerta * 100, 2),
            "riesgo": riesgo,
            "estado": estado_predominante
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno al procesar el audio: {str(e)}")
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
