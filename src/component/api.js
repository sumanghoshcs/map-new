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

// Define a placeholder GeoJSON object if not available
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
  const [photos, setPhotos] = useState([]);

  const pointFeatures = [
    [78.9629, 20.5937], // India
    [77.1025, 28.7041], // Delhi
    [72.8777, 19.076], // Mumbai
    [12.9716, 77.5946], // Bangalore
    [22.438311, 87.416008], // Jara
    [22.565571, 88.370209], // Kolkata
    [78.4867, 17.385], // Hyderabad
    [76.7794, 30.7333], // Chandigarh
    [76.6394, 12.2958], // Mysore
    [88.3639, 22.5726], // Kolkata
    [74.8723, 32.7266], // Jammu
    [88.2575, 22.5726], // Hooghly
    [73.8478, 18.5204], // Pune
    [75.8577, 26.9124], // Jaipur
    [80.9462, 26.8467], // Lucknow
    [81.6337, 21.2514], // Raipur
    [85.8245, 20.2961], // Bhubaneswar
    [76.7794, 30.7333], // Chandigarh
    [78.6569, 10.7905], // Madurai
    [83.2185, 17.6868], // Visakhapatnam
    [79.0806, 21.1458], // Nagpur
    [85.2799, 23.3441], // Ranchi
    [85.1376, 25.5941], // Patna
    [76.2711, 9.9312], // Kochi
    [73.7781, 15.2993], // Goa
  ].map(
    (coord) =>
      new Feature({
        geometry: new Point(fromLonLat(coord)),
      })
  );

  const fetchPhotos = async (lat, lon) => {
    try {
      // Example: Using lat/lon to generate a descriptive search query
      const query = `${lat},${lon}`;
      const response = await fetch(
        ` https://api.unsplash.com/photos/random?count=30&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      const data = await response.json();
      console.log(data);
      if (data.results) {
        setPhotos(data.results.slice(0, 6).map((photo) => photo.urls.regular)); // Display top 6 photos
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
      setPhotos([]);
    }
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

    // Handle feature clicks
    initialMap.on("click", (event) => {
      initialMap.forEachFeatureAtPixel(event.pixel, (feature) => {
        if (feature.getGeometry() instanceof Point) {
          const coord = toLonLat(feature.getGeometry().getCoordinates());
          const [lon, lat] = coord;
          fetchPhotos(lat, lon); // Fetch photos
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          {photos.map((photoUrl, index) => (
            <img
              key={index}
              src={photoUrl}
              alt="Unsplash Photo"
              style={{ width: "100%", marginBottom: "10px" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
