import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function GestorAcademicoAdmin() {
  // Navegación por pantallas: 'unidades' | 'lecciones' | 'gestion_leccion'
  const [vistaActual, setVistaActual] = useState('unidades');
  
  // Datos seleccionados
  const [unidades, setUnidades] = useState([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [lecciones, setLecciones] = useState([]);
  const [leccionSeleccionada, setLeccionSeleccionada] = useState(null);

  // Estados para Modales de Unidades
  const [isModalUnidadOpen, setIsModalUnidadOpen] = useState(false);
  const [editingUnidadId, setEditingUnidadId] = useState(null);
  const [formUnidad, setFormUnidad] = useState({ nombre: '', descripcion: '', pdf_url: '', orden: 1 });

  // Estados para Modales de Lecciones
  const [isModalLeccionOpen, setIsModalLeccionOpen] = useState(false);
  const [editingLeccionId, setEditingLeccionId] = useState(null);
  const [formLeccion, setFormLeccion] = useState({ nombre: '', paginas: 0, modo: 'estudio', orden: 1 });

  // Estados para la pantalla de Gestión de Lección (Páginas, Contenidos, Preguntas y Opciones)
  const [paginasLeccion, setPaginasLeccion] = useState([]);
  const [preguntasLeccion, setPreguntasLeccion] = useState([]);
  
  // Formularios internos para la pantalla de gestión
  const [nuevoContenidoTexto, setNuevoContenidoTexto] = useState('');
  const [numeroPaginaDestino, setNumeroPaginaDestino] = useState(1);
  
  const [nuevaPreguntaForm, setNuevaPreguntaForm] = useState({ 
    texto: '', 
    tipo: 'multiple', 
    orden: 1, 
    respuesta_texto: '', 
    extracto_referencia: '' 
  });

  const [opcionForms, setOpcionForms] = useState({});

  // Cargar Unidades iniciales
  const cargarUnidades = async () => {
    try {
      const res = await api.get('unidades/');
      setUnidades(res.data);
    } catch (err) {
      console.error('Error al cargar unidades:', err);
    }
  };

  useEffect(() => {
    cargarUnidades();
  }, []);

  // --- ACCIONES DE UNIDADES ---
  const abrirModalCrearUnidad = () => {
    setEditingUnidadId(null);
    setFormUnidad({ nombre: '', descripcion: '', pdf_url: '', orden: unidades.length + 1 });
    setIsModalUnidadOpen(true);
  };

  const abrirModalEditarUnidad = (u, e) => {
    e.stopPropagation();
    setEditingUnidadId(u.id);
    setFormUnidad({ nombre: u.nombre, descripcion: u.descripcion || '', pdf_url: u.pdf_url || '', orden: u.orden || 1 });
    setIsModalUnidadOpen(true);
  };

  const handleGuardarUnidad = async (e) => {
    e.preventDefault();
    try {
      if (editingUnidadId) {
        await api.put(`unidades/${editingUnidadId}/`, formUnidad);
      } else {
        await api.post('unidades/', formUnidad);
      }
      setIsModalUnidadOpen(false);
      cargarUnidades();
    } catch (err) {
      console.error('Error al guardar unidad:', err);
    }
  };

  const handleDeleteUnidad = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta unidad y sus datos asociados?')) {
      try {
        await api.delete(`unidades/${id}/`);
        cargarUnidades();
      } catch (err) {
        console.error('Error al eliminar unidad:', err);
      }
    }
  };

  // --- NAVEGAR A LECCIONES DE LA UNIDAD ---
  const seleccionarUnidad = async (unidad) => {
    setUnidadSeleccionada(unidad);
    try {
      const res = await api.get(`lecciones/?unidad_id=${unidad.id}`);
      setLecciones(res.data);
      setVistaActual('lecciones');
    } catch (err) {
      console.error('Error al cargar lecciones:', err);
    }
  };

  // --- ACCIONES DE LECCIONES ---
  const abrirModalCrearLeccion = () => {
    setEditingLeccionId(null);
    setFormLeccion({ nombre: '', paginas: 0, modo: 'estudio', orden: lecciones.length + 1 });
    setIsModalLeccionOpen(true);
  };

  const abrirModalEditarLeccion = (l, e) => {
    e.stopPropagation();
    setEditingLeccionId(l.id);
    setFormLeccion({ nombre: l.nombre, paginas: l.paginas || 0, modo: l.modo || 'estudio', orden: l.orden || 1 });
    setIsModalLeccionOpen(true);
  };

  const handleGuardarLeccion = async (e) => {
    e.preventDefault();
    if (!unidadSeleccionada) return;
    try {
      const payload = { ...formLeccion, unidad: unidadSeleccionada.id };
      if (editingLeccionId) {
        await api.put(`lecciones/${editingLeccionId}/`, payload);
      } else {
        await api.post('lecciones/', payload);
      }
      setIsModalLeccionOpen(false);
      const res = await api.get(`lecciones/?unidad_id=${unidadSeleccionada.id}`);
      setLecciones(res.data);
    } catch (err) {
      console.error('Error al guardar lección:', err);
    }
  };

  const handleDeleteLeccion = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta lección?')) {
      try {
        await api.delete(`lecciones/${id}/`);
        const res = await api.get(`lecciones/?unidad_id=${unidadSeleccionada.id}`);
        setLecciones(res.data);
      } catch (err) {
        console.error('Error al eliminar lección:', err);
      }
    }
  };

  // --- NAVEGAR A LA PANTALLA DE GESTIÓN DE LA LECCIÓN (SIN ERRORES 404) ---
  const irAGestionarLeccion = async (leccion) => {
    setLeccionSeleccionada(leccion);
    try {
      const [resPaginas, resPreguntas] = await Promise.all([
        api.get('paginas/'),
        api.get('preguntas/')
      ]);
      setPaginasLeccion(resPaginas.data.filter(p => Number(p.leccion) === Number(leccion.id)));
      setPreguntasLeccion(resPreguntas.data.filter(pr => Number(pr.leccion) === Number(leccion.id)));
      setVistaActual('gestion_leccion');
    } catch (err) {
      console.error('Error al cargar la gestión de la lección:', err);
    }
  };

  // Recargar datos de la lección activa
  const recargarGestionLeccion = async () => {
    if (!leccionSeleccionada) return;
    try {
      const [resPaginas, resPreguntas] = await Promise.all([
        api.get('paginas/'),
        api.get('pregunta/')
      ]);
      setPaginasLeccion(resPaginas.data.filter(p => Number(p.leccion) === Number(leccionSeleccionada.id)));
      setPreguntasLeccion(resPreguntas.data.filter(pr => Number(pr.leccion) === Number(leccionSeleccionada.id)));
    } catch (err) {
      console.error('Error al recargar:', err);
    }
  };

  // Crear contenido / párrafo en página
  const handleCrearContenidoPagina = async (e) => {
    e.preventDefault();
    if (!leccionSeleccionada || !nuevoContenidoTexto) return;
    try {
      let paginaObj = paginasLeccion.find(p => Number(p.numero_pagina) === Number(numeroPaginaDestino));
      let paginaId = paginaObj?.id;

      if (!paginaId) {
        const nuevaPagRes = await api.post('paginas/', {
          leccion: leccionSeleccionada.id,
          numero_pagina: parseInt(numeroPaginaDestino)
        });
        paginaId = nuevaPagRes.data.id;
      }

      await api.post('contenidos/', {
        pagina_leccion: paginaId,
        texto: nuevoContenidoTexto
      });

      setNuevoContenidoTexto('');
      recargarGestionLeccion();
    } catch (err) {
      console.error('Error al crear contenido:', err);
    }
  };

  const handleDeleteContenido = async (contenidoId) => {
    try {
      await api.delete(`contenidos/${contenidoId}/`);
      recargarGestionLeccion();
    } catch (err) {
      console.error('Error al eliminar contenido:', err);
    }
  };

  // Crear pregunta en la lección
  const handleCrearPreguntaLeccion = async (e) => {
    e.preventDefault();
    if (!leccionSeleccionada) return;
    try {
      await api.post('pregunta/', {
        ...nuevaPreguntaForm,
        leccion: leccionSeleccionada.id,
        orden: parseInt(nuevaPreguntaForm.orden) || 1
      });
      setNuevaPreguntaForm({ texto: '', tipo: 'multiple', orden: preguntasLeccion.length + 1, respuesta_texto: '', extracto_referencia: '' });
      recargarGestionLeccion();
    } catch (err) {
      console.error('Error al crear pregunta:', err);
    }
  };

  const handleDeletePregunta = async (preguntaId) => {
    try {
      await api.delete(`pregunta/${preguntaId}/`);
      recargarGestionLeccion();
    } catch (err) {
      console.error('Error al eliminar pregunta:', err);
    }
  };

  // Crear opción para una pregunta específica
  const handleCrearOpcion = async (preguntaId, e) => {
    e.preventDefault();
    const formOpcion = opcionForms[preguntaId] || { texto: '', es_correcta: false };
    if (!formOpcion.texto) return;

    try {
      await api.post('pregunta/', {
        pregunta_leccion: preguntaId,
        texto: formOpcion.texto,
        es_correcta: formOpcion.es_correcta
      });
      setOpcionForms({ ...opcionForms, [preguntaId]: { texto: '', es_correcta: false } });
      recargarGestionLeccion();
    } catch (err) {
      console.error('Error al crear opción:', err);
    }
  };

  // Eliminar opción de respuesta
  const handleDeleteOpcion = async (opcionId) => {
    try {
      await api.delete(`opciones-pregunta/${opcionId}/`);
      recargarGestionLeccion();
    } catch (err) {
      console.error('Error al eliminar opción:', err);
    }
  };


  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
      
      {/* ================= PANTALLA 1: LISTADO DE UNIDADES ================= */}
      {vistaActual === 'unidades' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Gestor Académico: Unidades</h2>
              <p className="text-sm text-gray-500">Administra las unidades educativas y accede a sus lecciones.</p>
            </div>
            <button
              onClick={abrirModalCrearUnidad}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2"
            >
              + Nueva Unidad
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {unidades.map((u) => (
              <div
                key={u.id}
                onClick={() => seleccionarUnidad(u)}
                className="border border-gray-200 hover:border-blue-500 rounded-2xl p-6 bg-white hover:bg-blue-50/20 cursor-pointer transition shadow-sm flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                      Orden #{u.orden}
                    </span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => abrirModalEditarUnidad(u, e)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-gray-100 transition">✏️</button>
                      <button onClick={(e) => handleDeleteUnidad(u.id, e)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition">🗑️</button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition">{u.nombre}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{u.descripcion || 'Sin descripción registrada.'}</p>
                </div>

                <div className="pt-3 border-t flex justify-between items-center text-xs font-semibold text-blue-600">
                  <span>Ver Lecciones →</span>
                  {u.pdf_url && <span className="text-gray-400 font-normal">📄 PDF Adjunto</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ================= PANTALLA 2: LISTADO DE LECCIONES DE LA UNIDAD ================= */}
      {vistaActual === 'lecciones' && unidadSeleccionada && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
            <div>
              <button
                onClick={() => setVistaActual('unidades')}
                className="text-xs font-bold text-blue-600 hover:underline mb-1.5 inline-block"
              >
                ← Volver al listado de Unidades
              </button>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Unidad: {unidadSeleccionada.nombre}</h2>
              <p className="text-sm text-gray-500">Gestiona las lecciones correspondientes a esta unidad.</p>
            </div>
            <button
              onClick={abrirModalCrearLeccion}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-md"
            >
              + Nueva Lección
            </button>
          </div>

          <div className="space-y-3">
            {lecciones.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
                No hay lecciones registradas en esta unidad. ¡Crea la primera!
              </div>
            ) : (
              lecciones.map((l) => (
                <div
                  key={l.id}
                  onClick={() => irAGestionarLeccion(l)}
                  className="p-5 border border-gray-200 hover:border-emerald-400 rounded-2xl bg-white hover:bg-emerald-50/10 cursor-pointer transition shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md">
                        #{l.orden}
                      </span>
                      <span className="text-base font-bold text-gray-800">{l.nombre}</span>
                    </div>
                    <p className="text-xs text-gray-500">Modo: <strong className="text-gray-700">{l.modo}</strong> | Páginas: <strong className="text-gray-700">{l.paginas || 0}</strong></p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => irAGestionarLeccion(l)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                    >
                      Gestionar Contenido y Preguntas ⚙️
                    </button>
                    <button onClick={(e) => abrirModalEditarLeccion(l, e)} className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100">✏️</button>
                    <button onClick={(e) => handleDeleteLeccion(l.id, e)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50">🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* ================= PANTALLA 3: GESTIÓN DE INFORMACIÓN DE LA LECCIÓN (CONTENIDO Y PREGUNTAS) ================= */}
      {vistaActual === 'gestion_leccion' && leccionSeleccionada && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5 bg-gray-50 p-5 rounded-2xl border">
            <div>
              <button
                onClick={() => setVistaActual('lecciones')}
                className="text-xs font-bold text-blue-600 hover:underline mb-1.5 inline-block"
              >
                ← Volver a las lecciones de la unidad
              </button>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Gestionando Lección: {leccionSeleccionada.nombre}</h2>
              <p className="text-xs text-gray-500">Panel exclusivo para estructurar las páginas, textos de estudio y preguntas evaluativas.</p>
            </div>
            <span className="bg-blue-100 text-blue-800 font-bold text-xs px-3.5 py-1.5 rounded-xl">
              Unidad: {unidadSeleccionada?.nombre}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COLUMNA IZQUIERDA: PÁGINAS Y CONTENIDOS */}
            <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
                📄 Páginas y Bloques de Texto
              </h3>

              <form onSubmit={handleCrearContenidoPagina} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Nº Página</label>
                    <input
                      type="number"
                      min="1"
                      value={numeroPaginaDestino}
                      onChange={(e) => setNumeroPaginaDestino(e.target.value)}
                      className="border p-2 rounded-lg text-xs w-full bg-white font-bold"
                      required
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <span className="text-[11px] text-gray-400 italic">Si el número de página no existe, se creará de forma automática.</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Texto / Párrafo del Contenido</label>
                  <textarea
                    rows={2}
                    placeholder="Escribe el contenido educativo o reglamentario de la página..."
                    value={nuevoContenidoTexto}
                    onChange={(e) => setNuevoContenidoTexto(e.target.value)}
                    className="border p-2.5 rounded-lg text-xs w-full outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl w-full transition shadow-sm"
                >
                  + Añadir Párrafo a Página
                </button>
              </form>

              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {paginasLeccion.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-6">No hay páginas ni contenidos registrados en esta lección.</p>
                ) : (
                  paginasLeccion.map((pag) => (
                    <div key={pag.id} className="bg-white border rounded-xl p-4 shadow-sm space-y-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                        Página #{pag.numero_pagina}
                      </span>
                      <div className="space-y-2 pt-1">
                        {pag.contenidos && pag.contenidos.length > 0 ? (
                          pag.contenidos.map((cont) => (
                            <div key={cont.id} className="bg-gray-50 border p-2.5 rounded-lg flex justify-between items-start gap-2">
                              <p className="text-xs text-gray-700 leading-relaxed flex-1">{cont.texto}</p>
                              <button
                                onClick={() => handleDeleteContenido(cont.id)}
                                className="text-red-400 hover:text-red-600 text-xs font-bold px-1.5"
                                title="Eliminar párrafo"
                              >
                                ✕
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic">Esta página no tiene párrafos asociados.</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: PREGUNTAS DE EVALUACIÓN Y OPCIONES */}
            <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
                ❓ Preguntas de Evaluación
              </h3>

              <form onSubmit={handleCrearPreguntaLeccion} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Enunciado de la Pregunta</label>
                  <textarea
                    rows={2}
                    placeholder="¿Cuál es el objetivo principal..."
                    value={nuevaPreguntaForm.texto}
                    onChange={(e) => setNuevaPreguntaForm({ ...nuevaPreguntaForm, texto: e.target.value })}
                    className="border p-2.5 rounded-lg text-xs w-full outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Orden</label>
                    <input
                      type="number"
                      min="1"
                      value={nuevaPreguntaForm.orden}
                      onChange={(e) => setNuevaPreguntaForm({ ...nuevaPreguntaForm, orden: parseInt(e.target.value) || 1 })}
                      className="border p-2 rounded-lg text-xs w-full bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Tipo</label>
                    <select
                      value={nuevaPreguntaForm.tipo}
                      onChange={(e) => setNuevaPreguntaForm({ ...nuevaPreguntaForm, tipo: e.target.value })}
                      className="border p-2 rounded-lg text-xs w-full bg-white outline-none"
                    >
                      <option value="multiple">Múltiple Opción</option>
                      <option value="verdadero_falso">Verdadero / Falso</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Referencia Normativa (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: RIC N°01 - Alcance"
                    value={nuevaPreguntaForm.extracto_referencia}
                    onChange={(e) => setNuevaPreguntaForm({ ...nuevaPreguntaForm, extracto_referencia: e.target.value })}
                    className="border p-2 rounded-lg text-xs w-full bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl w-full transition shadow-sm"
                >
                  + Registrar Pregunta
                </button>
              </form>

              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {preguntasLeccion.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-6">No hay preguntas registradas en esta lección.</p>
                ) : (
                  preguntasLeccion.map((pr) => (
                    <div key={pr.id} className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded">
                          Pregunta #{pr.orden}
                        </span>
                        <button
                          onClick={() => handleDeletePregunta(pr.id)}
                          className="text-red-400 hover:text-red-600 text-xs font-bold"
                        >
                          Eliminar 🗑️
                        </button>
                      </div>
                      <p className="text-xs font-bold text-gray-800">{pr.texto}</p>
                      
                      {/* Sub-sección de opciones de la pregunta */}
                      <div className="space-y-2 pt-2 border-t border-dashed">
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">Opciones de Respuesta:</span>
                        
                        {pr.opciones && pr.opciones.map((op) => (
                          <div key={op.id} className={`text-xs p-2 rounded-lg flex justify-between items-center ${op.es_correcta ? 'bg-emerald-50 border border-emerald-300 font-medium' : 'bg-gray-50 border'}`}>
                            <span>{op.texto} {op.es_correcta && '✅'}</span>
                            <button onClick={() => handleDeleteOpcion(op.id)} className="text-red-500 font-bold px-1">✕</button>
                          </div>
                        ))}

                        {/* Formulario rápido para añadir opción */}
                        <form onSubmit={(e) => handleCrearOpcion(pr.id, e)} className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Nueva opción..."
                            value={opcionForms[pr.id]?.texto || ''}
                            onChange={(e) => setOpcionForms({
                              ...opcionForms,
                              [pr.id]: { ...(opcionForms[pr.id] || { es_correcta: false }), texto: e.target.value }
                            })}
                            className="border p-1.5 rounded-lg text-xs flex-1 outline-none"
                            required
                          />
                          <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={opcionForms[pr.id]?.es_correcta || false}
                              onChange={(e) => setOpcionForms({
                                ...opcionForms,
                                [pr.id]: { ...(opcionForms[pr.id] || { texto: '' }), es_correcta: e.target.checked }
                              })}
                            />
                            Correcta
                          </label>
                          <button type="submit" className="bg-gray-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold">+</button>
                        </form>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ================= MODAL CREAR / EDITAR UNIDAD ================= */}
      {isModalUnidadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingUnidadId ? 'Modificar Unidad' : 'Crear Nueva Unidad'}
              </h3>
              <button onClick={() => setIsModalUnidadOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleGuardarUnidad} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Nombre de la Unidad:</label>
                <input
                  type="text"
                  placeholder="Ej: Módulo de Instalaciones Eléctricas"
                  value={formUnidad.nombre}
                  onChange={(e) => setFormUnidad({ ...formUnidad, nombre: e.target.value })}
                  className="border p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Orden:</label>
                  <input
                    type="number"
                    min="1"
                    value={formUnidad.orden}
                    onChange={(e) => setFormUnidad({ ...formUnidad, orden: parseInt(e.target.value) || 1 })}
                    className="border p-2.5 rounded-xl text-sm w-full outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">PDF URL (Opcional):</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formUnidad.pdf_url}
                    onChange={(e) => setFormUnidad({ ...formUnidad, pdf_url: e.target.value })}
                    className="border p-2.5 rounded-xl text-sm w-full outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Descripción:</label>
                <textarea
                  rows={3}
                  placeholder="Resumen del contenido de la unidad..."
                  value={formUnidad.descripcion}
                  onChange={(e) => setFormUnidad({ ...formUnidad, descripcion: e.target.value })}
                  className="border p-2.5 rounded-xl text-sm w-full outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalUnidadOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md">Guardar Unidad</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ================= MODAL CREAR / EDITAR LECCIÓN ================= */}
      {isModalLeccionOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingLeccionId ? 'Modificar Lección' : 'Crear Nueva Lección'}
              </h3>
              <button onClick={() => setIsModalLeccionOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleGuardarLeccion} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Nombre de la Lección:</label>
                <input
                  type="text"
                  placeholder="Ej: Empalmes monofásicos"
                  value={formLeccion.nombre}
                  onChange={(e) => setFormLeccion({ ...formLeccion, nombre: e.target.value })}
                  className="border p-2.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Orden:</label>
                  <input
                    type="number"
                    min="1"
                    value={formLeccion.orden}
                    onChange={(e) => setFormLeccion({ ...formLeccion, orden: parseInt(e.target.value) || 1 })}
                    className="border p-2.5 rounded-xl text-sm w-full outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Páginas Estimadas:</label>
                  <input
                    type="number"
                    min="0"
                    value={formLeccion.paginas}
                    onChange={(e) => setFormLeccion({ ...formLeccion, paginas: parseInt(e.target.value) || 0 })}
                    className="border p-2.5 rounded-xl text-sm w-full outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Modo:</label>
                <input
                  type="text"
                  value={formLeccion.modo}
                  onChange={(e) => setFormLeccion({ ...formLeccion, modo: e.target.value })}
                  className="border p-2.5 rounded-xl text-sm w-full outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalLeccionOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md">Guardar Lección</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}