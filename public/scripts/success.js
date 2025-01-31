// Success Page
// Generate the download link from the information passed in the URL
//
// If the information passed in the URL isn't valid or existing for whatever reason, send the user back to the form with an error

const downloadButton = document.getElementById('download-button');
const url = new URL(window.location.href);
const params = url.searchParams;

const targetFile = params.get('file');

// send the user back to the form page if there's not a target file parameter
if (!targetFile) {
    const newUrl = new URL(url.origin + '/?err=no_target');
    window.location.replace(newUrl);
}

// append the file parameter to the download link
const downloadLink = new URL(url.origin + '/download/' + targetFile );

console.log(downloadLink);

downloadButton.href = downloadLink;
