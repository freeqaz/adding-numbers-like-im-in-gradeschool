const assert = require('assert');

// maintain sanity :)
function validateInput(a, b) {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
    throw new Error('Invalid input number');
  }

  // flip the order if 2nd argument is a longer string
  if (a.length < b.length) {
    const origA = a;
    a = b;
    b = origA;
  }
  
  return [a, b];
}

// Basic imperative style of keeping track of state between calls.
function addTwoStringNumsImperative(a, b) {
  let output = '';
  let remainder = 0;
  // necessary to offset when adding strings of different lengths.
  const offset = b.length - a.length;
  // traverse the string backwards and add together each digit, while carrying the remainder forward.
  for (let i = a.length - 1; i >= -1; i--) {
    // short circuit to avoid extra leading zero if we don't have a remainder to add.
    if (i === -1 && remainder === 0) {
      break;
    }

    const curA = parseInt(a[i], 10) || 0;
    const curB = parseInt(b[i + offset], 10) || 0;
    const added = curA + curB + remainder;
    remainder = Math.floor(added / 10);
    output = (added % 10) + output;
  }
  return output;
}

// Avoids mutation and operates via chained functional operators, avoiding nesting via recursion.
// Essentially takes each "column" in the strings and operates on them independently,
// It then merges all of the results together (map/reduce).
function addTwoStringNumsFunctional(a, b) {
  // Takes state from a previous round and a column,
  // Returns state for the next round to use.
  function reduceColumn([output, carry], sum) {
    const total = carry + sum;
    return [
      total % 10 + output, // New total/output
      Math.floor(total / 10) // Remainder
    ];
  }

  // necessary to offset when adding strings of different lengths.
  const offset = b.length - a.length;

  const finalColumnToSum = a
    .split('')
    // create pairs of integers from string values
    .map((num, index) => [parseInt(num, 10) || 0, parseInt(b[index + offset], 10) || 0])
    // reverse the order so that we add right-to-left like in real life
    .reverse()
    // add all numbers together (could be run in parallel)
    .map(pair => pair[0] + pair[1])
    // sum each column and leverage the output of the previous run (current sum and the carry).
    // second argument is the initial state for reduce to use.
    .reduce(reduceColumn, ['', 0]);

  // Short circuit to avoid leading zero if we don't have a remainder left.
  if (finalColumnToSum[1] === 0) {
    return finalColumnToSum[0]
  }

  return reduceColumn(finalColumnToSum, 0)[0];
}

// allows adding of an arbitrary number of numbers via reduce
function addStringNums(addFn, ...args) {
  if (!args || !Array.isArray(args)) {
    throw new Error('Invalid input to addTwoNums');
  }
  const startNum = args[0];
  const restOfNums = args.slice(1);
  return restOfNums.reduce(
    (acc, a) => addFn.apply(null, validateInput(acc || '0', a || '0')),
    startNum
  );
}

const equal = (a, b) => a === b;

const tests = [
  ['999', '999', equal, '1998'],
  ['999',   '1', equal, '1000'],
  [  '1', '999', equal, '1000'],
  [  '0',   '0', equal,    '0'],
  [  '',   '0', equal,     '0'],
  [  '',    '', equal,     '0'],

  ['999', '999',  '45', equal, '2043'],
  ['55', '999',  '999', equal, '2053'],
  ['999', '999',  '45', equal, '2043'],
];

function formatAdditionTestOutputString(testConfig) {
  const [eq, sum] = testConfig.slice(testConfig.length - 2);
  const numbers = testConfig.slice(1, testConfig.length - 2);
  const operationString = numbers.reduce(
    (acc, num) => `${acc} + ${num || 'nil'}`, testConfig[0] || 'nil'
  );
  return `${operationString} = ${sum}`;
}

function runTests(testFn, testsArray, fmtOutput) {
  return testsArray.map(testConfig => {
    const length = testConfig.length;
    const testArgs = testConfig.slice(0, length -2);
    const conditional = testConfig[length - 2];
    const expectedOutput = testConfig[length - 1];

    const result = conditional(testFn.apply(null, testArgs), expectedOutput);
    return [result, fmtOutput(testConfig)];
  });
}

const imperativeTests = (...args) => addStringNums(addTwoStringNumsImperative, ...args);
const functionalTests = (...args) => addStringNums(addTwoStringNumsFunctional, ...args);

function logNiceTestOutputToConsole(header, testOutput) {
  console.log(header);
  testOutput.forEach(
    ([passed, outputString], i) => console.log(`#${i} ${passed ? 'ok' : 'not ok'}: ${outputString}`)
  );
  console.log(); // friendly newline
}
logNiceTestOutputToConsole(
  'imperative tests',
  runTests(imperativeTests, tests, formatAdditionTestOutputString)
);
logNiceTestOutputToConsole(
  'functional tests',
  runTests(functionalTests, tests, formatAdditionTestOutputString)
);
