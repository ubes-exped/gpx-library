<?php
$target_dir = "routes.ubes.co.uk/gpx/";
$target_file = $target_dir . basename($_FILES["gpxfile"]["name"]);
$error = [];
$imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

// Check if file already exists
if (file_exists($target_file)) {
  $error[] = "File $basename already exists.";
}

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
  header("Location: /", true, 303);
  exit;
} else {
  $error[] = "Sorry, there was an error uploading your file.";
}
header("Content-Type: text/plain", true, 400);
echo implode("\n", $error);
?>
