import * as xml from '@journeyapps/core-xml';
import * as evaluator from '@journeyapps/evaluator';
import { ComponentParserBank, ParseErrors } from '@journeyapps/parser-common';
import { parseElement } from '../util/parserUtils';
import { XMLError } from '@journeyapps/domparser/types';

const getAttribute = xml.getAttribute;

// TODO: whitelist ionicons?
const menuItemElement = {
  item: {
    label: xml.attribute.label,
    'on-press': xml.attribute.notBlank,
    indicator: xml.attribute.notBlank,
    icon: xml.attribute.notBlank,
    type: xml.attribute.optionList(['custom', 'messages'])
  }
};

const menuLogoElement = {
  logo: {
    src: xml.attribute.notBlank
  }
};

const syncSpinnerElement = {
  'sync-spinner': {
    disabled: xml.attribute.notBlank
  }
};

const menuElement = {
  menu: {
    disabled: xml.attribute.notBlank
  }
};

const notificationsElement = {
  notifications: {
    indicator: xml.attribute.notBlank
  }
};

export function parse(xmlString: string, options?: { componentBank?: ComponentParserBank }) {
  const xmlDoc = xml.parse(xmlString);

  let exports = {
    parsed: {
      notifications: null as { indicator?: string },
      nav: null as {
        menu: {
          items: any[];
          logo?: { src?: string };
          disabled?: boolean;
        };
        syncSpinner?: {
          disabled?: boolean;
        };
      }
    },
    errors: xmlDoc.errors || ([] as (XMLError | xml.ValidationError)[])
  };
  if (exports.errors.length > 0) {
    // Fail fast if the xml document is invalid
    return exports;
  }

  let errorHandler = new ParseErrors();

  const root = xmlDoc.documentElement;
  const notifications = xml.children(root, 'notifications')[0];
  if (notifications) {
    parseElement(notifications, notificationsElement, errorHandler);

    exports.parsed.notifications = {
      indicator: notifications.getAttribute('indicator')
    };
  }
  const nav = xml.children(root, 'nav')[0];
  const menu = xml.children(nav, 'menu')[0];
  let menuDisabled = false;
  if (menu) {
    parseElement(menu, menuElement, errorHandler);
    menuDisabled = getAttribute(menu, 'disabled') == 'true';
  }

  exports.parsed.nav = {
    menu: {
      items: [],
      logo: null,
      disabled: menuDisabled
    }
  };

  // Sync spinner
  let syncSpinner = xml.children(nav, 'sync-spinner')[0];
  if (syncSpinner) {
    parseElement(syncSpinner, syncSpinnerElement, errorHandler);
    exports.parsed.nav.syncSpinner = {
      disabled: getAttribute(syncSpinner, 'disabled') == 'true'
    };
  }

  xml.children(menu, 'item').forEach(function (menuItem) {
    parseElement(menuItem, menuItemElement, errorHandler);

    const item = {
      type: getAttribute(menuItem, 'type'),
      label: getAttribute(menuItem, 'label'),
      onpress: getAttribute(menuItem, 'on-press'),
      icon: getAttribute(menuItem, 'icon'),
      indicator: null as string
    };
    if (getAttribute(menuItem, 'indicator')) {
      item.indicator = getAttribute(menuItem, 'indicator');
      const token = evaluator.functionTokenExpression(item.indicator, false);
      if (token === null) {
        errorHandler.pushError(
          xml.attributeNode(menuItem, 'indicator') || menuItem,
          'invalid function token expression'
        );
      }
    }

    exports.parsed.nav.menu.items.push(item);
  });

  xml.children(menu, 'logo').forEach(function (logoItem) {
    parseElement(logoItem, menuLogoElement, errorHandler);
    exports.parsed.nav.menu.logo = {
      src: getAttribute(logoItem, 'src')
    };
  });

  exports.errors = exports.errors.concat(errorHandler.getErrors());

  return exports;
}
