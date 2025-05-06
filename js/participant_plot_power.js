let paramsDay = new URLSearchParams(document.location.search);
let nameDay = paramsDay.get("name");

let urlDay = `https://communityvirtualpowerplant.com/api/gateway.php?table=${nameDay}&maxRecords=1000&view=Grid%20view` //sort%5B0%5D%5Bfield%5D=datetime&sort%5B0%5D%5Bdirection%5D=desc`

getData(urlDay)
//setInterval(getData,60000);

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

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function fetchAllRecords(baseUrl) {
  const allRecords = [];
  let offset = null;
  const pageSize = 100; // Airtable max per page

  do {
    try{
      //let url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?pageSize=${pageSize}&view=${encodeURIComponent(view)}`;
      let url = baseUrl
      if (offset) {
        url += `&offset=${offset}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        break;
        throw new Error(`Error: ${res.status} - ${await res.text()}`);
      }

      const data = await res.json();
      allRecords.push(...data.records);
      offset = data.offset;

      //await sleep(300); // Sleep
  } catch (err){
    console.error(`Error fetching Airtable data: ${err.message}`);
    break;
  }

  } while (offset);

  return allRecords;
}


async function getData(url){

    try {
      const data = await fetchAllRecords(url);

      if (!data || data.length === 0) {
        console.warn('No records returned.');
        return;
      }

      console.log(data)
      plotDicts(data)
    } catch (error){
    console.error('There was a problem with getData:', error);
    }
}

async function plotDicts(data) {
  try {

    // Assuming the first column is X (e.g., Date) and second column is Y (e.g., Value)
    const datetime = [];
    const cols = ['powerstation_percentage','powerstation_inputWDC','relay1_power','relay2_power','relay3_power']; //'powerstation_inputWAC','powerstation_outputWAC','powerstation_outputWDC',
    const y = {}
    const positionData = []

    // merge the different dictionaries into one massive one
    cols.forEach(c=>{
          y[c] = []
        })

    data.forEach(row => {
      let fields =  row['fields']
      datetime.push(fields['datetime']);

      positionData.push(fields['position'])
      cols.forEach(c=>{
        // get col position
        //let i = headers.indexOf(c); 
        let v = parseFloat(fields[c])
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

    //console.log(positionColors)

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
      // ,
      // responsive: true
    });
  } catch (error) {
    console.error('Error fetching or plotting CSV:', error);
  }
}