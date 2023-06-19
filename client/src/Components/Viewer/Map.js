import { useEffect, useRef } from 'react';
import { isIOS } from 'react-device-detect';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import mapboxgl from 'mapbox-gl';
import polyline from '@mapbox/polyline';

import { useStaticContext } from '../../StaticContext';

import './Map.scss';
import Api from '../../Api';

function Map({ isOpen, onClose, stop, tourStops, variant }) {
  const containerRef = useRef();
  const staticContext = useStaticContext();
  mapboxgl.accessToken = staticContext?.env?.MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    let map;
    if (isOpen) {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-122.4115389, 37.7937587],
        zoom: 16,
      });
      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      });
      map.addControl(geolocate, 'bottom-right');
      const padding = { top: 150, right: 50, bottom: 50, left: 50 };
      const coords = [];
      let bounds;
      tourStops?.forEach((ts, i) => {
        if (ts.Stop?.coordinate) {
          const popup = new mapboxgl.Popup({ closeButton: false, offset: 25 }).setHTML(
            `<div class="map__popup-title">${i + 1}. ${ts.Stop?.names[variant?.code]}</div><div class="map__popup-body mb-2">${
              ts.Stop?.address
            }</div><div class="map__popup-body"><a class="btn btn-sm btn-primary" target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              ts.Stop?.address
            )}">Get directions in Google Maps</a></div>${
              isIOS
                ? `<div class="map__popup-body mt-2"><a class="btn btn-sm btn-primary" target="_blank" href="http://maps.apple.com/?daddr=${encodeURIComponent(
                    ts.Stop?.address
                  )}">Get directions in Apple Maps</a></div>`
                : ''
            }`
          );
          const { coordinates } = ts.Stop.coordinate;
          const el = document.createElement('div');
          el.className = 'map__marker';
          if (ts.Stop.id === stop?.id) {
            el.className = 'map__marker map__marker--current';
          }
          el.innerHTML = `<span class="map__marker-label">${i + 1}</span>`;
          el.addEventListener('click', function () {
            map.fitBounds(bounds, { padding });
          });
          new mapboxgl.Marker(el).setLngLat(coordinates).setPopup(popup).addTo(map);
          if (bounds) {
            bounds.extend(coordinates);
          } else {
            bounds = new mapboxgl.LngLatBounds(coordinates, coordinates);
          }
          coords.push(coordinates);
        }
      });
      if (bounds) {
        map.fitBounds(bounds, { padding });
      }
      geolocate.on('geolocate', (data) => {
        const newBounds = new mapboxgl.LngLatBounds(bounds.getSouthWest(), bounds.getNorthEast());
        const { latitude, longitude } = data.coords;
        newBounds.extend([longitude, latitude]);
        map.fitBounds(newBounds, { padding });
      });
      // get route path and draw on map
      map.on('load', () => {
        geolocate.trigger();
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
          },
        });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ffdd55',
            'line-opacity': 0.5,
            'line-width': 13,
            'line-blur': 0.5,
          },
        });
        Api.mapbox.directions(coords, mapboxgl.accessToken).then((response) => {
          if (response.data.routes?.length) {
            map.getSource('route').setData(polyline.toGeoJSON(response.data.routes[0].geometry));
            map.setLayoutProperty('route', 'visibility', 'visible');
          }
        });
      });
    }
    return () => map?.remove();
  }, [isOpen, stop, tourStops, variant]);

  return (
    <div className={classNames('map', { 'map--open': isOpen })}>
      <div ref={containerRef} className="map__container"></div>
      <div className="map__close">
        <button onClick={() => onClose()} className="btn btn-lg btn-primary btn-round">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
}
export default Map;
