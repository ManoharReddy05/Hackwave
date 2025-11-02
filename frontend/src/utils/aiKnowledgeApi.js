import axios from 'axios';

const AI_KNOWLEDGE_BASE_URL = import.meta.env.VITE_AI_KNOWLEDGE_URL;

// Create axios instance with base configuration
const aiKnowledgeApi = axios.create({
  baseURL: AI_KNOWLEDGE_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session/cookie when same-origin or CORS-enabled
});

// Inject user_id into every request (FormData, JSON body, or query params)
aiKnowledgeApi.interceptors.request.use((config) => {
  try {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!userId) return config;

    // If data is FormData, append user_id
    if (config.data instanceof FormData) {
      if (!config.data.has('user_id')) config.data.append('user_id', userId);
    } else if (config.data && typeof config.data === 'object') {
      // JSON body
      config.data = { user_id: userId, ...config.data };
    } else if (!config.data) {
      // no body
    }

    // Also ensure GET params include user_id
    if (config.method === 'get') {
      config.params = { ...(config.params || {}), user_id: userId };
    }
  } catch (_) {
    // noop
  }
  return config;
});

// Add response interceptor for error logging
aiKnowledgeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AI Knowledge API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== FILE UPLOAD & SUMMARIZATION ====================

/**
 * Upload files and get summaries
 * @param {FileList|File[]} files - Array of files to upload
 * @returns {Promise} Response with summaries
 */
export const uploadFiles = async (files) => {
  const formData = new FormData();
  
  // Append all files to FormData
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });

  const response = await aiKnowledgeApi.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// ==================== FOLLOW-UP QUESTIONS ====================

/**
 * Send a follow-up question about uploaded documents
 * @param {string} query - The follow-up question
 * @returns {Promise} Response with answer
 */
export const sendFollowUpQuery = async (query) => {
  const response = await aiKnowledgeApi.post('/followup', {
    query: query.trim(),
  });

  return response.data;
};

// ==================== QUIZ GENERATION ====================

/**
 * Generate quiz from uploaded notes
 * @param {number} numQuestions - Number of questions to generate
 * @param {string} title - Quiz title (optional)
 * @param {string} description - Quiz description (optional)
 * @returns {Promise} Response with generated quiz
 */
export const generateQuiz = async (
  numQuestions,
  title = 'Generated Quiz',
  description = 'Quiz generated from uploaded notes',
  groupId
) => {
  const payload = {
    num_questions: numQuestions,
    title,
    description,
  };
  if (groupId) payload.group_id = groupId; // Allow backend to associate quiz with a group

  const response = await aiKnowledgeApi.post('/generate_quiz', payload);

  return response.data;
};

// ==================== QUIZ FEEDBACK ====================

/**
 * Get feedback for quiz results
 * @param {Array} quizResults - Array of quiz results with structure:
 *   [{question: string, chosen_answer: string, correct_answer: string}, ...]
 * @returns {Promise} Response with detailed feedback
 */
export const getQuizFeedback = async (quizResults) => {
  const response = await aiKnowledgeApi.post('/quiz_feedback', {
    quiz_results: quizResults,
  });

  return response.data;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if AI Knowledge service is available
 * @returns {Promise<boolean>} True if service is available
 */
export const checkServiceHealth = async () => {
  try {
    const response = await aiKnowledgeApi.get('/');
    return response.status === 200;
  } catch (error) {
    console.error('AI Knowledge service unavailable:', error);
    return false;
  }
};

/**
 * Format quiz results for feedback API
 * @param {Array} questions - Array of question objects
 * @param {Object} userAnswers - Object mapping question index to selected answer
 * @param {Object} correctAnswers - Object mapping question index to correct answer
 * @returns {Array} Formatted quiz results
 */
export const formatQuizResultsForFeedback = (questions, userAnswers, correctAnswers) => {
  return questions.map((question, index) => ({
    question: question.questionText || question.question,
    chosen_answer: userAnswers[index] || 'No answer',
    correct_answer: correctAnswers[index] || 'Unknown',
  }));
};

export default aiKnowledgeApi;
