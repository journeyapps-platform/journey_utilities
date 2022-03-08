// Parse application.xml

import * as xml from '@journeyapps/core-xml';
import { Version } from '@journeyapps/parser-common';

export function parse(rawxml: string) {
  const xmlDoc = xml.parse(rawxml);
  const root = xmlDoc.documentElement;

  if (root == null || root.tagName != 'application') {
    throw new Error('No valid application root');
  }

  let appInfo = {
    name: xml.childContent(root, 'name'),

    label: xml.childContent(root, 'label'),
    description: xml.childContent(root, 'description'),
    mobileUserType: xml.childContent(root, 'mobile_user'),
    apiVersion: parseVersion(xml.childContent(root, 'api'), '1.0'),
    updateUrlIOS: xml.childContent(root, 'update-url-ios'),
    updateUrlAndroid: xml.childContent(root, 'update-url-android'),
    minimumVersionIOS: parseVersion(xml.childContent(root, 'minimum-version-ios'), null),
    minimumVersionAndroid: parseVersion(xml.childContent(root, 'minimum-version-android'), null),

    protectionType: null as string,
    protectionTimeout: null as number
  };

  const protectionElement = xml.childNode(root, 'protection');
  if (protectionElement != null) {
    appInfo.protectionType = xml.childContent(protectionElement, 'type');
    var timeout = parseInt(xml.childContent(protectionElement, 'timeout'), 10);
    if (timeout != null && !isNaN(timeout)) {
      appInfo.protectionTimeout = timeout;
    }
  }

  return appInfo;
}

function parseVersion(source: string, defaultVersion: string): Version {
  if (source == null && defaultVersion == null) {
    return null;
  } else if (source == null) {
    return new Version(defaultVersion);
  } else {
    return new Version(source);
  }
}
