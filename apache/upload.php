<?php
$target_dir = "routes.ubes.co.uk/gpx/";
$target_file = $target_dir . basename($_FILES["gpxfile"]["name"]);
$error = [];
$imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

// Check file size
if ($_FILES["fileToUpload"]["size"] > 1024 * 1024) {
  $error[] = "Your file is too large.";
}

// Allow certain file formats
if($imageFileType != "gpx") {
  $error[] = "Only GPX files are allowed.";
}

if ($error) {
  $error[] = "Sorry, your file was not uploaded.";
// if everything is ok, try to upload file
} elseif (move_uploaded_file($_FILES["gpxfile"]["tmp_name"], $target_file)) {
  shell_exec('bash upload.sh >> ../upload.log 2>&1 &');
  http_response_code(303);
  header("Location: /");
  exit;
} else {
  $error[] = "Sorry, there was an error uploading your file.";
}
http_response_code(400);
header("Content-Type: text/plain");
echo implode("\n", $error);
flush();
shell_exec('bash git-setup.sh >> ../upload.log 2>&1 &');
?>
