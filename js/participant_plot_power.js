let paramsDay = new URLSearchParams(document.location.search);
let nameDay = paramsDay.get("name");

let urlDay = `https://communityvirtualpowerplant.com/api/gateway.php?table=${nameDay}&maxRecords=1000`

// &sort%5B0%5D%5Bfield%5D=datetime&sort%5B0%5D%5Bdirection%5D=desc`

getData(urlDay)
setInterval(getData,60000);

//const apiUrl = '/api/data?file=recent';

// function extractFieldsToCSV(json) {
//   const records = json.records.map(rec => rec.fields);

//   if (!records.length) return '';

//   const headers = Object.keys(records[0]);
//   const csvRows = [headers.join(',')];

//   for (const row of records) {
//     const values = headers.map(key => {
//       const value = row[key] ?? '';
//       // Escape double quotes
//       return value//`${value.toString().replace(/"/g, '""')}`;
//     });
//     csvRows.push(values.join(','));
//   }

//   return csvRows.join('\n');
// }

function extractFieldsToCSV(json, sortByKey = null, ascending = true) {
  console.log(json)
  let records = json.records.map(rec => rec.fields);

  // Step 1: Sort if needed
  if (sortByKey) {
    records.sort((a, b) => {
      const valA = a[sortByKey] ?? '';
      const valB = b[sortByKey] ?? '';
      
      // Convert to Date or Number if needed
      const aVal = isNaN(Date.parse(valA)) ? valA : new Date(valA);
      const bVal = isNaN(Date.parse(valB)) ? valB : new Date(valB);

      if (aVal < bVal) return ascending ? -1 : 1;
      if (aVal > bVal) return ascending ? 1 : -1;
      return 0;
    });
  }

  // Step 2: Convert to CSV
  if (!records.length) return '';
  const headers = Object.keys(records[0]);
  const csvRows = [headers.join(',')];

  for (const row of records) {
    const values = headers.map(key => {
      const value = row[key] ?? '';
      return value//`"${value.toString().replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}


function getColor(){
  // get colors between 20-240
  let r = (Math.floor(Math.random() * 200)+20).toString()
  let g = (Math.floor(Math.random() * 200)+20).toString()
  let b = (Math.floor(Math.random() * 200)+20).toString()
  let a = (.6).toString();
  return `rgba(${r},${g},${b},${a})`
}

// async function fetchAllPages(baseUrl, processPage, extractNextPage) {
//   let allRecords = [];
//   let url = baseUrl;

//   while (url) {
//     const response = await fetch(url);
//     const data = await response.json();

//     // Add this page's records
//     const pageRecords = processPage(data);
//     allRecords.push(...pageRecords);

//     // Get next page URL or token
//     url = extractNextPage(data);
//   }

//   return allRecords;
// }

async function fetchAllPages(baseUrl) {

    const response = await fetch('apiUrlToGetPageNumber');

    pageCount = (24*30)/100
    console.log(pageCount)
    const responses = await Promise.all(
        Array.from(
            Array(pageCount),
            (_, i) => fetch(`apiUrlToSpecificPage?offset=${i}`)
        )
    );
    
    // do something with processedResponses here

}



function getData(url){
  // fetchAllPages(
  //   url,
  //   data => data.records,                      // pull data from each page
  //   data => data.offset                        // get next page token
  //     ? `${BASE_URL}&offset=${data.offset}`
  //     : null                                   // stop when no offset
  // )
  // //   .then(allRecords => {
  // //   console.log("Total records:", allRecords.length);
  // // });

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not OK');
      }
      return response.text(); // or response.text() if it's plain text
    })
    .then(data => {
      const safeJSON = data.replace(/\bNaN\b/g, 'null');
      data = JSON.parse(safeJSON);
      //console.log('Data received:', data);
      const csv = extractFieldsToCSV(data,'datetime');
      console.log(csv);
      plotCSV(csv)
    })
    .catch(error => {
      console.error('There was a problem with the fetch:', error);
    });
}



async function plotCSV(csvText) {
  try {
    // const response = await fetch(apiUrl);
    // const csvText = await response.text();

    // Parse CSV manually
    const rows = csvText.trim().split('\n').map(row => row.split(','));
    const headers = rows.shift();

    // Assuming the first column is X (e.g., Date) and second column is Y (e.g., Value)
    const datetime = [];
    const cols = ['powerstation_percentage','powerstation_inputWDC','relay1_power','relay2_power','relay3_power']; //'powerstation_inputWAC','powerstation_outputWAC','powerstation_outputWDC',
    const y = {}
    const positionData = []


    cols.forEach(c=>{
          y[c] = []
        })

    rows.forEach(row => {
      datetime.push(row[0]);
      positionData.push(row[headers.indexOf('position')])
      cols.forEach(c=>{
        // get col position
        let i = headers.indexOf(c); 
        let v = parseFloat(row[i])
        y[c].push(isNaN(v) ? null : v)
      })
      //y.push(parseFloat(row[1]));
    });

    ///////////////////////////////////////////
    //********** BACKGROUND ******************/
    ///////////////////////////////////////////

    const shapes = []; // Will hold background color blocks
    const positions = ['A','B','C','D','E','F','G','EA','EB','EC','ED','EE','EF','EG','EH'];

    const positionColors = []

    // randomly assign a unique color to each position
    positions.forEach(p=>{
      if (positionData.includes(p)){
        positionColors[p] = getColor()
      }
    })

    console.log(positionColors)

    // Create background rectangles where mode changes
    let lastPosition = null;
    let startTime = null;

    for (let i = 0; i < datetime.length; i++) {
      const currentPosition = positionData[i];
      const currentTime = datetime[i];
      if (currentPosition !== lastPosition) {
        if (lastPosition !== null) {
          // Close previous rectangle
          shapes.push({
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: startTime,
            x1: currentTime,
            y0: 0,
            y1: 1,
            fillcolor: positionColors[lastPosition],
            opacity: 0.3,
            line: { width: 0 }
          });
        }
        startTime = currentTime;
        lastPosition = currentPosition;
      }
    }

    // Add last rectangle
    if (lastPosition !== null) {
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: startTime,
        x1: datetime[datetime.length - 1],
        y0: 0,
        y1: 1,
        fillcolor: positionColors[lastPosition],
        opacity: 0.3,
        line: { width: 0 }
      });
    }

    //dummy background traces
    const backgroundLegendTraces = Object.entries(positionColors).map(([position, color], index) => ({
      name: `Position: ${position}`,
      type: 'scatter',
      mode: 'markers',     // don't plot points
      x: [datetime[0]], // 👈 Needs at least one point (we can use first datetime)
      y: [0], 
      hoverinfo: 'skip', // avoid hover distractions
      showlegend: true,
      marker: { 
        color: color,
        size: 8 // small marker, visible in legend
      },
      //legendgroup: 'positions'//, // optional: group legend items
      //line: { color } // ensures legend swatch gets the color
      legendgroup: 'positions',
      ...(index === 0 ? { 
        legendgrouptitle: { text: 'Positions' } 
      } : {})
    }));


    ///////////////////////////////////////////
    //********** CREATE DATA TRACES***********/
    ///////////////////////////////////////////

    traces = []//...backgroundLegendTraces] // ... spreads content into array, so it isn't nested


    cols.forEach(c=>{
      t = {
        x: datetime,
        y: y[c],
        mode: 'lines+markers',
        type: 'scatter',
        name:c.replace('powerstation','battery').replace('_',' ').replace('percentage','%')// make labels more readable
      }

      traces.push(t)
    })  


    traces.push(...backgroundLegendTraces)

    Plotly.newPlot('plotPower',traces, {
      title: "Smart Power Station Data - Today",
      xaxis: { title: "Time" },
      yaxis: { title: "Power" },
      shapes: shapes,
      legend: {
        orientation: 'v',
        traceorder: 'grouped'
      }
    });
  } catch (error) {
    console.error('Error fetching or plotting CSV:', error);
  }
}