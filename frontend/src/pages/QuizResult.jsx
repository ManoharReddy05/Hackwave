import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { getQuizFeedback } from "../utils/aiKnowledgeApi";
import "./QuizResult.css";

export default function QuizResult() {
  const { groupId, quizId, resultId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    fetchResultData();
  }, [resultId]);

  const fetchResultData = async () => {
    try {
      // Fetch result with populated data
      const resultResponse = await api.get(`/results/${resultId}`);
      setResult(resultResponse.data);

      // Fetch all questions for detailed view
      const questionsResponse = await api.get(`/questions/quiz/${quizId}`);
      setQuestions(questionsResponse.data);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching result:", err);
      setError(err.response?.data?.message || "Failed to load result");
      setLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "excellent";
    if (percentage >= 60) return "good";
    if (percentage >= 40) return "average";
    return "poor";
  };

  const getPerformanceFeedback = () => {
    const percentage = result.percentageScore;
    let title = "";
    let message = "";
    let icon = "";
    if (percentage >= 90) {
        title= "Outstanding Performance! 🎉",
        message= "You've demonstrated excellent mastery of the material. Keep up the great work!",
        icon= "🌟"
    } else if (percentage >= 80) {
        title= "Great Job! 👏",
        message= "You have a strong understanding of the concepts. Minor improvements can push you to excellence.",
        icon= "✨"
    } else if (percentage >= 70) {
        title= "Good Effort! 👍",
        message= "You're on the right track. Review the areas where you made mistakes to strengthen your knowledge.",
        icon= "💪"
    } else if (percentage >= 60) {
        title= "Passed, But Room for Improvement 📚",
        message= "You passed, but there's significant room for growth. Focus on understanding the core concepts better.",
        icon= "📖"
    } else {
        title= "Need More Practice 🎯",
        message= "Don't be discouraged! This is an opportunity to identify what you need to work on. Review the material and try again.",
        icon= "💡"
    }
    // Build a simple feedback summary for display (no external calls here)
    const correctCount = result.answers.filter(a => a.isCorrect).length;
    const totalCount = result.answers.length;
    const feedback = `You got ${correctCount} out of ${totalCount} correct.`;
    return {
      title,
      message,
      icon,
      feedback
    }
  };

  // Build payload for AI feedback service
  const buildAiFeedbackPayload = () => {
    if (!result || !questions.length) return null;

    const correctCount = result.answers.filter(a => a.isCorrect).length;
    const totalCount = result.answers.length;

    const answers = result.answers.map((answer) => {
      const q = questions.find(q => q._id === (answer.question?._id || answer.question));
      if (!q) {
        return {
          questionId: answer.question?._id || answer.question,
          isCorrect: answer.isCorrect,
        };
      }

      let correctAnswerText = q.correctAnswer;
      if (q.questionType === "multiple-choice") {
        const correctOption = q.options?.find(o => o.isCorrect);
        correctAnswerText = correctOption?.text ?? correctAnswerText;
      }

      let selectedAnswerText = answer.selectedOption;
      if (q.questionType === "multiple-choice" && typeof answer.selectedOption === "number") {
        selectedAnswerText = q.options?.[answer.selectedOption]?.text ?? String(answer.selectedOption);
      } else if (typeof answer.selectedOption !== "string") {
        selectedAnswerText = answer.selectedOption?.toString?.() ?? "";
      }

      return {
        questionId: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        difficulty: q.difficulty,
        tags: q.tags || [],
        selectedAnswer: selectedAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned,
        points: q.points,
      };
    });

    return {
      quizId,
      resultId,
      quizTitle: result.quiz?.title,
      summary: {
        percentageScore: result.percentageScore,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        correctCount,
        totalCount,
        timeTaken: result.timeTaken,
        timeLimit: result.quiz?.timeLimit,
        passed: result.isPassed,
        attemptNumber: result.attemptNumber,
      },
      answers,
    };
  };

  // Call AI feedback service when data is ready
  useEffect(() => {
    const run = async () => {
      if (!result || !questions.length) return;
      
      setAiLoading(true);
      setAiError(null);
      
      try {
        // Build quiz results in the format expected by the API
        const quizResults = result.answers.map((answer) => {
          const q = questions.find(q => q._id === (answer.question?._id || answer.question));
          if (!q) {
            return {
              question: "Unknown question",
              chosen_answer: answer.selectedOption?.toString() || "No answer",
              correct_answer: answer.isCorrect ? answer.selectedOption?.toString() : "Unknown"
            };
          }

          let correctAnswerText = q.correctAnswer;
          if (q.questionType === "multiple-choice") {
            const correctOption = q.options?.find(o => o.isCorrect);
            correctAnswerText = correctOption?.text ?? correctAnswerText;
          }

          let selectedAnswerText = answer.selectedOption;
          if (q.questionType === "multiple-choice" && typeof answer.selectedOption === "number") {
            selectedAnswerText = q.options?.[answer.selectedOption]?.text ?? String(answer.selectedOption);
          } else if (typeof answer.selectedOption !== "string") {
            selectedAnswerText = answer.selectedOption?.toString?.() ?? "No answer";
          }

          return {
            question: q.questionText,
            chosen_answer: selectedAnswerText,
            correct_answer: correctAnswerText
          };
        });

        // Call the AI Knowledge API for feedback
        const response = await getQuizFeedback(quizResults);
        setAiFeedback(response.feedback);
      } catch (e) {
        console.error("AI Feedback error:", e);
        setAiError(e?.response?.data?.message || e.message || "Failed to fetch AI feedback");
      } finally {
        setAiLoading(false);
      }
    };

    if (result && questions.length) {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId, result, questions.length]);

  const analyzeWeakPoints = () => {
    if (!result || !questions.length) return null;

    const weakAreas = {
      topics: {},
      difficulty: { easy: 0, medium: 0, hard: 0 },
      incorrectQuestions: []
    };

    result.answers.forEach(answer => {
      const question = questions.find(q => q._id === answer.question._id || q._id === answer.question);
      
      if (question && !answer.isCorrect) {
        // Track by difficulty
        weakAreas.difficulty[question.difficulty] = 
          (weakAreas.difficulty[question.difficulty] || 0) + 1;

        // Track by tags/topics
        if (question.tags && question.tags.length) {
          question.tags.forEach(tag => {
            weakAreas.topics[tag] = (weakAreas.topics[tag] || 0) + 1;
          });
        }

        // Store incorrect question
        weakAreas.incorrectQuestions.push({
          question,
          answer
        });
      }
    });

    return weakAreas;
  };

  const getRecommendations = (weakPoints) => {
    const recommendations = [];

    if (!weakPoints) return recommendations;

    // Difficulty-based recommendations
    const totalIncorrect = weakPoints.incorrectQuestions.length;
    const { difficulty } = weakPoints;

    if (difficulty.easy > 0) {
      recommendations.push({
        type: "fundamental",
        title: "Review Fundamentals",
        description: `You missed ${difficulty.easy} easy question(s). Focus on building a strong foundation in the basics.`
      });
    }

    if (difficulty.hard > difficulty.easy && difficulty.hard > difficulty.medium) {
      recommendations.push({
        type: "advanced",
        title: "Practice Advanced Concepts",
        description: "You're struggling more with difficult questions. Challenge yourself with advanced problems and seek detailed explanations."
      });
    }

    // Topic-based recommendations
    const topicEntries = Object.entries(weakPoints.topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topicEntries.length > 0) {
      recommendations.push({
        type: "topics",
        title: "Focus on Specific Topics",
        description: `Pay special attention to: ${topicEntries.map(([topic]) => topic).join(', ')}`
      });
    }

    // Time management (if applicable)
    if (result.timeTaken && result.quiz.timeLimit) {
      const percentTimeUsed = (result.timeTaken / result.quiz.timeLimit) * 100;
      if (percentTimeUsed > 90) {
        recommendations.push({
          type: "time",
          title: "Improve Time Management",
          description: "You used most of the available time. Practice answering questions more efficiently."
        });
      }
    }

    // General recommendation if score is low
    if (result.percentageScore < 60) {
      recommendations.push({
        type: "general",
        title: "Comprehensive Review Needed",
        description: "Consider revisiting the entire material, taking notes, and practicing with additional exercises."
      });
    }

    return recommendations;
  };

  const formatTime = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading results...</div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="page-container">
        <div className="error-message">{error || "Result not found"}</div>
        <button onClick={() => navigate(`/groups/${groupId}`)} className="btn btn-secondary">
          Back to Group
        </button>
      </div>
    );
  }

  const feedback = getPerformanceFeedback();
  const weakPoints = analyzeWeakPoints();
  const recommendations = getRecommendations(weakPoints);

  return (
    <div className="quiz-result-page">
      <div className="result-header">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="back-button">
          ← Back to Group
        </button>
        <h1 className="page-title">{result.quiz.title} - Results</h1>
      </div>

      {/* Score Card */}
      <div className={`score-card ${getScoreColor(result.percentageScore)}`}>
        <div className="score-main">
          <div className="score-circle">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${result.percentageScore * 2.827} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="score-text">
              <span className="score-value">{Math.round(result.percentageScore)}%</span>
              <span className="score-label">Score</span>
            </div>
          </div>

          <div className="score-details">
            <div className="score-item">
              <span className="label">Correct Answers</span>
              <span className="value">
                {result.answers.filter(a => a.isCorrect).length} / {result.answers.length}
              </span>
            </div>
            <div className="score-item">
              <span className="label">Points Earned</span>
              <span className="value">{result.totalScore} / {result.maxScore}</span>
            </div>
            <div className="score-item">
              <span className="label">Time Taken</span>
              <span className="value">{formatTime(result.timeTaken)}</span>
            </div>
            <div className="score-item">
              <span className="label">Attempt</span>
              <span className="value">#{result.attemptNumber}</span>
            </div>
          </div>
        </div>

        <div className={`pass-status ${result.isPassed ? 'passed' : 'failed'}`}>
          {result.isPassed ? '✓ Passed' : '✗ Not Passed'}
        </div>
      </div>

      {/* Feedback Section */}
      <div className="feedback-section">
        <div className="feedback-icon">{feedback.icon}</div>
        <h2>{feedback.title || "Feedback"}</h2>
        <p>{feedback.message || "No message available."}</p>
        {aiLoading && <p>Generating AI-powered feedback…</p>}
        {!aiLoading && aiError && (
          <p className="error-message">{aiError}</p>
        )}
        {!aiLoading && !aiError && (
          <p>{aiFeedback || feedback.feedback || "No feedback available."}</p>
        )}
      </div>

      {/* Weak Points Analysis */}
      {weakPoints && weakPoints.incorrectQuestions.length > 0 && (
        <div className="weak-points-section">
          <h2>📊 Areas for Improvement</h2>
          
          {/* Difficulty Breakdown */}
          <div className="analysis-card">
            <h3>Performance by Difficulty</h3>
            <div className="difficulty-bars">
              {['easy', 'medium', 'hard'].map(level => {
                const total = questions.filter(q => q.difficulty === level).length;
                const incorrect = weakPoints.difficulty[level] || 0;
                const correct = total - incorrect;
                const percentage = total > 0 ? (correct / total) * 100 : 0;

                return (
                  <div key={level} className="difficulty-bar-item">
                    <div className="bar-header">
                      <span className="bar-label">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                      <span className="bar-score">{correct}/{total}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${level}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topic Analysis */}
          {Object.keys(weakPoints.topics).length > 0 && (
            <div className="analysis-card">
              <h3>Topics Needing Attention</h3>
              <div className="topics-list">
                {Object.entries(weakPoints.topics)
                  .sort((a, b) => b[1] - a[1])
                  .map(([topic, count]) => (
                    <div key={topic} className="topic-item">
                      <span className="topic-name">{topic}</span>
                      <span className="topic-count">{count} mistake(s)</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="recommendations-section">
              <h3>💡 Recommendations</h3>
              <div className="recommendations-list">
                {recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <h4>{rec.title}</h4>
                    <p>{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Review Toggle */}
      <div className="detailed-review-section">
        <button 
          onClick={() => setShowDetailedView(!showDetailedView)}
          className="btn btn-primary"
        >
          {showDetailedView ? 'Hide' : 'View'} Detailed Review
        </button>

        {showDetailedView && (
          <div className="questions-review">
            {result.answers.map((answer, index) => {
              const question = questions.find(q => 
                q._id === (answer.question._id || answer.question)
              );
              
              if (!question) return null;

              return (
                <div 
                  key={index} 
                  className={`review-card ${answer.isCorrect ? 'correct' : 'incorrect'}`}
                >
                  <div className="review-header">
                    <span className="question-num">Question {index + 1}</span>
                    <span className={`result-badge ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                      {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>

                  <div className="question-text">{question.questionText}</div>

                  {question.questionType === "multiple-choice" && (
                    <div className="options-review">
                      {question.options.map((option, oIndex) => {
                        const isSelected = answer.selectedOption === oIndex;
                        const isCorrect = option.isCorrect;

                        return (
                          <div 
                            key={oIndex}
                            className={`option-review ${
                              isCorrect ? 'correct-answer' : ''
                            } ${isSelected ? 'selected' : ''}`}
                          >
                            {isCorrect && <span className="icon">✓</span>}
                            {isSelected && !isCorrect && <span className="icon">✗</span>}
                            <span>{option.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(question.questionType === "true-false" || question.questionType === "short-answer") && (
                    <div className="answer-review">
                      <div className="answer-item">
                        <span className="label">Your Answer:</span>
                        <span className={answer.isCorrect ? 'correct' : 'incorrect'}>
                          {answer.selectedOption?.toString() || "No answer"}
                        </span>
                      </div>
                      {!answer.isCorrect && (
                        <div className="answer-item">
                          <span className="label">Correct Answer:</span>
                          <span className="correct">{question.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {question.explanation && !answer.isCorrect && (
                    <div className="explanation">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}

                  <div className="question-meta">
                    <span className={`badge badge-${question.difficulty}`}>
                      {question.difficulty}
                    </span>
                    <span className="points">
                      {answer.pointsEarned} / {question.points} points
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="result-actions">
        <button 
          onClick={() => navigate(`/groups/${groupId}/quiz/${quizId}`)}
          className="btn btn-secondary"
        >
          Retake Quiz
        </button>
        <button 
          onClick={() => navigate(`/groups/${groupId}`)}
          className="btn btn-primary"
        >
          Back to Group
        </button>
      </div>
    </div>
  );
}
