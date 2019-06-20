import React from 'react';
import Transformation from './Transformation.jsx';
import ParseResult from '../ParseResult.jsx';
import { blockToText } from '../markdown/BlockType.jsx';

export default class ToTextBlocks extends Transformation {

    constructor() {
        super("To Text Blocks", "TextBlock");
    }
    
    transform(parseResult) {
        parseResult.pages.forEach(page => {
            const textItems = [];
            page.items.forEach(block => {
                //TODO category to type (before have no unknowns, have paragraph)
                const category = block.type ? block.type.name : 'Unknown';
                textItems.push({
                    category: category,
                    text: blockToText(block)
                });
            });
            page.items = textItems;
        });
        return new ParseResult({
            ...parseResult,
        });
    }

}
