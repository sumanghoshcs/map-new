import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import VectorsLayer from "../component/VectorLayer";
import TileSelector from "../component/TileSelecter";
import Satalite from "../component/Satalite";

const MapApp = () => {
  const [values, setValues] = useState("");

  const handleChange = (e) => {
    setValues(e.target.value);
  };

  return (
    <div className="mainContainer">
      <div >
        <select type="selector" name="selector" onChange={handleChange} style={{border:"1px solid grey",padding:"2px",margin:"2px",borderRadius:"5px"}}>
          <option value="tileselector">Tile Selector</option>
          <option value="vectorselector">Vector Selector</option>
          <option value="sataliteselector">Satalite Selector</option>
        </select>
      </div>
      {values === "vectorselector" ? (
        <>
          <VectorsLayer />
        </>
      ) : values === "tileselector" ? (
        <>
          <TileSelector />
        </>
      ) : values === "sataliteselector" ? (
        <>
          <Satalite />
        </>
      ) : (
        <>
          {" "}
          <TileSelector />
        </>
      )}
    </div>
  );
};

export default MapApp;
