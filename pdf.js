import pdfjs from 'pdfjs-dist';
import Page from './models/Page.js';
import TextItem from './models/TextItem.js'
import "core-js/stable";
import "regenerator-runtime/runtime";

var CountdownLatch = function (limit){
    this.limit = limit;
    this.count = 0;
    this.waitBlock = function (){};
};

CountdownLatch.prototype.countDown = function (){
    this.count = this.count + 1;
    if(this.limit <= this.count){
        return this.waitBlock();
    }
};

CountdownLatch.prototype.await = function(callback){
    this.waitBlock = callback;
};

var barrier = new CountdownLatch(1);

export async function getPDF(fileBuffer) {
    let docOptions = {
        data: fileBuffer,
        // cMapUrl: './node_modules/pdfjs-dist/cmaps/',
        cMapUrl: 'cmaps/',
        cMapPacked: true,
    }
    const pdfDocument = await pdfjs.getDocument(docOptions);
    // console.log(pdfDocument._transport);
    const metadata = await pdfDocument.getMetadata();
    // Create an Array of empty pages
    const pages = [...Array(pdfDocument.numPages).keys()].map(
        index => new Page({ index })
    )
    const fonts = {
        ids: new Set(),
        map: new Map(),
    }
    console.log("fonts1");
    console.log(fonts);
    for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i)
        const scale = 1.0
        const viewport = page.getViewport(scale)
        const textContent = await page.getTextContent()
        // console.log(pdfDocument._transport.commonObjs);
        const textItems = await textContent.items.map(item => {
            const fontId = item.fontName

            if (!fonts.ids.has(fontId) && fontId.startsWith('g_d0')) {
                pdfDocument._transport.commonObjs.get(fontId, font => {
                    if (!fonts.ids.has(fontId)) {
                        fonts.ids.add(fontId)
                        fonts.map.set(fontId, font)
                    }
                })
                barrier.countDown();
            }

            const tx = pdfjs.Util.transform(
                viewport.transform,
                item.transform
            )

            const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
            const dividedHeight = item.height / fontHeight;
            return new TextItem({
                x: Math.round(item.transform[4]),
                y: Math.round(item.transform[5]),
                width: Math.round(item.width),
                height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight),
                text: item.str,
                font: fontId,
            })
        })
        console.log("fonts out");
        console.log(fonts)
        pages[page.pageIndex].items = textItems
        // Verify that the number of page items for each page correspond
        // pages.forEach(element => {
        //     console.log(element.items.length)
        // });
        // Trigger the font retrieval for the page
        page.getOperatorList()
    }
    // fonts display nothing here cos the async function has not completed
    // console.log(fonts);
    // console.log(metadata);
    console.log("fonts final");
    console.log(fonts);
    barrier.await(function() {
        console.log("hi");
        console.log(fonts);
        return { fonts, metadata, pages, pdfDocument };
    })
} 

// What the above function is actually doing
export function getPDF2(filePath) {
    var loadingTask = pdfjs.getDocument(filePath);
    loadingTask.promise.then(function(pdf) {
        const pdfDocument = pdf;
        pdfDocument.getMetadata().then(function(metadata) {
            console.log(metadata);
        });
    });
}
