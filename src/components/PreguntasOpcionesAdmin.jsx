import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ListadoPreguntasModal() {
  const [lecciones, setLecciones] = useState([]);
  const [filtroLeccion, setFiltroLeccion] = useState('');
  const [preguntas, setPreguntas] = useState([]);
  
  // Estado para el Modal de Visualización
  const [preguntaActiva, setPreguntaActiva] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar datos iniciales de forma segura
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resLecciones, resPreguntas] = await Promise.all([
          api.get('lecciones/'),
          api.get('preguntas/') // Usamos el endpoint correcto registrado en urls.py
        ]);
        setLecciones(resLecciones.data);
        setPreguntas(resPreguntas.data);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      }
    };
    cargarDatos();
  }, []);

  const abrirModalDetalle = (pregunta) => {
    setPreguntaActiva(pregunta);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setPreguntaActiva(null);
  };

  // Filtrado seguro en el cliente para evitar errores 404 por query params
  const preguntasFiltradas = filtroLeccion
    ? preguntas.filter((p) => String(p.leccion) === String(filtroLeccion))
    : preguntas;

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      {/* Cabecera y Filtro */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Directorio General de Preguntas</h2>
          <p className="text-sm text-gray-500">Visualiza todas las preguntas y revisa sus opciones detalladas en un modal.</p>
        </div>

        <div className="w-full md:w-72">
          <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Filtrar por Lección:</label>
          <select
            value={filtroLeccion}
            onChange={(e) => setFiltroLeccion(e.target.value)}
            className="border border-gray-300 p-2.5 rounded-lg w-full text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="">-- Todas las lecciones --</option>
            {lecciones.map((l) => (
              <option key={l.id} value={l.id}>{l.id} - {l.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado en Tarjetas */}
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        {preguntasFiltradas.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
            No se encontraron preguntas registradas con este filtro.
          </div>
        ) : (
          preguntasFiltradas.map((p) => {
            const leccionObj = lecciones.find(l => l.id === p.leccion);
            return (
              <div
                key={p.id}
                onClick={() => abrirModalDetalle(p)}
                className="p-4 border border-gray-200 hover:border-blue-400 rounded-xl bg-white hover:bg-blue-50/30 cursor-pointer transition shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                      Orden #{p.orden}
                    </span>
                    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded uppercase">
                      Tipo: {p.tipo}
                    </span>
                    {leccionObj && (
                      <span className="text-xs text-gray-500 font-medium">
                        Lección: {leccionObj.id} - {leccionObj.nombre}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm text-gray-800">{p.texto}</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0">
                  <span className="text-xs text-gray-500 font-medium">
                    {p.opciones ? p.opciones.length : 0} opciones
                  </span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition shadow-sm">
                    Ver Opciones 🔍
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE DETALLE DE OPCIONES */}
      {isModalOpen && preguntaActiva && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-fadeIn">
            {/* Cabecera del Modal */}
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                  Pregunta #{preguntaActiva.orden}
                </span>
                <span className="text-xs uppercase bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded">
                  {preguntaActiva.tipo}
                </span>
              </div>
              <button
                onClick={cerrarModal}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400">Enunciado:</label>
                <p className="text-base font-semibold text-gray-900 leading-snug">
                  {preguntaActiva.texto}
                </p>
              </div>

              {preguntaActiva.respuesta_texto && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                  <label className="text-xs font-bold uppercase text-blue-700 block mb-0.5">Respuesta Corta / Explicación:</label>
                  <p className="text-xs text-blue-900 font-medium">{preguntaActiva.respuesta_texto}</p>
                </div>
              )}

              {preguntaActiva.extracto_referencia && (
                <div className="text-xs text-gray-500">
                  <span className="font-semibold">Referencia Normativa:</span> {preguntaActiva.extracto_referencia}
                </div>
              )}

              {/* Listado de Opciones */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-xs font-bold uppercase text-gray-600 block mb-2">
                  Opciones de Respuesta Registradas:
                </label>

                {preguntaActiva.opciones && preguntaActiva.opciones.length > 0 ? (
                  preguntaActiva.opciones.map((op, index) => (
                    <div
                      key={op.id || index}
                      className={`p-3.5 border rounded-xl flex justify-between items-center transition ${
                        op.es_correcta
                          ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          op.es_correcta ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{op.texto}</span>
                      </div>

                      {op.es_correcta ? (
                        <span className="bg-emerald-200 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          ✅ Opción Correcta
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Incorrecta</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed rounded-xl text-gray-400 text-xs italic">
                    Esta pregunta aún no tiene opciones de respuesta registradas.
                  </div>
                )}
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="bg-gray-50 px-6 py-3 border-t flex justify-end">
              <button
                onClick={cerrarModal}
                className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium px-5 py-2 rounded-lg transition"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}