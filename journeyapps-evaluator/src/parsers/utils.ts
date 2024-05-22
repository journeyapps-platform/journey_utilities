import { Node, isLabeledStatement } from '@babel/types';
import { FunctionTokenExpression } from '../token-expressions';

export function inFunctionExpression(node: Node): boolean {
  const parent = node.extra?.parent as Node;
  if (!parent) {
    return false;
  }
  if (isLabeledFunctionExpression(parent)) {
    return true;
  }
  return inFunctionExpression(parent);
}

export function isLabeledFunctionExpression(node: Node): boolean {
  if (!isLabeledStatement(node)) {
    return false;
  }
  return FunctionTokenExpression.PREFIX.indexOf(node.label.name) === 0;
}
