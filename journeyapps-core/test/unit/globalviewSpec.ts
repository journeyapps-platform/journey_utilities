import { globalviewParser } from '../../src/app/index';

function parse(xmlstring) {
  return globalviewParser.parse(xmlstring);
}

declare function expect(
  cond
): jasmine.Matchers<any> & {
  toHave(v);
};

describe('globalviewParser', function () {
  it('parses custom sidemenu items', function () {
    var result = parse(
      '<app><nav><menu><item label="moo" type="messages" on-press="menuClick()" indicator="$:count()" icon="ion-test" /></menu></nav></app>'
    );
    expect(result.errors).toEqual([]);
    var gv = result.parsed;

    var items = gv.nav.menu.items;
    expect(items.length).toEqual(1);
    expect(items[0].label).toEqual('moo');
    expect(items[0].type).toEqual('messages');
    expect(items[0].icon).toEqual('ion-test');
    expect(items[0].onpress).toEqual('menuClick()');
    expect(items[0].indicator).toEqual('$:count()');
  });

  it('parses disabled side menu', function () {
    var result = parse('<app><nav><menu disabled="true" /></nav></app>');
    expect(result.errors).toEqual([]);
    var gv = result.parsed;

    var menu = gv.nav.menu;
    expect(menu.disabled).toEqual(true);
  });

  it('parses sync spinner', function () {
    var result = parse('<app><nav><sync-spinner disabled="true" /></nav></app>');
    expect(result.errors).toEqual([]);
    var gv = result.parsed;

    var syncSpinner = gv.nav.syncSpinner;
    expect(syncSpinner.disabled).toEqual(true);
  });

  it('parses custom logo', function () {
    var result = parse('<app><nav><menu><logo src="my-logo" /></menu></nav></app>');
    expect(result.errors).toEqual([]);
    var gv = result.parsed;

    var logo = gv.nav.menu.logo;
    expect(logo).toHave({
      src: 'my-logo'
    });
  });

  it('parses notification behaviour', function () {
    var result = parse('<app><notifications indicator="$:totalUnreadCount()"/></app>');
    expect(result.errors).toEqual([]);
    var gv = result.parsed;
    expect(gv.notifications.indicator).toEqual('$:totalUnreadCount()');
  });
});
