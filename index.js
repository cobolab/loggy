'use strict';

// Load JSFix if not already loaded.
if ( !global.JSFix ) require('cb-jsfix');

// Load dependencies.
var file = require('fs-extra'),
    colr = require('cli-color'),
    path = require('path'),
    ansi = require('strip-ansi');

// Creating default options.
var defOptions = {
    print : true,   // Print the logs to the console.
    write : false,  // Write the logs to the file.
    dtime : false,  // Add date-time to the logs.
    signs : false,   // Add log sign to the logs.

    // Folder to save te logs.
    cwd : path.resolve(process.cwd(), 'logs'),
}

/**
 * Loggy
 * A simple logger that will print the messages based on cli option.
 */
class Loggy {
    // Loggy constructor.
    constructor ( options ) {
        // Merge user defined options.
        if ( isObject(options) ) {
            this.cfg = defOptions.$join(options);
        }
        else {
            this.cfg = defOptions;
        }

        if ( process.argv.indexOf('--verbose') > -1 ) {
            this.cfg.print = true;
        }

        // Wrap CLI Color.
        this.color = colr;
    }

    // Info logger.
    log ( message ) {
        let date = new Date();

        // Prepend date time to the message if required.
        if ( this.cfg.dtime ) message = `${colr.blackBright(date.toLocaleString())} ${message}`;

        // Prepend log signs to the message if required.
        if ( this.cfg.signs ) message = `${colr.xterm(76)('[i]')} ${message}`;

        // Print the logs if required.
        if ( this.cfg.print ) console.log(message);

        this.write('info', message);
    }

    // Warning logger.
    warn ( message ) {
        let date = new Date();

        // Prepend date time to the message if required.
        if ( this.cfg.dtime ) message = `${colr.blackBright(date.toLocaleString())} ${message}`;

        // Prepend log signs to the message if required.
        if ( this.cfg.signs ) message = `${colr.xterm(208)('[!]')} ${message}`;

        // Print the logs if required.
        if ( this.cfg.print ) console.log(message);

        this.write('warning', message);
    }

    // Error logger.
    error ( message ) {
        let date = new Date();

        // Prepend date time to the message if required.
        if ( this.cfg.dtime ) message = `${colr.blackBright(date.toLocaleString())} ${message}`;

        // Prepend log signs to the message if required.
        if ( this.cfg.signs ) message = `${colr.xterm(196)('[x]')} ${message}`;

        // Print the logs if required.
        if ( this.cfg.print ) console.log(message);

        this.write('error', message);
    }

    // Logs writer.
    write ( type, message ) {
        let date = new Date();

        // Strip colors from message.
        message = ansi(message);

        // Write the logs if required.
        if ( this.cfg.write ) {
            // Creating date format for filename.
            date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

            // Creating log file path.
            let filepath = path.resolve(this.cfg.cwd, `${type}-${date}.log`);

            // Ensure the log file is exist.
            file.ensureFileSync(path.resolve(filepath));

            // Get the log file content.
            let content = file.readFileSync(filepath, 'utf8');

            // Append new message to the log content.
            content += message + '\r\n';

            // Write the content to the log file.
            file.writeFileSync(filepath, content);
        }
    }
}

// Adding to global object.
global.Loggy = Loggy;

// Exporting class.
module.exports = Loggy;
