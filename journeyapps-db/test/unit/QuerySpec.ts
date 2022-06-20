import { query } from '../../dist';
import * as schema from '@journeyapps/parser-schema';
import { Day } from '@journeyapps/core-date';

describe('Queries', function () {
  let scope: schema.Type;

  const one = 1;
  const blue = 'blue';
  const monday = new Date('2013-08-26T00:00:00Z');
  const tuesday = new Date('2013-08-27T00:00:00Z');
  const wednesday = new Date('2013-08-28T00:00:00Z');
  const monDay = new Day('2013-08-26');
  const tuesDay = new Day('2013-08-27');
  const wednesDay = new Day('2013-08-28');

  const peterId = 'b0b278a4-beea-11e3-b97a-e0db55d54387';

  const colour = new schema.Variable('colour', schema.primitive('text'));
  const colours = new schema.Variable('colours', schema.primitive('multiple-choice'));
  colours.type.addOption('red', 'Red', 0);
  colours.type.addOption('green', 'Green', 1);
  colours.type.addOption('blue', 'Blue', 2);
  const number = new schema.Variable('number', schema.primitive('integer'));
  const date = new schema.Variable('date', schema.primitive('date'));
  const day = new schema.Variable('day', schema.primitive('date'));
  day.type.isDay = true;
  const datetime = new schema.Variable('datetime', schema.primitive('datetime'));
  const ownerId = new schema.Variable('owner_id', schema.primitive('text'));
  const owner = new schema.Variable('owner', new schema.ObjectType());
  ownerId.relationship = 'owner';
  owner.relationship = 'owner';

  beforeEach(function() {
    scope = new schema.Type(null);
    scope.name = 'TestScope';
    scope.addAttribute(new schema.Variable('id', schema.primitive('text')));
    scope.addAttribute(new schema.Variable('make', schema.primitive('text')));
    scope.addAttribute(new schema.Variable('model', schema.primitive('text')));
    scope.addAttribute(new schema.Variable('score', schema.primitive('integer')));
    scope.addAttribute(new schema.Variable('date', schema.primitive('date')));
    scope.addAttribute(new schema.Variable('datetime', schema.primitive('datetime')));
    scope.addAttribute(day);
    scope.addAttribute(colour);
    scope.addAttribute(owner);
    scope.addAttribute(ownerId);
    scope.addAttribute(colours);
  });

  describe('Expression parsing', function() {
    function assertParses(expression, result) {
      if (typeof result == 'string') {
        expect(query.parse(scope, expression, ['?', '?', '?']).toString()).toBe(result);
      } else {
        expect(query.parse(scope, expression, ['?', '?', '?'])).toEqual(result);
      }
    }

    function assertInvalid(expression, position) {
      try {
        query.parse(scope, expression, ['?', '?', '?']);
        expect('Should have thrown an error').toBe(true as any); // HACK
      } catch (error) {
        expect(error.position).toBe(position);
        if (error.position != position) {
          expect(error.message).toBe(''); // HACK
        }
      }
    }

    it('Should parse basic expressions', function() {
      // Basic expressions
      assertParses('id = ?', 'id = ?');
      assertParses('id=?', 'id = ?');
      assertParses('id != ?', 'id != ?');
      assertParses('id!=?', 'id != ?');

      // Test the values
      const expression = query.parse(scope, 'id = ?', ['?']) as query.Operation;
      expect(expression instanceof query.Operation).toBe(true);
      expect(expression.operator).toBe('=');
      expect(expression.attribute.name).toBe('id');
      expect(expression.attribute.type.name).toBe('text');
      expect(expression.value).toBe('?');
      expect(expression.attributes()).toEqual([scope.getAttribute('id')]);

      // Starts with
      assertParses('id starts with ?', 'id starts with ?');

      // And / or

      const id = scope.getAttribute('id');
      const score = scope.getAttribute('score');

      assertParses('id = ? and score = ?', '(id = ? and score = ?)');
      assertParses(
        'id = ? and score = ?',
        new query.AndExpression([new query.Operation(id, '=', '?'), new query.Operation(score, '=', '?')])
      );

      assertParses('id = ? or score = ?', '(id = ? or score = ?)');

      assertParses(
        'id = ? or score = ?',
        new query.OrExpression([new query.Operation(id, '=', '?'), new query.Operation(score, '=', '?')])
      );

      assertParses('id = ? and score = ? or score = ?', '((id = ? and score = ?) or score = ?)');
      assertParses(
        'id = ? and score = ? or score = ?',
        new query.OrExpression([
          new query.AndExpression([new query.Operation(id, '=', '?'), new query.Operation(score, '=', '?')]),
          new query.Operation(score, '=', '?')
        ])
      );
      assertParses(
        'score = ? or score = ? and id = ?',
        new query.OrExpression([
          new query.Operation(score, '=', '?'),
          new query.AndExpression([new query.Operation(score, '=', '?'), new query.Operation(id, '=', '?')])
        ])
      );

      // Parenthesis
      assertParses('(id = ?)', 'id = ?');
      assertParses('(id starts with ?) and (score = ?)', '(id starts with ? and score = ?)');
      assertParses('id = ? and (score = ? or score = ?)', '(id = ? and (score = ? or score = ?))');
      assertParses(
        'id = ? and (score = ? or score = ?)',
        new query.AndExpression([
          new query.Operation(id, '=', '?'),
          new query.OrExpression([new query.Operation(score, '=', '?'), new query.Operation(score, '=', '?')])
        ])
      );

      assertParses('(score = ? or score = ?) and id = ?', '((score = ? or score = ?) and id = ?)');
      assertParses(
        '(score = ? or score = ?) and id = ?',
        new query.AndExpression([
          new query.OrExpression([new query.Operation(score, '=', '?'), new query.Operation(score, '=', '?')]),
          new query.Operation(id, '=', '?')
        ])
      );

      assertParses('(((((id = ?)))))', 'id = ?');

      assertParses('(((((id = ? and score > ?)))))', '(id = ? and score > ?)');

      assertParses('id=? and (score=? or score=?)', '(id = ? and (score = ? or score = ?))');
    });

    it('should handle early termination', function() {
      assertInvalid('id', 2);
      assertInvalid('id =', 4);
      assertInvalid('id = ', 5);
      assertInvalid('id = ? and', 10);
      assertInvalid('id = ? and ', 11);
      assertInvalid('id = ? or', 9);
      assertInvalid('(id = ?', 7);
    });

    it('should handle invalid start', function() {
      assertInvalid('? = id', 0);
      assertInvalid('= id ?', 0);
      assertInvalid('or id = ?', 3);
    });

    it('should handle invalid expressions', function() {
      assertInvalid('id and id', 3);
      assertInvalid('id ?', 3);
      assertInvalid('id = 1', 5);
      assertInvalid('id$ = 1', 2);
      assertInvalid('id = ?$', 5);
      assertInvalid('id =! ?', 4);
      assertInvalid('id = ? andid = ?', 7);
      assertInvalid('id=? and(score=? or score=?)', 5);
      assertInvalid('id starts  with ?', 3);
      assertInvalid('score=?or score=?', 6);
    });
  });

  describe('toOriginalExpression', function() {
    // This is relevant only for the Backend JS Console
    function assertOriginalExpression(expression: string, result: any[]) {
      expect(query.parse(scope, expression, ['1', '2', '3']).toOriginalExpression()).toEqual(result);
    }

    it('should return the original expression, with the arguments in the correct order', function() {
      assertOriginalExpression('make = ?', ['make = ?', '1']);
      assertOriginalExpression('id = ? and score = ?', ['(id = ? and score = ?)', '1', '2']);
      assertOriginalExpression('id = ? or score = ?', ['(id = ? or score = ?)', '1', '2']);
      assertOriginalExpression('id = ? and score = ? or score = ?', [
        '((id = ? and score = ?) or score = ?)',
        '1',
        '2',
        '3'
      ]);
      assertOriginalExpression('score = ? or score = ? and id = ?', [
        '(score = ? or (score = ? and id = ?))',
        '1',
        '2',
        '3'
      ]);
      assertOriginalExpression('(id = ?)', ['id = ?', '1']);
      assertOriginalExpression('(id starts with ?) and (score = ?)', ['(id starts with ? and score = ?)', '1', '2']);
      assertOriginalExpression('id = ? and (score = ? or score = ?)', [
        '(id = ? and (score = ? or score = ?))',
        '1',
        '2',
        '3'
      ]);
      assertOriginalExpression('(score = ? or score = ?) and id = ?', [
        '((score = ? or score = ?) and id = ?)',
        '1',
        '2',
        '3'
      ]);
      assertOriginalExpression('(((((id = ?)))))', ['id = ?', '1']);
      assertOriginalExpression('(((((id = ? and score > ?)))))', ['(id = ? and score > ?)', '1', '2']);
      assertOriginalExpression('id=? and (score=? or score=?)', [
        '(id = ? and (score = ? or score = ?))',
        '1',
        '2',
        '3'
      ]);

      expect(query.parse(scope, 'id = ? and score in ?', ['1', ['2', '3']]).toOriginalExpression()).toEqual(
        ['(id = ? and score in ?)', '1', ['2', '3']]
      );

      expect(query.parse(scope, 'id = ? or score in ?', ['1', ['2', '3']]).toOriginalExpression()).toEqual(
        ['(id = ? or score in ?)', '1', ['2', '3']]
      );

      expect(query.parse(scope, 'id in ? and score = ?', [['1', '2'], '3']).toOriginalExpression()).toEqual(
        ['(id in ? and score = ?)', ['1', '2'], '3']
      );

      expect(query.parse(scope, 'id in ? or score = ?', [['1', '2'], '3']).toOriginalExpression()).toEqual(
        ['(id in ? or score = ?)', ['1', '2'], '3']
      );
    });

    it('should handle TrueExpressions', function() {
      // These can't feasibly be constructed by the user at the time of writing, but we still want these to be handled correctly.
      const op = new query.Operation(number, '=', one);
      const trueExpr = new query.TrueExpression();
      expect(new query.OrExpression([trueExpr, op]).toOriginalExpression()).toEqual(['']);
      expect(trueExpr.toOriginalExpression()).toEqual(['']);
      expect(new query.AndExpression([new query.OrExpression([trueExpr])]).toOriginalExpression()).toEqual(['']);
      expect(new query.AndExpression([op, new query.OrExpression([trueExpr])]).toOriginalExpression()).toEqual([
        '(number = ?)',
        1
      ]);
    });
  });

  describe('Normalize', function() {
    function assertNormalized(expression, normalized) {
      if (typeof expression == 'string') {
        expression = query.parse(scope, expression, ['?', '?', '?', '?']);
      }
      expect(expression.normalize().toString()).toBe(normalized);
    }

    it('should normalize expressions', function() {
      assertNormalized('make = ?', '((make = ?))');
      assertNormalized('make = ? and model = ?', '((make = ? and model = ?))');
      assertNormalized('make = ? and model = ? and colour = ?', '((make = ? and model = ? and colour = ?))');
      assertNormalized('make = ? or (model = ? and colour = ?)', '((make = ?) or (model = ? and colour = ?))');
      assertNormalized(
        '(make = ? or model = ?) and colour = ?',
        '((make = ? and colour = ?) or (model = ? and colour = ?))'
      );
      assertNormalized(
        '(make = ? or model = ?) and (colour = ? or date = ?)',
        '((make = ? and colour = ?) or (make = ? and date = ?) or (model = ? and colour = ?) or (model = ? and date = ?))'
      );
      assertNormalized(
        'make = ? and (model = ? or colour = ? or date = ?)',
        '((make = ? and model = ?) or (make = ? and colour = ?) or (make = ? and date = ?))'
      );
      assertNormalized(new query.TrueExpression(), '((true))');
      assertNormalized(new query.OrExpression([new query.TrueExpression()]), '((true))');
      assertNormalized(new query.AndExpression([new query.TrueExpression()]), '((true))');
      assertNormalized(
        new query.OrExpression([new query.TrueExpression(), new query.TrueExpression()]),
        '((true) or (true))'
      );
      assertNormalized(new query.AndExpression([new query.TrueExpression(), new query.TrueExpression()]), '((true))');
    });
  });

  describe('Operations', function() {
    it('=', function() {
      const eq = new query.Operation(colour, '=', blue);
      expect(eq.evaluate({ attributes: { colour: 'blue' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'red' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 1 } })).toBe(false);
      expect(eq.evaluate({ attributes: {} })).toBe(false);

      const eq2 = new query.Operation(number, '=', one);
      expect(eq2.evaluate({ attributes: { number: 'blue' } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 1 } })).toBe(true);
      expect(eq2.evaluate({ attributes: { number: 1.0 } })).toBe(true);
      expect(eq2.evaluate({ attributes: { number: 2 } })).toBe(false);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);

      const eq3 = new query.Operation(date, '=', tuesday);
      expect(eq3.evaluate({ attributes: { date: 'blue' } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: 1 } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: tuesday.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: tuesDay.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: new Date('2013-08-27T00:00:00Z').toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: '2013-08-27T00:00:00Z' } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: monday.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: wednesday.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: monDay.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: wednesDay.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: {} })).toBe(false);

      const eq4 = new query.Operation(ownerId, '=', peterId);
      expect(eq4.evaluate({ attributes: {}, belongs_to: { owner: peterId } })).toBe(true);
      expect(eq4.evaluate({ attributes: { owner: peterId }, belongs_to: {} })).toBe(false);
      expect(eq4.evaluate({ attributes: {}, belongs_to: { owner: '12345' } })).toBe(false);
      expect(eq4.evaluate({ attributes: {}, belongs_to: { owner: null } })).toBe(false);

      const eq5 = new query.Operation(owner, '=', peterId);
      expect(eq5.evaluate({ attributes: {}, belongs_to: { owner: peterId } })).toBe(true);
      expect(eq5.evaluate({ attributes: { owner: peterId }, belongs_to: {} })).toBe(false);
      expect(eq5.evaluate({ attributes: {}, belongs_to: { owner: '12345' } })).toBe(false);
      expect(eq5.evaluate({ attributes: {}, belongs_to: { owner: null } })).toBe(false);

      const eq6 = new query.Operation(colours, '=', ['red']);
      expect(eq6.evaluate({ attributes: { colours: ['red'] } })).toBe(true);
      expect(eq6.evaluate({ attributes: { colours: [] } })).toBe(false);
      expect(eq6.evaluate({ attributes: { colours: ['red', 'green'] } })).toBe(false);
      expect(eq6.evaluate({ attributes: { } })).toBe(false);

      const eq7 = new query.Operation(colours, '=', ['red', 'green']);
      expect(eq7.evaluate({ attributes: { colours: ['red', 'green'] } })).toBe(true);
      expect(eq7.evaluate({ attributes: { colours: ['green', 'red'] } })).toBe(false);
      expect(eq7.evaluate({ attributes: { colours: ['red'] } })).toBe(false);
      expect(eq7.evaluate({ attributes: { colours: [] } })).toBe(false);
      expect(eq7.evaluate({ attributes: { } })).toBe(false);
    });

    it('Day = Day', function() {
      const eq6 = new query.Operation(day, '=', tuesDay);
      expect(eq6.evaluate({ attributes: { day: tuesDay.toString() } })).toBe(true);
      expect(eq6.evaluate({ attributes: { day: '2013-08-27T00:00:00Z' } })).toBe(true);
      expect(eq6.evaluate({ attributes: { day: monDay.toString() } })).toBe(false);
      expect(eq6.evaluate({ attributes: { day: wednesDay.toString() } })).toBe(false);
      expect(eq6.evaluate({ attributes: {} })).toBe(false);
    });

    it('Day = Date', function() {
      // Takes the local timezone portion of the Date
      let eq: query.Operation;

      eq = new query.Operation(day, '=', new Date(2013, 7, 27, 0, 0));
      expect(eq.evaluate({ attributes: { day: '2013-08-27' } })).toBe(true);

      eq = new query.Operation(day, '=', new Date(2013, 7, 27, 23, 59));
      expect(eq.evaluate({ attributes: { day: '2013-08-27' } })).toBe(true);

      eq = new query.Operation(day, '=', new Date(2013, 7, 28, 0, 0));
      expect(eq.evaluate({ attributes: { day: '2013-08-27' } })).toBe(false);

      eq = new query.Operation(day, '=', new Date(2013, 7, 26, 23, 59));
      expect(eq.evaluate({ attributes: { day: '2013-08-27' } })).toBe(false);
    });

    it('Date = Day', function() {
      // This compares the Date in the local timezone
      const eq6 = new query.Operation(datetime, '=', tuesDay);
      expect(eq6.evaluate({ attributes: { datetime: new Date(2013, 7, 27, 23, 59).toISOString() } })).toBe(true);
      expect(eq6.evaluate({ attributes: { datetime: new Date(2013, 7, 27, 0, 0).toISOString() } })).toBe(true);
      expect(eq6.evaluate({ attributes: { datetime: new Date(2013, 7, 26, 23, 59).toISOString() } })).toBe(false);
      expect(eq6.evaluate({ attributes: { datetime: new Date(2013, 7, 28, 0, 0).toISOString() } })).toBe(false);
      expect(eq6.evaluate({ attributes: {} })).toBe(false);
    });

    it('!=', function() {
      const eq = new query.Operation(colour, '!=', blue);
      expect(eq.evaluate({ attributes: { colour: 'blue' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 'red' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 1 } })).toBe(true);
      expect(eq.evaluate({ attributes: {} })).toBe(true);

      const eq2 = new query.Operation(number, '!=', one);
      expect(eq2.evaluate({ attributes: { number: 'blue' } })).toBe(true);
      expect(eq2.evaluate({ attributes: { number: 1 } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 2 } })).toBe(true);
      expect(eq2.evaluate({ attributes: {} })).toBe(true);

      const eq3 = new query.Operation(date, '!=', tuesday);
      expect(eq3.evaluate({ attributes: { date: 'blue' } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: 1 } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: tuesday.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: monday.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: wednesday.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: tuesDay.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: monDay.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: wednesDay.toISOString() } })).toBe(true);
      expect(eq2.evaluate({ attributes: {} })).toBe(true);

      const eq4 = new query.Operation(ownerId, '!=', peterId);
      expect(eq4.evaluate({ attributes: {}, belongs_to: { owner: peterId } })).toBe(false);
      expect(eq4.evaluate({ attributes: { owner: peterId }, belongs_to: {} })).toBe(true);
      expect(eq4.evaluate({ attributes: {}, belongs_to: { owner: '12345' } })).toBe(true);
      expect(eq4.evaluate({ attributes: {}, belongs_to: { owner: null } })).toBe(true);

      const eq5 = new query.Operation(colours, '!=', ['red']);
      expect(eq5.evaluate({ attributes: { colours: ['red'] } })).toBe(false);
      expect(eq5.evaluate({ attributes: { colours: [] } })).toBe(true);
      expect(eq5.evaluate({ attributes: { colours: ['red', 'green'] } })).toBe(true);
      expect(eq5.evaluate({ attributes: { } })).toBe(true);
    });

    it('>', function() {
      const eq = new query.Operation(colour, '>', blue);
      expect(eq.evaluate({ attributes: { colour: 'blue' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 'red' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 1 } })).toBe(false);
      expect(eq.evaluate({ attributes: {} })).toBe(false);

      const eq2 = new query.Operation(number, '>', one);
      expect(eq2.evaluate({ attributes: { number: 'blue' } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 0 } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 1 } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 2 } })).toBe(true);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 0.5 } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 1.5 } })).toBe(true);

      const eq3 = new query.Operation(date, '>', tuesday);
      expect(eq3.evaluate({ attributes: { date: 'blue' } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: 1 } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: tuesday.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: monday.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: '2013-08-26T00:00:00Z' } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: wednesday.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: '2013-08-28T00:00:00Z' } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: tuesDay.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: monDay.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: wednesDay.toISOString() } })).toBe(true);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);
    });

    it('>=', function() {
      const eq = new query.Operation(colour, '>=', blue);
      expect(eq.evaluate({ attributes: { colour: 'blue' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'red' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 1 } })).toBe(false);
      expect(eq.evaluate({ attributes: {} })).toBe(false);

      const eq2 = new query.Operation(number, '>=', one);
      expect(eq2.evaluate({ attributes: { number: 'blue' } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 0 } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 1 } })).toBe(true);
      expect(eq2.evaluate({ attributes: { number: 2 } })).toBe(true);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);

      const eq3 = new query.Operation(date, '>=', tuesday);
      expect(eq3.evaluate({ attributes: { date: 'blue' } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: 1 } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: tuesday.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: monday.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: wednesday.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: {} })).toBe(false);

      const eq4 = new query.Operation(colours, '>', ['red']);
      expect(eq4.evaluate({ attributes: { colours: ['red'] } })).toBe(false);
      expect(eq4.evaluate({ attributes: { colours: [] } })).toBe(false);
      expect(eq4.evaluate({ attributes: { colours: ['red', 'green'] } })).toBe(false);
      expect(eq4.evaluate({ attributes: { } })).toBe(false);
    });

    it('<', function() {
      const eq = new query.Operation(colour, '<', blue);
      expect(eq.evaluate({ attributes: { colour: 'blue' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 'red' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 1 } })).toBe(false);
      expect(eq.evaluate({ attributes: {} })).toBe(false);

      const eq2 = new query.Operation(number, '<', one);
      expect(eq2.evaluate({ attributes: { number: 'blue' } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 0 } })).toBe(true);
      expect(eq2.evaluate({ attributes: { number: 1 } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 2 } })).toBe(false);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);

      const eq3 = new query.Operation(date, '<', tuesday);
      expect(eq3.evaluate({ attributes: { date: 'blue' } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: 1 } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: tuesday.toISOString() } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: monday.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: wednesday.toISOString() } })).toBe(false);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);
    });

    it('<=', function() {
      const eq = new query.Operation(colour, '<=', blue);
      expect(eq.evaluate({ attributes: { colour: 'blue' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'red' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 1 } })).toBe(false);
      expect(eq.evaluate({ attributes: {} })).toBe(false);

      const eq2 = new query.Operation(number, '<=', one);
      expect(eq2.evaluate({ attributes: { number: 'blue' } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: 0 } })).toBe(true);
      expect(eq2.evaluate({ attributes: { number: 1 } })).toBe(true);
      expect(eq2.evaluate({ attributes: { number: 2 } })).toBe(false);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);

      const eq3 = new query.Operation(date, '<=', tuesday);
      expect(eq3.evaluate({ attributes: { date: 'blue' } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: 1 } })).toBe(false);
      expect(eq3.evaluate({ attributes: { date: tuesday.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: monday.toISOString() } })).toBe(true);
      expect(eq3.evaluate({ attributes: { date: wednesday.toISOString() } })).toBe(false);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);
    });

    it('contains', function() {
      const eq = new query.Operation(colour, 'contains', blue);
      expect(eq.evaluate({ attributes: { colour: 'blue' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'bluebird' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'bright blue' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'bright bluebird' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'BLUE' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'bLUebird' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'bright Blue' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'bright bluEbird' } })).toBe(true);
      expect(eq.evaluate({ attributes: {} })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 'blu' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 1 } })).toBe(false);

      const eq2 = new query.Operation(number, 'contains', one);
      expect(eq2.evaluate({ attributes: { number: 1 } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: '1' } })).toBe(false);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);

      const eq3 = new query.Operation(colours, 'contains', 'red');
      expect(eq3.evaluate({ attributes: { colours: ['red'] } })).toBe(true);
      expect(eq3.evaluate({ attributes: { colours: [] } })).toBe(false);
      expect(eq3.evaluate({ attributes: { colours: ['red', 'green'] } })).toBe(true);
      expect(eq3.evaluate({ attributes: { colours: ['green', 'red'] } })).toBe(true);
      expect(eq3.evaluate({ attributes: { } })).toBe(false);

      const eq4 = new query.Operation(colours, 'contains', ['red', 'green']);
      expect(eq4.evaluate({ attributes: { colours: ['red'] } })).toBe(false);
      expect(eq4.evaluate({ attributes: { colours: [] } })).toBe(false);
      expect(eq4.evaluate({ attributes: { colours: ['red', 'green'] } })).toBe(true);
      expect(eq4.evaluate({ attributes: { colours: ['green', 'red'] } })).toBe(true);
      expect(eq4.evaluate({ attributes: { colours: ['green', 'red', 'blue'] } })).toBe(true);
      expect(eq4.evaluate({ attributes: { } })).toBe(false);
    });

    it('in', function() {
      const eq = new query.Operation(colour, 'in', [blue]);
      expect(eq.evaluate({ attributes: { colour: 'blue' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'red' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 1 } })).toBe(false);
      expect(eq.evaluate({ attributes: {} })).toBe(false);

      const eq2 = new query.Operation(colour, 'in', [blue, 'red']);
      expect(eq2.evaluate({ attributes: { colour: 'blue' } })).toBe(true);
      expect(eq2.evaluate({ attributes: { colour: 'red' } })).toBe(true);
      expect(eq2.evaluate({ attributes: { colour: 1 } })).toBe(false);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);

      const eq3 = new query.Operation(colours, 'in', [blue, 'red']);
      expect(eq3.evaluate({ attributes: { colours: ['blue'] } })).toBe(true);
      expect(eq3.evaluate({ attributes: { colours: ['red'] } })).toBe(true);
      expect(eq3.evaluate({ attributes: { colours: ['red', 'green'] } })).toBe(true);
      expect(eq3.evaluate({ attributes: { colours: ['green'] } })).toBe(false);
      expect(eq3.evaluate({ attributes: { colours: ['bluer'] } })).toBe(false);
      expect(eq3.evaluate({ attributes: { colours: [] } })).toBe(false);
      expect(eq3.evaluate({ attributes: {} })).toBe(false);
    });

    it('not in', function() {
      const eq = new query.Operation(colour, 'not in', [blue]);
      expect(eq.evaluate({ attributes: { colour: 'blue' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 'red' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 1 } })).toBe(true);
      expect(eq.evaluate({ attributes: {} })).toBe(true);

      const eq2 = new query.Operation(colour, 'not in', [blue, 'red']);
      expect(eq2.evaluate({ attributes: { colour: 'blue' } })).toBe(false);
      expect(eq2.evaluate({ attributes: { colour: 'red' } })).toBe(false);
      expect(eq2.evaluate({ attributes: { colour: 'green' } })).toBe(true);

      const eq3 = new query.Operation(colours, 'not in', [blue, 'red']);
      expect(eq3.evaluate({ attributes: { colours: ['blue'] } })).toBe(false);
      expect(eq3.evaluate({ attributes: { colours: ['red'] } })).toBe(false);
      expect(eq3.evaluate({ attributes: { colours: ['red', 'green'] } })).toBe(false);
      expect(eq3.evaluate({ attributes: { colours: ['green'] } })).toBe(true);
      expect(eq3.evaluate({ attributes: { colours: ['bluer'] } })).toBe(true);
      expect(eq3.evaluate({ attributes: { colours: [] } })).toBe(true);
      expect(eq3.evaluate({ attributes: {} })).toBe(true);
    });


    it('starts with', function() {
      const eq = new query.Operation(colour, 'starts with', blue);
      expect(eq.evaluate({ attributes: { colour: 'blue' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'bluebird' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'BLUE' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'bLUebird' } })).toBe(true);
      expect(eq.evaluate({ attributes: { colour: 'bright blue' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 'bright bluebird' } })).toBe(false);
      expect(eq.evaluate({ attributes: {} })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 'blu' } })).toBe(false);
      expect(eq.evaluate({ attributes: { colour: 1 } })).toBe(false);

      const eq2 = new query.Operation(number, 'starts with', one);
      expect(eq2.evaluate({ attributes: { number: 1 } })).toBe(false);
      expect(eq2.evaluate({ attributes: { number: '1' } })).toBe(false);
      expect(eq2.evaluate({ attributes: {} })).toBe(false);
    });

    it('and', function() {
      const colourOp = new query.Operation(colour, '=', blue);
      const numberOp = new query.Operation(number, '=', one);
      const and = new query.AndExpression([colourOp, numberOp]);

      expect(colourOp.evaluate({ attributes: { colour: 'blue', number: 1 } })).toBe(true);
      expect(numberOp.evaluate({ attributes: { colour: 'blue', number: 1 } })).toBe(true);
      expect(and.evaluate({ attributes: { colour: 'blue', number: 1 } })).toBe(true);
      expect(and.evaluate({ attributes: { colour: 'red', number: 1 } })).toBe(false);
      expect(and.evaluate({ attributes: { colour: 'blue', number: 2 } })).toBe(false);
      expect(and.evaluate({ attributes: { colour: 'red', number: 2 } })).toBe(false);
    });

    it('or', function() {
      const colourOp = new query.Operation(colour, '=', blue);
      const numberOp = new query.Operation(number, '=', one);
      const or = new query.OrExpression([colourOp, numberOp]);

      expect(or.evaluate({ attributes: { colour: 'blue', number: 1 } })).toBe(true);
      expect(or.evaluate({ attributes: { colour: 'red', number: 1 } })).toBe(true);
      expect(or.evaluate({ attributes: { colour: 'blue', number: 2 } })).toBe(true);
      expect(or.evaluate({ attributes: { colour: 'red', number: 2 } })).toBe(false);
    });
  });

  describe('RelationMatch', function() {
    it('should match', function() {
      const match = new query.RelationMatch('region', '12345');
      expect(match.evaluate({ belongs_to: { region: '12345' } })).toBe(true);
      expect(match.evaluate({ belongs_to: { region: '12346' } })).toBe(false);
      expect(match.evaluate({ belongs_to: {} })).toBe(false);
    });
  });
});
