<?php
$target_dir = "routes.ubes.co.uk/gpx/";
$target_file = $target_dir . basename($_FILES["gpxfile"]["name"]);
$uploadOk = 1;
$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));

// Check if file already exists
if (file_exists($target_file)) {
  echo "Sorry, file $basename already exists. ";
  $uploadOk = 0;
}

// Check file size
if ($_FILES["fileToUpload"]["size"] > 1024 * 1024) {
  echo "Sorry, your file is too large. ";
  $uploadOk = 0;
}

// Allow certain file formats
if($imageFileType != "gpx" ) {
  echo "Sorry, only GPX files are allowed. ";
  $uploadOk = 0;
}

// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
  echo "Sorry, your file was not uploaded. ";
// if everything is ok, try to upload file
} else {
  if (move_uploaded_file($_FILES["gpxfile"]["tmp_name"], $target_file)) {
    shell_exec(sprintf('%s > /dev/null 2>&1 &', "bash upload.sh"));
    header("Location: https://walks.ubes.co.uk",TRUE,303);
  } else {
    echo "Sorry, there was an error uploading your file.";
  }
}
?>
