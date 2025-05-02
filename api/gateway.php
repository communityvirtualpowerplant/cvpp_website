<?php

// ======== CONFIG ========= //
//$table_name = 'live';
$base_ID = 'appZI2AenYNrfVqCL';
$valid_key = '12345'; // Key required to access this script

// https://api.airtable.com/v0/appZI2AenYNrfVqCL/analysis
$third_party_api_key = require('key.php'); //best to use a .env file instead, but might be a little tricky on dreamhost with a shared server...
//========================= //

// Get the key from query or header
$client_key = $_GET['key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? null;
$table_name = $_GET['table'] ?? $_SERVER['table'] ?? null;

$third_party_url = 'https://api.airtable.com/v0/' . $base_ID . '/' . $table_name; // The 3rd-party API endpoint 


if (isset($_GET['maxRecords'])) {
    $max_records = $_GET['maxRecords'];
    $third_party_url = $third_party_url . '?maxRecords=' . $max_records;
}

if (isset($_GET['view'])) {
    $view = $_GET['view'];
    $third_party_url = $third_party_url . '&view=' . urlencode($view);
}

if (isset($_GET['offset'])) {
    $offset = $_GET['offset'];
    $third_party_url = $third_party_url . '&offset=' . $offset;
}




//&maxRecords=1000&view=Grid%20view


// // Reject if key is invalid
// if ($client_key !== $valid_key) {
//     http_response_code(403);
//     echo json_encode(["error" => "Unauthorized"]);
//     exit;
// }

// Forward request to third-party API
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $third_party_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$headers = [
    'Authorization: Bearer ' . $third_party_api_key,
    'Content-Type: application/json'
];

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Return the response back to the client
http_response_code($http_code);
header('Content-Type: application/json');
echo $response;
?>