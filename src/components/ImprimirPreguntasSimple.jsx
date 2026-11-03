import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ImprimirPreguntasSimple() {
  const [lecciones, setLecciones] = useState([]);
  const [filtroLeccion, setFiltroLeccion] = useState('');
  const [preguntas, setPreguntas] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resLecciones, resPreguntas] = await Promise.all([
          api.get('lecciones/'),
          api.get('preguntas/') // <-- Apuntando al endpoint correcto que me indicaste
        ]);
        setLecciones(resLecciones.data);
        setPreguntas(resPreguntas.data);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los datos de la API.');
      }
    };
    cargarDatos();
  }, []);

  const preguntasFiltradas = filtroLeccion
    ? preguntas.filter(p => Number(p.leccion) === Number(filtroLeccion))
    : preguntas;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl max-w-4xl mx-auto space-y-6">
      
      {/* Controles (Se ocultan al imprimir) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Listado de Preguntas</h2>
          <p className="text-sm text-gray-500">Total de preguntas en el sistema: {preguntas.length}</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filtroLeccion}
            onChange={(e) => setFiltroLeccion(e.target.value)}
            className="border p-2.5 rounded-xl text-sm bg-gray-50 outline-none w-full md:w-64"
          >
            <option value="">-- Todas las lecciones --</option>
            {lecciones.map(l => <option key={l.id} value={l.id}>{l.id} - {l.nombre}</option>)}
          </select>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-md whitespace-nowrap"
          >
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold print:hidden">
          {error}
        </div>
      )}

      {/* Contenido de Preguntas */}
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 print:max-h-none print:overflow-visible">
        {preguntasFiltradas.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl text-gray-400 text-sm">
            No hay preguntas registradas con este filtro.
          </div>
        ) : (
          preguntasFiltradas.map((pr, index) => {
            const listaOpciones = pr.opciones || [];
            return (
              <div key={pr.id} className="border border-gray-200 rounded-2xl p-5 space-y-3 bg-gray-50/50 print:border-none print:p-0 print:mb-6">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded">
                    Pregunta #{pr.orden || index + 1}
                  </span>
                  <span className="text-xs text-gray-400 uppercase">Lección ID: {pr.leccion}</span>
                </div>

                <p className="font-bold text-sm text-gray-900">{pr.texto}</p>

                {pr.extracto_referencia && (
                  <p className="text-[11px] text-gray-500 italic">Ref: {pr.extracto_referencia}</p>
                )}

                <div className="space-y-1.5 pt-2 border-t border-dashed print:border-gray-300">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Opciones de Respuesta:</span>
                  
                  {listaOpciones.length > 0 ? (
                    listaOpciones.map((op, i) => (
                      <div 
                        key={op.id || i} 
                        className={`text-xs p-2.5 rounded-xl flex justify-between items-center ${
                          op.es_correcta ? 'bg-emerald-50 border border-emerald-300 font-medium print:bg-transparent print:border-none' : 'bg-white border print:bg-transparent print:border-none'
                        }`}
                      >
                        <span><strong>{String.fromCharCode(65 + i)})</strong> {op.texto}</span>
                        {op.es_correcta && <span className="text-emerald-700 font-bold print:text-black">✅ Correcta</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">Sin opciones registradas.</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}