import React, { useState, useEffect, useRef } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";
import { fromLonLat, toLonLat } from "ol/proj";
import { Point, Circle as CircleGeom } from "ol/geom";
import { Feature } from "ol";
import { Style, Icon } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import {
  ScaleLine,
  Zoom,
  ZoomToExtent,
  FullScreen,
  OverviewMap,
  Attribution,
} from "ol/control";

const geojsonObject = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
    },
  ],
};

const pointFeatures = [
  [78.9629, 20.5937],
  [77.1025, 28.7041],
  [72.8777, 19.076],
  [78.9629, 20.5937],
].map(
  (coord) =>
    new Feature({
      geometry: new Point(fromLonLat(coord)),
    })
);

const App = () => {
  const mapRef = useRef();
  const [map, setMap] = useState(null);
  const [circleLayer, setCircleLayer] = useState(null);
  const [radius, setRadius] = useState(2); // in km
  const [selectedLayer, setSelectedLayer] = useState("points");
  const [highlight, setHighlight] = useState(null);

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
    
    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        url: "https://openlayers.org/data/vector/ecoregions.json",
        format: new GeoJSON(),
      }),
    });

    initialMap.addLayer(vectorLayer);

    const featureOverlay = new VectorLayer({
      source: new VectorSource(),
      map: initialMap,
    });

    const displayFeatureInfo = (pixel) => {
      const feature = initialMap.forEachFeatureAtPixel(
        pixel,
        (feature) => feature
      );
      const info = document.getElementById("info");
      if (feature) {
        info.innerHTML = feature.get("ECO_NAME") || "&nbsp;";
      } else {
        info.innerHTML = "&nbsp;";
      }

      if (feature !== highlight) {
        if (highlight) {
          featureOverlay.getSource().removeFeature(highlight);
        }
        if (feature) {
          featureOverlay.getSource().addFeature(feature);
        }
        setHighlight(feature);
      }
    };

    initialMap.on("pointermove", (evt) => {
      if (evt.dragging) return;
      const pixel = initialMap.getEventPixel(evt.originalEvent);
      displayFeatureInfo(pixel);
    });

    initialMap.on("click", (event) => {
      initialMap.forEachFeatureAtPixel(event.pixel, (feature) => {
        if (feature.getGeometry() instanceof Point) {
          const coord = toLonLat(feature.getGeometry().getCoordinates());

          initialMap.getView().animate({
            center: feature.getGeometry().getCoordinates(),
            duration: 1000,
            zoom: 10,
          });
          // fetchPhotos(lat, lon);
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
        <div id="info" className="info" style={{ marginTop: "20px" }}></div>
      </div>
    </div>
  );
};

export default App;
