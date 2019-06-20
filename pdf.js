import pdfjs from 'pdfjs-dist';
import Page from './models/Page.jsx';
import TextItem from './models/TextItem.jsx'
import "core-js/stable";
import "regenerator-runtime/runtime";

export async function getPDF(docOptions) {
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
    for (let i = 1; i <= pdfDocument.numPages; i++) {
        console.log("getting page")
        const page = await pdfDocument.getPage(i)
        const scale = 1.0
        const viewport = page.getViewport(scale)
        console.log("getting pagetextcontent")
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
                    // console.log("fonts inside if")
                })
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
        console.log("fonts out" + i.toString());
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
    return { fonts, metadata, pages, pdfDocument };
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
