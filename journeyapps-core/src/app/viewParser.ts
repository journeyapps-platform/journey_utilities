import { FormatString } from '@journeyapps/evaluator';
import * as evaluator from '@journeyapps/evaluator';
import * as xml from '@journeyapps/core-xml';
import * as schema from '@journeyapps/parser-schema';
import { ObjectType, QueryType, Type, NestedType, ParseVersion, Variable } from '@journeyapps/parser-schema';
import { ParseErrors } from '@journeyapps/parser-common';
import {
  Component,
  ComponentAction,
  ComponentEnumOption,
  LayoutColumn,
  LayoutSection,
  SidebarItem,
  View
} from './view';
import {
  checkForBooleanToPrimitive,
  parseShowHide,
  validateBinding,
  parseElement,
  inferOnPress,
  parseVariables,
  validateViewElementOrder,
  parseLinks
} from '../util/parserUtils';
import { Formatter } from '../util/Formatter';
import { XMLElement } from '@journeyapps/domparser/types';
import { ComponentParserBank, ComponentParseEvent } from '@journeyapps/parser-common';
const { getAttribute } = xml;

// This list specifies the *allowed* attributes on components, along with validations for those attributes.
// This only applies to top-level components, not to e.g. columns or sidebar.
const attributeMap2 = {
  default: {
    // These are allowed on all components
    label: xml.attribute.notBlank,
    id: xml.attribute.id,
    bind: xml.attribute.notBlank, // TODO: this should return the binding type
    required: xml.attribute.optionList(['true', 'false']),
    'show-if': xml.attribute.notBlank,
    'hide-if': xml.attribute.notBlank
  },
  table: {
    headingLabel: xml.attribute.notBlank, // deprecated?
    headingValue: xml.attribute.notBlank // deprecated?
  },
  columns: {},
  date: {
    'on-change': xml.attribute.notBlank
  },
  datetime: {
    'on-change': xml.attribute.notBlank
  },
  html: {
    id: xml.attribute.notBlank,
    src: xml.attribute.path,
    height: xml.attribute.notBlank,
    'show-fullscreen-button': xml.attribute.optionListWithFunctions(
      ['true', 'false'],
      evaluator.FunctionTokenExpression.PREFIX
    )
  },
  sidebar: {
    items: xml.attribute.any,
    'visible-on-mobile': xml.attribute.optionList(['true', 'false'])
  },
  card: {}
};

const attributeMap3 = {
  default: {
    // These are allowed on all components
    label: xml.attribute.label,
    bind: xml.attribute.notBlank,
    required: xml.attribute.optionListWithFunctions(['true', 'false'], evaluator.FunctionTokenExpression.PREFIX),
    'show-if': xml.attribute.notBlank,
    'hide-if': xml.attribute.notBlank
  },
  row: {
    // TODO: this should only be valid inside a table
    value: xml.attribute.label
  },
  'power-bi': {
    config: xml.attribute.notBlank,
    'on-interaction': xml.attribute.notBlank,
    height: xml.attribute.notBlank,
    'show-scroll-button': xml.attribute.optionListWithFunctions(
      ['true', 'false'],
      evaluator.FunctionTokenExpression.PREFIX
    ),
    'show-fullscreen-button': xml.attribute.optionListWithFunctions(
      ['true', 'false'],
      evaluator.FunctionTokenExpression.PREFIX
    )
  },
  columns: {},
  'datetime-input': {
    'on-change': xml.attribute.notBlank,
    disabled: xml.attribute.any,
    'time-format': xml.attribute.optionListWithFunctions(['24h', '12h'], evaluator.FunctionTokenExpression.PREFIX),
    'placeholder-date': xml.attribute.label,
    'placeholder-time': xml.attribute.label,
    'modifier-text': xml.attribute.label
  },
  html: {
    id: xml.attribute.notBlank,
    src: xml.attribute.path,
    height: xml.attribute.notBlank,
    'show-fullscreen-button': xml.attribute.optionListWithFunctions(
      ['true', 'false'],
      evaluator.FunctionTokenExpression.PREFIX
    )
  },
  'object-list': {
    query: xml.attribute.notBlank,
    'on-change': xml.attribute.notBlank,
    'empty-message': xml.attribute.label,
    display: xml.attribute.label
  },
  'object-repeat': {
    query: xml.attribute.notBlank,
    as: xml.attribute.notBlank,
    _required: ['as']
  },
  sidebar: {
    position: xml.attribute.optionListWithFunctions(['left', 'right'], evaluator.FunctionTokenExpression.PREFIX),
    items: xml.attribute.any,
    'visible-on-mobile': xml.attribute.optionList(['true', 'false'])
  },
  card: {},
  'context-menu': {}
};

export const SUPPORTED_COMPONENT_TAGS = Object.keys(attributeMap3).filter((tag) => tag != 'default');

const v3typeMap: { [newComponent: string]: string } = {
  'datetime-input': 'datetime'
};

export const linkElement = {
  link: {
    name: xml.attribute.name,
    path: xml.attribute.notBlank,
    type: xml.attribute.optionList(['normal', 'dismiss']),
    ondismiss: xml.attribute.notBlank
  }
};

const baseEditElement = {
  value: xml.attribute.any,
  'on-change': xml.attribute.any,
  disabled: xml.attribute.any
};

const editElement = {
  'edit-select': Object.assign(baseEditElement, {
    options: xml.attribute.any
  }),
  'edit-date': baseEditElement,
  'edit-datetime': baseEditElement,
  'edit-number': baseEditElement,
  'edit-text': baseEditElement,
  'edit-boolean': baseEditElement
};

export const argElement = {
  arg: {
    bind: xml.attribute.notBlank
  }
};

const sidebarItemElement = {
  item: {
    label: xml.attribute.label,
    state: xml.attribute.any,
    icon: xml.attribute.path,
    'icon-color': xml.attribute.notBlank,
    'on-press': xml.attribute.notBlank,
    'on-press-icon': xml.attribute.path,
    'show-if': xml.attribute.notBlank,
    'hide-if': xml.attribute.notBlank,
    validate: xml.attribute.optionListWithFunctions(['true', 'false'], evaluator.FunctionTokenExpression.PREFIX)
  }
};

const cardInfoElement = {
  header: {
    'show-if': xml.attribute.notBlank,
    'hide-if': xml.attribute.notBlank
  },
  footer: {
    'show-if': xml.attribute.notBlank,
    'hide-if': xml.attribute.notBlank
  },
  content: {
    'show-if': xml.attribute.notBlank,
    'hide-if': xml.attribute.notBlank
  }
};

const cardAccentElement = {
  accent: {
    label: xml.attribute.label,
    color: xml.attribute.any
  }
};

export function parser(
  view: View,
  options?: {
    version?: ParseVersion;
    recordReferences?: boolean;
    recordSource?: boolean;
    componentBank?: ComponentParserBank;
  }
) {
  let errorHandler = new ParseErrors();

  let fieldReferences: {
    type: string;
    isPrimitiveType: boolean;
    name: string;
  }[][] = [];

  options = options || {};

  let tag: {
    root: string;
    inverseOf: string;
    belongsTo: string;
    hasMany: string;
    field: string;
    onPress: string;
  };

  let description: {
    field: string;
  };

  let attributeMap: typeof attributeMap2 | typeof attributeMap3;
  var version = options.version || {};
  var v3 = version.v3 === true;
  var v3d1 = version.v3_1 === true;

  var recordReferences = options.recordReferences || false;
  const recordSource = options.recordSource || false;
  var schemaParser = schema.parser(view.schema, options);

  let fmt = new Formatter(errorHandler, recordReferences, fieldReferences);

  if (!v3) {
    attributeMap = attributeMap2;
    tag = {
      root: 'schema',
      inverseOf: 'inverse_of',
      belongsTo: 'belongs_to',
      hasMany: 'has_many',
      field: 'attribute',
      onPress: 'onpress'
    };
    description = {
      field: 'Attribute'
    };
  } else {
    attributeMap = attributeMap3;
    tag = {
      root: 'data-model',
      inverseOf: 'inverse-of',
      belongsTo: 'belongs-to',
      hasMany: 'has-many',
      field: 'field',
      onPress: 'on-press'
    };
    description = {
      field: 'Field'
    };
  }

  var componentTags = Object.keys(attributeMap);

  // append V5 components
  if (options && options.componentBank) {
    componentTags = componentTags.concat(
      Object.keys(options.componentBank.components).filter((value) => {
        return componentTags.indexOf(value) === -1;
      })
    );
  }

  componentTags = componentTags.filter(function (tagName: string) {
    // Don't parse 'sidebar' and 'default' as components
    return tagName != 'default' && tagName != 'sidebar' && tagName != 'navigation';
  });

  // The number indicates the expected order
  var allowedViewElements: { [tag: string]: number } = {
    param: 1,
    var: 2,
    link: 3,
    sidebar: 4
  };
  var allowedColumnElements: { [tag: string]: number } = {};
  var allowedRepeatElements: { [tag: string]: number } = {};

  componentTags.forEach(function (componentName) {
    allowedViewElements[componentName] = 4;
    allowedColumnElements[componentName] = 4;
    allowedRepeatElements[componentName] = 4;
  });

  var optionDef = {
    option: { key: xml.attribute.notBlank, _required: ['key'] }
  };

  // TODO: dedup with schemaParser?
  function loadIntegerOptions(element: XMLElement, scopeType: Type) {
    let componentOptions: ComponentEnumOption[] = [];
    xml.children(element, 'option').forEach(function (e) {
      parseElement(e, optionDef, errorHandler);
      const keyText = getAttribute(e, 'key');
      const key = keyText == null ? 0 : parseInt(keyText, 10);
      const label = fmt.formatText(e, scopeType);
      componentOptions.push({ key: key, label: label });
    });
    return componentOptions;
  }

  function loadStringOptions(element: XMLElement, scopeType: Type) {
    let componentOptions: ComponentEnumOption[] = [];
    xml.children(element, 'option').forEach(function (e) {
      parseElement(e, optionDef, errorHandler);
      var key = getAttribute(e, 'key');
      var label = fmt.formatText(e, scopeType);
      componentOptions.push({ key: key, label: label });
    });
    return componentOptions;
  }

  function loadBooleanOptions(element: XMLElement, scopeType: Type) {
    const BOOLEAN_KEYS: { [key: string]: boolean } = {
      true: true,
      false: false
    };
    let componentOptions: ComponentEnumOption[] = [];
    xml.children(element, 'option').forEach(function (e) {
      parseElement(e, optionDef, errorHandler);
      var keyText = getAttribute(e, 'key');
      var key = BOOLEAN_KEYS[keyText];
      var label = fmt.formatText(e, scopeType);
      if (key != null) {
        componentOptions.push({ key: key, label: label });
      } else {
        errorHandler.pushError(xml.attributeNode(e, 'key') || e, 'key must be "true" or "false"');
      }
    });
    return componentOptions;
  }

  let htmlComponents: { [id: string]: XMLElement } = {};
  const emptyContextMenu = xml.parse('<context-menu/>').documentElement;

  function parse(xmlString: string) {
    var xmlDoc = xml.parse(xmlString);
    view.errors = xmlDoc.errors || [];
    if (view.errors.length > 0) {
      // Stop parsing right here, and keep the previous version we parsed.
      return;
    }

    view.reset();

    var root = xmlDoc.documentElement;
    if (recordSource) {
      view.sourceElement = root;
    }

    // Validate order of children
    validateViewElementOrder(root, allowedViewElements, errorHandler);

    // Parse parameters and variables
    parseVariables(root, view, schemaParser, errorHandler);

    // Links
    parseLinks(root, view, errorHandler);

    view.title = fmt.format(root, 'title', view.type);
    view.onBack = getAttribute(root, 'on-back');
    view.onNavigate = getAttribute(root, 'on-navigate');

    view.mode = getAttribute(root, 'mode');

    // Sidebar
    parseSidebar(root, view.type);

    // Components
    view.components = [];

    xml.children(root, componentTags).forEach(function (e) {
      var component = parseComponent(e, view.type);
      if (component.type === 'context-menu') {
        view.contextMenu = component;
      } else {
        component._parent = view;
        view.components.push(component);
      }
    });

    if (v3d1 && !view.contextMenu) {
      view.contextMenu = parseComponent(emptyContextMenu, view.type);
    }

    view.sections = buildSections(view.components);
    view.hasColumns = view.sections.length > 1 || (view.sections.length > 0 && view.sections[0].layout == 'double');
  }

  function parseSidebar(root: XMLElement, scopeType: Type) {
    var sidebar = xml.children(root, 'sidebar')[0];
    view.hasSidebar = sidebar != null;
    var hasIcons = false;
    var items: SidebarItem[] = [];
    var position = sidebar ? getAttribute(sidebar, 'position') : null;
    var itemsFunction = sidebar ? getAttribute(sidebar, 'items') : null;
    var visibleOnMobile = sidebar ? getAttribute(sidebar, 'visible-on-mobile') === 'true' : false;
    var forceShow = sidebar ? getAttribute(sidebar, 'hidden-feature-force-always-show') == 'true' : false;

    var sidebarItems = xml.children(sidebar, 'item');
    if (itemsFunction !== null && sidebarItems.length > 0) {
      errorHandler.pushError(sidebar, "The sidebar cannot have children if its 'items' attribute is set");
    }

    sidebarItems.forEach(function (element) {
      parseElement(element, sidebarItemElement, errorHandler);
      let item: SidebarItem = {
        state: getAttribute(element, 'state'),
        onpress: getAttribute(element, tag.onPress),
        onpressIcon: getAttribute(element, 'on-press-icon'),
        icon: fmt.format(element, 'icon', view.type),
        iconColor: getAttribute(element, 'icon-color'),
        label: fmt.formatText(element, view.type),
        validate: getAttribute(element, 'validate')
      };
      parseShowHide(element, item, scopeType, errorHandler);
      items.push(item);
      if (item.icon != null) {
        hasIcons = true;
      }
    });
    view.sidebar = {
      sidebarItems: items,
      generateItems: itemsFunction,
      visibleOnMobile: visibleOnMobile,
      hasIcons: hasIcons,
      position: position,
      forceShow: forceShow,
      type: 'sidebar'
    };
  }

  // Return an array of sections.
  // Each section has:
  //   layout: single, double
  //   columns: array of:
  //     label: column label
  //     components: an array of components
  function buildSections(components: Component[]) {
    var sections: LayoutSection[] = [];

    var currentSection: LayoutSection = null;

    function pushSection() {
      if (currentSection && currentSection.columns[0].components.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        layout: 'single',
        columns: [
          {
            label: null,
            components: []
          }
        ]
      };
    }

    pushSection();

    for (var i = 0; i < components.length; i++) {
      currentSection.columns[0].components.push(components[i]);
    }

    pushSection();

    return sections;
  }

  // Parse a single component and its children.
  function parseComponent(element: XMLElement, scopeType: Type) {
    if (scopeType == null) {
      scopeType = view.type;
    }

    const originalType = element.tagName;
    let type: string;
    if (v3 && originalType in v3typeMap) {
      type = v3typeMap[originalType];
    } else {
      type = originalType;
    }
    // Some common properties
    let component: Component & { [key: string]: any } = {
      type: type
    };

    if (recordSource) {
      component._sourceElement = element;
    }

    const bind = getAttribute(element, 'bind');
    if (bind) {
      component.bind = bind;
    }

    let bindingVar;

    if (component.bind) {
      component.bind = component.bind.replace(/\?/g, '');

      bindingVar = scopeType.getVariable(component.bind);
      component.bindingType = bindingVar == null ? null : bindingVar.type;

      if (component.bindingType == null) {
        errorHandler.pushError(xml.attributeNode(element, 'bind'), 'Undefined variable ' + component.bind);
      }
      if (recordReferences) {
        // We are interested in the type and name of the final two variables in the expression
        var arrayOfTypes = view.type.getVariableTypeAndNameWithParent(component.bind);
        fieldReferences.push(arrayOfTypes);
      }
    }

    // parse it after the binding has been done
    if (options.componentBank) {
      let parser = options.componentBank.getComponent(type);
      if (!!parser) {
        parser.setView(view);
        // Add binding info if non-null
        if (bindingVar != null) {
          component.bindingInfo = { ...bindingVar };
        }
        const event = new ComponentParseEvent();
        event.component = component;
        event.element = element;
        event.helper = {
          checkForBooleanToPrimitive: (val) => {
            return checkForBooleanToPrimitive(val);
          },
          formatAttribute(
            element: XMLElement,
            value: string,
            scopeType: Type,
            checkRawTokenExpression?: boolean
          ): FormatString | null {
            return fmt.format(element, value, scopeType, checkRawTokenExpression);
          },
          inferOnPress(onPress: string): any {
            inferOnPress(onPress, view);
          },
          pushError(element: XMLElement, message: string, type?: xml.ErrorType): void {
            errorHandler.pushError(element, message, type);
          },
          formatContent(element: XMLElement, scopeType: Type): FormatString | null {
            return fmt.formatText(element, scopeType);
          },
          parseElement(element: XMLElement, definitions: any) {
            return parseElement(element, definitions, errorHandler);
          },
          parseComponent(element: XMLElement, type: Type) {
            return parseComponent(element, scopeType);
          },
          validateBinding: (element: XMLElement, attr: string, allowFunctionBinding: boolean, scopes: Type) => {
            validateBinding(element, attr, allowFunctionBinding, scopes, errorHandler);
          }
        };
        event.scope = scopeType;

        // actually parse the datas
        try {
          parser.parse(event);
        } catch (ex) {
          console.error('Exception while parsing', ex);
        }

        return component;
      }
    }

    parseElement(element, attributeMap, errorHandler);

    var labelString = getAttribute(element, 'label');

    if (labelString === '') {
      component.label = null;
    } else if (labelString != null) {
      component.label = fmt.format(element, 'label', scopeType);
    } else if (bindingVar != null && v3d1) {
      component.label = evaluator.formatString(bindingVar.label);
    } else {
      component.label = null;
    }

    parseShowHide(element, component, scopeType, errorHandler);

    if (getAttribute(element, 'id')) {
      component.id = getAttribute(element, 'id');
    }

    const required = getAttribute(element, 'required');
    if (required == 'true') {
      component.required = true;
    } else if (required == 'false') {
      component.required = false;
    } else if (required) {
      const token = evaluator.functionTokenExpression(required, false);
      if (token == null) {
        errorHandler.pushError(element, 'Invalid required');
      } else {
        // Valid
        component.required = required;
      }
    }

    // Component-specific properties
    if (type == 'columns') {
      errorHandler.pushErrors(xml.validateChildren(element, { column: 1 }));

      component.columns = [];
      xml.children(element, 'column').forEach(function (columnEl) {
        errorHandler.pushErrors(xml.validateChildren(columnEl, allowedColumnElements));

        var column: LayoutColumn = {
          components: [] as Component[],
          label: fmt.format(columnEl, 'label', scopeType),
          hasLabel: false
        };
        if (column.label && column.label.expression.length > 0) {
          column.hasLabel = true;
        }

        // We recursively parse the children of the column
        xml.children(columnEl, componentTags).forEach(function (e) {
          var inner = parseComponent(e, scopeType);
          column.components.push(inner);
        });
        (component.columns as LayoutColumn[]).push(column);
      });
    }

    if (type == 'datetime') {
      if (element.hasAttribute('time-format')) {
        component.timeFormat = getAttribute(element, 'time-format');
      }
    }

    if (type == 'datetime' || type == 'object-list') {
      if (element.hasAttribute('on-change')) {
        component.onChange = getAttribute(element, 'on-change');
      }
    }

    if (type == 'html') {
      const NO_ID = `noid:`;
      const toId = (id: string) => `id:${id}`;
      const toNoId = (counter: number) => `${NO_ID}${counter}`;
      const htmlComponentsKeys = Object.keys(htmlComponents || {});

      let htmlID = getAttribute(element, 'id') || null;
      if (htmlComponentsKeys.length > 0) {
        // There is already at least 1 HTML component registered

        // In order not to break older apps, we only enforce IDs when there are:
        // - multiple HTML elements of which
        // - at least one has an ID set
        const shouldEnforceIDs =
          htmlComponentsKeys.some((key) => {
            return !key.startsWith(NO_ID);
          }) || htmlID;

        if (shouldEnforceIDs) {
          for (let thisKey of htmlComponentsKeys) {
            if (thisKey.startsWith(NO_ID)) {
              errorHandler.pushError(
                htmlComponents[thisKey],
                `If some HTML component has an ID, every HTML component must have an ID`
              );
            }
            if (thisKey && thisKey === toId(htmlID)) {
              errorHandler.pushError(element, `HTML component IDs must be unique`);
            }
          }
          if (!htmlID) {
            errorHandler.pushError(element, `If some HTML component has an ID, every HTML component must have an ID`);
          }
        }
      }

      component.id = htmlID;
      component.src = fmt.format(element, 'src', scopeType);
      component.showFullscreenButton = getAttribute(element, 'show-fullscreen-button') || null;
      component.height = getAttribute(element, 'height') || null;

      htmlComponents[htmlID ? toId(htmlID) : toNoId(htmlComponentsKeys.length + 1)] = element;
    }

    if (type == 'datetime') {
      if (getAttribute(element, 'placeholder-date') != null) {
        component.placeholderDate = fmt.format(element, 'placeholder-date', scopeType);
      }
      if (getAttribute(element, 'placeholder-time') != null) {
        component.placeholderTime = fmt.format(element, 'placeholder-time', scopeType);
      }
    }
    if (type == 'datetime') {
      if (getAttribute(element, 'modifier-text') != null) {
        component.modifierText = fmt.format(element, 'modifier-text', scopeType);
      }
      if (getAttribute(element, 'disabled') != null) {
        component.disabled = getAttribute(element, 'disabled');
        validateBinding(element, 'disabled', true, scopeType, errorHandler);
      }
    }

    if (type == 'card') {
      component.header = null;
      component.footer = null;
      component.accent = null;
      component.cardContent = null;
      component.action = null;
      xml.children(element, 'accent').forEach(function (accentElement) {
        parseElement(accentElement, cardAccentElement, errorHandler);
        component.accent = {
          label: fmt.format(accentElement, 'label', scopeType),
          color: getAttribute(accentElement, 'color')
        };
      });
      xml.children(element, 'header').forEach(function (headerElement) {
        var parsedHeader = parseElement(headerElement, cardInfoElement, errorHandler);
        component.header = {
          value: fmt.formatText(headerElement, scopeType)
        };
      });
      xml.children(element, 'footer').forEach(function (footerElement) {
        var parsedFooter = parseElement(footerElement, cardInfoElement, errorHandler);
        component.footer = {
          value: fmt.formatText(footerElement, scopeType)
        };
      });
      xml.children(element, 'content').forEach(function (contentElement) {
        var parsedContent = parseElement(contentElement, cardInfoElement, errorHandler);
        component.cardContent = {
          value: fmt.formatText(contentElement, scopeType)
        };
      });
      xml.children(element, 'action').forEach(function (actionElement) {
        var action: ComponentAction<string> = {
          label: getAttribute(actionElement, 'label'),
          onpress: actionElement.getAttribute(tag.onPress)
        };
        var validate = getAttribute(actionElement, 'validate');
        var iconName = getAttribute(actionElement, 'icon');
        if (iconName) {
          action.icon = iconName;
        }
        component.action = action;
        component.validate = validate;
        inferOnPress(action.onpress, view);
      });
    }
    if (type == 'power-bi') {
      component.config = getAttribute(element, 'config') || null;
      component.onInteraction = getAttribute(element, 'on-interaction') || null;
      component.showScrollButton = getAttribute(element, 'show-scroll-button') || null;
      component.showFullscreenButton = getAttribute(element, 'show-fullscreen-button') || null;
      component.height = getAttribute(element, 'height') || null;
    }
    if (type == 'object-repeat') {
      component.collection = getAttribute(element, 'query');
      // The actual type check is done later
      component.collectionType = scopeType.getType(component.collection);
      var asName = getAttribute(element, 'as');
      component.components = [];

      if (component.collection == null) {
        errorHandler.pushError(element, 'query is required');
      } else if (component.collectionType == null) {
        errorHandler.pushError(xml.attributeNode(element, 'query'), 'Undefined variable ' + component.collection);
      } else if (!component.collectionType.isCollection) {
        errorHandler.pushError(xml.attributeNode(element, 'query'), 'query must be a query or array');
      } else {
        var nestedType = new NestedType(scopeType);
        var variable = new Variable(asName, (component.collectionType as QueryType).objectType);
        component.as = variable;
        nestedType.addAttribute(variable);
        component.scopeType = nestedType;

        errorHandler.pushErrors(xml.validateChildren(element, allowedRepeatElements));

        // We recursively parse the children of the object-repeat
        xml.children(element, componentTags).forEach(function (e) {
          var inner = parseComponent(e, nestedType);
          component.components.push(inner);
        });
      }
    }

    if (type == 'object-list') {
      // TODO: validate collection/query attribute properly
      component.collection = getAttribute(element, 'collection') || getAttribute(element, 'query');
      component.collectionType = scopeType.getType(component.collection);

      if (component.collection == null) {
        errorHandler.pushError(element, (v3 ? 'query' : 'collection') + ' is required');
      } else if (component.collectionType == null) {
        errorHandler.pushError(
          xml.attributeNode(element, v3 ? 'query' : 'collection'),
          'Undefined variable ' + component.collection
        );
      } else if (!component.collectionType.isCollection) {
        errorHandler.pushError(
          xml.attributeNode(element, v3 ? 'query' : 'collection'),
          v3 ? 'query must be a query or array' : 'collection must be a query'
        );
      }

      if (component.bindingType != null) {
        if (!(component.bindingType instanceof ObjectType)) {
          errorHandler.pushError(xml.attributeNode(element, 'bind'), 'must be bound to an object');
        } else {
          if (component.collectionType != null && component.collectionType.isCollection) {
            if (component.bindingType != (component.collectionType as QueryType).objectType) {
              errorHandler.pushError(
                xml.attributeNode(element, 'bind'),
                (v3 ? 'query' : 'collection') + ' and binding must have the same object type'
              );
            }
          }
        }
      }

      // TODO: validate emptyMessage/empty-message attribute properly
      if (getAttribute(element, 'emptyMessage') != null) {
        component.emptyMessage = fmt.format(element, 'emptyMessage', scopeType);
      } else if (getAttribute(element, 'empty-message') != null) {
        component.emptyMessage = fmt.format(element, 'empty-message', scopeType);
      } else {
        // Set empty message to null, Runtime sets to 'No data'
        component.emptyMessage = null;
      }

      component.actions = [];

      xml.children(element, 'action').forEach(function (actionElement) {
        var action: ComponentAction<string> = {
          label: getAttribute(actionElement, 'label'),
          onpress: actionElement.getAttribute(tag.onPress)
        };
        var validate = getAttribute(actionElement, 'validate');
        var iconName = getAttribute(actionElement, 'icon');
        if (iconName) {
          action.icon = iconName;
        }
        component.actions.push(action);
        component.validate = validate;
        inferOnPress(action.onpress, view);
      });

      if (component.actions.length > 0) {
        component.clickable = true;
        if (component.bind != null) {
          errorHandler.pushError(
            xml.attributeNode(element, 'bind'),
            'Binding not allowed on ' + component.type + "s containing 'action'"
          );
        }
        component.bind = null;
        component.required = false;
      }

      if (component.type === 'object-list') {
        component.display = fmt.displayFormat(element, component);
      }

      if (component.type === 'object-list') {
        errorHandler.pushErrors(xml.validateChildren(element, { action: 1 }));
      } else if (component.type == 'object-table') {
        errorHandler.pushErrors(
          xml.validateChildren(element, {
            action: 1,
            column: 1,
            'button-group': 1
          })
        );
      }
    }

    return component;
  }

  function reset() {
    errorHandler.reset();
  }

  function getErrors() {
    return errorHandler.getErrors();
  }

  return {
    parse,
    parseComponent,
    reset,
    getErrors,
    fieldReferences
  };
}
