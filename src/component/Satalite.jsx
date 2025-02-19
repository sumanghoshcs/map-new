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
  const UNSPLASH_ACCESS_KEY = "wv2KkbVrvAEGMg7RJW6kTMnOcqqYknCUsv87sYqAFjQ";
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
  const [userLocation, setUserLocation] = useState(null);
  const [photos, setPhotos] = useState([]);

  const pointFeatures = [
    [78.9629, 20.5937],
    [77.1025, 28.7041],
    [72.8777, 19.076],
    [12.9716, 77.5946],
    [40.7128, -74.006],
    [48.8566, 2.3522],
    [35.6895, 139.6917],
    [34.0522, -118.2437],
    [22.438311, 87.416008],
    [22.565571, 88.370209],
    [78.4867, 17.385],
    [76.7794, 30.7333],
    [76.6394, 12.2958],
    [88.3639, 22.5726],
    [74.8723, 32.7266],
    [88.2575, 22.5726],
    [73.8478, 18.5204],
    [75.8577, 26.9124],
    [80.9462, 26.8467],
  ].map(
    (coord) =>
      new Feature({
        geometry: new Point(fromLonLat(coord)),
      })
  );

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const fetchPhotos = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?count=30&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      const data = await response.json();
      if (data) {
        const filteredPhotos = data.filter((photo) => {
          const photoLat = photo.location?.position?.latitude || lat;
          const photoLon = photo.location?.position?.longitude || lon;
          const distance = calculateDistance(lat, lon, photoLat, photoLon);
          return distance <= 10;
        });
        if (filteredPhotos.length > 0) {
          setPhotos(filteredPhotos[0].urls.regular);
        } else {
          setPhotos(null);
        }
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
      setPhotos("https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg");
    }
  };

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

    const select = new Select({
      condition: click,
      layers: [pointLayer],
    });

    select.on("select", (event) => {
      const feature = event.target.getFeatures().getArray()[0];
      if (feature) {
        const coord = toLonLat(feature.getGeometry().getCoordinates());
        const [lon, lat] = coord;
        fetchPhotos(lat, lon);
        map.getView().animate({
          center: fromLonLat(coord),
          duration: 1000,
          zoom: 8,
        });
      }
    });

    map.addInteraction(select);

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
        const circle = new CircleGeom(fromLonLat(coord), radius * 1000);
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
          <div>
            {photos && (
              <img
                src={photos}
                alt="Unsplash Photo"
                style={{ width: "100%", marginTop: "20px" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
