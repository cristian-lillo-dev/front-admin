import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function PaginasContenidoAdmin() {
  const [paginas, setPaginas] = useState([]);
  const [lecciones, setLecciones] = useState([]);
  const [filtroLeccion, setFiltroLeccion] = useState('');
  
  const [paginaForm, setPaginaForm] = useState({ leccion: '', numero_pagina: 1 });
  const [contenidoForms, setContenidoForms] = useState({});

  const cargarDatos = async () => {
    try {
      // Cargamos todas las lecciones y páginas de forma segura
      const [resPaginas, resLecciones] = await Promise.all([
        api.get('paginas/'),
        api.get('lecciones/')
      ]);
      setPaginas(resPaginas.data);
      setLecciones(resLecciones.data);
    } catch (err) {
      console.error('Error al cargar páginas o lecciones:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearPagina = async (e) => {
    e.preventDefault();
    if (!paginaForm.leccion) return;
    try {
      await api.post('paginas/', {
        leccion: parseInt(paginaForm.leccion),
        numero_pagina: parseInt(paginaForm.numero_pagina) || 1
      });
      setPaginaForm({ leccion: '', numero_pagina: 1 });
      cargarDatos();
    } catch (err) {
      console.error('Error al crear página:', err);
    }
  };

  const handleCrearContenido = async (paginaId, e) => {
    e.preventDefault();
    const texto = contenidoForms[paginaId]?.texto;
    if (!texto) return;

    try {
      await api.post('contenidos/', {
        pagina_leccion: paginaId,
        texto: texto
      });
      setContenidoForms({ ...contenidoForms, [paginaId]: { texto: '' } });
      cargarDatos();
    } catch (err) {
      console.error('Error al crear contenido:', err);
    }
  };

  const handleDeleteContenido = async (contenidoId) => {
    try {
      await api.delete(`contenidos/${contenidoId}/`);
      cargarDatos();
    } catch (err) {
      console.error('Error al eliminar contenido:', err);
    }
  };

  // Filtrado seguro en el cliente para evitar errores 404 por query params malformados
  const paginasFiltradas = filtroLeccion
    ? paginas.filter((p) => String(p.leccion) === String(filtroLeccion))
    : paginas;

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestión de Páginas y Contenidos</h2>
          <p className="text-sm text-gray-500">Administra la estructura de texto e información por lección y página.</p>
        </div>

        {/* Filtro por Lección */}
        <div className="w-full md:w-72">
          <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Filtrar por Lección:</label>
          <select
            value={filtroLeccion}
            onChange={(e) => setFiltroLeccion(e.target.value)}
            className="border border-gray-300 p-2 rounded-lg w-full text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="">-- Todas las lecciones --</option>
            {lecciones.map((l) => (
              <option key={l.id} value={l.id}>{l.id} - {l.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Formulario para Crear Página */}
        <div className="lg:col-span-1 bg-gray-50 p-4 rounded-xl border border-gray-200 h-fit space-y-4">
          <h3 className="font-bold text-gray-700 text-base">Crear Nueva Página</h3>
          <form onSubmit={handleCrearPagina} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lección Destino:</label>
              <select
                value={paginaForm.leccion}
                onChange={(e) => setPaginaForm({ ...paginaForm, leccion: e.target.value })}
                className="border p-2 rounded-lg w-full text-sm bg-white"
                required
              >
                <option value="">Selecciona una lección</option>
                {lecciones.map((l) => (
                  <option key={l.id} value={l.id}>{l.id} - {l.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Número de Página:</label>
              <input
                type="number"
                min="1"
                value={paginaForm.numero_pagina}
                onChange={(e) => setPaginaForm({ ...paginaForm, numero_pagina: e.target.value })}
                className="border p-2 rounded-lg w-full text-sm bg-white"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded-lg w-full text-sm transition shadow-sm"
            >
              Registrar Página
            </button>
          </form>
        </div>

        {/* Columna Derecha: Listado de Páginas y sus Bloques de Contenido */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-base">
              Páginas Registradas ({paginasFiltradas.length})
            </h3>
            {filtroLeccion && (
              <button
                onClick={() => setFiltroLeccion('')}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {paginasFiltradas.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              No hay páginas registradas con este filtro.
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {paginasFiltradas.map((pag) => {
                const leccionObj = lecciones.find(l => l.id === pag.leccion);
                return (
                  <div key={pag.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md">
                          Página {pag.numero_pagina}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          Lección ID: {pag.leccion} {leccionObj ? `- ${leccionObj.nombre}` : ''}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">ID Reg: {pag.id}</span>
                    </div>

                    {/* Bloques de Contenido existentes */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contenidos de la página:</p>
                      {pag.contenidos && pag.contenidos.length > 0 ? (
                        pag.contenidos.map((cont) => (
                          <div key={cont.id} className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg flex justify-between items-start gap-3">
                            <p className="text-xs text-gray-700 leading-relaxed font-normal whitespace-pre-wrap flex-1">
                              {cont.texto}
                            </p>
                            <button
                              onClick={() => handleDeleteContenido(cont.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-50 transition"
                              title="Eliminar contenido"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">No hay bloques de texto en esta página aún.</p>
                      )}
                    </div>

                    {/* Formulario rápido para añadir contenido a esta página */}
                    <form
                      onSubmit={(e) => handleCrearContenido(pag.id, e)}
                      className="mt-3 pt-3 border-t border-dashed flex gap-2"
                    >
                      <textarea
                        placeholder="Añadir nuevo párrafo de contenido..."
                        value={contenidoForms[pag.id]?.texto || ''}
                        onChange={(e) => setContenidoForms({
                          ...contenidoForms,
                          [pag.id]: { texto: e.target.value }
                        })}
                        className="border border-gray-300 p-2 rounded-lg text-xs w-full focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                        rows={1}
                        required
                      />
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition whitespace-nowrap h-fit self-end"
                      >
                        + Añadir
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}