import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Container } from 'react-bootstrap';

import './style.css';

const NearbySightseeingPlaces = () => {
  const [map, setMap] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearestAirport, setNearestAirport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoicHJhdHl1c2gxMjIzIiwiYSI6ImNsaXQzM2ZwMjAwM2EzZWxmaXZpdjI5NWEifQ.kvEOVqp8qIXe1a6lbDQeVg';
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          initializeMap(latitude, longitude);
          getNearbyPlaces(latitude, longitude);
        },
        error => {
          console.error('Error getting user location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  const initializeMap = (latitude, longitude) => {
    const map = new mapboxgl.Map({
      container: 'map', // container ID
      // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [-74.5, 40], // starting position
      zoom: 12 // starting zoom
      });
       setMap(map);
      // Add zoom and rotation controls to the map.
      map.addControl(new mapboxgl.NavigationControl());
      const markerElement = document.createElement('div');
      markerElement.className = 'marker';
      new mapboxgl.Marker(markerElement).setLngLat([longitude, latitude]).addTo(map);
    };;

  const getNearbyPlaces = async (latitude, longitude) => {
    const apiKey = 'pk.eyJ1IjoicHJhdHl1c2gxMjIzIiwiYSI6ImNsaXQzM2ZwMjAwM2EzZWxmaXZpdjI5NWEifQ.kvEOVqp8qIXe1a6lbDQeVg';
    const radius = 25000;
    const limit = 10; // Increase the limit to include the nearest airport
  
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}&types=poi&limit=${limit}&radius=${radius}`
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch nearby places.');
      }
  
      const data = await response.json();
  
      const nearbyPlacesData = data.features.map(place => ({
        name: place.text,
        location: place.place_name,
        description: place.properties.category,
        coordinates: place.geometry.coordinates,
        distance: calculateDistance(latitude, longitude, place.geometry.coordinates[1], place.geometry.coordinates[0]),
        image: `https://source.unsplash.com/400x300/?${place.text}`,
      }));
  
      console.log(nearbyPlacesData)

      // Find the nearest airport
      const nearestAirport = findNearestAirport(latitude, longitude, nearbyPlacesData);
      console.log(nearestAirport);
      setNearbyPlaces(nearbyPlacesData);
      setNearestAirport(nearestAirport);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance.toFixed(2);
  };

  const deg2rad = deg => {
    return deg * (Math.PI / 180);
  };

  const findNearestAirport = (latitude, longitude, places) => {
    let nearestAirport = null;
    let minDistance = Infinity;

    for (const place of places) {
      if (place.description === 'shop') { // Update with the correct description for airports
        const distance = calculateDistance(latitude, longitude, place.coordinates[1], place.coordinates[0]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestAirport = place;
        }
      }
    }

    return nearestAirport;
  };

  const openGoogleMaps = place => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.location)}`;
    window.open(url, '_blank');
  };

  return (
    <section>
     <Container fluid className="home-about-section" id="about">
        <Container className="home-content">
          <h1>Your Nearby</h1>
          <div id="map" className="map-container"></div>
          <div>
            <br />
            <br />
          </div>
          <h2>Nearby Airport</h2>
          {isLoading ? (
            <p>Loading nearest airport...</p>
          ) : nearestAirport ? (
            <div className="place-card">
              <img src={nearestAirport.image} alt={nearestAirport.name} className="place-image" />
              <div className="place-details">
                <h5 className="place-name">{nearestAirport.name}</h5>
                <p className="place-location">{nearestAirport.location}</p>
                <p className="card-text">Distance: {nearestAirport.distance} km</p>
                <p className="place-description">{nearestAirport.description}</p>
              </div>
              <div className="place-footer">
                <button onClick={() => openGoogleMaps(nearestAirport)} className="place-button">
                  Navigate
                </button>
              </div>
            </div>
          ) : (
            <p>No nearby airports found.</p>
          )}
          <h2>Nearby Places</h2>
          <div className="place-list">
            {nearbyPlaces.map((place, index) => (
              <div key={index} className="place-card">
                <img src={place.image} alt={place.name} className="place-image" />
                <div className="place-details">
                  <h5 className="place-name">{place.name}</h5>
                  <p className="place-location">{place.location}</p>
                  <p className="card-text">Distance: {place.distance} km</p>
                  <p className="place-description">{place.description}</p>
                </div>
                <div className="place-footer">
                  <button onClick={() => openGoogleMaps(place)} className="place-button">
                    Navigate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Container>
    </section>
  );
};

export default NearbySightseeingPlaces;
