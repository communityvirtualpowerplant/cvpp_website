const API_KEY = "";
const BASE_ID = "appZI2AenYNrfVqCL";
const TABLE_NAME = "live";

fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
  headers: {
    Authorization: `Bearer ${API_KEY}`
  }
})
.then(response => response.json())
.then(data => {
  document.getElementById("output").textContent = JSON.stringify(data.records, null, 2);
})
.catch(err => console.error(err));
