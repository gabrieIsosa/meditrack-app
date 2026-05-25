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

## 📦 Estado del proyecto

Proyecto en desarrollo activo 🚧