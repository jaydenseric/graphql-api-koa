import { doesNotThrow, throws } from 'assert';
import { specifiedRules } from 'graphql';
import checkGraphQLValidationRules from '../../private/checkGraphQLValidationRules.mjs';

export default (tests) => {
  tests.add(
    '`checkGraphQLValidationRules` with valid GraphQL validation rules.',
    () => {
      doesNotThrow(() => checkGraphQLValidationRules(specifiedRules, 'Test'));
    }
  );

  tests.add('`checkGraphQLValidationRules` with a non array.', () => {
    throws(() => checkGraphQLValidationRules(false, 'Test'), {
      name: 'InternalServerError',
      message: 'Test GraphQL validation rules must be an array.',
      status: 500,
      expose: false,
    });
  });

  tests.add('`checkGraphQLValidationRules` with non function rules.', () => {
    throws(() => checkGraphQLValidationRules([false], 'Test'), {
      name: 'InternalServerError',
      message: 'Test GraphQL validation rules must be functions.',
      status: 500,
      expose: false,
    });
  });
};
