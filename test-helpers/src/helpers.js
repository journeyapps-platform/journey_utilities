// Register additional matchers.
beforeEach(function () {
  // `this` is the current jasmine suite
  var suite = this;

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

  function has(util, actual, expected) {
    for (var key in expected) {
      if (expected.hasOwnProperty(key)) {
        if (!suite.skipErrorPositions || ['start', 'end'].indexOf(key) === -1) {
          // We treat null and undefined as the same
          var matches = expected[key] == null ? actual[key] == null : util.equals(actual[key], expected[key]);
          if (!matches) {
            return false;
          }
        }
      }
    }
    return true;
  }

  jasmine.pp = function (obj) {
    return JSON.stringify(obj, undefined, 2);
  };

  jasmine.addMatchers(
    require('jasmine-diff')(jasmine, {
      colors: true,
      inline: true
    })
  );

  jasmine.addMatchers({
    // Check that the actual object has all the keys in the expected object.
    // The actual object may have more keys not present in the expected object, which are ignored.
    toHave: function (util) {
      return {
        compare: function (actual, expected) {
          return { pass: has(util, actual, expected) };
        }
      };
    },
    toHaveError: function (util) {
      return {
        compare: function (actual, error) {
          if (actual.length != 1) {
            return { pass: false };
          }
          var actualError = actual[0];
          return { pass: has(util, actualError, error) };
        }
      };
    },
    toHaveErrors: function (util) {
      return {
        compare: function (actual, errors) {
          // Order-independent check
          if (actual.length != errors.length) {
            return {
              pass: false
            };
          }

          for (var i = 0; i < errors.length; i++) {
            var expected = errors[i];
            var found = false;
            for (var j = 0; j < actual.length; j++) {
              // TODO: we should probably remove the error from this.actual, so it's not matched twice
              if (has(util, actual[j], expected)) {
                found = true;
                break;
              }
            }
            if (!found) {
              return { pass: false };
            }
          }
          return { pass: true };
        }
      };
    }
  });
});
