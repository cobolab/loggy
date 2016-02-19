require('../index');

// Configure the logger.
var loggy = new Loggy({
    print : true,
    write : true,
    signs : true,
    dtime : true,
    reads : true
});

// Wrapping colors from loggy.
var grn = loggy.color.green,
    ylw = loggy.color.yellow,
    red = loggy.color.red;

// Testing general logger, without breaking the runtime.
loggy.log(grn('Printing log message using ') + 'loggy.log()');
loggy.info(grn('Printing information message using ') + 'loggy.info()');
loggy.warn(ylw('Printing warning message using ') + 'loggy.warn()');
loggy.error(red('Printing error message using ') + 'loggy.error()');

// Testing the error logger with throwing exception.
try {
    require('./wrong');
}
catch ( err ) {
    //loggy.error(err);
}

// Function that contains the assert fill excluded from the error stack.
function fileReader ( file ) {
    //loggy.assert(isString(file), `Argument ${loggy.color.green('file')} is required and must be string to call the "fileReader(file)."`);

    console.log('Continue if all fine');
}

// Part of error stack.
function indirectRead ( file ) {
    return fileReader(file);
}

// Part of error stack.
function init () {
    var content = indirectRead(); // Causing error since the arg is required.

    console.log(content);
}

// part of error stack.
init();