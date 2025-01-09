<?php
$url = 'https://raw.githubusercontent.com/ubes-exped/routes.ubes.co.uk/master/walks.json';
$path = dirname(__FILE__) . '/routes.ubes.co.uk/' . 'walks.json';

/**
 * Download a URL to a file, via memory. Returns true on success.
 */
function get_file($path, $url) {
    $value = file_get_contents($url);
    if ($value !== false && $path !== false) {
        return file_put_contents($path, $value) !== false;
    } 
    return false;
}

function success() {
    global $path;

    http_response_code(200);
    
    header('Content-Type: application/json');
    header("Content-Length: ".@filesize($path));
    readfile($path);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

shell_exec('bash git-setup.sh >> ../upload.log 2>&1 &');
	if (get_file($path, $url)) {
        success();
	} else {
        http_response_code(500);
    }
} else {
    if (!file_exists($path) && !get_file($path, $url)) {
        http_response_code(500);
        exit();
    }
    success();
}
