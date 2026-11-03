import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function LeccionDetalle({ leccion, onVolver }) {
  const [paginas, setPaginas] = useState([]);
  const [preguntas, setPreguntas] = useState([]);

  // Estados para Modal de Páginas (Crear / Editar)
  const [isModalPaginaOpen, setIsModalPaginaOpen] = useState(false);
  const [editingPaginaId, setEditingPaginaId] = useState(null);
  const [numeroPaginaForm, setNumeroPaginaForm] = useState(1);

  // Estados para Modal de Contenido / Párrafos (Crear / Editar)
  const [isModalContenidoOpen, setIsModalContenidoOpen] = useState(false);
  const [editingContenidoId, setEditingContenidoId] = useState(null);
  const [paginaDestinoId, setPaginaDestinoId] = useState(null);
  const [textoContenidoForm, setTextoContenidoForm] = useState('');

  // Estados para Modal de Preguntas y Opciones (Crear / Editar)
  const [isModalPreguntaOpen, setIsModalPreguntaOpen] = useState(false);
  const [editingPreguntaId, setEditingPreguntaId] = useState(null);
  const [preguntaForm, setPreguntaForm] = useState({
    texto: '',
    tipo: 'multiple',
    orden: 1,
    extracto_referencia: '',
    opciones: [
      { id: null, texto: '', es_correcta: true },
      { id: null, texto: '', es_correcta: false }
    ]
  });

  const cargarDatos = async () => {
    try {
      const [resPaginas, resPreguntas] = await Promise.all([
        api.get(`paginas/?leccion_id=${leccion.id}`),
        api.get(`preguntas/?leccion_id=${leccion.id}`)
      ]);
      setPaginas(resPaginas.data);
      setPreguntas(resPreguntas.data);
    } catch (err) {
      console.error('Error al cargar detalles de la lección:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [leccion]);

  // --- ACCIONES DE GUARDAR (CREAR / EDITAR) ---
  const handleGuardarPagina = async (e) => {
    e.preventDefault();
    try {
      if (editingPaginaId) {
        await api.put(`paginas/${editingPaginaId}/`, {
          leccion: leccion.id,
          numero_pagina: parseInt(numeroPaginaForm)
        });
      } else {
        await api.post('paginas/', {
          leccion: leccion.id,
          numero_pagina: parseInt(numeroPaginaForm)
        });
      }
      setIsModalPaginaOpen(false);
      setEditingPaginaId(null);
      cargarDatos();
    } catch (err) {
      console.error('Error al guardar página:', err);
    }
  };

  const handleGuardarContenido = async (e) => {
    e.preventDefault();
    if (!textoContenidoForm || !paginaDestinoId) return;
    try {
      if (editingContenidoId) {
        await api.put(`contenidos/${editingContenidoId}/`, {
          pagina_leccion: paginaDestinoId,
          texto: textoContenidoForm
        });
      } else {
        await api.post('contenidos/', {
          pagina_leccion: paginaDestinoId,
          texto: textoContenidoForm
        });
      }
      setTextoContenidoForm('');
      setEditingContenidoId(null);
      setPaginaDestinoId(null);
      setIsModalContenidoOpen(false);
      cargarDatos();
    } catch (err) {
      console.error('Error al guardar contenido:', err);
    }
  };

  const handleGuardarPregunta = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        leccion: leccion.id,
        texto: preguntaForm.texto,
        tipo: preguntaForm.tipo,
        orden: parseInt(preguntaForm.orden) || 1,
        extracto_referencia: preguntaForm.extracto_referencia,
        opciones: preguntaForm.opciones
          .filter(op => op.texto.trim() !== '')
          .map(op => ({
            id: op.id || null,
            texto: op.texto,
            es_correcta: op.es_correcta
          }))
      };

      if (editingPreguntaId) {
        await api.put(`preguntas/${editingPreguntaId}/`, payload);
      } else {
        await api.post('preguntas/', payload);
      }

      setIsModalPreguntaOpen(false);
      setEditingPreguntaId(null);
      cargarDatos();
    } catch (err) {
      console.error('Error al guardar pregunta:', err);
    }
  };

  const handleOpcionChange = (index, field, value) => {
    const nuevasOpciones = [...preguntaForm.opciones];
    if (field === 'es_correcta' && value === true) {
      nuevasOpciones.forEach((o, i) => o.es_correcta = (i === index));
    } else {
      nuevasOpciones[index][field] = value;
    }
    setPreguntaForm({ ...preguntaForm, opciones: nuevasOpciones });
  };

  // --- ACCIONES DE BORRADO ---
  const handleEliminarContenido = async (contenidoId) => {
    if (window.confirm('¿Eliminar este párrafo?')) {
      try {
        await api.delete(`contenidos/${contenidoId}/`);
        cargarDatos();
      } catch (err) { console.error(err); }
    }
  };

  const handleEliminarPagina = async (paginaId) => {
    if (window.confirm('¿Eliminar esta página y todo su contenido asociado?')) {
      try {
        await api.delete(`paginas/${paginaId}/`);
        cargarDatos();
      } catch (err) { console.error(err); }
    }
  };

  const handleEliminarPregunta = async (preguntaId) => {
    if (window.confirm('¿Eliminar esta pregunta evaluativa?')) {
      try {
        await api.delete(`preguntas/${preguntaId}/`);
        cargarDatos();
      } catch (err) { console.error(err); }
    }
  };

  // --- ABRIR MODALES ---
  const abrirEditarPagina = (pag) => {
    setEditingPaginaId(pag.id);
    setNumeroPaginaForm(pag.numero_pagina);
    setIsModalPaginaOpen(true);
  };

  const abrirCrearContenido = (paginaId) => {
    setEditingContenidoId(null);
    setTextoContenidoForm('');
    setPaginaDestinoId(paginaId);
    setIsModalContenidoOpen(true);
  };

  const abrirEditarContenido = (c, paginaId) => {
    setEditingContenidoId(c.id);
    setPaginaDestinoId(paginaId);
    setTextoContenidoForm(c.texto);
    setIsModalContenidoOpen(true);
  };

  const abrirEditarPregunta = (pr) => {
    setEditingPreguntaId(pr.id);
    setPreguntaForm({
      texto: pr.texto,
      tipo: pr.tipo,
      orden: pr.orden,
      extracto_referencia: pr.extracto_referencia || '',
      opciones: pr.opciones && pr.opciones.length > 0 
        ? pr.opciones.map(op => ({ id: op.id, texto: op.texto, es_correcta: op.es_correcta }))
        : [{ id: null, texto: '', es_correcta: true }]
    });
    setIsModalPreguntaOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-xl space-y-6 animate-fadeIn">
      
      {/* Cabecera y Botones de Acción */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-5 gap-4">
        <div>
          <button onClick={onVolver} className="text-xs font-bold text-blue-600 hover:underline mb-1 inline-block">
            ← Volver a Lecciones
          </button>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Lección: {leccion.nombre}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Modo: <span className="font-semibold text-gray-700">{leccion.modo}</span> | Orden: <span className="font-semibold text-gray-700">#{leccion.orden}</span></p>
        </div>

        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          <button 
            onClick={() => { setEditingPaginaId(null); setNumeroPaginaForm(paginas.length + 1); setIsModalPaginaOpen(true); }} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-md flex-1 md:flex-none"
          >
            + Nueva Página
          </button>
          <button 
            onClick={() => { 
              setEditingPreguntaId(null);
              setPreguntaForm({ 
                texto: '', 
                tipo: 'multiple', 
                orden: preguntas.length + 1, 
                extracto_referencia: '', 
                opciones: [{id: null, texto:'', es_correcta:true}, {id: null, texto:'', es_correcta:false}] 
              }); 
              setIsModalPreguntaOpen(true); 
            }} 
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-md flex-1 md:flex-none"
          >
            + Agregar Pregunta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Listado de Páginas y Contenidos */}
        <div className="space-y-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-200">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wide flex items-center gap-2">
              📄 Páginas y Contenidos
            </h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {paginas.length} {paginas.length === 1 ? 'Página' : 'Páginas'}
            </span>
          </div>

          {paginas.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-10">No hay páginas registradas para esta lección.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {paginas.map((pag) => (
                <div key={pag.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span 
                      onClick={() => abrirEditarPagina(pag)} 
                      className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition"
                      title="Editar número de página"
                    >
                      Página #{pag.numero_pagina} ✏️
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => abrirCrearContenido(pag.id)} 
                        className="text-[11px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-semibold transition"
                      >
                        + Párrafo
                      </button>
                      <button 
                        onClick={() => handleEliminarPagina(pag.id)} 
                        className="text-red-400 hover:text-red-600 p-1 text-xs font-bold"
                        title="Eliminar página"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {pag.contenidos && pag.contenidos.length > 0 ? (
                      pag.contenidos.map((c) => (
                        <div key={c.id} className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex justify-between items-start gap-2">
                          <p className="text-xs text-gray-700 leading-relaxed flex-1">{c.texto}</p>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => abrirEditarContenido(c, pag.id)} 
                              className="text-blue-500 hover:text-blue-700 text-xs font-bold px-1"
                              title="Editar párrafo"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => handleEliminarContenido(c.id)} 
                              className="text-red-400 hover:text-red-600 text-xs font-bold px-1"
                              title="Eliminar párrafo"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic pl-1">Sin bloques de contenido en esta página.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listado de Preguntas y Opciones */}
        <div className="space-y-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-200">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wide flex items-center gap-2">
              ❓ Preguntas y Opciones
            </h3>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {preguntas.length} {preguntas.length === 1 ? 'Pregunta' : 'Preguntas'}
            </span>
          </div>

          {preguntas.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-10">No hay preguntas registradas para esta lección.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {preguntas.map((pr, index) => (
                <div key={pr.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-purple-200">
                      Pregunta #{pr.orden || index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => abrirEditarPregunta(pr)} 
                        className="text-amber-600 hover:text-amber-700 text-xs font-semibold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg transition"
                      >
                        Editar ✏️
                      </button>
                      <button 
                        onClick={() => handleEliminarPregunta(pr.id)} 
                        className="text-red-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-lg transition"
                      >
                        Eliminar 🗑️
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-gray-900 leading-snug">{pr.texto}</p>
                  
                  <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-200">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Opciones de respuesta:</span>
                    {pr.opciones && pr.opciones.length > 0 ? (
                      pr.opciones.map((op, i) => (
                        <div 
                          key={op.id} 
                          className={`text-xs p-2 rounded-xl flex justify-between items-center ${
                            op.es_correcta ? 'bg-emerald-50 border border-emerald-300 font-medium text-emerald-900' : 'bg-gray-50/80 border border-gray-200 text-gray-700'
                          }`}
                        >
                          <span><strong>{String.fromCharCode(65 + i)})</strong> {op.texto}</span>
                          {op.es_correcta && <span className="text-emerald-700 font-bold text-[11px]">✅ Correcta</span>}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">Sin opciones registradas.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ================= MODAL CREAR / EDITAR PÁGINA ================= */}
      {isModalPaginaOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl animate-fadeIn">
            <h3 className="font-bold text-base text-gray-800">{editingPaginaId ? 'Editar Página' : 'Nueva Página'}</h3>
            <form onSubmit={handleGuardarPagina} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Número de Página:</label>
                <input 
                  type="number" 
                  min="1" 
                  value={numeroPaginaForm} 
                  onChange={e => setNumeroPaginaForm(e.target.value)} 
                  className="border border-gray-300 p-2.5 w-full text-xs rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
                  required 
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsModalPaginaOpen(false)} className="px-4 py-2 bg-gray-100 text-xs rounded-xl font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs rounded-xl font-semibold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CREAR / EDITAR CONTENIDO ================= */}
      {isModalContenidoOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl animate-fadeIn">
            <h3 className="font-bold text-base text-gray-800">{editingContenidoId ? 'Editar Párrafo de Contenido' : 'Agregar Párrafo de Contenido'}</h3>
            <form onSubmit={handleGuardarContenido} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Texto del Contenido:</label>
                <textarea 
                  rows={3} 
                  placeholder="Escribe el texto informativo..." 
                  value={textoContenidoForm} 
                  onChange={e => setTextoContenidoForm(e.target.value)} 
                  className="border border-gray-300 p-2.5 w-full text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsModalContenidoOpen(false)} className="px-4 py-2 bg-gray-100 text-xs rounded-xl font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs rounded-xl font-semibold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CREAR / EDITAR PREGUNTA ================= */}
      {isModalPreguntaOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <h3 className="font-bold text-base text-gray-800">{editingPreguntaId ? 'Editar Pregunta Evaluativa' : 'Nueva Pregunta Evaluativa'}</h3>
            <form onSubmit={handleGuardarPregunta} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Enunciado de la Pregunta:</label>
                <textarea 
                  rows={2} 
                  placeholder="¿Cuál es el objetivo principal..." 
                  value={preguntaForm.texto} 
                  onChange={e => setPreguntaForm({...preguntaForm, texto: e.target.value})} 
                  className="border border-gray-300 p-2.5 w-full text-xs rounded-xl outline-none focus:ring-2 focus:ring-purple-500" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Orden:</label>
                  <input 
                    type="number" 
                    value={preguntaForm.orden} 
                    onChange={e => setPreguntaForm({...preguntaForm, orden: e.target.value})} 
                    className="border border-gray-300 p-2.5 w-full text-xs rounded-xl outline-none focus:ring-2 focus:ring-purple-500" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo:</label>
                  <select 
                    value={preguntaForm.tipo} 
                    onChange={e => setPreguntaForm({...preguntaForm, tipo: e.target.value})} 
                    className="border border-gray-300 p-2.5 w-full text-xs rounded-xl bg-white outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="multiple">Múltiple Opción</option>
                    <option value="verdadero_falso">Verdadero / Falso</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Referencia Normativa (Opcional):</label>
                <input 
                  type="text" 
                  placeholder="Ej: RIC N°01" 
                  value={preguntaForm.extracto_referencia} 
                  onChange={e => setPreguntaForm({...preguntaForm, extracto_referencia: e.target.value})} 
                  className="border border-gray-300 p-2.5 w-full text-xs rounded-xl outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700 uppercase">Opciones de Respuesta:</span>
                  <button 
                    type="button" 
                    onClick={() => setPreguntaForm({...preguntaForm, opciones: [...preguntaForm.opciones, {id: null, texto:'', es_correcta:false}]})} 
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    + Otra Opción
                  </button>
                </div>
                {preguntaForm.opciones.map((op, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <input 
                      type="text" 
                      placeholder={`Opción ${idx + 1}`} 
                      value={op.texto} 
                      onChange={e => handleOpcionChange(idx, 'texto', e.target.value)} 
                      className="border border-gray-300 p-2 flex-1 text-xs rounded-lg bg-white outline-none" 
                      required 
                    />
                    <label className="flex items-center gap-1 text-xs font-medium cursor-pointer whitespace-nowrap text-gray-700">
                      <input 
                        type="checkbox" 
                        checked={op.es_correcta} 
                        onChange={e => handleOpcionChange(idx, 'es_correcta', e.target.checked)} 
                        className="rounded text-purple-600 focus:ring-purple-500"
                      /> 
                      Correcta
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalPreguntaOpen(false)} className="px-4 py-2 bg-gray-100 text-xs rounded-xl font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white text-xs rounded-xl font-semibold shadow-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}