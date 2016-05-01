'use strict';

require('../index');

// Configure the logger.
let loggy = new Loggy({
    print: true,
    write: true,
    signs: true,
    dtime: false,
    reads: true,
    global: true,
    indent: 4
});

// Wrapping colors from loggy.
let grn = loggy.color.green,
    ylw = loggy.color.yellow,
    red = loggy.color.red;

// Testing general logger, without breaking the runtime.
loggy.log(`${grn('Printing log message using ')} loggy.log()`);
loggy.success(`${grn('Printing log message using ')} loggy.success()`);
loggy.info(`${grn('Printing information message using ')} loggy.info()`);
loggy.warn(`${ylw('Printing warning message using ')} loggy.warn()`);
loggy.error(`${red('Printing error message using ')} loggy.error()`);

loggy.info(`Printing message without indent`);
loggy.info(`%1%Printing message with indent 1`);
loggy.info(`%2%Printing message with indent 2`);
loggy.info(`%3%Printing message with indent 3`);

const cli = global.console;

let cwait = loggy.wait(`${grn('Printing message that show spinner using')} loggy.wait(), and success.`);
let fwait = loggy.wait(`%1%${grn('Printing message that show spinner using')} loggy.wait(), and failed.`);

setTimeout(() => {
    cwait.done();
}, 10000);

setTimeout(() => {
    fwait.fail();
}, 8000);

// Testing the error logger with throwing exception.
try {
    require('./wrong');
}
catch (err) {
    //loggy.error(err);
}

// Function that contains the assert fill excluded from the error stack.
function fileReader(file) {
    // loggy.assert(isString(file), `Argument ${loggy.color.green('file')} is required and must be string to call the "fileReader(file)."`);

    cli.log('Continue if all fine');
}

// Part of error stack.
function indirectRead(file) {
    return fileReader(file);
}

// Part of error stack.
function init() {
    let content = indirectRead(); // Causing error since the arg is required.

    // cli.log(content);
}

// part of error stack.
init();