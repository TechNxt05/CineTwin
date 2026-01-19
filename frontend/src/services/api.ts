/// <reference types="vite/client" />
import axios from 'axios'
import { Question, Character, QuizData, QuizResult, AmritanshuFeedback, MediaTraits } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiService = {
  // Questions
  getQuestions: async (limit: number = 20): Promise<Question[]> => {
    const response = await api.get(`/api/questions?count=${limit}`)
    return response.data
  },

  // Characters
  getCharacters: async (universe?: string, limit?: number): Promise<Character[]> => {
    const params = new URLSearchParams()
    if (universe) params.append('universe', universe)
    if (limit) params.append('limit', limit.toString())

    const response = await api.get(`/api/characters?${params.toString()}`)
    return response.data
  },

  // Quiz scoring
  submitQuiz: async (data: QuizData): Promise<QuizResult> => {
    const response = await api.post('/api/score', data)
    return response.data
  },

  // Amritanshu feedback
  submitAmritanshuFeedback: async (data: AmritanshuFeedback): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/api/feedback/amritanshu', data)
    return response.data
  },

  // Media mapping (internal)
  mapMedia: async (title: string, type: 'song' | 'movie'): Promise<MediaTraits> => {
    const response = await api.post('/api/media/map', { title, type })
    return response.data
  },

  // Admin endpoints
  admin: {
    getResults: async (token: string, limit?: number): Promise<any[]> => {
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())

      const response = await api.get(`/admin/results?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },

    getFeedback: async (token: string, limit?: number): Promise<any[]> => {
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())

      const response = await api.get(`/admin/feedback?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },

    getStats: async (token: string): Promise<any> => {
      const response = await api.get('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },

    remapMedia: async (token: string, title: string, type: 'song' | 'movie'): Promise<any> => {
      const response = await api.post('/admin/media-mapping', { title, type }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    }
  }
}

export default api
