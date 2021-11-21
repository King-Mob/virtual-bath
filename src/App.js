import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Bath from "./components/Bath";

const App = () => {
  return (
    <div>
      <h1>Virtual Bath</h1>
      <p className="tag-text">The world's leading virtual bathing experience</p>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Bath privateBath={false} />} />
          <Route path="/private/:bath" element={<Bath privateBath={true} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
