import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function LeccionesAdmin() {
  const [unidades, setUnidades] = useState([]);
  const [unidadId, setUnidadId] = useState('');
  const [lecciones, setLecciones] = useState([]);
  
  // Estados para el Modal de Crear/Editar Lección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', paginas: 0, modo: 'estudio', orden: 1, unidad: '' });

  // Estados para la Pantalla / Modal de Detalle (Páginas y Preguntas asociadas)
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [leccionSeleccionada, setLeccionSeleccionada] = useState(null);
  const [paginasLeccion, setPaginasLeccion] = useState([]);
  const [preguntasLeccion, setPreguntasLeccion] = useState([]);

  // Estados para formularios internos de creación dentro del detalle
  const [isModalPaginaOpen, setIsModalPaginaOpen] = useState(false);
  const [numeroPaginaForm, setNumeroPaginaForm] = useState(1);

  const [isModalContenidoOpen, setIsModalContenidoOpen] = useState(false);
  const [paginaDestinoId, setPaginaDestinoId] = useState(null);
  const [textoContenidoForm, setTextoContenidoForm] = useState('');

  const [isModalPreguntaOpen, setIsModalPreguntaOpen] = useState(false);
  const [preguntaForm, setPreguntaForm] = useState({
    texto: '',
    tipo: 'multiple',
    orden: 1,
    extracto_referencia: '',
    opciones: [
      { texto: '', es_correcta: true },
      { texto: '', es_correcta: false }
    ]
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resUnidades, resLecciones] = await Promise.all([
        api.get('unidades/'),
        api.get('lecciones/')
      ]);
      setUnidades(resUnidades.data);
      setLecciones(resLecciones.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const abrirModalCrear = () => {
    setEditingId(null);
    setForm({ 
      nombre: '', 
      paginas: 0, 
      modo: 'estudio', 
      orden: lecciones.length + 1, 
      unidad: unidadId || '' 
    });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (l, e) => {
    e.stopPropagation();
    setEditingId(l.id);
    setForm({
      nombre: l.nombre,
      paginas: l.paginas || 0,
      modo: l.modo || 'estudio',
      orden: l.orden || 1,
      unidad: l.unidad || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.unidad) {
      alert('Por favor selecciona una unidad destino para la lección.');
      return;
    }

    const payload = { ...form, unidad: parseInt(form.unidad) };
    
    try {
      if (editingId) {
        await api.put(`lecciones/${editingId}/`, payload);
      } else {
        await api.post('lecciones/', payload);
      }
      setIsModalOpen(false);
      cargarDatos();
    } catch (err) {
      console.error('Error al guardar la lección:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de eliminar esta lección?')) {
      try {
        await api.delete(`lecciones/${id}/`);
        cargarDatos();
      } catch (err) {
        console.error('Error al eliminar la lección:', err);
      }
    }
  };

  // Ver detalles de la lección (Páginas y Preguntas)
  const verDetalleLeccion = async (leccion) => {
    setLeccionSeleccionada(leccion);
    await recargarDetalles(leccion.id);
    setIsDetalleOpen(true);
  };

  const recargarDetalles = async (leccionId) => {
    try {
      const resPaginas = await api.get('paginas/');
      setPaginasLeccion(resPaginas.data.filter(p => Number(p.leccion) === Number(leccionId)));

      const resPreguntas = await api.get('preguntas/');
      setPreguntasLeccion(resPreguntas.data.filter(pr => Number(pr.leccion) === Number(leccionId)));
    } catch (err) {
      console.error('Error al recargar detalles:', err);
    }
  };

  // --- ACCIONES DE CREACIÓN DE CONTENIDO ---
  const handleCrearPagina = async (e) => {
    e.preventDefault();
    try {
      await api.post('paginas/', {
        leccion: leccionSeleccionada.id,
        numero_pagina: parseInt(numeroPaginaForm)
      });
      setIsModalPaginaOpen(false);
      recargarDetalles(leccionSeleccionada.id);
    } catch (err) {
      console.error('Error al crear página:', err);
    }
  };

  const handleCrearContenido = async (e) => {
    e.preventDefault();
    if (!textoContenidoForm || !paginaDestinoId) return;
    try {
      await api.post('contenidos/', {
        pagina_leccion: paginaDestinoId,
        texto: textoContenidoForm
      });
      setTextoContenidoForm('');
      setIsModalContenidoOpen(false);
      recargarDetalles(leccionSeleccionada.id);
    } catch (err) {
      console.error('Error al crear contenido:', err);
    }
  };

  const handleCrearPregunta = async (e) => {
    e.preventDefault();
    try {
      // 1. Crear la pregunta principal
      const resPregunta = await api.post('preguntas/', {
        leccion: leccionSeleccionada.id,
        texto: preguntaForm.texto,
        tipo: preguntaForm.tipo,
        orden: parseInt(preguntaForm.orden) || 1,
        extracto_referencia: preguntaForm.extracto_referencia
      });

      const preguntaId = resPregunta.data.id;

      // 2. Crear las opciones asociadas a la pregunta
      for (const op of preguntaForm.opciones) {
        if (op.texto.trim() !== '') {
          await api.post('opciones-pregunta/', {
            pregunta_leccion: preguntaId,
            texto: op.texto,
            es_correcta: op.es_correcta
          });
        }
      }

      setIsModalPreguntaOpen(false);
      setPreguntaForm({
        texto: '',
        tipo: 'multiple',
        orden: preguntasLeccion.length + 1,
        extracto_referencia: '',
        opciones: [
          { texto: '', es_correcta: true },
          { texto: '', es_correcta: false }
        ]
      });
      recargarDetalles(leccionSeleccionada.id);
    } catch (err) {
      console.error('Error al crear pregunta y opciones:', err);
    }
  };

  const handleAgregarOpcionForm = () => {
    setPreguntaForm({
      ...preguntaForm,
      opciones: [...preguntaForm.opciones, { texto: '', es_correcta: false }]
    });
  };

  const handleOpcionChange = (index, field, value) => {
    const nuevasOpciones = [...preguntaForm.opciones];
    if (field === 'es_correcta' && value === true) {
      // Marcar única opción correcta si es de opción múltiple
      nuevasOpciones.forEach((o, i) => o.es_correcta = (i === index));
    } else {
      nuevasOpciones[index][field] = value;
    }
    setPreguntaForm({ ...preguntaForm, opciones: nuevasOpciones });
  };

  const leccionesFiltradas = unidadId
    ? lecciones.filter((l) => String(l.unidad) === String(unidadId))
    : lecciones;

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Administración General de Lecciones</h2>
          <p className="text-sm text-gray-500">Haz clic en cualquier lección para ver sus páginas y preguntas asociadas.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-64">
            <select
              value={unidadId}
              onChange={(e) => setUnidadId(e.target.value)}
              className="border border-gray-300 p-2.5 rounded-lg w-full text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="">-- Todas las unidades --</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.id} - {u.nombre}</option>
              ))}
            </select>
          </div>

          <button
            onClick={abrirModalCrear}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shadow-sm w-full sm:w-auto whitespace-nowrap"
          >
            + Nueva Lección
          </button>
        </div>
      </div>

      {/* Listado General de Lecciones */}
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
        {leccionesFiltradas.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
            No hay lecciones registradas con este filtro.
          </div>
        ) : (
          leccionesFiltradas.map((l) => {
            const unidadObj = unidades.find((u) => u.id === l.unidad);
            return (
              <div 
                key={l.id} 
                onClick={() => verDetalleLeccion(l)}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
                      #{l.orden}
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {l.nombre}
                    </span>
                    {unidadObj && (
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded">
                        Unidad: {unidadObj.nombre}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Modo: <strong>{l.modo}</strong></span>
                    <span>Páginas estimadas: <strong>{l.paginas || 0}</strong></span>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => abrirModalEditar(l, e)}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition shadow-sm"
                  >
                    Editar ✏️
                  </button>
                  <button
                    onClick={(e) => handleDelete(l.id, e)}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition shadow-sm"
                  >
                    Eliminar 🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DETALLE DE LECCIÓN (PÁGINAS, CONTENIDOS Y PREGUNTAS) */}
      {isDetalleOpen && leccionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Cabecera Modal */}
            <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-400 font-bold">Gestión de Lección</span>
                <h3 className="font-bold text-lg">{leccionSeleccionada.nombre}</h3>
              </div>
              <button
                onClick={() => setIsDetalleOpen(false)}
                className="text-gray-400 hover:text-white font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Acciones Rápidas Superiores */}
            <div className="bg-gray-100 px-6 py-3 border-b flex gap-3">
              <button
                onClick={() => { setNumeroPaginaForm(paginasLeccion.length + 1); setIsModalPaginaOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
              >
                + Nueva Página
              </button>
              <button
                onClick={() => {
                  if (paginasLeccion.length === 0) {
                    alert('Primero debes crear al menos una página.');
                    return;
                  }
                  setPaginaDestinoId(paginasLeccion[0].id);
                  setIsModalContenidoOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
              >
                + Agregar Contenido
              </button>
              <button
                onClick={() => {
                  setPreguntaForm({
                    texto: '',
                    tipo: 'multiple',
                    orden: preguntasLeccion.length + 1,
                    extracto_referencia: '',
                    opciones: [
                      { texto: '', es_correcta: true },
                      { texto: '', es_correcta: false }
                    ]
                  });
                  setIsModalPreguntaOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
              >
                + Agregar Pregunta
              </button>
            </div>

            {/* Contenido en dos columnas (Páginas vs Preguntas) */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1 bg-gray-50">
              
              {/* Columna Izquierda: Páginas y Contenidos */}
              <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-800 text-sm uppercase border-b pb-2">
                  📄 Páginas y Contenidos ({paginasLeccion.length})
                </h4>

                {paginasLeccion.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-8">No hay páginas registradas para esta lección.</p>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {paginasLeccion.map((pag) => (
                      <div key={pag.id} className="border border-gray-200 p-3 rounded-lg bg-gray-50/50 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                            Página #{pag.numero_pagina}
                          </span>
                          <button
                            onClick={() => { setPaginaDestinoId(pag.id); setIsModalContenidoOpen(true); }}
                            className="text-[11px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-medium"
                          >
                            + Párrafo
                          </button>
                        </div>
                        <div className="space-y-1">
                          {pag.contenidos && pag.contenidos.length > 0 ? (
                            pag.contenidos.map((c) => (
                              <p key={c.id} className="text-xs text-gray-700 leading-relaxed bg-white p-2 rounded border border-gray-100">
                                {c.texto}
                              </p>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">Sin bloques de contenido en esta página.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Columna Derecha: Preguntas y Opciones */}
              <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-800 text-sm uppercase border-b pb-2">
                  ❓ Preguntas Evaluativas ({preguntasLeccion.length})
                </h4>

                {preguntasLeccion.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-8">No hay preguntas asociadas a esta lección.</p>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {preguntasLeccion.map((pr) => (
                      <div key={pr.id} className="border border-gray-200 p-3 rounded-lg bg-gray-50/50 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded">
                            Pregunta #{pr.orden}
                          </span>
                          <span className="text-xs text-gray-400 uppercase">{pr.tipo}</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-800">{pr.texto}</p>
                        
                        {/* Opciones de la pregunta */}
                        <div className="space-y-1 pt-1">
                          {pr.opciones && pr.opciones.length > 0 ? (
                            pr.opciones.map((op, idx) => (
                              <div key={op.id || idx} className={`text-xs p-1.5 rounded flex justify-between items-center ${op.es_correcta ? 'bg-emerald-100 text-emerald-900 font-medium' : 'bg-white text-gray-600 border'}`}>
                                <span>{op.texto}</span>
                                {op.es_correcta && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">Correcta ✅</span>}
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-gray-400 italic">Sin opciones registradas.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Pie del Modal Detalle */}
            <div className="bg-gray-100 px-6 py-3 border-t flex justify-end">
              <button
                onClick={() => setIsDetalleOpen(false)}
                className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium px-5 py-2 rounded-lg transition"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREAR PÁGINA ================= */}
      {isModalPaginaOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-800">Nueva Página</h3>
            <form onSubmit={handleCrearPagina} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Número de Página:</label>
                <input
                  type="number"
                  min="1"
                  value={numeroPaginaForm}
                  onChange={(e) => setNumeroPaginaForm(e.target.value)}
                  className="border p-2 w-full text-xs rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalPaginaOpen(false)} className="px-3 py-1.5 bg-gray-100 text-xs rounded">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREAR CONTENIDO ================= */}
      {isModalContenidoOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-800">Agregar Párrafo de Contenido</h3>
            <form onSubmit={handleCrearContenido} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Seleccionar Página:</label>
                <select
                  value={paginaDestinoId || ''}
                  onChange={(e) => setPaginaDestinoId(e.target.value)}
                  className="border p-2 w-full text-xs rounded bg-white"
                  required
                >
                  {paginasLeccion.map((p) => (
                    <option key={p.id} value={p.id}>Página #{p.numero_pagina}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Texto del Contenido:</label>
                <textarea
                  rows={3}
                  placeholder="Escribe el texto informativo..."
                  value={textoContenidoForm}
                  onChange={(e) => setTextoContenidoForm(e.target.value)}
                  className="border p-2 w-full text-xs rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalContenidoOpen(false)} className="px-3 py-1.5 bg-gray-100 text-xs rounded">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded">Añadir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREAR PREGUNTA CON OPCIONES ================= */}
      {isModalPreguntaOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-gray-800">Nueva Pregunta Evaluativa</h3>
            <form onSubmit={handleCrearPregunta} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Enunciado de la Pregunta:</label>
                <textarea
                  rows={2}
                  placeholder="¿Cuál es el objetivo..."
                  value={preguntaForm.texto}
                  onChange={(e) => setPreguntaForm({ ...preguntaForm, texto: e.target.value })}
                  className="border p-2 w-full text-xs rounded"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Orden:</label>
                  <input
                    type="number"
                    min="1"
                    value={preguntaForm.orden}
                    onChange={(e) => setPreguntaForm({ ...preguntaForm, orden: e.target.value })}
                    className="border p-2 w-full text-xs rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo:</label>
                  <select
                    value={preguntaForm.tipo}
                    onChange={(e) => setPreguntaForm({ ...preguntaForm, tipo: e.target.value })}
                    className="border p-2 w-full text-xs rounded bg-white"
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
                  onChange={(e) => setPreguntaForm({ ...preguntaForm, extracto_referencia: e.target.value })}
                  className="border p-2 w-full text-xs rounded"
                />
              </div>

              {/* Sección de Opciones */}
              <div className="space-y-2 border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-gray-600">Opciones de Respuesta:</span>
                  <button type="button" onClick={handleAgregarOpcionForm} className="text-xs text-blue-600 font-semibold hover:underline">+ Otra Opción</button>
                </div>
                {preguntaForm.opciones.map((op, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Opción ${idx + 1}`}
                      value={op.texto}
                      onChange={(e) => handleOpcionChange(idx, 'texto', e.target.value)}
                      className="border p-1.5 flex-1 text-xs rounded"
                      required
                    />
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={op.es_correcta}
                        onChange={(e) => handleOpcionChange(idx, 'es_correcta', e.target.checked)}
                      />
                      Correcta
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalPreguntaOpen(false)} className="px-3 py-1.5 bg-gray-100 text-xs rounded">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded">Registrar Pregunta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL PARA CREAR / EDITAR LECCIÓN ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingId ? 'Modificar Lección' : 'Crear Nueva Lección'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Nombre de la Lección:</label>
                <input
                  type="text"
                  placeholder="Ej: Introducción a RIC N°01"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="border border-gray-300 p-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Unidad Destino:</label>
                <select
                  value={form.unidad}
                  onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                  className="border border-gray-300 p-2.5 rounded-lg text-sm w-full outline-none bg-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecciona una unidad</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>{u.id} - {u.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Total Páginas:</label>
                  <input
                    type="number"
                    min="0"
                    value={form.paginas}
                    onChange={(e) => setForm({ ...form, paginas: parseInt(e.target.value) || 0 })}
                    className="border border-gray-300 p-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Orden:</label>
                  <input
                    type="number"
                    min="1"
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value) || 1 })}
                    className="border border-gray-300 p-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Modo:</label>
                <input
                  type="text"
                  value={form.modo}
                  onChange={(e) => setForm({ ...form, modo: e.target.value })}
                  className="border border-gray-300 p-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Lección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}