import React, { useEffect, useState } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/WebGLTile";
import VectorLayer from "ol/layer/Vector";
import { ImageTile } from "ol/source";
import VectorSource from "ol/source/Vector";
import { fromLonLat, toLonLat } from "ol/proj";
import { Point, Circle as CircleGeom } from "ol/geom";
import { Feature } from "ol";
import { Select } from "ol/interaction";
import { click } from "ol/events/condition";
import { OSM } from "ol/source";

const MapComponent = () => {
  const key = "socwaaZqo0x6ii7USOIE";
  const attributions =
    '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
    '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

  const [variables, setVariables] = useState({
    exposure: 0,
    contrast: 0,
    saturation: 0,
  });
  const [circleLayer, setCircleLayer] = useState(null);
  const [radius, setRadius] = useState(2); // in km
  const [userLocation, setUserLocation] = useState(null); // User's current location
  const [photos, setPhotos] = useState([]); 

  const pointFeatures = [
    [78.9629, 20.5937], // Point in India
    [77.1025, 28.7041], // Point in Delhi, India
    [72.8777, 19.076], // Point in Mumbai, India
  ].map(
    (coord) =>
      new Feature({
        geometry: new Point(fromLonLat(coord)),
      })
  );

  useEffect(() => {
    const layer = new TileLayer({
      style: {
        exposure: ["var", "exposure"],
        contrast: ["var", "contrast"],
        saturation: ["var", "saturation"],
        variables: variables,
      },
      source: new ImageTile({
        attributions: attributions,
        url:
          "https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=" + key,
        tileSize: 512,
        maxZoom: 20,
      }),
    });

    const map = new Map({
      target: "map",
      layers: [layer],
      view: new View({
        center: fromLonLat([78.9629, 20.5937]),
        zoom: 4,
      }),
    });

    const initialCircleLayer = new VectorLayer({
      source: new VectorSource(),
    });

    map.addLayer(initialCircleLayer);
    setCircleLayer(initialCircleLayer);

    // Add initial Point Layer
    const pointLayer = new VectorLayer({
      source: new VectorSource({
        features: pointFeatures,
      }),
    });

    map.addLayer(pointLayer);

    Object.keys(variables).forEach((name) => {
      const element = document.getElementById(name);
      if (element) {
        element.value = variables[name].toString();
        document.getElementById(name + "-value").innerText =
          variables[name].toFixed(2);
        element.addEventListener("input", (event) => {
          const value = parseFloat(event.target.value);
          setVariables((prevVariables) => ({
            ...prevVariables,
            [name]: value,
          }));
          document.getElementById(name + "-value").innerText = value.toFixed(2);
          const updates = {};
          updates[name] = value;
          layer.updateStyleVariables(updates);
        });
      }
    });

    // Handle click events on point features
    const select = new Select({
      condition: click,
      layers: [pointLayer],
    });

    select.on('select', (event) => {
      const feature = event.target.getFeatures().getArray()[0];
      if (feature) {
        const coord = toLonLat(feature.getGeometry().getCoordinates());
        map.getView().animate({
          center: fromLonLat(coord),
          duration: 1000,
          zoom: 8,
        });
      }
    });

    map.addInteraction(select);

    // Geolocation: Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        const userFeature = new Feature({
          geometry: new Point(fromLonLat(coords)),
        });

        pointLayer.getSource().addFeature(userFeature);
        setUserLocation(coords);
        map.getView().animate({
          center: fromLonLat(coords),
          zoom: 10,
          duration: 1000,
        });
      });
    }

    return () => map.setTarget(null);
  }, [variables]);

  useEffect(() => {
    if (circleLayer) {
      const features = pointFeatures.map((feature) => {
        const coord = toLonLat(feature.getGeometry().getCoordinates());
        const circle = new CircleGeom(fromLonLat(coord), radius * 1000); // radius in meters
        return new Feature({ geometry: circle });
      });

      if (userLocation) {
        const userCircle = new CircleGeom(
          fromLonLat(userLocation),
          radius * 1000
        );
        features.push(new Feature({ geometry: userCircle }));
      }

      circleLayer.getSource().clear();
      circleLayer.getSource().addFeatures(features);
    }
  }, [circleLayer, radius, userLocation]);

  const handleRadiusChange = (event) => {
    setRadius(parseFloat(event.target.value));
  };

  const fetchPhotos = async (coords) => {
    const [lon, lat] = coords;
    const url = `https://api.unsplash.com/photos/random?client_id=YOUR_UNSPLASH_ACCESS_KEY&query=nature&count=10&orientation=landscape&content_filter=high&lat=${lat}&lon=${lon}&radius=${radius * 1000}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      setPhotos(data); // Store fetched photos in state
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  };
  
  // Fetch photos when user's location is obtained or point is selected
  useEffect(() => {
    if (userLocation) {
      fetchPhotos(userLocation);
    }
  }, [userLocation]);

  

  return (
    <div style={{ display: "flex" }}>
      <div id="map" style={{ width: "90%", height: "90vh" }}></div>
      <div>
        <div style={{ width: "50%", height: "90vh", padding: "20px" }}>
          <label htmlFor="radius-slider">
            Circle Radius: <span>{radius}</span> km
          </label>
          <input
            type="range"
            id="radius-slider"
            min="1"
            max="10"
            step="0.1"
            value={radius}
            onChange={handleRadiusChange}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
