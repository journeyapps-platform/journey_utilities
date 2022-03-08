import { ComponentParser } from './ComponentParser';

export class ComponentParserBank {
  components: { [name: string]: ComponentParser };

  constructor() {
    this.components = {};
  }

  reset() {
    this.components = {};
  }

  registerComponent(component: ComponentParser) {
    this.components[component.options.name] = component;
  }

  getComponent(name: string): ComponentParser {
    return this.components[name];
  }
}
