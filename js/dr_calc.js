
// initialize map
const map = L.map('map').setView([40.75, -73.97], 12);

// add open street map tile
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker;
let highlightLayer;
let allFeaturesLayer;

// Utility: detect lat/lng input
function isLatLng(input) {
  const parts = input.split(',');
  if (parts.length !== 2) return false;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  return !isNaN(lat) && !isNaN(lng);
}

// Drop a pin at location
function dropPin(lat, lng, popupText = '') {
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lng]).addTo(map);
  if (popupText) marker.bindPopup(popupText).openPopup();
  map.setView([lat, lng], 15);
}

// Highlight feature containing the point
function highlightFeature(lat, lng) {
  const url = 'https://services.arcgis.com/ciPnsNFi1JLWVjva/ArcGIS/rest/services/CECONY_NetworkLCSD_Prod/FeatureServer/0/query';

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      geometry: `${lng},${lat}`, // x,y = lng,lat
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson'
    })
  })
  .then(res => res.json())
  .then(geojson => {
    if (highlightLayer) map.removeLayer(highlightLayer);
    if (geojson.features.length === 0) return;

    highlightLayer = L.geoJSON(geojson, {
      style: {
        color: 'red',
        weight: 3,
        fillOpacity: 0.1
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        
        layer.bindPopup(popupContent(props));
      }
    }).addTo(map);
  });
}

function popupContent(props){
  let popupContent = '';
  for (let key in props) {
    popupContent += `<b>${key}</b>: ${props[key]}<br>`;
  }
  return popupContent
}

// Load all features (blue outlines)
function loadAllFeatures() {
  const url = 'https://services.arcgis.com/ciPnsNFi1JLWVjva/ArcGIS/rest/services/CECONY_NetworkLCSD_Prod/FeatureServer/0/query';

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson'
    })
  })
  .then(res => res.json())
  .then(geojson => {
    allFeaturesLayer = L.geoJSON(geojson, {
      style: {
        color: 'blue',
        weight: 1,
        fillOpacity: 0.05
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        let popupContent = '';
        for (let key in props) {
          popupContent += `<b>${key}</b>: ${props[key]}<br>`;
        }
        layer.bindPopup(popupContent);
      }
    }).addTo(map);
  });
}

// Initial load
loadAllFeatures();

// Handle search box
document.getElementById('searchBox').addEventListener('change', async (e) => {
  const input = e.target.value.trim();

  if (!input) return;

  let lat, lng, label;

  if (isLatLng(input)) {
    const parts = input.split(',');
    lat = parseFloat(parts[0]);
    lng = parseFloat(parts[1]);

    // Reverse geocode
    const revRes = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${lng},${lat}&f=json`);
    const revData = await revRes.json();
    label = revData?.address?.LongLabel || `📍 ${lat}, ${lng}`;
  } else {
    // Forward geocode address
    const geoRes = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(input)}&f=json`);
    const data = await geoRes.json();
    if (!data.candidates.length) {
      alert('Address not found.');
      return;
    }
    const candidate = data.candidates[0];
    lat = candidate.location.y;
    lng = candidate.location.x;
    label = candidate.address;
  }

  dropPin(lat, lng, label);
  highlightFeature(lat, lng);
});