
# 🏨 HostalAI Manager - Guía de Despliegue en Vercel

Esta aplicación está lista para ser desplegada en Vercel con un solo clic o mediante la CLI.

## 🚀 Pasos para el Despliegue

1.  **Crear Repositorio**: Crea un nuevo repositorio en tu GitHub.
2.  **Subir Código**: Sube todos los archivos (el `.gitignore` evitará subir lo innecesario).
3.  **Conectar con Vercel**: 
    *   Ve a [vercel.com](https://vercel.com).
    *   Haz clic en **"Add New" > "Project"**.
    *   Selecciona tu repositorio de GitHub.
4.  **Configurar Variable de Entorno**:
    *   En el panel de configuración de Vercel, busca **Environment Variables**.
    *   Añade la clave: `API_KEY`.
    *   Pega tu clave de [Google AI Studio](https://aistudio.google.com).
5.  **Desplegar**: Haz clic en **Deploy**.

## 🛠️ Tecnologías
- **React 19** + **Vite**
- **Tailwind CSS** (UI moderna)
- **Gemini 2.5 & 3** (IA de voz y procesamiento)
- **Vercel** (Hosting)

## 🔑 Notas de Seguridad
Nunca compartas tu archivo `.env` o tu `API_KEY` públicamente. Vercel se encarga de inyectar la clave de forma segura en el servidor.
