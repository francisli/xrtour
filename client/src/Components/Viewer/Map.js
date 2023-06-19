import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import mapboxgl from 'mapbox-gl';
import polyline from '@mapbox/polyline';

import { useStaticContext } from '../../StaticContext';

import './Map.scss';
import Api from '../../Api';

function Map({ isOpen, onClose, stop, tourStops }) {
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
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        'bottom-right'
      );
      const coords = [];
      let bounds;
      tourStops?.forEach((ts, i) => {
        if (ts.Stop?.coordinate) {
          const { coordinates } = ts.Stop.coordinate;
          const el = document.createElement('div');
          el.className = 'map__marker';
          if (ts.Stop.id === stop?.id) {
            el.className = 'map__marker map__marker--current';
          }
          el.innerHTML = `<span class="map__marker-label">${i + 1}</span>`;
          new mapboxgl.Marker(el).setLngLat(coordinates).addTo(map);
          if (bounds) {
            bounds.extend(coordinates);
          } else {
            bounds = new mapboxgl.LngLatBounds(coordinates, coordinates);
          }
          coords.push(coordinates);
        }
      });
      if (bounds) {
        map.fitBounds(bounds, { padding: 50 });
      }
      // get route path and draw on map
      map.on('load', () => {
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
            'line-color': '#cccccc',
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
  }, [isOpen, stop, tourStops]);

  return (
    <div className={classNames('map', { 'map--open': isOpen })}>
      <div ref={containerRef} className="map__container"></div>
      <div className="map__close">
        <button onClick={() => onClose()} className="btn btn-lg btn-outline-primary">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
}
export default Map;
