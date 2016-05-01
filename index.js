'use strict';

// Load JSFix if not already loaded.
if (!global.JSFix) require('cb-jsfix');

// Load dependencies.
const file = require('fs-extra'),
    read = require('./util/readline'),
    colr = require('cli-color'),
    path = require('path'),
    ansi = require('strip-ansi');

const Spinner = require('cli-spinner').Spinner;

// Creating default options.
let defOptions = {
    print: true,   // Print the logs to the console.
    write: false,  // Write the logs to the file.
    dtime: false,  // Add date-time to the logs.
    signs: false,  // Add log sign to the logs.
    reads: true,   // Show full error block.
    throw: true,   // Throw error.

    // Folder to save te logs.
    cwd: path.resolve(process.cwd(), 'logs')
}

// Wrap the console.
const cli = global.console;

/**
 * Loggy
 * A simple logger that will print the messages based on cli option.
 */
class Loggy {
    // Loggy constructor.
    constructor(options) {
        // Creating configurations.
        this.cfg = JSON.parse(JSON.stringify(defOptions));

        // Merge user defined options.
        if (isObject(options)) {
            this.cfg.$join(options);
        }

        if (process.argv.indexOf('--verbose') > -1) {
            this.cfg.print = true;
        }

        // Wrap CLI Color.
        this.color = colr;
    }

    // Deprecating
    log(message) {
        // Print the logs if required.
        if (this.cfg.print) cli.log(message);

        return this.write('logs', message);
    }

    // Info logger.
    info(message) {
        let date = new Date();

        // Prepend date time to the message if required.
        if (this.cfg.dtime) message = `[${colr.blackBright(date.toLocaleString())}] ${message}`;

        // Prepend log signs to the message if required.
        if (this.cfg.signs) message = `${colr.xterm(76)('[i]')} ${message}`;

        // Print the logs if required.
        if (this.cfg.print) cli.log(message);

        return this.write('info', message);
    }

    // Success logger.
    success(message) {
        let date = new Date();

        // Prepend date time to the message if required.
        if (this.cfg.dtime) message = `[${colr.blackBright(date.toLocaleString())}] ${message}`;

        // Prepend log signs to the message if required.
        if (this.cfg.signs) message = `${colr.xterm(76)('[✓]')} ${message}`;

        // Print the logs if required.
        if (this.cfg.print) cli.log(message);

        return this.write('info', message);
    }

    // Warning logger.
    warn(message) {
        let date = new Date();

        // Prepend date time to the message if required.
        if (this.cfg.dtime) message = `[${colr.blackBright(date.toLocaleString())}] ${message}`;

        // Prepend log signs to the message if required.
        if (this.cfg.signs) message = `${colr.xterm(208)('[!]')} ${message}`;

        // Print the logs if required.
        if (this.cfg.print) cli.log(message);

        return this.write('warning', message);
    }

    // Error logger.
    error(info, skipCall, skipFile, slice) {
        let date = new Date();

        if (isError(info)) {
            // Create new Error.
            let error = info,
                etext = '';

            // Create the improved error stack.
            let stack = this._readStack(this._parseStack(error, skipFile), skipCall);

            // Create message info.
            etext = `${colr.redBright(info.message)}\r\n`;

            // Modify the stack.
            error.stack = `Error:\r\n    at ${error.stack.split(' at ').slice(slice || 0).join(' at ')}`;

            // Append each stack text to message.
            if (this.cfg.reads) {
                stack.$each((item, i) => {
                    if ((Array.isArray(skipCall) && i > 0) || !Array.isArray(skipCall)) {
                        etext += `\r\n${item.text}`;
                    }
                });
            }

            // Prepend date time to the message if required.
            if (this.cfg.dtime) etext = `[${colr.blackBright(date.toLocaleString())}] ${etext}`;

            // Prepend log signs to the message if required.
            if (this.cfg.signs) etext = `${colr.xterm(196)('[x]')} ${etext}`;

            // Print the logs if required.
            if (this.cfg.print) {
                cli.log(etext);
            }

            // Write the message.
            this.write('error', etext);

            // Throw error message.
            if (this.cfg.throw) {
                throw error;
            }
        } else if (isString(info)) {
            // Prepend date time to the message if required.
            if (this.cfg.dtime) info = `[${colr.blackBright(date.toLocaleString())}] ${info}`;

            // Prepend log signs to the message if required.
            if (this.cfg.signs) info = `${colr.xterm(196)('[x]')} ${info}`;

            // Print the logs if required.
            if (this.cfg.print) cli.log(info);

            this.write('error', info);
        }

        return this;
    }

    // Show waiting message.
    wait(message) {
        let self = this;
        let date = new Date();

        // Prepend date time to the message if required.
        let msg = message;

        if (this.cfg.dtime) msg = `[${colr.blackBright(date.toLocaleString())}] ${message}`;

        let spin = new Spinner(msg);

        if (isString(message)) {
            spin.setSpinnerString(18);
            spin.start();
        }

        return {
            done() {
                spin.stop(true);
                self.success(message);
            },
            fail(error) {
                spin.stop(true);
                self.error(message);

                if (error) {
                    self.error(error);
                }
            }
        }
    }

    // Logs writer.
    write(type, message) {
        let date = new Date();

        // Strip colors from message.
        message = ansi(message);

        // Write the logs if required.
        if (this.cfg.write) {
            // Creating date format for filename.
            date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

            // Creating log file path.
            let filepath = path.resolve(this.cfg.cwd, `${type}-${date}.log`);

            // Ensure the log file is exist.
            file.ensureFileSync(path.resolve(filepath));

            // Get the log file content.
            let content = file.readFileSync(filepath, 'utf8');

            // Append new message to the log content.
            content += `${message}\r\n`;

            // Write the content to the log file.
            file.writeFileSync(filepath, content);
        }

        return this;
    }

    /**
     * Function argument checker.
     *
     * @param arg
     * @param callback
     */
    assert(arg, callback) {
        if (!arg) {
            if (isString(callback)) {
                // Create new error.
                let error = new Error(`ERR_ASSERT: ${callback}`);

                // Log the error.
                this.error(error, ['Loggy.assert'], null, 2);
            } else if (isFunction(callback)) {
                // Create new Error.
                let error = new Error('ERROR_ARGUMENT: Required argument is missing or invalid.');

                // Modify the error stack.
                error.stack = `Error:\r\n    at ${error.stack.split(' at ').slice(2).join(' at ')}`;

                // Call the callback.
                callback.call(this, this._parseError(error, ['Loggy.assert']), error);
            }
        }
    }

    /**
     * Error Parser
     *
     * @param err
     * @param skipCall
     * @param skipFile
     * @returns {Array}
     * @private
     */
    _parseError(err, skipCall, skipFile) {
        if (!isError(err)) err = new Error();

        return this._readStack(this._parseStack(err, skipCall), skipFile);
    }

    /**
     * Error Stack Parser
     *
     * @param err
     * @param skip
     * @returns {Array}
     * @private
     */
    _parseStack(err, skip) {
        let stack = err.stack.split(' at ').map(item => {
            return item.replace(/[\r\n]+/g, '').replace(/[\s]+$/, '');
        });

        let newStack = [];

        stack.$each(item => {
            let match = item.match(/^[new\sa-zA-Z\d\.\<\>\_\-]+\s+/);

            if (match) {
                let call = match[0].replace(/[\s]+$/g, ''),
                    file = match.input
                                .replace(match[0], '')
                                .replace(/[\(\)]+/g, '')
                                .split(':')[0],
                    line = match.input
                                .replace(match[0], '')
                                .replace(/[\(\)]+/g, '')
                                .replace(`${file}:`, '')
                                .split(':');

                if (Array.isArray(skip)) {
                    if (skip.indexOf(file) < 0) {
                        newStack.push({
                            call,
                            file,
                            line: {
                                row: line[0],
                                col: line[1]
                            }
                        });
                    }
                } else {
                    newStack.push({
                        call,
                        file,
                        line: {
                            row: line[0],
                            col: line[1]
                        }
                    });
                }
            }
        });

        return newStack;
    }

    /**
     * Error Stack Reader
     *
     * @param stack
     * @param skip
     * @returns {Array}
     * @private
     */
    _readStack(stack, skip) {
        // Creating new stack list.
        let newStack = [];

        // Creating gutter size.
        let gutter = 0;

        stack.$each(item => {
            if (String(item.line.row).length > gutter) {
                gutter = String(item.line.row).length;
            }
        });

        gutter += 2;

        stack.$each(item => {
            // Mark to proceed the read.
            let proceed = true;

            // Check does the item need to be skipped.
            if (Array.isArray(skip) && skip.indexOf(item.call) > -1) proceed = false;

            // Skip if proceed is false.
            if (proceed) {
                // File exist holder.
                let exist;

                // Ensure the file is exist.
                try {
                    exist = file.statSync(item.file);
                }
                catch (err) {
                    exist = false;
                }

                // Create error messages block, error message, and error messages list.
                let errText = colr.yellow(`[↓][ ${item.file} ][ ${item.line.row} ][ ${item.line.col} ]\r\n`),
                    errList = [],
                    errLine = '';

                // Continue if file is exist.
                if (exist) {
                    let row = item.line.row;

                    // Define gutter length, current line position, pick start, and pick end.
                    let idx = 0,
                        min = (Number(row) - 4),
                        max = (Number(row) + 2);

                    // Read the file line by line.
                    let text = read(item.file),
                        line = text.next();

                    while (!line.done) {
                        if (idx >= min && idx <= max) {
                            // Creating line number and gutter.
                            let sdx = String((idx + 1)),
                                gut = '';

                            // Loop through the gutter size to create line number with margin.
                            gutter.$each((i) => {
                                if (i < sdx.length) {
                                    gut += sdx[i];
                                } else {
                                    gut += ' ';
                                }
                            });

                            // Proceed the error line.
                            if (idx === item.line.row - 1) {
                                // Add the error line.
                                errLine = {
                                    line: sdx,
                                    text: line.value
                                };

                                let val = '',
                                    cfl = false;

                                line.value.$each((char, i) => {
                                    if (i === (item.line.col - 1)) {
                                        cfl = true;
                                    }

                                    if (cfl) {
                                        val += colr.redBright.bold(char);
                                    } else {
                                        val += char;
                                    }
                                });

                                // Colorize the error line message.
                                errText += colr.cyan(`${colr.redBright(gut)}${val}\r\n`);
                            } else {
                                let val = line.value.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:^\s*\/\/(?:.*)$)/gm, (comment) => {
                                    return colr.xterm(239)(comment);
                                });

                                errText += colr.cyan(`${gut}${val}\r\n`);
                            }

                            // Add new line to the list.
                            errList.push({
                                line: sdx,
                                text: line.value
                            });
                        }

                        // Proceed next line.
                        line = text.next();

                        // Increase current line position.
                        idx++;
                    }

                    // Adding stack text.
                    item.text = errText;

                    // Adding stack object.
                    item.raws = {
                        curn: errLine,
                        list: errList
                    }

                    // Push readed item to the stack list.
                    newStack.push(item);
                }
            }
        });

        return newStack;
    }

    /**
     * Color Remover.
     *
     * @param text
     * @returns {*}
     * @private
     */
    _cleanColor(text) {
        return ansi(text);
    }
}

// Adding to global object.
if (!global.hasOwnProperty('Loggy')) {
    global.Loggy = Loggy;
}

// Exporting class.
module.exports = Loggy;
