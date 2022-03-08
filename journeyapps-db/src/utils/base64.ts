// Base64 encoding and decoding functions

var base64 = {};
// See https://developer.mozilla.org/en-US/docs/DOM/window.btoa

export var decode: (encodedData: string) => string;
export var encode: (text: string) => string;

if (typeof Buffer == 'undefined') {
  // Browser
  decode = function (str) {
    return decodeURIComponent((window as any).escape(window.atob(str)));
  };

  encode = function (str) {
    return window.btoa((window as any).unescape(encodeURIComponent(str)));
  };
} else {
  // NodeJS

  decode = function (str) {
    return new Buffer(str, 'base64').toString('ascii');
  };

  encode = function (str) {
    return new Buffer(str).toString('base64');
  };
}

export function datauri(mime: string, data: string) {
  return 'data:' + mime + ';base64,' + encode(data);
}

export function cleanDecode(encodedData: string) {
  var value = decode(encodedData);
  // Sometimes this has a lot of empty characters (charCode = 0) in between. Remove them
  var fixedValue = '';
  for (var i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) != 0) {
      fixedValue += value.charAt(i);
    }
  }
  return fixedValue;
}
