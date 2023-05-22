import { ChoiceType } from './ChoiceType';

export class SingleChoiceType extends ChoiceType {
  static TYPE = 'single-choice';

  constructor() {
    super(SingleChoiceType.TYPE, { multiple: false });
  }
}
