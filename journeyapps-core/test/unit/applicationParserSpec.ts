import * as blackmontapp from '../../src/app/index';
import { Version } from '@journeyapps/parser-common';
import '@journeyapps/core-xml/domparser';
const applicationXml = require('../fixtures/application.xml').default;
const applicationMinimalXml = require('../fixtures/application-minimal.xml').default;

describe('application XML parsing', function () {
  var parse = blackmontapp.applicationParser.parse;

  it('should parse full xml', function () {
    var info = parse(applicationXml);

    expect(info.name).toBe('embark-demos-and-testing-components');
    expect(info.label).toBe('Components 123');
    expect(info.description).toBe('Component testing');
    expect(info.mobileUserType).toBe('worker');
    expect(info.apiVersion instanceof Version).toBe(true);
    expect(info.apiVersion.toString()).toBe('2.6');
    expect(info.updateUrlAndroid).toBe('http://embark.mobi/android');
    expect(info.updateUrlIOS).toBe('http://embark.mobi/ios');
    expect(info.minimumVersionAndroid instanceof Version).toBe(true);
    expect(info.minimumVersionAndroid.toString()).toBe('3.16.2');
    expect(info.minimumVersionIOS instanceof Version).toBe(true);
    expect(info.minimumVersionIOS.toString()).toBe('1.8.0');
    expect(info.protectionType).toBe('password');
    expect(info.protectionTimeout).toBe(24);
  });

  it('should parse a minimal xml', function () {
    var info = parse(applicationMinimalXml);

    expect(info.name).toBe('embark-demos-and-testing-components');
    expect(info.label).toBe('Components 123');
    expect(info.description).toBe(null);
    expect(info.mobileUserType).toBe('worker');
    expect(info.apiVersion instanceof Version).toBe(true);
    expect(info.apiVersion.toString()).toBe('1.0');
    expect(info.updateUrlAndroid).toBe(null);
    expect(info.updateUrlIOS).toBe(null);
    expect(info.minimumVersionAndroid).toBe(null);
    expect(info.minimumVersionIOS).toBe(null);
    expect(info.protectionType).toBe(null);
    expect(info.protectionTimeout).toBe(null);
  });
});
