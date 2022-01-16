import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router";
import { MatrixContext } from "../context/MatrixContext";
import "../App.css";
import NewBathMenu from "./NewBathMenu";

const Bath = ({ privateBath }) => {
  const { client } = useContext(MatrixContext);
  const [loadingMessage, setLoadingMessage] = useState("connecting to bath...");
  const [waterVolume, setWaterVolume] = useState(50);
  const [waterTemp, setWaterTemp] = useState(0);
  const [coldTap, setColdTap] = useState();
  const [hotTap, setHotTap] = useState();
  const [plugged, setPlugged] = useState(true);
  const [bathLoaded, setBathLoaded] = useState(false);
  const [bathName, setBathName] = useState();
  const [counter, setCounter] = useState(0);

  let bathId;
  if (privateBath) {
    let { bath } = useParams();
    bathId = bath;
  } else {
    bathId = "!pjOusktacwpnwSwqGj:matrix.org";
  }

  const sendSnapShot = () => {
    client.sendEvent(bathId, "bath.snapshot", {
      waterTemp: Math.round(waterTemp),
      waterVolume: Math.round(waterVolume),
    });
  };

  const toggleColdTap = () => {
    if (coldTap.flow == 0) {
      client.sendEvent(bathId, "bath.tap.turn", {
        temp: coldTap.temp,
        flow: 10,
      });
    } else {
      client.sendEvent(bathId, "bath.tap.turn", {
        temp: coldTap.temp,
        flow: 0,
      });
    }
    sendSnapShot();
  };

  const toggleHotTap = () => {
    if (hotTap.flow == 0) {
      client.sendEvent(bathId, "bath.tap.turn", {
        temp: hotTap.temp,
        flow: 10,
      });
    } else {
      client.sendEvent(bathId, "bath.tap.turn", {
        temp: hotTap.temp,
        flow: 0,
      });
    }
    sendSnapShot();
  };

  const togglePlug = () => {
    if (plugged) {
      client.sendEvent(bathId, "bath.plug.pull", {});
    } else {
      client.sendEvent(bathId, "bath.plug.push", {});
    }
    sendSnapShot();
  };

  const handleEvent = (event) => {
    //change taps and plug as events come in
    console.log(event);

    const eventType = event.event.type;
    const content = event.event.content;

    switch (eventType) {
      case "bath.snapshot":
        setWaterTemp(content.waterTemp);
        setWaterVolume(content.waterVolume);
        break;
      case "bath.tap.turn":
        if (content.temp == hotTap.temp) {
          setHotTap({
            flow: content.flow,
            temp: hotTap.temp,
          });
        } else {
          setColdTap({
            flow: content.flow,
            temp: coldTap.temp,
          });
        }
        break;
      case "bath.plug.pull":
        setPlugged(false);
        break;
      case "bath.plug.push":
        setPlugged(true);
        break;
      default:
        break;
    }
  };

  const initialiseBath = async () => {
    if (client) {
      const firstBath = await client.getRoom(bathId);
      await client.paginateEventTimeline(
        firstBath.timelineSets[0].liveTimeline,
        {
          backwards: true,
          limit: 100000,
        }
      );

      setLoadingMessage("replaying past bath events...");

      let waterVolume = 0;
      let waterTemp = 0;
      let time = 0;
      let previousEventTime = 0;
      let coldFlow = 0;
      let hotFlow = 0;
      let coldTemp = 10;
      let hotTemp = 40;
      let plugged = true;

      await firstBath.timeline.forEach((item, index) => {
        setLoadingMessage(
          `replaying past bath events...${index}/${firstBath.timeline.length}`
        );
        console.log(waterTemp);

        time = (item.event.origin_server_ts - previousEventTime) / 1000;

        const potentialWaterVolume =
          waterVolume + (time * (coldFlow + hotFlow - (plugged ? 0 : 20))) / 10;

        const currentFlowTemp =
          coldFlow + hotFlow != 0
            ? (coldFlow * coldTemp + hotFlow * hotTemp) / (coldFlow + hotFlow)
            : waterTemp;

        waterTemp =
          waterVolume + potentialWaterVolume != 0
            ? (waterTemp * waterVolume +
                (potentialWaterVolume - waterVolume) * currentFlowTemp) /
              (waterVolume + (potentialWaterVolume - waterVolume))
            : 0;

        if (potentialWaterVolume < 0) {
          waterVolume = 0;
        } else if (potentialWaterVolume > 100) {
          waterVolume = 100;
        } else {
          waterVolume = potentialWaterVolume;
        }

        const eventType = item.event.type;

        switch (eventType) {
          case "bath.snapshot":
            waterTemp = item.event.content.waterTemp;
            waterVolume = item.event.content.waterVolume;
            break;
          case "bath.create":
            coldTemp = item.event.content.taps[0];
            hotTemp = item.event.content.taps[1];
            break;
          case "bath.tap.turn":
            if (item.event.content.temp == 40) {
              hotFlow = item.event.content.flow;
            } else {
              coldFlow = item.event.content.flow;
            }
            break;
          case "bath.plug.pull":
            plugged = false;
            break;
          case "bath.plug.push":
            plugged = true;
            break;
          default:
            break;
        }

        previousEventTime = item.event.origin_server_ts; //time is in milliseconds
      });

      //at the end, set the waterVolume and waterTemp for the current bath
      console.log(waterVolume);
      setWaterVolume(waterVolume);
      setWaterTemp(waterTemp);
      setColdTap({
        flow: coldFlow,
        temp: coldTemp,
      });
      setHotTap({
        flow: hotFlow,
        temp: hotTemp,
      });

      setBathName(firstBath.name);

      setBathLoaded(true);
    }
  };

  useEffect(() => {
    initialiseBath();
  }, [client]);

  useEffect(() => {
    if (coldTap && hotTap) {
      client.on("Room.timeline", handleEvent);
    }
  }, [coldTap, hotTap]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(counter + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [counter]);

  useEffect(() => {
    if (coldTap && hotTap) {
      const potentialWaterVolume =
        waterVolume + (coldTap.flow + hotTap.flow - (plugged ? 0 : 20)) / 100;

      const oldTemp = isNaN(waterTemp) ? 0 : waterTemp;

      const currentFlowTemp =
        coldTap.flow + hotTap.flow != 0
          ? (coldTap.flow * coldTap.temp + hotTap.flow * hotTap.temp) /
            (coldTap.flow + hotTap.flow)
          : oldTemp;

      const newWater = Math.abs(potentialWaterVolume - waterVolume);

      setWaterTemp(
        (oldTemp * waterVolume + newWater * currentFlowTemp) /
          (waterVolume + newWater)
      );

      if (potentialWaterVolume < 0) {
        setWaterVolume(0);
      } else if (potentialWaterVolume > 100) {
        setWaterVolume(100);
      } else {
        setWaterVolume(potentialWaterVolume);
      }
    }
  }, [counter]);

  const calcWaterColour = (waterTemp) => {
    const tapHeatDifference = hotTap.temp - coldTap.temp;
    const heatScalar = (waterTemp - coldTap.temp) / tapHeatDifference;

    const red = 109 + heatScalar * 91;
    const blue = 216 + heatScalar * 25;

    return red + "," + blue;
  };

  return (
    <div className="bath-container">
      <NewBathMenu />
      {bathLoaded ? (
        <div className="tub-container">
          <p>
            {bathName} is {Math.round(waterVolume)}% full and{" "}
            {Math.round(waterTemp)}°c
          </p>
          <div className="taps-container">
            {coldTap && hotTap && (
              <>
                <button onClick={() => toggleColdTap()}>
                  Cold tap {coldTap.temp}°c
                </button>
                <button onClick={() => toggleHotTap()}>
                  Hot tap {hotTap.temp}°c
                </button>
              </>
            )}
          </div>
          <div className="stream-container">
            {coldTap && hotTap && (
              <>
                {coldTap.flow > 0 ? <div className="stream cold"></div> : null}
                {hotTap.flow > 0 ? <div className="stream hot"></div> : null}
              </>
            )}
          </div>
          <div
            className="tub"
            style={{
              backgroundImage: `linear-gradient(
                to top,
                rgba(${calcWaterColour(waterTemp)}, 255, 1) ${waterVolume}%,
                rgba(0, 0, 0, 0) 1px,
                rgba(0, 0, 0, 0)
              )`,
            }}
          ></div>
          <button onClick={togglePlug}>Plug</button>
          <div
            className="drain"
            style={{
              display: plugged ? "none" : "block",
              backgroundImage:
                waterVolume == 0
                  ? `linear-gradient(rgba(255, 214, 239, 1), rgba(0, 0, 0, 0))`
                  : `linear-gradient(rgba(${calcWaterColour(
                      waterTemp
                    )}, 255, 1), rgba(0, 0, 0, 0))`,
            }}
          ></div>
        </div>
      ) : (
        <div className="loading-bath-container">
          <p>{loadingMessage}</p>
        </div>
      )}
    </div>
  );
};

export default Bath;
