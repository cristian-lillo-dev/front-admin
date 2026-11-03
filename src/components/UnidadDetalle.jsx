import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import LeccionDetalle from './LeccionDetalle';

export default function UnidadDetalle({ unidad, onVolver }) {
  const [lecciones, setLecciones] = useState([]);
  const [leccionSeleccionada, setLeccionSeleccionada] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: '', modo: 'estudio', paginas: 0, orden: 1 });

  const cargarLecciones = async () => {
    try {
      const res = await api.get(`lecciones/?unidad_id=${unidad.id}`);
      setLecciones(res.data);
    } catch (err) {
      console.error('Error al cargar lecciones:', err);
    }
  };

  useEffect(() => {
    cargarLecciones();
  }, [unidad]);

  const abrirModal = (l = { id: null, nombre: '', modo: 'estudio', paginas: 0, orden: lecciones.length + 1 }) => {
    setForm(l);
    setModalOpen(true);
  };

  const guardarLeccion = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, unidad: unidad.id };
      if (form.id) {
        await api.put(`lecciones/${form.id}/`, payload);
      } else {
        await api.post('lecciones/', payload);
      }
      setModalOpen(false);
      cargarLecciones();
    } catch (err) {
      console.error('Error al guardar lección:', err);
    }
  };

  const borrarLeccion = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta lección?')) {
      try {
        await api.delete(`lecciones/${id}/`);
        cargarLecciones();
      } catch (err) {
        console.error('Error al eliminar lección:', err);
      }
    }
  };

  // No maiparang ti detaly ti leksion no adda napili
  if (leccionSeleccionada) {
    return <LeccionDetalle leccion={leccionSeleccionada} onVolver={() => setLeccionSeleccionada(null)} />;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow space-y-4 animate-fadeIn">
      {/* Cabecera con botón de retorno */}
      <div className="flex justify-between items-center border-b pb-3">
        <div>
          <button onClick={onVolver} className="text-xs font-bold text-blue-600 hover:underline mb-1 block">
            ← Volver a Unidades
          </button>
          <h2 className="text-lg font-bold text-gray-800">{unidad.nombre}</h2>
          {unidad.descripcion && <p className="text-xs text-gray-500">{unidad.descripcion}</p>}
        </div>
        <button onClick={() => abrirModal()} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg">
          + Nueva Lección
        </button>
      </div>

      {/* Listado de Lecciones */}
      <div className="space-y-3">
        {lecciones.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-8">No hay lecciones registradas en esta unidad.</p>
        ) : (
          lecciones.map((l) => (
            <div 
              key={l.id} 
              onClick={() => setLeccionSeleccionada(l)}
              className="border-b pb-2 flex justify-between items-center cursor-pointer hover:bg-emerald-50/20 p-2 rounded-xl transition"
            >
              <div>
                <h3 className="font-semibold text-sm text-emerald-900">#{l.orden}: {l.nombre}</h3>
                <p className="text-xs text-gray-500">Modo: <span className="font-medium">{l.modo}</span> | Páginas: {l.paginas || 0}</p>
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => abrirModal(l)} className="text-xs px-2 py-1 bg-gray-100 rounded">✏️</button>
                <button onClick={(e) => borrarLeccion(l.id, e)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear / Editar Lección */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4">
            <h3 className="font-bold text-base">{form.id ? 'Editar Lección' : 'Nueva Lección'}</h3>
            <form onSubmit={guardarLeccion} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre de la lección"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="border p-2 w-full text-xs rounded"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Orden"
                  value={form.orden}
                  onChange={e => setForm({ ...form, orden: parseInt(e.target.value) || 1 })}
                  className="border p-2 w-full text-xs rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Páginas"
                  value={form.paginas}
                  onChange={e => setForm({ ...form, paginas: parseInt(e.target.value) || 0 })}
                  className="border p-2 w-full text-xs rounded"
                />
              </div>
              <input
                type="text"
                placeholder="Modo (ej: estudio)"
                value={form.modo}
                onChange={e => setForm({ ...form, modo: e.target.value })}
                className="border p-2 w-full text-xs rounded"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 bg-gray-100 text-xs rounded">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}