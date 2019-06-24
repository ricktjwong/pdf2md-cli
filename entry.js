import { getPDF } from './pdf.js';
import { makeTransformations, transform } from './lib/transformations.jsx';
import "core-js/stable";
import "regenerator-runtime/runtime";

const fs = require('fs');
const path = require('path')
var argv = require('minimist')(process.argv.slice(2));

// node index.js --inputFolderPath=/Users/ricktjwong/rickwong/3_Projects/5_Business/govtech/pdf2md-cli/examples --outputFolderPath=./output --recursive=true

if (!argv["inputFolderPath"]) {
    console.log("Please specify inputFolderPath")
} else if (!argv["outputFolderPath"]) {
    console.log("Please specify outputFolderPath")
} else if (!argv["recursive"]) {
    console.log("Please specify recursive equals 1 or 0")
} else {
    const folderPath = argv["inputFolderPath"]
    const outputPath = argv["outputFolderPath"] 
    const recursive = parseInt(argv["recursive"])
    run(folderPath, outputPath, recursive)
}

function run(folderPath, outputPath, recursive=true) {
    var allFilePaths = getAllPdfPaths(folderPath, outputPath, recursive)
    var allOutputPaths = allFilePaths.map(x => {
        return outputPath + x.split(folderPath)[1].split('.')[0]
    })
    allFilePaths.forEach(async function(filePath, i) {
        const data = fs.readFileSync(filePath)
        try {
            const {fonts, metadata, pages, pdfDocument} =  await getPDF(data)
            console.log(`Doing transformations...`)
            const transformations = makeTransformations(fonts.map)
            const parseResult = transform(pages, transformations)
            const text = parseResult.pages
                .map(page => page.items.join('\n') + '\n')
                .join('')
            let outputFile = allOutputPaths[i] + '.md'
            console.log(`Writing to ${outputFile}...`)
            fs.writeFileSync(path.resolve(outputFile), text)
            console.log('Done.')
        } catch (err) {
            console.log(err)
        }
    })
}

function getAllPdfPaths(folderPath, outputPath, recursive) {
    var folderPaths = [folderPath]
    var allFilePaths = []
    while (folderPaths.length != 0) {
        folderPaths.forEach(newFolderPath => {
            var files = fs.readdirSync(newFolderPath)
            outputPath = outputPath + newFolderPath.split(folderPath)[1]
            var outputArray = getPaths(files, newFolderPath, outputPath)
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

function getPaths(files, folderPath, outputPath) {
    var filePaths = []
    var folderPaths = []
    files.forEach(file => {
        const isDirectory = fs.lstatSync(folderPath + '/' + file).isDirectory()
        if (isDirectory) {
            folderPaths.push(folderPath + '/' + file)
            var newdir = outputPath + '/' + file
            if (!fs.existsSync(newdir)) {
                fs.mkdirSync(outputPath + '/' + file, { recursive: true })
            }
        }
        if (file.split('.').pop() == 'pdf') {
            filePaths.push(folderPath + '/' + file)
        }
    });
    return [filePaths, folderPaths]
}