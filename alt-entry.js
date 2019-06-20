// Alternate entry point that makes use of process.argv instead of ink cli

import { getPDF } from './pdf.js';
import { makeTransformations, transform } from './lib/transformations.jsx';
import "core-js/stable";
import "regenerator-runtime/runtime";

const fs = require('fs');
const path = require('path')

var params = process.argv;
if (params.length < 4) {
    console.log("Please enter both the folder path and the output path separated by a single space")
} else if (params.length > 4) {
    console.log("Only one parameter is allowed")
} else {
    const folderPath = process.argv[2]
    const outputPath = process.argv[3]
    run(folderPath, outputPath)
}

async function run(folderPath, outputPath) { 
    var files = fs.readdirSync(folderPath)
    var filePaths = []
    var fileNames = []

    files.forEach(file => {
        if (file.split('.').pop() == 'pdf') {
            filePaths.push(folderPath + '/' + file)
            fileNames.push(file.split('.')[0])
        }
    });
    
    filePaths.forEach(async function(filePath, i) {
        const data = fs.readFileSync(filePath)
        const {fonts, metadata, pages, pdfDocument} = await getPDF(data)
        console.log(fonts)
        const transformations = makeTransformations(fonts.map)
        const parseResult = transform(pages, transformations)
        const text = parseResult.pages
            .map(page => page.items.join('\n') + '\n')
            .join('')
        let outputFile = outputPath + "/" + fileNames[i] + ".md"
        console.log(`Writing to ${outputFile}...`)
        fs.writeFileSync(path.resolve(outputFile), text)
        console.log('Done.')
    })
}