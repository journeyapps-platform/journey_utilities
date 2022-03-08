import * as xml from '@journeyapps/core-xml';
export const STYLE_PROPERTIES = [
  'align',
  'color',
  'icon-color',
  'background-color',
  'bold',
  'italics',
  'underline',
  'strikethrough'
];

export function toStyleProperty(prop: string) {
  return `style-${prop}`;
}

export function styleProperties() {
  let style = {};
  (style as any)['style'] = xml.attribute.any;
  STYLE_PROPERTIES.forEach((prop) => {
    (style as any)[toStyleProperty(prop)] = xml.attribute.any;
  });
  return style;
}
