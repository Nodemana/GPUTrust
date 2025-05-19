// src/components/ShippingAndMap.jsx
import { useState, useRef, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  Autocomplete,
} from "@react-google-maps/api";
import PropTypes from "prop-types";

const containerStyle = {
  width: "100%",
  height: "400px",
};
const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // center of USA

export default function ShippingAndMap({ sellerLocation, onBuyerAddress }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY, // your API key here
    libraries: ["places"],
  });

  const [buyerPos, setBuyerPos] = useState(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);

  const onLoadMap = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry?.location) {
      const pos = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setBuyerPos(pos);
      onBuyerAddress(place.formatted_address, pos);
      mapRef.current.panTo(pos);
    }
  };

  if (loadError) return <p>Error loading maps</p>;
  if (!isLoaded) return <p>Loading map…</p>;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">
          Shipping Address
        </label>
        <Autocomplete
          onLoad={(auto) => (autocompleteRef.current = auto)}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Enter your address"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </Autocomplete>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={buyerPos || sellerLocation || defaultCenter}
        zoom={buyerPos || sellerLocation ? 12 : 4}
        onLoad={onLoadMap}
      >
        {sellerLocation && (
          <Marker
            position={sellerLocation}
            label="Seller"
            icon={{ url: "/seller-marker.png", scaledSize: { width: 30, height: 30 } }}
          />
        )}
        {buyerPos && (
          <Marker
            position={buyerPos}
            label="You"
            icon={{ url: "/buyer-marker.png", scaledSize: { width: 30, height: 30 } }}
          />
        )}
      </GoogleMap>
    </div>
  );
}

ShippingAndMap.propTypes = {
  sellerLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }),
  onBuyerAddress: PropTypes.func.isRequired,
};
