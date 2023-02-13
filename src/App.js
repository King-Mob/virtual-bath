import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Bath from "./components/Bath";

const App = () => {
  return (
    <div>
      <h1>Virtual Bath</h1>
      <p className="tag-text">The world's leading online multi-user bathing experience. <br /> <a href="https://write.as/king-mob/introducing-virtual-bath-the-worlds-leading-online-bathing-experience" target="_blank">Find out how it works</a></p>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Bath privateBath={false} />} />
          <Route path="/bath/:bath" element={<Bath privateBath={true} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
