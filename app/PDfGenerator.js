const PDFDocument = require('pdfkit');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function generatePDF(csvFile, filePrefix, template, details) {
    return new Promise(async (resolve) => {
        // doc defaults
        const layout = 'landscape';
        const margin = 36; // margin is in pt so 72 = 1 inch
        const size = 'LETTER';
        const font = 'Helvetica';

        // new doc
        const doc = new PDFDocument({
            layout: layout,
            margin: margin,
            size: size,
            font: font,
            autoFirstPage: false,
        });

        // save the document to storage/generated_docs/
        const saveDir = path.join('storage', 'generated_docs');

        let fileName;
        try {
            fileName = `${filePrefix}_${generateFileName(csvFile.filename)}.pdf`;
        } catch (err) {
            resolve({
                "status" : 500,
                "message" : err.message
            });
        }

        // create the write stream for the document
        const filePath = path.join(saveDir, fileName);
        doc.pipe(fs.createWriteStream(filePath));

        // parse the csv file
        // csvRows will come as an array of JSON objects
        let csvRows = await parseCSV(csvFile);
        // console.log("CSV Data", csvRows);

        // pull the details for the template
        let templateData, templateFields, buildInstructions = null;
        const storageDir = path.resolve('storage/data');
        const url = path.join(storageDir, `${template}.json`);

        templateData = await JSON.parse(fs.readFileSync(url));

        if (templateData) {
            for (let key in templateData) {
                if (key === "fields") {
                    templateFields = templateData[key];
                }

                if (key === "build") {
                    buildInstructions = templateData[key];
                }
            }

            // error if no template fields found at this point
            if (!templateFields) {
                resolve({
                    "status" : 400,
                    "message" : "Could not resolve template fields"
                });
            }
        } else {
            resolve({
                "status" : 400,
                "message" : "Could not get template data"
            });

        }
       
        // generate the multi-page PDF document containing all the files
        csvRows.forEach((row) => {
            let firstName = row.First;
            let lastName = row.Last;

            // console.log("Adding row for", firstName, lastName);
            // loop through the names to create pages then generate the right page based off the template info
            doc.addPage();

            // add the banner image if the template requires one
            if (buildInstructions['banner-image']) {
                let imageWidth = 154;
                doc.image(buildInstructions['banner-image'], (doc.page.width - imageWidth) / 2, 36, { width: imageWidth });
                doc.moveDown(10);
            } else {
                // console.log("No banner required");
            }

            // add the certificate title if the template requires one
            if (buildInstructions['title']) {
                doc.fontSize(16);
                doc.font("Helvetica")
                    .text(buildInstructions['title'], {
                        align: 'center',
                    });
                doc.moveDown(.75);

            }

            // write the name to the document
            doc.fontSize(32);
            doc.font("Helvetica-Bold")
                .text(`${firstName} ${lastName}`, {
                    align: 'center'
                });
            doc.moveDown(.5);

            // write the additional details to the doc
            let fieldValue, fontName, fontSize, fontAlign, fontSpacing = null;
            for (let field in templateFields) {
                // console.log("Field", templateFields[field]);

                // get values and details for each field
                fieldValue = details[field];
                fontName = templateFields[field].family ?? font;
                fontSize = templateFields[field].size ?? 12;
                fontAlign = templateFields[field].align ?? 'center';
                fontSpacing = templateFields[field].spacing ?? 1;

                // console.log({
                //    "value" : fieldValue,
                //    "font" : [fontName, fontSize, fontAlign],
                // });

                // draw the signature line first if the field is the instructor name
                if (field === 'instructorName') {
                    const lineStart = (doc.page.width / 2) - 120;
                    const lineEnd = (doc.page.width / 2) + 120;

                    doc.moveTo(lineStart, doc.page.height - 100)
                        .lineTo(lineEnd, doc.page.height - 100)
                        .stroke();

                    doc.moveTo(doc.page.width / 2, doc.page.height - 80);
                    doc.moveDown(2);
                }

                doc.fontSize(fontSize);

                doc.font(fontName)
                    .text(fieldValue, { align: fontAlign })
                    .moveDown(fontSpacing);
            }

        });
        

        // close the document
        doc.end();

        // return an object with a status and a way to send the download link or something
        resolve({
            'status' : 200,
            'filename' : fileName.replace(".pdf", "")
        });
    });
}

async function parseCSV(file) {
    return new Promise((resolve) => {
        let results = [];

        // read the file
        fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) =>results.push(data))
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
