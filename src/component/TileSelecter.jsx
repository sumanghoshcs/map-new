import React, { useState, useEffect, useRef } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";
import { fromLonLat, toLonLat } from "ol/proj";
import { Point, Circle as CircleGeom } from "ol/geom";
import { Feature } from "ol";
import GeoJSON from "ol/format/GeoJSON";
import {
  ScaleLine,
  Zoom,
  ZoomToExtent,
  FullScreen,
  OverviewMap,
  Attribution,
} from "ol/control";

const UNSPLASH_ACCESS_KEY = "wv2KkbVrvAEGMg7RJW6kTMnOcqqYknCUsv87sYqAFjQ";

const geojsonObject = {
  type: "FeatureCollection",
  features: [],
};

const App = () => {
  const mapRef = useRef();
  const [map, setMap] = useState(null);
  const [circleLayer, setCircleLayer] = useState(null);
  const [radius, setRadius] = useState(2); // in km
  const [selectedLayer, setSelectedLayer] = useState("points");
  const [photoUrl, setPhotoUrl] = useState(null);

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

  const fetchPhotos = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?count=30&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      const data = await response.json();
      if (data) {
        // Filter photos based on distance
        const filteredPhotos = data.filter((photo) => {
          const photoLat = photo.location?.position?.latitude || lat;
          const photoLon = photo.location?.position?.longitude || lon;
          const distance = calculateDistance(lat, lon, photoLat, photoLon);
          return distance <= 10; // Within 10 km
        });
        if (filteredPhotos.length > 0) {
          setPhotoUrl(filteredPhotos[0].urls.regular);
        } else {
          setPhotoUrl(null);
        }
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
      setPhotoUrl(
        "https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg"
      );
    }
  };

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

  useEffect(() => {
    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([78.9629, 20.5937]),
        zoom: 3,
      }),
      controls: [
        new Zoom(),
        new ZoomToExtent({ extent: [-180, -90, 180, 90] }),
        new FullScreen(),
        new OverviewMap(),
        new ScaleLine(),
        new Attribution(),
      ],
    });
    setMap(initialMap);

    const initialCircleLayer = new VectorLayer({
      source: new VectorSource(),
    });

    initialMap.addLayer(initialCircleLayer);
    setCircleLayer(initialCircleLayer);

    // Add initial Point Layer
    const pointLayer = new VectorLayer({
      source: new VectorSource({
        features: pointFeatures,
      }),
    });

    initialMap.addLayer(pointLayer);

    // Add GeoJSON Layer
    const geoJsonLayer = new VectorLayer({
      source: new VectorSource({
        features: new GeoJSON().readFeatures(geojsonObject, {
          featureProjection: "EPSG:3857",
        }),
      }),
    });

    initialMap.addLayer(geoJsonLayer);
    initialMap.on("click", (event) => {
      initialMap.forEachFeatureAtPixel(event.pixel, (feature) => {
        if (feature.getGeometry() instanceof Point) {
          const coord = toLonLat(feature.getGeometry().getCoordinates());
          const [lon, lat] = coord;
          fetchPhotos(lat, lon);
          initialMap.getView().animate({
            center: feature.getGeometry().getCoordinates(),
            duration: 1000,
            zoom: 10,
          });
        }
      });
    });

    return () => initialMap.setTarget(null);
  }, []);

  useEffect(() => {
    if (circleLayer) {
      const features = pointFeatures.map((feature) => {
        const coord = toLonLat(feature.getGeometry().getCoordinates());
        const circle = new CircleGeom(fromLonLat(coord), radius * 1000);
        return new Feature({ geometry: circle });
      });

      circleLayer.getSource().clear();
      circleLayer.getSource().addFeatures(features);
    }
  }, [circleLayer, radius]);

  useEffect(() => {
    if (map) {
      map
        .getLayers()
        .getArray()
        .forEach((layer) => {
          if (layer instanceof VectorLayer) {
            layer.setVisible(
              layer === circleLayer ||
                selectedLayer === "points" ||
                selectedLayer === "geojson"
            );
          }
        });
    }
  }, [map, selectedLayer]);

  const handleSliderChange = (event) => {
    setRadius(parseFloat(event.target.value));
  };

  const handleLayerChange = (event) => {
    setSelectedLayer(event.target.value);
  };

  return (
    <div style={{ display: "flex" }}>
      <div id="map" ref={mapRef} style={{ width: "80%", height: "90vh" }}></div>
      <div style={{ width: "20%", height: "90vh", padding: "20px" }}>
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
          onChange={handleSliderChange}
          style={{ width: "100%" }}
        />
        <div>
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Unsplash Photo"
              style={{ width: "100%", marginTop: "20px" }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
