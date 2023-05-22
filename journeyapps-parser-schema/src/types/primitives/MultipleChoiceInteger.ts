import { ChoiceType } from './ChoiceType';

export class MultipleChoiceIntegerType extends ChoiceType {
  static TYPE = 'multiple-choice-integer';

  constructor() {
    super(MultipleChoiceIntegerType.TYPE, { multiple: true });
  }

  setOptionLabels(labels: string[]) {
    this.options = {};
    for (let i = 0; i < labels.length; i++) {
      this.addOption(i, labels[i], i);
    }
  }
}
