import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backelec-production.up.railway.app/api/unidades/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;