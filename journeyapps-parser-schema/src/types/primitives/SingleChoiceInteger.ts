import { ChoiceType } from './ChoiceType';

export class SingleChoiceIntegerType extends ChoiceType {
  static readonly TYPE = 'single-choice-integer';

  constructor() {
    super(SingleChoiceIntegerType.TYPE, { multiple: false });
  }

  setOptionLabels(labels: string[]) {
    this.options = {};
    for (let i = 0; i < labels.length; i++) {
      this.addOption(i, labels[i], i);
    }
  }
}
