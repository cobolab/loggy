require('./index');

var loggy = new Loggy({
    print : true,
    write : true,
    signs : true,
    dtime : true
});

loggy.log(loggy.color.green('Printing information message using ') + 'loggy.log()');
loggy.warn(loggy.color.yellow('Printing warning message using ') + 'loggy.warn()');
loggy.error(loggy.color.red('Printing error message using ') + 'loggy.error()');
