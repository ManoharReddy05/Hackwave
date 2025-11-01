import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axios";
import "./CreateQuiz.css";

export default function CreateQuiz() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState(null);
  const [quizType, setQuizType] = useState("manual"); // "manual" or "ai"
  
  // Quiz metadata
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    difficulty: "medium",
    timeLimit: 1800, // 30 minutes default
    scheduledStartTime: "",
    scheduledEndTime: "",
    isScheduled: false,
  });

  // Questions for manual mode
  const [questions, setQuestions] = useState([
    {
      questionText: "",
      questionType: "multiple-choice",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      correctAnswer: "",
      points: 1,
      explanation: "",
      difficulty: "medium",
    }
  ]);

  // AI generation settings
  const [aiSettings, setAiSettings] = useState({
    topic: "",
    numberOfQuestions: 10,
    difficulty: "medium",
    includeExplanations: true,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      setGroup(response.data);
    } catch (err) {
      console.error("Error fetching group:", err);
      setError("Failed to load group details");
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        questionType: "multiple-choice",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        correctAnswer: "",
        points: 1,
        explanation: "",
        difficulty: "medium",
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      alert("Quiz must have at least one question");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, field, value) => {
    const newQuestions = [...questions];
    if (field === "isCorrect" && value) {
      // Uncheck other options for multiple choice
      newQuestions[qIndex].options.forEach((opt, i) => {
        opt.isCorrect = i === oIndex;
      });
    } else {
      newQuestions[qIndex].options[oIndex][field] = value;
    }
    setQuestions(newQuestions);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({ text: "", isCorrect: false });
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length <= 2) {
      alert("Question must have at least 2 options");
      return;
    }
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const validateQuiz = () => {
    if (!quizData.title.trim()) {
      setError("Quiz title is required");
      return false;
    }

    // Validate schedule if enabled
    if (quizData.isScheduled) {
      if (!quizData.scheduledStartTime) {
        setError("Start time is required for scheduled quizzes");
        return false;
      }
      if (!quizData.scheduledEndTime) {
        setError("End time is required for scheduled quizzes");
        return false;
      }
      
      const startTime = new Date(quizData.scheduledStartTime);
      const endTime = new Date(quizData.scheduledEndTime);
      const now = new Date();

      if (startTime < now) {
        setError("Start time must be in the future");
        return false;
      }

      if (endTime <= startTime) {
        setError("End time must be after start time");
        return false;
      }
    }

    if (quizType === "manual") {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        if (!q.questionText.trim()) {
          setError(`Question ${i + 1}: Question text is required`);
          return false;
        }

        if (q.questionType === "multiple-choice") {
          if (q.options.length < 2) {
            setError(`Question ${i + 1}: At least 2 options required`);
            return false;
          }

          const hasCorrectAnswer = q.options.some(opt => opt.isCorrect);
          if (!hasCorrectAnswer) {
            setError(`Question ${i + 1}: Please mark the correct answer`);
            return false;
          }

          const allOptionsFilled = q.options.every(opt => opt.text.trim());
          if (!allOptionsFilled) {
            setError(`Question ${i + 1}: All options must be filled`);
            return false;
          }
        } else if (q.questionType === "true-false") {
          if (!q.correctAnswer) {
            setError(`Question ${i + 1}: Please select the correct answer`);
            return false;
          }
        } else if (q.questionType === "short-answer") {
          if (!q.correctAnswer || !q.correctAnswer.trim()) {
            setError(`Question ${i + 1}: Correct answer is required`);
            return false;
          }
        }
      }
    } else {
      // AI mode validation
      if (!aiSettings.topic.trim()) {
        setError("Please specify a topic for AI generation");
        return false;
      }
      if (aiSettings.numberOfQuestions < 1 || aiSettings.numberOfQuestions > 50) {
        setError("Number of questions must be between 1 and 50");
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateQuiz()) {
      return;
    }

    setLoading(true);

    try {
      if (quizType === "ai") {
        // For AI generation, we'd call an AI endpoint
        // For now, I'll create a placeholder implementation
        alert("AI quiz generation coming soon! Please use manual mode for now.");
        setLoading(false);
        return;
      }

      // Create the quiz first
      const quizPayload = {
        title: quizData.title,
        description: quizData.description,
        difficulty: quizData.difficulty,
        timeLimit: quizData.timeLimit,
        groupId: groupId,
        isAIGenerated: quizType === "ai",
      };

      // Add schedule data if enabled
      if (quizData.isScheduled) {
        quizPayload.scheduledStartTime = new Date(quizData.scheduledStartTime).toISOString();
        quizPayload.scheduledEndTime = new Date(quizData.scheduledEndTime).toISOString();
      }

      const quizResponse = await api.post("/quizzes", quizPayload);

      const quizId = quizResponse.data._id;

      // Then bulk create questions
      await api.post("/questions/bulk", {
        quizId: quizId,
        questions: questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.questionType === "multiple-choice" ? q.options : [],
          correctAnswer: q.questionType !== "multiple-choice" ? q.correctAnswer : undefined,
          points: q.points,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })),
      });

      alert("Quiz created successfully!");
      navigate(`/groups/${groupId}`);
    } catch (err) {
      console.error("Error creating quiz:", err);
      setError(err.response?.data?.message || "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  if (!group) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-container create-quiz-page">
      <div className="page-header">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="back-button">
          ← Back to Group
        </button>
        <h1 className="page-title">Create Quiz for {group.name}</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Quiz Type Selection */}
      <div className="quiz-type-selector">
        <button
          className={`type-btn ${quizType === "manual" ? "active" : ""}`}
          onClick={() => setQuizType("manual")}
        >
          📝 Manual Creation
        </button>
        <button
          className={`type-btn ${quizType === "ai" ? "active" : ""}`}
          onClick={() => setQuizType("ai")}
        >
          🤖 AI Generated
        </button>
      </div>

      <form onSubmit={handleSubmit} className="create-quiz-form">
        {/* Quiz Metadata */}
        <div className="quiz-metadata-section">
          <h2>Quiz Details</h2>
          
          <div className="form-group">
            <label htmlFor="quizTitle">Quiz Title *</label>
            <input
              type="text"
              id="quizTitle"
              value={quizData.title}
              onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
              placeholder="e.g., Chapter 5: Calculus Fundamentals"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quizDescription">Description</label>
            <textarea
              id="quizDescription"
              value={quizData.description}
              onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
              placeholder="Describe what this quiz covers..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                value={quizData.difficulty}
                onChange={(e) => setQuizData({ ...quizData, difficulty: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="timeLimit">Time Limit (minutes)</label>
              <input
                type="number"
                id="timeLimit"
                value={quizData.timeLimit / 60}
                onChange={(e) => setQuizData({ ...quizData, timeLimit: e.target.value * 60 })}
                min="1"
                max="180"
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="schedule-section">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={quizData.isScheduled}
                  onChange={(e) => setQuizData({ ...quizData, isScheduled: e.target.checked })}
                />
                Schedule this quiz
              </label>
            </div>

            {quizData.isScheduled && (
              <div className="schedule-fields">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="scheduledStartTime">Start Time *</label>
                    <input
                      type="datetime-local"
                      id="scheduledStartTime"
                      value={quizData.scheduledStartTime}
                      onChange={(e) => setQuizData({ ...quizData, scheduledStartTime: e.target.value })}
                      required={quizData.isScheduled}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="scheduledEndTime">End Time *</label>
                    <input
                      type="datetime-local"
                      id="scheduledEndTime"
                      value={quizData.scheduledEndTime}
                      onChange={(e) => setQuizData({ ...quizData, scheduledEndTime: e.target.value })}
                      required={quizData.isScheduled}
                      min={quizData.scheduledStartTime || new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
                <div className="info-box">
                  <p>📅 This quiz will only be available between the scheduled times.</p>
                  <p>Students will automatically see a countdown timer before the quiz starts.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Quiz Creation */}
        {quizType === "manual" && (
          <div className="questions-section">
            <div className="section-header">
              <h2>Questions</h2>
              <button type="button" onClick={addQuestion} className="btn btn-secondary">
                + Add Question
              </button>
            </div>

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="question-card">
                <div className="question-header">
                  <h3>Question {qIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="btn-icon btn-danger"
                    title="Remove question"
                  >
                    🗑️
                  </button>
                </div>

                <div className="form-group">
                  <label>Question Text *</label>
                  <textarea
                    value={question.questionText}
                    onChange={(e) => updateQuestion(qIndex, "questionText", e.target.value)}
                    placeholder="Enter your question..."
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Question Type</label>
                    <select
                      value={question.questionType}
                      onChange={(e) => updateQuestion(qIndex, "questionType", e.target.value)}
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="short-answer">Short Answer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Points</label>
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>

                  <div className="form-group">
                    <label>Difficulty</label>
                    <select
                      value={question.difficulty}
                      onChange={(e) => updateQuestion(qIndex, "difficulty", e.target.value)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Multiple Choice Options */}
                {question.questionType === "multiple-choice" && (
                  <div className="options-section">
                    <label>Options * <span className="help-text">(Click the radio button to mark the correct answer)</span></label>
                    {!question.options.some(opt => opt.isCorrect) && question.options.some(opt => opt.text.trim()) && (
                      <div className="warning-message">
                        ⚠️ Please mark one option as the correct answer
                      </div>
                    )}
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="option-row">
                        <label className="radio-label" title="Mark as correct answer">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={option.isCorrect}
                            onChange={(e) => updateOption(qIndex, oIndex, "isCorrect", e.target.checked)}
                          />
                          <span className="radio-indicator">
                            {option.isCorrect ? '✓ Correct' : 'Mark correct'}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(qIndex, oIndex, "text", e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className={option.isCorrect ? "correct-option-input" : ""}
                          required
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="btn-icon btn-danger-small"
                            title="Remove option"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {question.options.length < 4 && (
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="btn btn-small btn-secondary"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                {/* True/False */}
                {question.questionType === "true-false" && (
                  <div className="form-group">
                    <label>Correct Answer *</label>
                    <select
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)}
                      required
                    >
                      <option value="">Select...</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>
                )}

                {/* Short Answer */}
                {question.questionType === "short-answer" && (
                  <div className="form-group">
                    <label>Correct Answer *</label>
                    <input
                      type="text"
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)}
                      placeholder="Enter the correct answer..."
                      required
                    />
                    <small>Note: Answer matching is case-insensitive</small>
                  </div>
                )}

                <div className="form-group">
                  <label>Explanation (Optional)</label>
                  <textarea
                    value={question.explanation}
                    onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)}
                    placeholder="Explain the correct answer..."
                    rows="2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Quiz Generation */}
        {quizType === "ai" && (
          <div className="ai-settings-section">
            <h2>AI Generation Settings</h2>
            
            <div className="form-group">
              <label htmlFor="aiTopic">Topic *</label>
              <input
                type="text"
                id="aiTopic"
                value={aiSettings.topic}
                onChange={(e) => setAiSettings({ ...aiSettings, topic: e.target.value })}
                placeholder="e.g., JavaScript Promises and Async/Await"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="aiNumQuestions">Number of Questions</label>
                <input
                  type="number"
                  id="aiNumQuestions"
                  value={aiSettings.numberOfQuestions}
                  onChange={(e) => setAiSettings({ ...aiSettings, numberOfQuestions: parseInt(e.target.value) })}
                  min="1"
                  max="50"
                />
              </div>

              <div className="form-group">
                <label htmlFor="aiDifficulty">Difficulty</label>
                <select
                  id="aiDifficulty"
                  value={aiSettings.difficulty}
                  onChange={(e) => setAiSettings({ ...aiSettings, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={aiSettings.includeExplanations}
                  onChange={(e) => setAiSettings({ ...aiSettings, includeExplanations: e.target.checked })}
                />
                Include explanations for answers
              </label>
            </div>

            <div className="info-box">
              <p>🤖 AI will generate questions based on your topic and settings.</p>
              <p><strong>Note:</strong> AI generation feature is coming soon!</p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}`)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Creating Quiz..." : "Create Quiz"}
          </button>
        </div>
      </form>
    </div>
  );
}
