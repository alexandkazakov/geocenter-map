import "./App.css";
import { MapContainer, TileLayer, useMapEvents, Polygon, Popup, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Button } from "./components/Button";
import { Aside } from "./components/Aside";

const App = () => {
  const [polygonPositions, setPolygonPositions] = useState([]);
  const [newPoint, setNewPoint] = useState([]);
  const [isCreatingPolygon, setIsCreatingPolygon] = useState(false);
  const [populationCount, setPopulationCount] = useState(null);
  const [editPointIndex, setEditPointIndex] = useState(null);
  const polygonRef = useRef(null);

  useEffect(() => {
    let timeoutId;

    const fetchData = async () => {
      const geoJSONCollection = JSON.stringify({
        type: "FeatureCollection",
        features: [polygonRef.current.toGeoJSON()],
      });

      const response = await fetch(
        `https://gis01.rumap.ru/4898/areaStatistics?guid=93BC6341-B35E-4B34-9DFE-26796F64BBB7&geometry=1&geojson=${geoJSONCollection}`
      );
      const data = await response.json();
      setPopulationCount(data.population_rs);
      populationCount && polygonRef.current.openPopup();
    };

    if (!isCreatingPolygon && polygonPositions.length > 0) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(fetchData, 200);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isCreatingPolygon, polygonPositions, populationCount]);

  const MapEvents = () => {
    useMapEvents({
      click(event) {
        const repeatCoords = !!polygonPositions.find(
          (item) => item.lat === event.latlng.lat && item.lng === event.latlng.lng
        );
        isCreatingPolygon && !repeatCoords && setPolygonPositions([...polygonPositions, event.latlng]);
      },
      mousemove(event) {
        if (polygonPositions.length > 0 && isCreatingPolygon) {
          setNewPoint([[event.latlng.lat, event.latlng.lng]]);
        }
      },
      dblclick(event) {
        const repeatCoords = !!polygonPositions.find(
          (item) => item.lat === event.latlng.lat && item.lng === event.latlng.lng
        );
        isCreatingPolygon && !repeatCoords && setPolygonPositions([...polygonPositions, event.latlng]);
        isCreatingPolygon && setIsCreatingPolygon(false);
      },
    });
  };

  const buttonHandler = () => {
    isCreatingPolygon && setNewPoint([]);
    setIsCreatingPolygon(!isCreatingPolygon);
  };

  return (
    <div className="App">
      <Aside>
        <h2 className="section-title">Подсчёт населения</h2>
        <span className="span">Для того, чтобы нарисовать фигуру, нажмите на кнопку</span>
        <Button isActive={isCreatingPolygon} onClick={buttonHandler}>
          {isCreatingPolygon ? "Закончить" : "Нарисовать"} фигуру
        </Button>
        <span className="span">Чтобы закончить фигуру два раза клик на последнюю точку</span>
        <Button isActive={!polygonPositions.length} onClick={() => setPolygonPositions([])}>
          Удалить фигуру
        </Button>
      </Aside>
      <MapContainer
        center={[50.600189, 36.586027]}
        zoom={13}
        className="Map"
        doubleClickZoom={false}
        zoomControl={false}
      >
        <TileLayer url="http://tile.digimap.ru/rumap/{z}/{x}/{y}.png?guid=93BC6341-B35E-4B34-9DFE-26796F64BBB7" />
        <MapEvents />
        {polygonPositions.length > 0 && (
          <Polygon ref={polygonRef} positions={[...polygonPositions, ...newPoint]}>
            {polygonPositions.map((pos, index) => (
              <Marker
                key={index}
                position={pos}
                eventHandlers={{
                  dragstart: () => setEditPointIndex(index),
                  drag: (event) => {
                    const { lat, lng } = event.target.getLatLng();
                    const updatedPolygon = [...polygonPositions];
                    updatedPolygon[editPointIndex] = [lat, lng];
                    setPolygonPositions(updatedPolygon);
                  },
                  dragend: () => setEditPointIndex(null),
                  dblclick: (e) => {
                    if (!isCreatingPolygon) {
                      const { lat, lng } = e.latlng;
                      if (polygonPositions[0].lat === lat && polygonPositions[0].lng === lng) {
                        setPolygonPositions([]);
                      } else {
                        polygonPositions.length <= 3
                          ? setPolygonPositions([])
                          : setPolygonPositions(
                              polygonPositions.filter((point) => point.lat !== lat && point.lng !== lng)
                            );
                      }
                      setNewPoint([]);
                    }
                  },
                }}
                draggable={true}
              />
            ))}
            {populationCount && !isCreatingPolygon && <Popup>Население: {populationCount}</Popup>}
          </Polygon>
        )}
      </MapContainer>
    </div>
  );
};

export default App;
