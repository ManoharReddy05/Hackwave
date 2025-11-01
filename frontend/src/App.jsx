import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Users from "./pages/Users";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Playground from "./pages/Playground";
import GroupDiscussions from "./pages/GroupDiscussions";
import Threads from "./pages/Threads";
import ThreadView from "./components/ThreadView";
import CreateThread from "./pages/CreateThread";
import CreateQuiz from "./pages/CreateQuiz";
import TakeQuiz from "./pages/TakeQuiz";
import QuizResult from "./pages/QuizResult";
import UserDashboard from "./pages/UserDashboard";
import GroupDashboard from "./pages/GroupDashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/users" element={<Users />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />
            <Route path="/groups/:groupId/dashboard" element={<GroupDashboard />} />
            <Route path="/groups/:groupId/playground" element={<Playground />} />
            <Route path="/groups/:groupId/discussions" element={<GroupDiscussions />} />
            <Route path="/groups/:groupId/create-quiz" element={<CreateQuiz />} />
            <Route path="/groups/:groupId/quiz/:quizId" element={<TakeQuiz />} />
            <Route path="/groups/:groupId/quiz/:quizId/result/:resultId" element={<QuizResult />} />
            <Route path="/threads" element={<Threads />} />
            <Route path="/thread/:id" element={<ThreadView />} />
            <Route path="/create" element={<CreateThread />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
