import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";
import "./TakeQuiz.css";

export default function TakeQuiz() {
  const { groupId, quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [quizStatus, setQuizStatus] = useState("loading"); // loading, not-started, active, ended
  const [countdownToStart, setCountdownToStart] = useState(null);

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  // Countdown to quiz start
  useEffect(() => {
    if (countdownToStart !== null && countdownToStart > 0) {
      const timer = setInterval(() => {
        setCountdownToStart((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Refresh quiz data to check if it's now active
            fetchQuizData();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdownToStart]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz details
      const quizResponse = await api.get(`/quizzes/group/${groupId}`);
      const targetQuiz = quizResponse.data.find(q => q._id === quizId);
      
      if (!targetQuiz) {
        setError("Quiz not found");
        setLoading(false);
        return;
      }

      setQuiz(targetQuiz);

      // Check if quiz is scheduled
      if (targetQuiz.scheduledStartTime && targetQuiz.scheduledEndTime) {
        const now = new Date();
        const startTime = new Date(targetQuiz.scheduledStartTime);
        const endTime = new Date(targetQuiz.scheduledEndTime);

        if (now < startTime) {
          // Quiz hasn't started yet
          setQuizStatus("not-started");
          const secondsUntilStart = Math.floor((startTime - now) / 1000);
          setCountdownToStart(secondsUntilStart);
          setLoading(false);
          return;
        } else if (now > endTime) {
          // Quiz has ended
          setQuizStatus("ended");
          setError("This quiz has ended and is no longer available.");
          setLoading(false);
          return;
        }
      }

      // Quiz is active
      setQuizStatus("active");

      // Fetch questions
      const questionsResponse = await api.get(`/questions/quiz/${quizId}`);
      setQuestions(questionsResponse.data);

      // Initialize time
      if (targetQuiz.timeLimit) {
        setTimeRemaining(targetQuiz.timeLimit);
      }
      setQuizStartTime(Date.now());

      setLoading(false);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError(err.response?.data?.message || "Failed to load quiz");
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleAutoSubmit = async () => {
    alert("Time's up! Submitting your quiz automatically.");
    await submitQuiz();
  };

  const submitQuiz = async () => {
    setSubmitting(true);

    try {
      const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
      
      const formattedAnswers = questions.map(q => ({
        questionId: q._id,
        selectedOption: answers[q._id] || null,
      }));

      const response = await api.post("/results", {
        quizId: quizId,
        answers: formattedAnswers,
        timeTaken: timeTaken,
      });

      // Navigate to results page
      navigate(`/groups/${groupId}/quiz/${quizId}/result/${response.data._id}`);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError(err.response?.data?.message || "Failed to submit quiz");
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    // Check if all questions are answered
    const unansweredCount = questions.filter(q => !answers[q._id]).length;
    
    if (unansweredCount > 0) {
      if (!confirm(`You have ${unansweredCount} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }
    
    setShowConfirmSubmit(true);
  };

  const confirmSubmit = () => {
    setShowConfirmSubmit(false);
    submitQuiz();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading quiz...</div>
      </div>
    );
  }

  // Show countdown if quiz hasn't started yet
  if (quizStatus === "not-started") {
    const days = Math.floor(countdownToStart / 86400);
    const hours = Math.floor((countdownToStart % 86400) / 3600);
    const minutes = Math.floor((countdownToStart % 3600) / 60);
    const seconds = countdownToStart % 60;

    return (
      <div className="page-container">
        <div className="countdown-container">
          <h1 className="quiz-title">{quiz.title}</h1>
          {quiz.description && <p className="quiz-description">{quiz.description}</p>}
          
          <div className="countdown-card">
            <div className="countdown-icon">⏰</div>
            <h2>Quiz Starts In</h2>
            <div className="countdown-timer">
              {days > 0 && (
                <div className="countdown-unit">
                  <span className="countdown-value">{days}</span>
                  <span className="countdown-label">Days</span>
                </div>
              )}
              <div className="countdown-unit">
                <span className="countdown-value">{hours}</span>
                <span className="countdown-label">Hours</span>
              </div>
              <div className="countdown-unit">
                <span className="countdown-value">{minutes}</span>
                <span className="countdown-label">Minutes</span>
              </div>
              <div className="countdown-unit">
                <span className="countdown-value">{seconds}</span>
                <span className="countdown-label">Seconds</span>
              </div>
            </div>
            <div className="quiz-schedule-info">
              <p>📅 <strong>Start Time:</strong> {new Date(quiz.scheduledStartTime).toLocaleString()}</p>
              <p>📅 <strong>End Time:</strong> {new Date(quiz.scheduledEndTime).toLocaleString()}</p>
              <p>⏱️ <strong>Duration:</strong> {Math.floor(quiz.timeLimit / 60)} minutes</p>
            </div>
          </div>
          
          <button onClick={() => navigate(`/groups/${groupId}`)} className="btn btn-secondary">
            Back to Group
          </button>
        </div>
      </div>
    );
  }

  // Show message if quiz has ended
  if (quizStatus === "ended") {
    return (
      <div className="page-container">
        <div className="countdown-container">
          <h1 className="quiz-title">{quiz.title}</h1>
          <div className="countdown-card ended">
            <div className="countdown-icon">🔒</div>
            <h2>Quiz Has Ended</h2>
            <p>This quiz is no longer available. The submission period has closed.</p>
            <div className="quiz-schedule-info">
              <p>📅 <strong>Ended:</strong> {new Date(quiz.scheduledEndTime).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={() => navigate(`/groups/${groupId}`)} className="btn btn-secondary">
            Back to Group
          </button>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="page-container">
        <div className="error-message">{error || "Quiz not found"}</div>
        <button onClick={() => navigate(`/groups/${groupId}`)} className="btn btn-secondary">
          Back to Group
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="take-quiz-page">
      {/* Quiz Header */}
      <div className="quiz-header">
        <div className="quiz-info">
          <h1 className="quiz-title">{quiz.title}</h1>
          {quiz.description && <p className="quiz-description">{quiz.description}</p>}
        </div>
        
        <div className="quiz-stats">
          <div className="stat-item">
            <span className="stat-label">Progress</span>
            <span className="stat-value">
              {getAnsweredCount()} / {questions.length}
            </span>
          </div>
          {timeRemaining !== null && (
            <div className={`stat-item timer ${timeRemaining < 300 ? 'warning' : ''}`}>
              <span className="stat-label">Time</span>
              <span className="stat-value">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Question Navigator */}
      <div className="question-navigator">
        {questions.map((q, index) => (
          <button
            key={q._id}
            className={`nav-dot ${currentQuestionIndex === index ? 'active' : ''} ${
              answers[q._id] ? 'answered' : ''
            }`}
            onClick={() => setCurrentQuestionIndex(index)}
            title={`Question ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question Display */}
      {currentQuestion && (
        <div className="question-container">
          <div className="question-header">
            <h2 className="question-number">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            <div className="question-meta">
              <span className="badge badge-{currentQuestion.difficulty}">
                {currentQuestion.difficulty}
              </span>
              <span className="points">{currentQuestion.points} point(s)</span>
            </div>
          </div>

          <div className="question-text">
            {currentQuestion.questionText}
          </div>

          {/* Answer Options */}
          <div className="answer-section">
            {currentQuestion.questionType === "multiple-choice" && (
              <div className="options-list">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className="option-label">
                    <input
                      type="radio"
                      name={`question-${currentQuestion._id}`}
                      value={index}
                      checked={answers[currentQuestion._id] === index}
                      onChange={() => handleAnswerChange(currentQuestion._id, index)}
                    />
                    <span className="option-text">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.questionType === "true-false" && (
              <div className="options-list">
                <label className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQuestion._id}`}
                    value="true"
                    checked={answers[currentQuestion._id] === "true"}
                    onChange={() => handleAnswerChange(currentQuestion._id, "true")}
                  />
                  <span className="option-text">True</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQuestion._id}`}
                    value="false"
                    checked={answers[currentQuestion._id] === "false"}
                    onChange={() => handleAnswerChange(currentQuestion._id, "false")}
                  />
                  <span className="option-text">False</span>
                </label>
              </div>
            )}

            {currentQuestion.questionType === "short-answer" && (
              <div className="short-answer-section">
                <input
                  type="text"
                  value={answers[currentQuestion._id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="short-answer-input"
                />
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="question-navigation">
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="btn btn-secondary"
            >
              ← Previous
            </button>
            
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="btn btn-primary"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="btn btn-success"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="modal-overlay" onClick={() => setShowConfirmSubmit(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Quiz?</h2>
              <button 
                className="modal-close"
                onClick={() => setShowConfirmSubmit(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to submit your quiz?</p>
              <p>You have answered <strong>{getAnsweredCount()}</strong> out of <strong>{questions.length}</strong> questions.</p>
              <p>You cannot change your answers after submitting.</p>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Review Answers
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmSubmit}
              >
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
