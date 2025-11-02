/**
 * EXAMPLES: How to use the AI Knowledge API in your components
 * 
 * This file contains example code snippets for integrating the AI Knowledge API
 * into your Summarizer and Quiz Results components.
 */

import { 
  uploadFiles, 
  sendFollowUpQuery, 
  generateQuiz, 
  getQuizFeedback,
  formatQuizResultsForFeedback,
  checkServiceHealth 
} from './aiKnowledgeApi';

// ==================== SUMMARIZER COMPONENT EXAMPLES ====================

/**
 * Example 1: Upload files and get summaries in Summarizer component
 */
export const exampleUploadFilesInSummarizer = async (selectedFile) => {
  try {
    const response = await uploadFiles([selectedFile]);
    
    console.log('Upload successful:', response);
    // response structure: { message: string, summaries: { filename: summary } }
    
    const summaries = response.summaries;
    const filename = selectedFile.name;
    const summary = summaries[filename];
    
    // Update your component state with the summary
    // setSummaryResult({
    //   title: filename,
    //   summary: summary,
    //   // ... other fields
    // });
    
    return { success: true, summaries };
  } catch (error) {
    console.error('Upload failed:', error);
    // Handle error in UI
    // alert(error.response?.data?.message || 'Failed to upload file');
    return { success: false, error };
  }
};

/**
 * Example 2: Send follow-up question about uploaded document
 */
export const exampleSendFollowUp = async (question) => {
  try {
    const response = await sendFollowUpQuery(question);
    
    console.log('Follow-up response:', response);
    // response structure: { response: string }
    
    const answer = response.response;
    
    // Display answer in your UI
    // setFollowUpAnswer(answer);
    
    return { success: true, answer };
  } catch (error) {
    console.error('Follow-up failed:', error);
    return { success: false, error };
  }
};

/**
 * Example 3: Generate quiz from uploaded notes
 */
export const exampleGenerateQuizFromSummary = async (numQuestions = 1, groupId) => {
  try {
    const response = await generateQuiz(
      numQuestions,
      'Quiz from Summary',
      'Auto-generated quiz based on uploaded document',
      groupId
    );
    
    console.log('Quiz generated:', response);
    // response structure: { quiz: {...}, message: string }
    
    if (response.quiz && response.quiz.quizId) {
      // Quiz generated successfully
      // Navigate to the quiz or show success message
      // navigate(`/groups/${groupId}/quiz/${response.quiz.quizId}`);
      return { success: true, quiz: response.quiz };
    } else {
      // No quiz could be generated
      // alert(response.message);
      return { success: false, message: response.message };
    }
  } catch (error) {
    console.error('Quiz generation failed:', error);
    return { success: false, error };
  }
};

// ==================== QUIZ RESULTS COMPONENT EXAMPLES ====================

/**
 * Example 4: Get feedback for completed quiz
 */
export const exampleGetQuizFeedback = async (quizData) => {
  try {
    // Format: questions, userAnswers, correctAnswers
    const { questions, userAnswers, correctAnswers } = quizData;
    
    // Format the results for the API
    const quizResults = formatQuizResultsForFeedback(
      questions,
      userAnswers,
      correctAnswers
    );
    
    const response = await getQuizFeedback(quizResults);
    
    console.log('Feedback received:', response);
    // response structure: { feedback: string }
    
    const feedback = response.feedback;
    
    // Display feedback in your UI
    // setFeedbackText(feedback);
    
    return { success: true, feedback };
  } catch (error) {
    console.error('Feedback request failed:', error);
    return { success: false, error };
  }
};

/**
 * Example 5: Complete flow - Upload, generate quiz, get feedback
 */
export const exampleCompleteFlow = async (file, numQuestions = 5, groupId) => {
  try {
    // Step 1: Upload and summarize
    console.log('Step 1: Uploading file...');
    const uploadResult = await uploadFiles([file]);
    console.log('Summary:', uploadResult.summaries[file.name]);
    
    // Step 2: Generate quiz
    console.log('Step 2: Generating quiz...');
  const quizResult = await generateQuiz(numQuestions, 'Generated Quiz', 'From uploaded notes', groupId);
    console.log('Quiz generated:', quizResult.quiz);
    
    // Step 3: User takes quiz (simulate)
    // In real app, user would take the quiz through UI
    const simulatedAnswers = {
      0: 'Answer A',
      1: 'Answer B',
      2: 'Answer C',
    };
    
    const simulatedCorrect = {
      0: 'Answer A',
      1: 'Answer C',
      2: 'Answer C',
    };
    
    // Step 4: Get feedback
    console.log('Step 3: Getting feedback...');
    const mockQuestions = [
      { questionText: 'Question 1' },
      { questionText: 'Question 2' },
      { questionText: 'Question 3' },
    ];
    
    const quizResults = formatQuizResultsForFeedback(
      mockQuestions,
      simulatedAnswers,
      simulatedCorrect
    );
    
    const feedbackResult = await getQuizFeedback(quizResults);
    console.log('Feedback:', feedbackResult.feedback);
    
    return {
      success: true,
      summary: uploadResult.summaries[file.name],
      quiz: quizResult.quiz,
      feedback: feedbackResult.feedback,
    };
  } catch (error) {
    console.error('Complete flow failed:', error);
    return { success: false, error };
  }
};

// ==================== UTILITY EXAMPLES ====================

/**
 * Example 6: Check if service is available before making requests
 */
export const exampleCheckService = async () => {
  const isAvailable = await checkServiceHealth();
  
  if (isAvailable) {
    console.log('AI Knowledge service is available');
    // Proceed with API calls
  } else {
    console.log('AI Knowledge service is unavailable');
    // Show error message to user
    // alert('AI features are currently unavailable. Please try again later.');
  }
  
  return isAvailable;
};
