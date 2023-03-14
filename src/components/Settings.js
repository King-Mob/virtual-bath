import React from "react";
import "../App.css";

const Settings = () => {
    const toggleHighContrast = () => {
        const highContrast = localStorage.getItem("bath-high-contrast");
        if (highContrast) {
            localStorage.removeItem("bath-high-contrast");
            document.getElementsByTagName("body")[0].style.backgroundColor = null;
        }
        else {
            localStorage.setItem("bath-high-contrast", true);
            document.getElementsByTagName("body")[0].style.backgroundColor = "#f562f0";
        }
    }

    return <div className="settings-container">
        <button className="high-contrast" onClick={toggleHighContrast}>HC</button>
    </div>
}

export default Settings;