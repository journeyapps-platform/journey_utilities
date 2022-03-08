// # view module
//
// This module handles view parsing (stateless)
import * as viewParser from './viewParser';
import * as parserUtils from '../util/parserUtils';
import { Schema, Variable, Type, ParseVersion } from '@journeyapps/parser-schema';
import { ComponentParserBank, DEFAULT, V5ViewInterface } from '@journeyapps/parser-common';
import { FormatString, PrimitiveConstantTokenExpression } from '@journeyapps/evaluator';
import { parse } from './navParser';
import { XMLElement } from '@journeyapps/domparser/lib';
import { XMLError } from '@journeyapps/domparser/types';
import { ValidationError } from '@journeyapps/core-xml';

export interface ComponentEnumOption {
  key: string | number | boolean;
  label: FormatString;
}

export interface Hideable {
  showIf?: string;
  hideIf?: string;
}

export interface LayoutColumn {
  components: Component[];
  label?: FormatString;
  hasLabel?: boolean;
}

export interface LayoutSection {
  columns: LayoutColumn[];
  layout: 'single' | 'double';
}

export interface ObjectTableColumn {
  heading: FormatString;
  value: FormatString;
  search: string | boolean;
  showIf: PrimitiveConstantTokenExpression | string;
  hideIf: PrimitiveConstantTokenExpression | string;
  // New:
  style?: ObjectTableStyle;
  styleExpression?: string;
  edit?: ObjectTableEditableProperties;
  action?: ComponentAction<FormatString>;
  icon?: FormatString;
  /**
   * Should be 'asc' or 'desc', but not checked by the parser.
   */
  sort?: 'asc' | 'desc' | string;
  sortValue?: string;
  filter?: boolean;
  sorting?: boolean;
}

export interface ObjectTableEditableProperties {
  type: 'date' | 'select' | 'boolean' | 'text' | 'datetime' | 'number';
  value?: string;
  onChange?: string;
  disabled?: string | PrimitiveConstantTokenExpression;
  options?: string;
}

export interface ObjectTableStyle {
  align?: 'left' | 'right' | 'center';
  backgroundColor?: string;
  color?: string;
  iconColor?: string;
  bold?: string | PrimitiveConstantTokenExpression;
  italics?: string | PrimitiveConstantTokenExpression;
  underline?: string | PrimitiveConstantTokenExpression;
  strikethrough?: string | PrimitiveConstantTokenExpression;
}

export interface PanelItemPill extends Hideable {
  label: FormatString;
  color: string;
}

/**
 * Note: T = FormatString is deprecated, which is why the default is string.
 * From here on, the component should represent the primitives, not the expressions
 */
export interface ComponentAction<T extends string | FormatString = string> {
  label: T;
  onpress: string;
  icon?: T;
  validate?: boolean;
}

export interface Component extends Hideable {
  // give this to the runtime, so we can use it for directives etc..
  type: string;
  subtype?: string;

  label?: FormatString;

  bind?: string;
  bindingType?: Type;

  value?: FormatString;

  required?: boolean | string;

  onChange?: string;

  validate?: string;

  // object-*
  collection?: string;
  emptyMessage?: FormatString;

  // It is an error if this is anything else than QueryType.
  // However, the code does currently still save it and continue parsing.
  collectionType?: Type;

  // object-repeat
  as?: Variable;
  scopeType?: Type;

  mode?: string;

  objectTableStyle?: ObjectTableStyle;
  objectTableStyleExpression?: string;

  // object-list
  display?: FormatString;

  // button
  buttonType?: 'normal' | 'primary' | string;
  link?: string;
  color?: string;
  disabled?: string;
  onpress?: string;
  disabledMessage?: FormatString;
  icon?: FormatString;
  subtext?: FormatString;
  actions?: ComponentAction<FormatString | string>[];
  clickable?: boolean;

  // columns | object-table
  columns?: LayoutColumn[] | any;

  // table
  rows?: Component[];

  // menu
  hasLabel?: boolean;
  components?: Component[];
  hasIcons?: boolean;

  // *-choice
  options?: ComponentEnumOption[];

  // capture-photo
  source?: string;
  onCapture?: string;
  resolution?: string;

  // datetime-input
  modifierText?: FormatString;
  placeholder?: FormatString;

  // datetime-input
  placeholderDate?: FormatString;
  placeholderTime?: FormatString;

  // card
  header?: { value: FormatString } | FormatString;
  footer?: { value: FormatString } | FormatString;
  cardContent?: { value: FormatString };
  accent?: {
    label: FormatString;
    color: string;
  };
  action?: ComponentAction<FormatString | string>;

  // panel-item
  footerLabel?: FormatString;
  itemContent?: FormatString;
  hasContent?: boolean;
  image?: FormatString;
  hasImages?: boolean;
  iconColor?: string;
  pills?: PanelItemPill[];
  pillExpression?: string;

  // power-bi
  config?: string;
  onInteraction?: string;
  showScrollButton?: string;

  // power-bi / html
  showFullscreenButton?: string;
  height?: string;

  // buttons2.0
  style?: string;
  textColor?: string;
  iconPosition?: string | PrimitiveConstantTokenExpression;

  // Composition Zone
  compositionZone?: Component;

  // Toggle Widget
  statusTrue?: FormatString;
  statusFalse?: FormatString;
  statusDisabled?: FormatString;

  // Legacy
  id?: string;
}

export interface SidebarItem extends Hideable {
  state: string;
  onpress: string;
  onpressIcon: string;
  icon: FormatString;
  iconColor: string;
  label: FormatString;
  validate?: string;
}

export interface Sidebar {
  hasIcons: boolean;
  position: string;
  forceShow: boolean;
  type: 'sidebar';
  sidebarItems: SidebarItem[];
  /**
   * Function reference with type (...props: any[]) => SidebarItem[]
   */
  generateItems: string;
  visibleOnMobile: boolean;
}

// View constructor. This contains the view definition, and no state.
export class View implements V5ViewInterface {
  path: string;
  schema: Schema;
  app: any;
  errors: (XMLError | ValidationError)[];
  type: ViewType;
  parameters: Variable[];
  title: FormatString;

  mode: string;
  contextMenu: Component;

  links: { [index: string]: any };
  link_functions: { [index: string]: any }; // tslint:disable-line

  sidebar: Sidebar;
  sections: any[];
  primaryButton: Component;
  onBack: string;
  onNavigate: string;
  hasSidebar: boolean;

  hasColumns: boolean;
  components: Component[];

  functions: string[];
  inferredLinks: { [index: string]: any };
  fieldReferences: any;

  code: string;
  config: any;

  sourceElement: XMLElement;

  // used by the tern definitions
  apiVersion?: string;

  constructor(path: string, schema: Schema, data?: any) {
    this.path = path;
    this.schema = schema;
    this.app = null;

    this.errors = [];

    this.reset();

    if (data) {
      this.parse(data);
    }
  }

  reset() {
    this.type = new ViewType();
    this.parameters = []; // Sequential array of parameter variables
    this.links = {};
    this.inferredLinks = {};
    this.link_functions = {};
    this.functions = [];
    this.sections = [];
    this.primaryButton = null;
    this.onBack = null;
    this.onNavigate = null;
    this.config = {};
  }

  parse(data: any, options?: any) {
    this.errors = [];
    try {
      this.loadXml(data.xml, options);
    } catch (err) {
      console.log(`Error: failed to parse view ${this.path}, error:`, err);
      // Last resort only. In most cases the loadXml function should report more specific errors.
      this.errors.push(err);
    }
    try {
      if (data.js) {
        this.loadCode(data.js);
        this.loadJSHINT(data.js);
      }
      if (data.config) {
        // TODO: have config class do validation and error handling
        this.config = JSON.parse(data.config);
      }
    } catch (err) {
      // When does this happen?
      this.errors.push(err);
    }
    return this;
  }

  // Add a link to the view. Used when parsing the view.
  addLink(link: any) {
    var linkFn = function () {
      var args = Array.prototype.slice.call(arguments);
      var action = new LinkAction({
        path: link.path,
        args: args,
        type: link.type,
        ondismiss: link.ondismiss
      });
      return action;
    };
    this.links[link.name] = link;
    this.link_functions[link.name] = linkFn;

    return link;
  }

  addInferredLink(link: any) {
    this.inferredLinks[link.path] = link;
  }

  getInferredLinks() {
    var self = this;
    var links = {} as any;

    const TYPE_MAP: { [index: string]: string } = {
      link: 'normal',
      dismiss: 'dismiss'
    };

    if (this.code != null) {
      // TODO: better place for this
      // TODO: cache this
      var code = stripCodeComments(this.code);
      var LINK_INFER = /(link|dismiss)\.([\w.]+)/g;
      while (true) {
        var match = LINK_INFER.exec(code);
        if (match == null) {
          break;
        }
        var type = TYPE_MAP[match[1]];
        var path = match[2];
        if (path) {
          path = path.replace(/\./g, '/');
        }
        links[path] = {
          type: type,
          path: path,
          inferred: true
        };
      }
    }

    Object.keys(this.inferredLinks).forEach(function (linkPath: string) {
      links[linkPath] = self.inferredLinks[linkPath];
    });
    // Actual links overrides any inferred links.
    Object.keys(this.links).forEach(function (name) {
      links[name] = self.links[name];
    });

    return links;
  }

  dataURI(path: string, mime: string) {
    if (this.app) {
      return this.app.dataURI(path, mime);
    } else {
      return null;
    }
  }

  resourceData(path: string) {
    if (this.app) {
      return this.app.resourceData(path);
    } else {
      return null;
    }
  }

  toJSON() {
    // Only view variables and links at the moment
    const vars = this.type.toJSON();
    return {
      onBack: this.onBack,
      onNavigate: this.onNavigate,
      variables: this.type.toJSON(),
      parameters: this.parameters.map(function (param: any) {
        return param.name;
      }),
      links: this.links
    };
  }

  // Load the JavaScript code into the view.
  loadCode(code: string) {
    this.code = code;
  }

  loadJSHINT(jsString: string) {
    // No-op; kept for backwards-compatibility
  }

  // Given an XML string, parse a view
  loadXml(
    xmlString: string,
    options: {
      apiVersion?: ParseVersion;
      recordReferences?: boolean;
      recordSource?: boolean;
      componentBank?: ComponentParserBank;
    }
  ) {
    options = options || {};
    const apiVersion = options.apiVersion || DEFAULT;
    const recordReferences = options.recordReferences || false;
    if (this.path === 'nav') {
      const parsed = parse(xmlString, {
        componentBank: options.componentBank
      });
      // Make sure that this.errors (a) is an array and (b) doesn't have null values
      this.errors = [].concat(parsed.errors).filter((v) => v);
      return this;
    } else {
      const myParser = viewParser.parser(this, {
        version: apiVersion,
        recordReferences: recordReferences,
        componentBank: options.componentBank,
        recordSource: options.recordSource
      });
      myParser.parse(xmlString);
      if (recordReferences) {
        this.fieldReferences = myParser.fieldReferences;
      }

      this.errors = this.errors.concat(myParser.getErrors());
      return this;
    }
  }
}

/**
 * Remove simple "//" comments from code string (does not support block comments)
 * @returns Code with simple comments removed.
 */
export function stripCodeComments(code: string) {
  if (!code) {
    return code; // safety check
  }
  var codeLines = [] as string[];
  // lines starting with any number of whitespace and then a double slash, e.g. "//" or " //"
  var COMMENT = /^\s*\/\/.*$/;
  code.split('\n').forEach(function (line) {
    if (!COMMENT.test(line)) {
      codeLines.push(line);
    }
  });
  return codeLines.join('\n');
}

// New link action with the specified path and args.
// args is a sequential array of values
export class LinkAction {
  path: string;
  args: any[];
  type: string;
  dismiss: boolean;
  ondismiss: string;
  options: any;

  constructor(data: any) {
    this.path = data.path;
    let args = data.args;
    if (args == null) {
      args = [];
    }
    this.args = args;
    this.type = data.type;
    this.dismiss = this.type == 'dismiss';
    this.ondismiss = data.ondismiss;
    this.options = data.options || {};
  }
}

export class DialogAction {
  title: string;
  body: string;

  constructor(title: string, body: string) {
    this.title = title;
    this.body = body;
  }

  perform(state: any) {
    return state.showDialog(this);
  }
}

export class ViewType extends Type {
  constructor() {
    super('view');
  }

  toJSON() {
    let result = {} as any;
    for (let key of Object.keys(this.attributes)) {
      result[key] = this.attributes[key].toJSON();
    }
    return result;
  }
}

export const parser = viewParser.parser;
export const jsonParser = parserUtils.jsonParser;
