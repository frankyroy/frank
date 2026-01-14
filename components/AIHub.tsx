
import React, { useState, useRef } from 'react';
import { useLiveVoice } from '../hooks/useLiveVoice';
import { askGeneralAI, searchInformation, generateImage, editImage } from '../services/gemini';
import { GroundingSource } from '../types';

const AIHub: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'Voz' | 'Búsqueda' | 'Imágenes' | 'Análisis'>('Voz');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [isThinking, setIsThinking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { start, stop, isActive, transcriptions } = useLiveVoice();

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResultText('');
    setSources([]);
    try {
      const res = await searchInformation(query);
      setResultText(res.text || '');
      setSources(res.sources);
    } finally {
      setLoading(false);
    }
  };

  const handleComplexReasoning = async () => {
    if (!query) return;
    setLoading(true);
    setResultText('');
    setIsThinking(true);
    try {
      const res = await askGeneralAI(query, true);
      setResultText(res || '');
    } finally {
      setLoading(false);
      setIsThinking(false);
    }
  };

  const handleGenerateImg = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const url = await generateImage(query, aspectRatio, imageSize);
      setGeneratedImg(url);
    } finally {
      setLoading(false);
    }
  };

  const handleEditImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const res = await editImage(base64, query || "Añadir un filtro acogedor y profesional de hostal");
      setGeneratedImg(res);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-[2rem] w-fit shadow-inner">
        {(['Voz', 'Búsqueda', 'Imágenes', 'Análisis'] as const).map((tool) => (
          <button
            key={tool}
            onClick={() => {
              setActiveTool(tool);
              setResultText('');
              setGeneratedImg(null);
            }}
            className={`px-8 py-3 rounded-2xl text-sm font-black transition-all duration-300 ${
              activeTool === tool ? 'bg-white text-indigo-600 shadow-lg' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tool}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 p-10 min-h-[600px] flex flex-col">
        {activeTool === 'Voz' && (
          <div className="flex flex-col items-center justify-center space-y-10 flex-1">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 ${
              isActive ? 'bg-indigo-600 animate-pulse scale-110 shadow-2xl shadow-indigo-300' : 'bg-gray-50 border-4 border-dashed border-gray-200'
            }`}>
              <svg className={`w-16 h-16 ${isActive ? 'text-white' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
              </svg>
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">{isActive ? 'Te escucho atentamente...' : 'Asistente por Voz en Tiempo Real'}</h2>
              <p className="text-gray-400 font-medium max-w-md mx-auto">Gestiona reservas, consulta disponibilidad o solicita informes operativos hablando directamente con la IA.</p>
            </div>
            <button
              onClick={isActive ? stop : start}
              className={`px-12 py-5 rounded-[2rem] font-black text-lg transition-all active:scale-95 ${
                isActive ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-100' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-200'
              }`}
            >
              {isActive ? 'Finalizar Llamada' : 'Iniciar Conversación'}
            </button>
            
            <div className="w-full max-h-56 overflow-y-auto bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 space-y-3 text-sm italic font-medium text-gray-600 custom-scrollbar">
              {transcriptions.length === 0 ? <p className="text-gray-300 text-center">La transcripción aparecerá aquí durante la charla...</p> : 
                transcriptions.map((t, idx) => <p key={idx} className="animate-in slide-in-from-bottom-2 duration-300">{t}</p>)
              }
            </div>
          </div>
        )}

        {activeTool !== 'Voz' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Consulta o Instrucción</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeTool === 'Búsqueda' ? "Ej: ¿Qué eventos culturales hay en Madrid este fin de semana para recomendar?" :
                  activeTool === 'Análisis' ? "Ej: Analiza mis precios actuales frente a la competencia y sugiere una oferta de temporada." :
                  "Ej: Una habitación acogedora con luz cálida para banner de Instagram..."
                }
                className="w-full p-6 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all h-40 font-medium text-gray-800 shadow-inner"
              />
            </div>

            {activeTool === 'Imágenes' && (
              <div className="flex flex-wrap gap-8 p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100/50">
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Formato</label>
                  <select 
                    value={aspectRatio} 
                    onChange={e => setAspectRatio(e.target.value)}
                    className="block w-full p-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {["1:1", "3:4", "4:3", "9:16", "16:9"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Calidad de Salida</label>
                  <select 
                    value={imageSize} 
                    onChange={e => setImageSize(e.target.value)}
                    className="block w-full p-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {["1K", "2K", "4K"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                disabled={loading || !query}
                onClick={
                  activeTool === 'Búsqueda' ? handleSearch :
                  activeTool === 'Análisis' ? handleComplexReasoning :
                  handleGenerateImg
                }
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black shadow-2xl shadow-indigo-200 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center tracking-tight"
              >
                {loading ? (
                  <svg className="animate-spin h-6 w-6 text-white mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : null}
                {activeTool === 'Búsqueda' ? 'Consultar Google Search' : activeTool === 'Análisis' ? 'Ejecutar Razonamiento Profundo' : 'Generar Imagen de Alta Calidad'}
              </button>

              {activeTool === 'Imágenes' && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-5 rounded-2xl font-black shadow-2xl shadow-purple-200 transition-all active:scale-95"
                >
                  Editar Foto Propia
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleEditImg} />

            {isThinking && (
              <div className="p-6 bg-indigo-600 text-white rounded-3xl flex items-center space-x-6 animate-pulse">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin shadow-lg"></div>
                <div className="flex-1">
                   <p className="font-black text-lg tracking-tight">El modelo está pensando...</p>
                   <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Utilizando presupuesto de razonamiento profundo (32k tokens)</p>
                </div>
              </div>
            )}

            {resultText && (
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6 animate-in slide-in-from-top-4 duration-500 shadow-inner">
                <h3 className="font-black text-gray-800 text-xl tracking-tight">Resultado del Procesamiento</h3>
                <div className="prose prose-indigo prose-sm text-gray-700 whitespace-pre-wrap font-medium leading-relaxed">{resultText}</div>
                {sources.length > 0 && (
                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Fuentes de Información</p>
                    <div className="flex flex-wrap gap-3">
                      {sources.map((s, idx) => (
                        <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-xs px-4 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                          {s.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {generatedImg && (
              <div className="space-y-6 animate-in zoom-in duration-500">
                <h3 className="font-black text-gray-800 text-xl tracking-tight">Imagen Resultado</h3>
                <div className="relative group rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                  <img src={generatedImg} alt="Resultado IA" className="w-full h-auto" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a href={generatedImg} download="hostalai-ia-result.png" className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-2xl transform scale-90 group-hover:scale-100 transition-transform flex items-center space-x-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span>Descargar Imagen</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHub;
