import { ChoiceType } from './ChoiceType';

export class SingleChoiceType extends ChoiceType {
  static readonly TYPE = 'single-choice';

  constructor() {
    super(SingleChoiceType.TYPE, { multiple: false });
  }
}
