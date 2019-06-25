import { getPDF } from './pdf.js';
import { makeTransformations, transform } from './lib/transformations.jsx';
import "core-js/stable";
import "regenerator-runtime/runtime";

const fs = require('fs');
const path = require('path')
var argv = require('minimist')(process.argv.slice(2));

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
    var outputArray = getPaths(folderPath)
    var filePaths = outputArray[0]
    var folderPaths = outputArray[1]
    var allFolderPaths = folderPaths
    if (recursive) {
        while (allFolderPaths.length != 0) {
            var nextFolderPaths = []
            allFolderPaths.forEach(folderPath => {
                outputArray = getPaths(folderPath)
                filePaths = filePaths.concat(outputArray[0])
                nextFolderPaths = nextFolderPaths.concat(outputArray[1])
                folderPaths = folderPaths.concat(outputArray[1])
            });
            allFolderPaths = nextFolderPaths
        }
    }
    var allOutputPaths = filePaths.map(x => {
        return outputPath + x.split(folderPath)[1].split('.')[0]
    })
    console.log(filePaths)
    console.log(folderPaths)
    console.log(allOutputPaths)
    allOutputPaths.forEach(outputPath => {
        outputPath = outputPath.split('/').slice(0, -1).join('/')
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true })
        }
    })
    createMarkdownFiles(filePaths, allOutputPaths)
}

function getPaths(folderPath) {
    var filePaths = []
    var folderPaths = []
    var directoryItems = fs.readdirSync(folderPath)
    directoryItems.forEach(directoryItem => {
        const isDirectory = fs.lstatSync(folderPath + '/' + directoryItem).isDirectory()
        if (isDirectory) {
            folderPaths.push(folderPath + '/' + directoryItem)
        } 
        if (directoryItem.split('.').pop() == 'pdf') {
            filePaths.push(folderPath + '/' + directoryItem)
        }
    });
    return [filePaths, folderPaths]
}

function createMarkdownFiles(filePaths, allOutputPaths) {
    filePaths.forEach(async function(filePath, i) {
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