import React from 'react';
import {render, Box} from 'ink';
import TextInput from 'ink-text-input';
import { getPDF } from './pdf.js';
import { makeTransformations, transform } from './lib/transformations.jsx';
import "core-js/stable";
import "regenerator-runtime/runtime";

const fs = require('fs');
const PropTypes = require('prop-types');
const path = require('path')

class SearchQuery extends React.Component {
    constructor() {
        super();
        PropTypes.showCursor = true;
 
        this.state = {
            query: ''
        };
 
        this.handleChange = this.handleChange.bind(this);
    }
 
    render() {
        return (
            <Box>
                <Box marginRight={1}>
                    Please input your folder path and output path separated by a single space:
                </Box>
 
                <TextInput
                    value={this.state.query}
                    onChange={this.handleChange}
                    onSubmit={this.handleSubmit}
                />
            </Box>
        );
    }
 
    handleChange(query) {
        this.setState({query});
    }

    handleSubmit(query) {
        console.log(query);
        var paths = query.split(' ');
        if (paths.length != 2) {
            query = "";
        } else {
            //passing directoryPath and callback function
            console.log(paths)
            var files = fs.readdirSync(paths[0])
            var filePaths = []

            files.forEach(file => {
                if (file.split('.').pop() == 'pdf') {
                    filePaths.push(paths[0] + '/' + file)
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
                const outputPath = "./output/output" + i + ".md"
                console.log(`Writing to ${outputPath}...`)
                fs.writeFileSync(path.resolve(outputPath), text)
                console.log('Done.')
            })
        }
    }
}
 
render(<SearchQuery/>);