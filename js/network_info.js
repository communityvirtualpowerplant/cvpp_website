 const map = L.map('map').setView([40.70, -73.94], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let allFeaturesLayer;
    let allNetworks = [];
    let markerLayer;

    function isLatLng(input) {
      const parts = input.split(',');
      if (parts.length !== 2) return false;
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      return !isNaN(lat) && !isNaN(lng);
    }

    function getColor(bat) {
      const r = Math.floor(255 * bat);
      const g = Math.floor(255 * (1 - bat));
      const b = 255;
      return `rgba(${r},${g},${b},1)`;
    }

    function dropCircle(lat, lng, popupText, flex, bat) {
      let marker = L.circleMarker([lat, lng], {
        radius: flex,
        color: 'red',
        fillColor: getColor(bat),
        fillOpacity: 1,
        weight: 1,
        interactive: true,
        className: 'marker',
        zIndexOffset: 1000
      }).addTo(map);

      marker.on('click', () => {
        console.log('Marker clicked!');
      });

      if (popupText) marker.bindPopup(popupText);
    }

    function popupContent(props) {
      return Object.entries(props)
        .map(([key, value]) => `<b>${key}</b>: ${value}<br>`)
        .join('');
    }

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
            allNetworks.push(props['NETWORK']);
            layer.bindPopup(popupContent(props));
          }
        }).addTo(map);
      });
    }

    async function getData(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed');
        const text = await response.text();
        const safeJSON = text.replace(/\bNaN\b/g, 'null');
        const parsed = JSON.parse(safeJSON);
        updateData(parsed.records);
      } catch (err) {
        console.error('Data fetch error:', err);
      }
    }

    async function updateData(records) {
      const flexList = records
        .map(d => parseFloat(d.fields['flex wh']))
        .filter(v => !isNaN(v));

      const flexMin = Math.min(...flexList);
      const flexMax = Math.max(...flexList);

      for (const rec of records) {
        const fields = rec.fields;
        if (fields['flex wh'] == null) continue;

        const input = fields['network'] + ", NYC";
        let lat, lng;

        if (isLatLng(input)) {
          [lat, lng] = input.split(',').map(Number);
        } else {
          const geoRes = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(input)}&f=json`);
          const geoData = await geoRes.json();
          if (!geoData.candidates.length) continue;
          lat = geoData.candidates[0].location.y;
          lng = geoData.candidates[0].location.x;
        }

        const label = `${fields['name']} in ${fields['network']}`;
        let flex = (parseFloat(fields['flex wh']) - flexMin) / (flexMax - flexMin);
        flex = Math.round(flex * 10 + 5);

        const bat = parseFloat(fields['battery']) / 100;
        dropCircle(lat, lng, label, flex, bat);
      }
    }

    // Load everything
    loadAllFeatures();
    getData('https://communityvirtualpowerplant.com/api/gateway.php?table=live');




// // initialize map
// const map = L.map('map').setView([40.70, -73.94], 11,{
//     zIndexOffset: 0
// });

// // add open street map tile
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   attribution: '© OpenStreetMap contributors'
// }).addTo(map);

// let marker;
// //let highlightLayer;
// let allFeaturesLayer;

// let allNetworks = [];

// // Utility: detect lat/lng input
// function isLatLng(input) {
//   const parts = input.split(',');
//   if (parts.length !== 2) return false;
//   const lat = parseFloat(parts[0]);
//   const lng = parseFloat(parts[1]);
//   return !isNaN(lat) && !isNaN(lng);
// }

// // // Drop a pin at location
// // function dropPin(lat, lng, popupText = '') {
// //   //if (marker) map.removeLayer(marker);
// //   marker = L.marker([lat, lng]).addTo(map);
// //   if (popupText) marker.bindPopup(popupText).openPopup();
// //   map.setView([lat, lng], 15);
// // }

// function getColor(bat){
//   // get colors between 20-240
//   let r = (Math.floor(255*bat)).toString()
//   let g = (Math.floor(255*(1-bat))).toString()
//   let b = '255'
//   let a = (1).toString();
//   return `rgba(${r},${g},${b},${a})`
// }

// // Drop a circle at location
// function dropCircle(lat, lng, popupText = '',flex, bat) {
//   //if (marker) map.removeLayer(marker);
//     const marker = L.circleMarker([lat, lng], {
//       radius: flex,         // size of the circle
//       color: 'red',       // stroke color
//       fillColor: getColor(bat),  // fill color
//       fillOpacity: 1,
//       interactive: true,
//       zIndexOffset: 1000 
//   }).addTo(map);

//     marker.on('click', function () {
//         //console.log(name)
//         //window.location.href = `/participant?name=${name}`;
//         console.log('Marker clicked!');
//   });

//   //marker.bindPopup("Clicked!")//.openPopup();

//   //if (popupText) marker.bindPopup(popupText).openPopup();
//   //map.setView([lat, lng], 15);
// }


// // // Highlight feature containing the point
// // function highlightFeature(lat, lng) {
// //   const url = 'https://services.arcgis.com/ciPnsNFi1JLWVjva/ArcGIS/rest/services/CECONY_NetworkLCSD_Prod/FeatureServer/0/query';

// //   fetch(url, {
// //     method: 'POST',
// //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
// //     body: new URLSearchParams({
// //       geometry: `${lng},${lat}`, // x,y = lng,lat
// //       geometryType: 'esriGeometryPoint',
// //       spatialRel: 'esriSpatialRelIntersects',
// //       inSR: '4326',
// //       outFields: '*',
// //       returnGeometry: 'true',
// //       f: 'geojson'
// //     })
// //   })
// //   .then(res => res.json())
// //   .then(geojson => {
// //     if (highlightLayer) map.removeLayer(highlightLayer);
// //     if (geojson.features.length === 0) return;

// //     highlightLayer = L.geoJSON(geojson, {
// //       style: {
// //         color: 'red',
// //         weight: 3,
// //         fillOpacity: 0.1
// //       },
// //       onEachFeature: (feature, layer) => {
// //         const props = feature.properties;
        
// //         layer.bindPopup(popupContent(props));
// //       }
// //     }).addTo(map);
// //   });
// // }

// function popupContent(props){
//   let popupContent = '';
//   for (let key in props) {
//     popupContent += `<b>${key}</b>: ${props[key]}<br>`;
//     console.log(key)
//     // if (key == 'NETWORK'){

//     // }
//   }
//   return popupContent
// }

// // Load all features (blue outlines)
// function loadAllFeatures() {
//   const url = 'https://services.arcgis.com/ciPnsNFi1JLWVjva/ArcGIS/rest/services/CECONY_NetworkLCSD_Prod/FeatureServer/0/query';

//   fetch(url, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body: new URLSearchParams({
//       where: '1=1',
//       outFields: '*',
//       returnGeometry: 'true',
//       f: 'geojson'
//     })
//   })
//   .then(res => res.json())
//   .then(geojson => {
//     allFeaturesLayer = L.geoJSON(geojson, {
//       style: {
//         color: 'blue',
//         weight: 1,
//         fillOpacity: 0.05
//       },
//       onEachFeature: (feature, layer) => {
//         const props = feature.properties;
//         let popupContent = '';
//         for (let key in props) {
//           popupContent += `<b>${key}</b>: ${props[key]}<br>`;
//           if (key == 'NETWORK'){
//             allNetworks.push(props[key])
//           }
//         }
//         layer.bindPopup(popupContent);
//       }
//     }).addTo(map);
//   });
// }

// // Initial load
// loadAllFeatures();

// // cvpp network data
// function getData(url){
//   fetch(url)
//     .then(response => {
//       if (!response.ok) {
//         throw new Error('Network response was not OK');
//       }
//       return response.text(); // or response.text() if it's plain text
//     })
//     .then(data => {
//       const safeJSON = data.replace(/\bNaN\b/g, 'null');
//       data = JSON.parse(safeJSON);
//       //console.log('Data received:', data);
//       updateData(data);
//     })
//     .catch(error => {
//       console.error('There was a problem with the fetch:', error);
//     });
// }

// // do something with cvpp network data
// async function updateData(data){
//     data = data['records']//[0]['fields']

//     // scale flex
//     let flexList = data.map(d => parseFloat(d['fields']['flex wh']));
//     flexList = flexList.filter(num => !Number.isNaN(num));

//     // scale flex wh by range
//     let flexMin = Math.min(...flexList)
//     console.log(flexList)
//     let flexMax = Math.max(...flexList)

//     let lat, lng, label, flex

//     for (let i = 0; i < data.length; i++) {
//         //if NaN don't make a marker
//         if (data[i]['fields']['flex wh'] == null || data[i]['fields']['flex wh'] === undefined ){
//             continue
//         }

//         input = data[i]['fields']['network'] + ", NYC"
//         //console.log(input)

//         if (isLatLng(input)) {
//             const parts = input.split(',');
//             lat = parseFloat(parts[0]);
//             lng = parseFloat(parts[1]);

//             // Reverse geocode
//             const revRes = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${lng},${lat}&f=json`);
//             const revData = await revRes.json();
            
//         } else {
//             // Forward geocode address
//             const geoRes = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(input)}&f=json`);
//             const data = await geoRes.json();
//             if (!data.candidates.length) {
//               alert('Address not found.');
//               return;
//             }
//             const candidate = data.candidates[0];
//             lat = candidate.location.y;
//             lng = candidate.location.x;
//         }
//         label = data[i]['fields']['name'] +' in ' + data[i]['fields']['network'];

//         // scale size of dot by available flexibility
//         flex = parseFloat(data[i]['fields']['flex wh'])
//         flex = (parseFloat(flex) - flexMin)/(flexMax- flexMin)
//         flex = parseInt((flex * 10) + 5)

//         bat = parseFloat(data[i]['fields']['battery'])/100

//         //let nameC = data[i]['fields']['name'];
//         dropCircle(lat, lng, label,flex, bat);//,);
//     }

    
// }

// // get cvpp network data to populate map
// getData('https://communityvirtualpowerplant.com/api/gateway.php?table=live')
// //setInterval(getData,60000);