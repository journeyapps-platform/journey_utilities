import { ChoiceType } from './ChoiceType';

export class MultipleChoiceType extends ChoiceType {
  static TYPE = 'multiple-choice';

  constructor() {
    super(MultipleChoiceType.TYPE, { multiple: true });
  }
}
