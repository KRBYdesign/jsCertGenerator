const PORT = 80;

const express = require("express");
const path = require('path');
const app = express();
const multer = require("multer");

const multStorage = multer.diskStorage({
    destination : 'storage/uploads/',
    filename: function (req, res, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

        cb(null, 'file-' + uniqueSuffix + '.csv');
    }
});

const upload = multer({ storage: multStorage });
const generatePDF = require('./app/PDfGenerator.js');

app.use('/public', express.static(path.join(__dirname + '/public')));
app.use('/storage', express.static(path.join(__dirname + '/storage')));
app.use(express.urlencoded({ extended: true }));

// Serve the form page
app.get('/', function(req, res) {
   res.sendFile(path.join(__dirname, "/views/index.html"));
});

// Download the CSV template
app.get('/download/csv-template', function(_, res) {
    let filePath = "./storage/templates/certificate-csv-template.csv";
    let fileName = "certificate-csv-template.csv";

    res.download(filePath, fileName);
});

// download the generated PDF file
app.get('/download/:file', function (req, res) {
    let filePath = "./storage/generated_docs/" + req.params.file + ".pdf";
    let fileName = req.params.file.split("file-")[0] + '.pdf';

    res.download(filePath, fileName);
});

app.get('/success', function (req, res) {
    res.sendFile(path.join(__dirname, "/views/success.html"));
});

// Submit the generation form
app.post('/generate', upload.single('csvUpload'), async function(req, res) {
    let prevPage = '/'; // save the previous page for redirect

    // honeypot
    const honeyPot = await req.body.preferredName;
    if (honeyPot !== "") {
        console.log("Honeypot triggered");
        res.redirect(prevPage);
    }

    const filePrefix = await req.body.filePrefix;
    const certTemplate = await req.body.pdfTemplate;
    const certDetails = await req.body;

    // get the csv file
    const file = req.file;

    // console.log("Upload", file);

    let generatedPDF = await generatePDF(file, filePrefix, certTemplate, certDetails);

    // send back the link to download the file with the generated id as a url parameter
    // res.redirect(prevPage);
    if (generatedPDF.status !== 200) {
        // error occured
        res.redirect('/?err=' + encodeURIComponent(generatedPDF.message));
    } else {
        res.redirect('/success?file=' + encodeURIComponent(generatedPDF.filename));
    }

});

app.listen(PORT, '0.0.0.0');
console.log(`Server listening on port ${PORT}`);
