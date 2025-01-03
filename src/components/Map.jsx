import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { cn } from "../utils"; // Assuming this is your utility function

function Map() {
  const [position, setPosition] = useState([26.3082, -98.1740]); // Initial map position
  const [zoomLevel, setZoomLevel] = useState(12); // Initial zoom level

  const markers = [
    { id: 1, position: [26.306390387581928, -98.17466556705496], popup: "Marker 1" },
    { id: 2, position: [33.0901482, -107.9750699], popup: "Marker 2" },
    { id: 3, position: [31.9901482, -105.9750699], popup: "Marker 3" },
  ];

  return (
    <div className="flex-1 min-w-0">
      <div className="border-2 border-[#201F1F] rounded-md flex flex-col h-full w-full overflow-hidden backdrop-blur-sm">
        <div className="w-full bg-[#09090B] flex items-center py-1 px-2 border-b-2 border-[#201F1F] drag-handle cursor-move select-none">
          <p className="text-[#9CA3AF] text-lg">Map</p>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className={cn("flex justify-center items-center flex-1")}>
            <MapContainer
              center={position}
              zoom={zoomLevel}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer
                url='public/tiles/{z}/{x}/{y}.png'  // Use the path to your locally served tiles
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {markers.map((marker) => (
                <Marker key={marker.id} position={marker.position}>
                  <Popup>{marker.popup}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Map;