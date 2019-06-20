// Alternate entry point that makes use of process.argv instead of ink cli

import { getPDF } from './pdf.js';
import { makeTransformations, transform } from './lib/transformations.jsx';
import "core-js/stable";
import "regenerator-runtime/runtime";

const fs = require('fs');
const path = require('path')

var params = process.argv;
if (params.length < 3) {
    console.log("Please enter file path")
} else if (params.length > 3) {
    console.log("Only one parameter is allowed")
} else {
    const filePath = process.argv[2]
}



async function run() {
    const data = fs.readFileSync(filePath)
    const {fonts, metadata, pages, pdfDocument} = await getPDF(data)
    console.log(fonts)
    const transformations = makeTransformations(fonts.map)
    const parseResult = transform(pages, transformations)
    const text = parseResult.pages
        .map(page => page.items.join('\n') + '\n')
        .join('')
    const outputPath = "./output/output.md"
    console.log(`Writing to ${outputPath}...`)
    fs.writeFileSync(path.resolve(outputPath), text)
    console.log('Done.')
}

run()