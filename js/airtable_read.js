const API_KEY = "patJHyXMkPElVcgiy.edf9521de577151b56fb3668779bd0cd0cb777e8f11e8b9359adcc4d4539eb6b";
const BASE_ID = "your_base_id_here";
const TABLE_NAME = "sDR_test";

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
