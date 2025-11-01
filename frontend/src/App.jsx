import { BrowserRouter, Routes, Route } from "react-router-dom";
import ThreadList from "./components/ThreadList";
import ThreadView from "./components/ThreadView";
import CreateThread from "./pages/CreateThread";

function App() {
  return (
    <BrowserRouter>
      <div >
        <Routes>
          <Route path="/" element={<ThreadList />} />
          <Route path="/thread/:id" element={<ThreadView />} />
          <Route path="/create" element={<CreateThread />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
