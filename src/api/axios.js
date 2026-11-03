import axios from 'axios';

const api = axios.create({
  baseURL: 'backelec-production.up.railway.app/api/', // Cambia según tu endpoint de Django
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;