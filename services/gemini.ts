
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

export const askGeneralAI = async (prompt: string, complex: boolean = false) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = complex ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    temperature: 0.7,
  };

  if (complex) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config
  });

  return response.text;
};

export const searchInformation = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'Fuente de información',
    uri: chunk.web?.uri
  })).filter((s: any) => s.uri) || [];

  return {
    text: response.text,
    sources
  };
};

export const generateImage = async (prompt: string, aspectRatio: string, imageSize: string) => {
  // Verificación obligatoria para modelos Pro de Imagen
  if (typeof window !== 'undefined' && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      // Tras abrir el diálogo, procedemos asumiendo que el usuario seleccionará una válida
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: imageSize as any
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const editImage = async (base64Image: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Limpiar el prefijo data:image/...;base64, si existe
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png'
          }
        },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
