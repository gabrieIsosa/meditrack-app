# 🚚 Meditrack

Sistema de logística farmacéutica orientado a la gestión y seguimiento de envíos, rutas y repartidores.

## ✨ Funcionalidades

- Gestión de envíos
- Tracking público
- Administración de clientes
- Gestión de medicamentos
- Gestión de rutas
- Administración de transportes
- Gestión de repartidores
- Reportes
- Control de usuarios y roles
- Integración con Google Maps y Places API

## 👥 Roles del sistema

- Administrador
- Supervisor
- Operador
- Repartidor

## 🛠️ Tecnologías utilizadas

- React
- Vite
- React Router
- Context API
- Google Maps API
- Lucide React

## 🚀 Instalación

```bash
git clone <repo-url>
cd meditrack-app
npm install
npm run dev
```

## 🔑 Variables de entorno

Crear un archivo `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=TU_API_KEY
```

## 📂 Estructura principal

```bash
src/
 ├── components/
 ├── context/
 ├── pages/
 ├── services/
 ├── utils/
```

## 🔒 Autenticación y permisos

El sistema utiliza rutas protegidas según el rol del usuario mediante `ProtectedRoute` y `AuthContext`.

## 🧠 Detección de Fatiga por Voz (IA)

El sistema integra un módulo de Inteligencia Artificial para validar la aptitud física de los repartidores antes de comenzar una ruta, analizando su voz en tiempo real para detectar fatiga y somnolencia extrema.

### 🔬 Modelo y Entrenamiento
El modelo está basado en **Wav2Vec2-XLS-R** y clasifica la voz del conductor en base a una frase preestablecida.

*   **Cuaderno de Entrenamiento (Google Colab)**: [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Joaquin1128/meditrack-app/blob/main/src/meditrack-ai/entrenamiento_fatiga.ipynb)
*   **Modelo en Hugging Face**: [gabrieIsosa/modelo-fatiga-wav2vec](https://huggingface.co/gabrieIsosa/modelo-fatiga-wav2vec)
*   **API del Microservicio**: [gabrieIsosa/meditrack-fatigue-api](https://huggingface.co/spaces/gabrieIsosa/meditrack-fatigue-api)

### ⚙️ Estructura de la carpeta `src/meditrack-ai`
- `entrenamiento_fatiga.ipynb`: Jupyter Notebook con el proceso completo de carga del dataset, ajuste fino (fine-tuning) y evaluación del modelo.
- `microservice/`:
  - `app.py`: API REST construida con FastAPI que recibe archivos de audio y retorna el porcentaje de fatiga y riesgo clasificado (`BAJO`, `MODERADO`, `CRÍTICO`).
  - `Dockerfile` y `requirements.txt`: Configuración para empaquetar y desplegar el microservicio de forma rápida.

## 📦 Estado del proyecto

Proyecto en desarrollo activo 🚧