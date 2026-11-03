import React, { useState } from 'react';
import UnidadesAdmin from './components/UnidadesAdmin';
import LeccionesAdmin from './components/LeccionesAdmin';
import PaginasContenidoAdmin from './components/PaginasContenidoAdmin';
import PreguntasOpcionesAdmin from './components/PreguntasOpcionesAdmin';
import GestorAcademicoAdmin from './components/UnidadesAdmin';
import ImprimirPreguntasSimple from './components/ImprimirPreguntasSimple';
export default function App() {
  const [tab, setTab] = useState('unidades');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
   <UnidadesAdmin />
    </div>
  );
}