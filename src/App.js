import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Bath from "./components/Bath";
import Settings from "./components/Settings";

const checkHighContrast = () => {
  const highContrast = localStorage.getItem("bath-high-contrast");
  if (highContrast)
    document.getElementsByTagName("body")[0].style.backgroundColor = "#f562f0";
};

const App = () => {
  checkHighContrast();

  return (
    <div>
      <Settings />
      <h1>Virtual Bath</h1>
      <p className="tag-text">
        The world's leading online multi-user bathing experience. <br />
        <a
          href="https://write.as/king-mob/introducing-virtual-bath-the-worlds-leading-online-bathing-experience"
          target="_blank"
        >
          Powered by Matrix, find out how
        </a>
      </p>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Bath privateBath={false} />} />
          <Route path="/bath/:bathUrl" element={<Bath privateBath={true} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
