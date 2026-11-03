import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import UnidadDetalle from './UnidadDetalle';

export default function UnidadesAdmin() {
  const [unidades, setUnidades] = useState([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: '', descripcion: '', orden: 1 });

  const cargar = () => {
    api.get('unidades/')
      .then(res => {
        // Maneja tanto si viene paginado ({ results: [...] }) como si viene plano ([...])
        const dataList = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setUnidades(dataList);
      })
      .catch(console.error);
  };

  useEffect(() => { cargar(); }, []);

  const abrirModal = (u = { id: null, nombre: '', descripcion: '', orden: unidades.length + 1 }) => {
    setForm(u);
    setModalOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await api.put(`unidades/${form.id}/`, form);
      } else {
        await api.post('unidades/', form);
      }
      setModalOpen(false);
      cargar();
    } catch (err) { console.error(err); }
  };

  const borrar = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar unidad?')) {
      await api.delete(`unidades/${id}/`).catch(console.error);
      cargar();
    }
  };

  // Si hay una unidad seleccionada, mostramos su pantalla de detalle
  if (unidadSeleccionada) {
    return <UnidadDetalle unidad={unidadSeleccionada} onVolver={() => setUnidadSeleccionada(null)} />;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow space-y-4">
      <div className="flex justify-between items-center border-b pb-3 print:hidden">
        <h2 className="text-lg font-bold">Listado de Unidades (RIC)</h2>
        <div className="flex gap-2">
          <button onClick={() => abrirModal()} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg">+ Nueva</button>
        </div>
      </div>

      <div className="space-y-3">
        {(Array.isArray(unidades) ? unidades : []).map((u) => (
          <div 
            key={u.id} 
            onClick={() => setUnidadSeleccionada(u)}
            className="border-b pb-3 flex justify-between items-center cursor-pointer hover:bg-blue-50/30 p-2 rounded-xl transition"
          >
            <div>
              <h3 className="font-semibold text-sm text-blue-900">#{u.orden}: {u.nombre}</h3>
              {u.descripcion && <p className="text-xs text-gray-500">{u.descripcion}</p>}
            </div>
            <div className="flex gap-1 print:hidden" onClick={e => e.stopPropagation()}>
              <button onClick={() => abrirModal(u)} className="text-xs px-2 py-1 bg-gray-100 rounded">✏️</button>
              <button onClick={(e) => borrar(u.id, e)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4">
            <h3 className="font-bold text-base">{form.id ? 'Editar Unidad' : 'Nueva Unidad'}</h3>
            <form onSubmit={guardar} className="space-y-3">
              <input type="text" placeholder="Nombre (ej: RIC N°01)" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="border p-2 w-full text-xs rounded" required />
              <input type="number" placeholder="Orden" value={form.orden} onChange={e => setForm({...form, orden: parseInt(e.target.value)||1})} className="border p-2 w-full text-xs rounded" required />
              <textarea placeholder="Descripción" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="border p-2 w-full text-xs rounded" rows={2} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 bg-gray-100 text-xs rounded">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}