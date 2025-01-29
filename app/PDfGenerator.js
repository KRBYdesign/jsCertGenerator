const PDFDocument = require('pdfkit');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function generatePDF(csvFile, filePrefix, template, details) {
    return new Promise(async (resolve) => {
        const doc = new PDFDocument();

        // save the document to storage/generated_docs/
        const saveDir = path.join('storage', 'generated_docs');

        let fileName;
        try {
            fileName = generateFileName(csvFile.filename);
        } catch (err) {
            resolve({
                "status" : err.code,
                "message" : err.message
            });
        }

        // create the write stream for the document
        const filePath = path.join(saveDir, filePrefix + '_' + fileName + '.pdf');
        doc.pipe(fs.createWriteStream(filePath));

        // parse the csv file
        // csvRows will come as an array of JSON objects
        let csvRows = await parseCSV(csvFile);
        console.log("CSV Data", csvRows);

        // pull the details for the template
        let templateData = null;
        await fetch(`storage/data/${template}.json`)
            .then((results) => results.json())
            .then((data) => templateData = data);

        console.log("Template Data", templateData);

        // return an error if the template isn't able to be gathered
        if (templateData === null) {
            resolve({
                "status" : 400,
                "message" : "Could not get template data"
            });
        }

        
       
        // generate the multi-page PDF document containing all the files
        

        // close the document
        doc.end();

        // return an object with a status and a way to send the download link or something
        resolve({
            'status' : 200,
            'download' : filePath
        });
    });
}

async function parseCSV(file) {
    return new Promise((resolve) => {
        let results = [];

        // read the file
        fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            resolve(results);
        });
    }); 
}

function generateFileName(fileName) {
    // filename should always end with .csv
    const parts = fileName.split(".");

    if (parts.length > 2) {
        let err = new Error("Filename contains more than 1 '.' character");
        err.code = 400

        throw err;

    } else if (parts[1] !== "csv") {
        let err = new Error("Filename does not end with 'csv'");
        err.code = 400

        throw err;
    }

    return parts[0];
}

module.exports = generatePDF;
