import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ArticleDetail } from "./ArticleDetail";
import { ArticleList } from "./ArticleList";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ArticleList />} />
          <Route path="articles/:articleUrl" element={<ArticleDetail />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
