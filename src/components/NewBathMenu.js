import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MatrixContext } from "../context/MatrixContext";
import "../App.css";

const NewBathMenu = ({ setBathId, setBathLoaded }) => {
  const { client } = useContext(MatrixContext);
  const navigate = useNavigate();
  const [newBathMenuVisible, setNewBathMenuVisible] = useState(false);
  const [newBathName, setNewBathName] = useState("");
  const [newColdTemp, setNewColdTemp] = useState(10);
  const [newHotTemp, setNewHotTemp] = useState(40);
  const [creatingBath, setCreatingBath] = useState(false);

  const createBath = async () => {
    if (newBathName.length > 0) {
      setCreatingBath(true);
      const newBath = await client.createRoom({
        visibility: "private",
        name: newBathName,
      });

      await client.sendEvent(newBath.room_id, "bath.create", {
        taps: [newColdTemp, newHotTemp],
      });

      setCreatingBath(false);
      setNewBathMenuVisible(false);
      setBathLoaded(false);
      setBathId(newBath.room_id);
      navigate(`../bath/${newBath.room_id}`);
    }
  };

  return (
    <div>
      <button
        onClick={() => setNewBathMenuVisible(!newBathMenuVisible)}
        className="new-bath-menu-button"
      >
        create new bath
      </button>
      {newBathMenuVisible && <div className="new-bath-menu-container">
        {creatingBath ? (
          <p>
            Creating {newBathName}...
          </p>
        ) : (
          <>
            <div className="new-bath-menu-item">
              <label for="bathName">Name</label>
              <input
                type="text"
                value={newBathName}
                onChange={(e) => setNewBathName(e.target.value)}
                placeholder="new bath name"
                name="bathName"
              ></input>
            </div>
            <div className="new-bath-menu-item">
              <label for="coldtemp">Cold temp</label>
              <input
                type="number"
                value={newColdTemp}
                onChange={(e) => setNewColdTemp(e.target.value)}
                placeholder="temp in °c"
                name="coldTemp"
              ></input>
            </div>
            <div className="new-bath-menu-item">
              <label for="hotTemp">Hot temp</label>
              <input
                type="number"
                value={newHotTemp}
                onChange={(e) => setNewHotTemp(e.target.value)}
                placeholder="temp in °c"
                name="hotTemp"
              ></input>
            </div>
            <button onClick={() => setNewBathMenuVisible(false)}>
              cancel
            </button>
            <button onClick={createBath}>Create Bath</button>
          </>
        )}
      </div>}
    </div>
  );
};

export default NewBathMenu;
