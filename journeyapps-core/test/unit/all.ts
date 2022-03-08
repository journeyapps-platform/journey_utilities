if (typeof window !== 'object') {
  (global as any).window = global;
  ((global as any).window as any).navigator = {};
}
import '@journeyapps/core-test-helpers';

import './applicationParserSpec';
import './evaluatorSpec';
import './globalviewSpec';
import './syncRules1Spec';
import './syncRules2Spec';
import './viewSpec';
