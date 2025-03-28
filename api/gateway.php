<?php

// ======== CONFIG ========= //
$table_name = 'sDR_test';
$base_ID = 'appkbMg8saW21BQKS';
$valid_key = '12345'; // Key required to access this script
$third_party_url = 'https://api.airtable.com/v0/' . $base_ID . '/' . $table_name; // The 3rd-party API endpoint
$third_party_api_key = require('key.php'); //best to use a .env file instead, but might be a little tricky on dreamhost with a shared server...
//========================= //

// Get the key from query or header
$client_key = $_GET['key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? null;

// Reject if key is invalid
if ($client_key !== $valid_key) {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

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