// Alternate entry point that makes use of process.argv instead of ink cli

import { getPDF } from './pdf.js';
import { makeTransformations, transform } from './lib/transformations.jsx';
import "core-js/stable";
import "regenerator-runtime/runtime";

const fs = require('fs');
const path = require('path')

var params = process.argv;
if (params.length < 5) {
    console.log("Please enter both the folder path, output path and recursive conversion (0 or 1) separated by a single space")
} else if (params.length > 5) {
    console.log("Only three parameters is allowed")
} else {
    const folderPath = process.argv[2]
    const outputPath = process.argv[3]
    const recursive = parseInt(process.argv[4])
    run(folderPath, outputPath, recursive)
}

async function run(folderPath, outputPath, recursive=true) { 
    var allFilePaths = getAllPDFs(folderPath, outputPath, recursive)
    var allOutputPaths = allFilePaths.map(x => {
        x = outputPath + x.split(folderPath)[1].split('.')[0]
        return x
    })
    console.log(allFilePaths)
    console.log(allOutputPaths)
    allFilePaths.forEach(async function(filePath, i) {
        const data = fs.readFileSync(filePath)
        const {fonts, metadata, pages, pdfDocument} = await getPDF(data)
        console.log(fonts)
        const transformations = makeTransformations(fonts.map)
        const parseResult = transform(pages, transformations)
        const text = parseResult.pages
            .map(page => page.items.join('\n') + '\n')
            .join('')
        let outputFile = allOutputPaths[i] + '.md'
        console.log(`Writing to ${outputFile}...`)
        fs.writeFileSync(path.resolve(outputFile), text)
        console.log('Done.')
    })
}

function getAllPDFs(folderPath, outputPath, recursive) {
    var folderPaths = [folderPath]
    var allFilePaths = []
    while (folderPaths.length != 0) {
        folderPaths.forEach(newFolderPath => {
            var files = fs.readdirSync(newFolderPath)
            outputPath = outputPath + newFolderPath.split(folderPath)[1]
            var outputArray = saveFilePaths(files, newFolderPath, outputPath)
            var filePaths = outputArray[0]
            folderPaths = outputArray[1]
            if (!recursive) {
                folderPaths = []    
            }
            allFilePaths = allFilePaths.concat(filePaths)
        });
    }
    return allFilePaths
}

function saveFilePaths(files, folderPath, outputPath) {
    var filePaths = []
    var folderPaths = []
    files.forEach(file => {
        const isDirectory = fs.lstatSync(folderPath + '/' + file).isDirectory()
        if (isDirectory) {
            folderPaths.push(folderPath + '/' + file)
            var newdir = outputPath + '/' + file
            if (!fs.existsSync(newdir)) {
                fs.mkdir(outputPath + '/' + file, {
                    recursive: true 
                }, (err) => {
                    if (err) throw err;
                });
            }
        } 
        if (file.split('.').pop() == 'pdf') {
            filePaths.push(folderPath + '/' + file)
        }
    });
    return [filePaths, folderPaths]
}