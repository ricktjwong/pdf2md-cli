import pdfjs from 'pdfjs-dist';
import Page from './models/Page.jsx';
import TextItem from './models/TextItem.jsx';
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
        // console.log("getting page")
        const page = await pdfDocument.getPage(i)
        const scale = 1.0
        const viewport = page.getViewport(scale)
        // console.log("getting pagetextcontent")
        const textContent = await page.getTextContent()
        if (textContent) {
            const textItems = textContent.items.map(item => {
                const fontId = item.fontName
                if (!fonts.ids.has(fontId) && fontId.startsWith('g_d0')) {
                    // according to the docs, a PDFObject has the method get(objId: number, callback?: any): any;
                    // Need to promisify the .get method, and await before returning, but this entails editing
                    // the framework. Have to find use an object watcher instead.
                    pdfDocument._transport.commonObjs.get(fontId, font => {
                        if (!fonts.ids.has(fontId)) {
                            fonts.ids.add(fontId)
                            fonts.map.set(fontId, font)
                        }
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
            pages[page.pageIndex].items = textItems
            page.getOperatorList()
        }
    }
        return { fonts, metadata, pages, pdfDocument };
}
