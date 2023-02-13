import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { MatrixContext } from "../context/MatrixContext";
import "../App.css";

const NewBathMenu = () => {
  const { client } = useContext(MatrixContext);
  const [newBathMenuVisible, setNewBathMenuVisible] = useState(false);
  const [newBathName, setNewBathName] = useState("");
  const [newColdTemp, setNewColdTemp] = useState(10);
  const [newHotTemp, setNewHotTemp] = useState(40);
  const [newBathId, setNewBathId] = useState();

  const createBath = async () => {
    if (newBathName.length > 0) {
      const newBath = await client.createRoom({
        visibility: "private",
        name: newBathName,
      });

      await client.sendEvent(newBath.room_id, "bath.create", {
        taps: [newColdTemp, newHotTemp],
      });

      setNewBathId(newBath.room_id);
    }
  };

  return (
    <div>
      {newBathMenuVisible ? (
        <div className="new-bath-menu-container">
          {newBathId ? (
            <Link to={`../bath/${newBathId}`}>Go to {newBathName}</Link>
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
        </div>
      ) : (
        <button
          onClick={() => setNewBathMenuVisible(true)}
          className="new-bath-menu-button"
        >
          create new bath
        </button>
      )}
    </div>
  );
};

export default NewBathMenu;
