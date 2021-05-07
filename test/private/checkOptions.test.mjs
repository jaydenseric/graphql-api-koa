import { doesNotThrow, throws } from 'assert';
import checkOptions from '../../private/checkOptions.mjs';

export default (tests) => {
  tests.add('`checkOptions` with valid options.', () => {
    doesNotThrow(() => checkOptions({ a: true }, ['a'], 'Test'));
  });

  tests.add('`checkOptions` with unenumerable options.', () => {
    throws(() => checkOptions(null, ['a'], 'Test'), {
      message: 'Test options must be an enumerable object.',
      status: 500,
      expose: false,
    });
  });

  tests.add('`checkOptions` with invalid option keys.', () => {
    throws(() => checkOptions({ a: true, b: true, c: true }, ['b'], 'Test'), {
      message: 'Test options invalid: `a`, `c`.',
      status: 500,
      expose: false,
    });
  });
};
