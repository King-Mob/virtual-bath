import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router";
import { MatrixContext } from "../context/MatrixContext";
import "../App.css";
import NewBathMenu from "./NewBathMenu";

const Bath = ({ privateBath }) => {
  const { client } = useContext(MatrixContext);
  const [bathId, setBathId] = useState(process.env.REACT_APP_PUBLIC_BATH_ID);
  const { bathUrl } = useParams();
  const [loadingMessage, setLoadingMessage] = useState("joining the baths...");
  const [waterVolume, setWaterVolume] = useState(50);
  const [waterTemp, setWaterTemp] = useState(0);
  const [coldTap, setColdTap] = useState({ temp: 10, flow: 0 });
  const [hotTap, setHotTap] = useState({ temp: 40, flow: 0 });
  const [plugged, setPlugged] = useState(true);
  const [overflow, setOverflow] = useState(0);
  const [bathLoaded, setBathLoaded] = useState(false);
  const [bathName, setBathName] = useState();
  const [counter, setCounter] = useState(0);
  const [batherId, setBatherId] = useState(Math.round(Math.random() * 1000000));
  const [bathers, setBathers] = useState([{ id: batherId, time: Date.now() }]);
  const [mostRecentBather, setMostRecentBather] = useState({
    id: batherId,
    time: Date.now(),
  });

  useEffect(() => {
    if (privateBath) {
      setBathId(bathUrl);
    }
  }, []);

  const sendSnapShot = () => {
    client.sendEvent(bathId, "bath.snapshot", {
      waterTemp: Math.round(waterTemp),
      waterVolume: Math.round(waterVolume),
    });
  };

  const turnTap = (tap) => {
    const { temp, flow } = tap;
    client.sendEvent(bathId, "bath.tap.turn", {
      temp: temp,
      flow: flow === 0 ? 10 : 0,
    });
    sendSnapShot();
  };

  const togglePlug = () => {
    client.sendEvent(bathId, plugged ? "bath.plug.pull" : "bath.plug.push", {});
    sendSnapShot();
  };

  const handleEvent = (event, coldTemp, hotTemp) => {
    //change taps and plug as events come in
    console.log(event);

    const { content, room_id, type } = event.event;

    if (room_id === bathId) {
      switch (type) {
        case "bath.snapshot":
          setWaterTemp(content.waterTemp);
          setWaterVolume(content.waterVolume);
          break;
        case "bath.tap.turn":
          if (content.temp == hotTemp) {
            setHotTap({
              flow: content.flow,
              temp: hotTemp,
            });
          } else {
            setColdTap({
              flow: content.flow,
              temp: coldTemp,
            });
          }
          break;
        case "bath.plug.pull":
          setPlugged(false);
          break;
        case "bath.plug.push":
          setPlugged(true);
          break;
        case "bath.presence":
          setMostRecentBather({
            id: content.id,
            time: event.event.origin_server_ts,
          });
          break;
        default:
          break;
      }
    }
  };

  const initialiseBath = async () => {
    if (client) {
      const firstBath = await client.getRoom(bathId);
      console.log(bathId);
      console.log(firstBath);
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
            if (item.event.content.temp == hotTemp) {
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
      client.on("Room.timeline", (event) =>
        handleEvent(event, coldTemp, hotTemp)
      );
    }
  };

  useEffect(() => {
    initialiseBath();
  }, [client, bathId]);

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
        setOverflow(overflow + potentialWaterVolume - 100);
      } else {
        setWaterVolume(potentialWaterVolume);
      }
    }

    if (client && counter % 100 == 0)
      client.sendEvent(bathId, "bath.presence", { id: batherId });
  }, [counter]);

  useEffect(() => {
    const allBathers = bathers.concat([mostRecentBather]);

    const uniqueBathers = [];
    allBathers.reverse(); //look for unique bathers, keeping the most recently added
    allBathers.forEach((bather) => {
      if (
        !uniqueBathers.find(
          (possibleDuplicateBather) => possibleDuplicateBather.id == bather.id
        )
      )
        uniqueBathers.push(bather);
    });

    const recentBathers = uniqueBathers.filter(
      (bather) => Date.now() - bather.time < 20000
    );
    setBathers(recentBathers);
  }, [mostRecentBather]);

  const calcWaterColour = (waterTemp) => {
    const tapHeatDifference = hotTap.temp - coldTap.temp;
    const heatScalar = (waterTemp - coldTap.temp) / tapHeatDifference;

    const red = 109 + heatScalar * 91;
    const blue = 216 + heatScalar * 25;

    return red + "," + blue;
  };

  const overflowing =
    waterVolume >= 100 && (coldTap.flow > 0 || hotTap.flow > 0);

  return (
    <div className="bath-container">
      {bathLoaded && (
        <NewBathMenu setBathId={setBathId} setBathLoaded={setBathLoaded} />
      )}
      {bathLoaded && (
        <p>
          {bathName} is {Math.round(waterVolume)}% full
          {waterVolume > 0 && ` and ${Math.round(waterTemp)}°c`}
          {` with ${bathers.length} in the bath.`}
        </p>
      )}
      {bathLoaded ? (
        <div className="tub-container">
          <div
            className="overflow"
            style={{
              backgroundImage: `linear-gradient(
          to top,
          rgba(${calcWaterColour(waterTemp)}, 255, 1) ${overflow}%,
          rgba(0, 0, 0, 0) 1px,
          rgba(0, 0, 0, 0)
        )`,
            }}
          />
          <div className="taps-container">
            {coldTap && hotTap && (
              <>
                <button onClick={() => turnTap(coldTap)}>
                  Cold tap {coldTap.temp}°c
                </button>
                <button onClick={() => turnTap(hotTap)}>
                  Hot tap {hotTap.temp}°c
                </button>
              </>
            )}
          </div>
          <div className="stream-container">
            {coldTap && hotTap && (
              <>
                {overflowing && (
                  <div
                    className="stream overflow-left"
                    style={{
                      backgroundImage:
                        waterVolume == 0
                          ? `linear-gradient(rgba(255, 214, 239, 1), rgba(0, 0, 0, 0))`
                          : `linear-gradient(rgba(${calcWaterColour(
                              waterTemp
                            )}, 255, 1), rgba(0, 0, 0, 0))`,
                    }}
                  />
                )}
                {coldTap.flow > 0 && <div className="stream cold" />}
                {hotTap.flow > 0 && <div className="stream hot" />}
                {overflowing && (
                  <div
                    className="stream overflow-right"
                    style={{
                      backgroundImage:
                        waterVolume == 0
                          ? `linear-gradient(rgba(255, 214, 239, 1), rgba(0, 0, 0, 0))`
                          : `linear-gradient(rgba(${calcWaterColour(
                              waterTemp
                            )}, 255, 1), rgba(0, 0, 0, 0))`,
                    }}
                  />
                )}
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
