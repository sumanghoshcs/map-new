import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer } from "ol/layer";
import { OSM } from "ol/source";
import { fromLonLat } from "ol/proj";
import { Point } from "ol/geom";
import Feature from "ol/Feature";
import Control from "ol/control/Control";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import VectorsLayer from "../component/VectorLayer";
import TileSelector from "../component/TileSelecter";
import Satalite from "../component/Satalite";

const MapApp = () => {
  const mapRef = useRef();
  const [map, setMap] = useState(null);
  const [geojsonLayer, setGeojsonLayer] = useState(null);
  const [pointLayer, setPointLayer] = useState(null);
  const [flickrLayer, setFlickrLayer] = useState(null);
  const [radius, setRadius] = useState(2);
  const [values, setValues] = useState("");

  const handleChange = (e) => {
    // alert(e.target.value);
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
