import React from 'react';
import { cn } from "../utils";
import { MapContainer } from 'react-leaflet/MapContainer';
import { TileLayer } from 'react-leaflet/TileLayer';
import { Marker, Popup } from 'react-leaflet';
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { createSwapy } from 'swapy';
import { useMap } from 'react-leaflet/hooks';
import { useMapEvents } from "react-leaflet";

const MapInvalidator = forwardRef((props, ref) => {
    const map = useMap();

    const mapEvents = useMapEvents({
        zoomend: () => {
            props.setZoomLevel(mapEvents.getZoom());
            // Re-center the map after zooming
            map.setView(props.center, mapEvents.getZoom());
        },
        moveend: () => {
            const center = mapEvents.getCenter();
            props.setPosition([center.lat, center.lng]);
        }
    });

    useImperativeHandle(ref, () => ({
        update() {
            map.invalidateSize();
        }
    }));

    useEffect(() => {
        map.invalidateSize();
    }, [map]);

    return null;
});

function Map({ markers }) {
    const mapRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(13);
    const center = [33.501037, -99.338722]; // Fixed center point (your coordinates)
    const [position, setPosition] = useState(center); // Initial position
    const [swaping, setSwaping] = useState(false);
    const [hasChanged, setHasChanged] = useState(false);

    // Default marker at your coordinates
    const defaultMarkers = [
        { id: 1, position: center, popup: "Marker at 33°30'03.7\"N 99°20'19.4\"W" }
    ];

    useEffect(() => {
        const container = document.getElementById('main');

        const swapy = createSwapy(container, {
            animation: 'dynamic',
            preserveAspectRatio: true
        });

        swapy.onSwapEnd((event) => {
            setSwaping(false);
            mapRef.current.update();
            setHasChanged(prev => !prev);
        });

        swapy.onSwapStart(() => {
            setSwaping(true);
        });

        const style = document.createElement('style');
        style.innerHTML = `
          [data-swapy-item] {
            transition: none !important;
            width: 100% !important;
            height: 100% !important;
          }
          [data-swapy-ghost] {
            transition: none !important;
            width: var(--swapy-width) !important;
            height: var(--swapy-height) !important;
          }
          .leaflet-container {
            width: 100% !important;
            height: 100% !important;
          }
        `;
        document.head.appendChild(style);

        swapy.enable(true);

        return () => {
            swapy.enable(false);
            style.remove();
        };
    }, []);

    return (
        <div className="flex-1 min-w-0" data-swapy-slot="1">
            <div data-swapy-item="a" className="border-2 border-[#201F1F] rounded-md flex flex-col h-full w-full overflow-hidden backdrop-blur-sm">
                <div className="w-full bg-[#09090B] flex items-center py-1 px-2 border-b-2 border-[#201F1F] drag-handle cursor-move select-none" data-swapy-handle>
                    <p className="text-[#9CA3AF] text-lg">Map</p>
                </div>
                <div className="flex-1 overflow-hidden flex">
                    <div className={cn("flex justify-center items-center flex-1", {
                        "hidden": !swaping
                    })}>
                        <h2 className="text-[#9CA3AF] text-lg">Map is hidden while swapping...</h2>
                    </div>

                    <div className={cn("flex-1", {
                        "hidden": swaping
                    })}>
                        <MapContainer
                            center={center} // Initial center
                            zoom={zoomLevel}
                            scrollWheelZoom={true}
                            className="w-full h-full"
                            key={hasChanged}
                            attributionControl={false}
                        >
                            <MapInvalidator 
                                ref={mapRef} 
                                setZoomLevel={setZoomLevel} 
                                setPosition={setPosition} 
                                center={center} // Pass center to MapInvalidator
                            />
                            <TileLayer
                                url="/tiles/{z}/{x}/{y}.png"
                                minZoom={6}  // Your tile range
                                maxZoom={18} // Your tile range
                                attribution="Local Tiles"
                            />
                            {(markers || defaultMarkers).map((marker) => (
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