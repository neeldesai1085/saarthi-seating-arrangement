import axios from 'axios';
import type { Room, Rule } from '../engine/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const RoomService = {
  getAll: async () => {
    const response = await api.get<Room[]>('/rooms');
    return response.data;
  },
  create: async (data: Omit<Room, 'id' | 'totalSeats'>) => {
    const response = await api.post<Room>('/rooms', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Room>) => {
    const response = await api.put<Room>(`/rooms/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/rooms/${id}`);
  }
};

export const RuleService = {
  get: async () => {
    const response = await api.get<Rule>('/rules');
    return response.data;
  },
  update: async (data: Partial<Rule>) => {
    const response = await api.put<Rule>('/rules', data);
    return response.data;
  }
};
