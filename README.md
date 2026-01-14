
# 🏨 HostalAI Manager - Guía de Despliegue en Vercel

Esta aplicación está lista para ser desplegada en Vercel con un solo clic o mediante la CLI.

## 🚀 Pasos para el DDespliegueDDespliegueespliegueespliegue

1.  **Subir a GitHub**: Sube los archivos de este proyecto a un repositorio de GitHub.
2.  **Importar en Vercel**: Ve a [vercel.com](https://vercel.com), dale a "Add New" > "Project" e importa tu repositorio.
3.  **Configurar Variable de Entorno**:
    *   Durante el paso de configuración en Vercel, busca la sección **Environment Variables**.
    *   Añade una nueva variable:
        *   **Key**: `API_KEY`
        *   **Value**: *Tu clave de API de Google AI Studio* (Obtenla en [aistudio.google.com](https://aistudio.google.com)).
4.  **Desplegar**: Haz clic en **Deploy**.

## 🛠️ Tecnologías Utilizadas
- **React 19** (Frontend)
- **Tailwind CSS** (Diseño)
- **Google Gemini API** (Inteligencia Artificial)
- **Vite** (Build Tool)

## 🔑 Seguridad
La `API_KEY` se maneja a través de variables de entorno del servidor, lo que garantiza que no quede expuesta directamente en el código fuente público del repositorio.
