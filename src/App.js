import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Bath from "./components/Bath";

const App = () => {
  const sharedBathId = "!pjOusktacwpnwSwqGj:matrix.org";

  return (
    <div>
      <h1>Virtual Bath</h1>
      <p className="tag-text">The world's leading virtual bathing experience</p>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Bath bathId={sharedBathId} />} />
          <Route path="/private/:bath" element={<Bath />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
