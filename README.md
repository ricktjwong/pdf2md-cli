# pdf2md-CLI

Based on the convert made by https://github.com/jzillmann/pdf-to-markdown.
This started as a bare ink CLI project, adding the elements required for the pdf2md along the way, to minimise dependency clashes.

Instructions to run:
<pre>
$ cd [project_folder]
$ node index.js [input folder path] [output folder path] [Specify 1 for recursive and 0 for non-recursive]
</pre>

Options:
1. Input folder path (should exist)
2. Output folder path (should exist)
3. Recursive - convert all PDFs for folders within folders
