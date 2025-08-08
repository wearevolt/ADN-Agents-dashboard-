// Agno API Configuration
export const AGNO_CONFIG = {
  API_KEY: 'ag-EFFsoSj_MNM4jkApoWjS4q8nDT8uwxoeyrIRoLr1fmw',
  API_URL: 'http://localhost:7777', // Попробуем локальный сервер
  ENABLED: true
}

// Альтернативные endpoints для тестирования
export const ALTERNATIVE_ENDPOINTS = [
  'http://localhost:7777',
  'http://localhost:8000', 
  'http://localhost:3001',
  'https://api.openai.com/v1',
  'https://api.groq.com/openai/v1'
]

export const getAgnoHeaders = () => ({
  'Authorization': `Bearer ${AGNO_CONFIG.API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
})

export const AGNO_ENDPOINTS = {
  CHAT: '/chat/completions',
  AGENTS: '/models', // Попробуем /models вместо /agents
  SESSIONS: '/sessions',
  STATUS: '/status' // Упростим путь для статуса
} 