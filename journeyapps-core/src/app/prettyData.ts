// Adapted from: https://github.com/vkiryukhin/pretty-data/blob/master/pretty-data.js
// License: MIT

export class PrettyData {
  shift: string[];
  step: string;

  constructor() {
    this.shift = ['\n']; // array of shifts
    this.step = '    '; // 4 spaces
    const maxdeep = 100; // nesting level

    // initialize array with shifts //
    for (let ix = 0; ix < maxdeep; ix++) {
      this.shift.push(this.shift[ix] + this.step);
    }
  }

  // ----------------------- XML section ----------------------------------------------------

  xml(text: string) {
    const ar = text
      .replace(/>\s{0,}</g, '><')
      .replace(/</g, '~::~<')
      .replace(/xmlns\:/g, '~::~xmlns:')
      .replace(/xmlns\=/g, '~::~xmlns=')
      .split('~::~');
    const len = ar.length;
    let inComment = false;
    let deep = 0;
    let str = '';
    let ix = 0;

    for (ix = 0; ix < len; ix++) {
      // start comment or <![CDATA[...]]> or <!DOCTYPE //
      if (ar[ix].search(/<!/) > -1) {
        str += this.shift[deep] + ar[ix];
        inComment = true;
        // end comment  or <![CDATA[...]]> //
        if (ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1 || ar[ix].search(/!DOCTYPE/) > -1) {
          inComment = false;
        }
      } else if (ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1) {
        // end comment  or <![CDATA[...]]> //
        str += ar[ix];
        inComment = false;
      } else if (
        /^<\w/.exec(ar[ix - 1]) &&
        /^<\/\w/.exec(ar[ix]) &&
        /^<[\w:\-\.\,]+/.exec(ar[ix - 1])[0] == /^<\/[\w:\-\.\,]+/.exec(ar[ix])[0].replace('/', '')
      ) {
        // <elm></elm> //
        str += ar[ix];
        if (!inComment) {
          deep--;
        }
      } else if (ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) == -1 && ar[ix].search(/\/>/) == -1) {
        // <elm> //
        str = !inComment ? (str += this.shift[deep++] + ar[ix]) : (str += ar[ix]);
      } else if (ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) > -1) {
        // <elm>...</elm> //
        str = !inComment ? (str += this.shift[deep] + ar[ix]) : (str += ar[ix]);
      } else if (ar[ix].search(/<\//) > -1) {
        // </elm> //
        str = !inComment ? (str += this.shift[--deep] + ar[ix]) : (str += ar[ix]);
      } else if (ar[ix].search(/\/>/) > -1) {
        // <elm/> //
        str = !inComment ? (str += this.shift[deep] + ar[ix]) : (str += ar[ix]);
      } else if (ar[ix].search(/<\?/) > -1) {
        // <? xml ... ?> //
        str += this.shift[deep] + ar[ix];
      } else if (ar[ix].search(/xmlns\:/) > -1 || ar[ix].search(/xmlns\=/) > -1) {
        // xmlns //
        str += this.shift[deep] + ar[ix];
      } else {
        str += ar[ix];
      }
    }

    return str[0] == '\n' ? str.slice(1) : str;
  }
}
