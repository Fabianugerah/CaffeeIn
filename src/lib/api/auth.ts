import axios from '@/lib/axios';
import { LoginRequest, LoginResponse, RegisterRequest } from '@/types';

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await axios.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await axios.post('/auth/logout');
    return response.data;
  },

  me: async () => {
    const response = await axios.get('/auth/me');
    return response.data;
  },
};