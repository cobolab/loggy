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
    indent: 4,     // Default indent size.

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
        this.assert(isString(message), 'info(message) => Message must be a string!');

        // Format the message.
        message = this._format(message, colr.xterm(76), '[i]');

        // Print the logs if required.
        if (this.cfg.print) cli.log(message);

        return this.write('info', message);
    }

    // Success logger.
    success(message) {
        this.assert(isString(message), 'success(message) => Message must be a string!');

        // Format the message.
        message = this._format(message, colr.xterm(76), '[✓]');

        // Print the logs if required.
        if (this.cfg.print) cli.log(message);

        return this.write('info', message);
    }

    // Warning logger.
    warn(message) {
        this.assert(isString(message), 'warn(message) => Message must be a string!');

        // Format the message.
        message = this._format(message, colr.xterm(208), '[!]');

        // Print the logs if required.
        if (this.cfg.print) cli.log(message);

        return this.write('warning', message);
    }

    // Error logger.
    error(info, skipCall, skipFile, slice) {
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

            // Format the message.
            etext = this._format(etext, colr.xterm(196), '[x]');

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
            // Format the message.
            info = this._format(info, colr.xterm(196), '[x]');

            // Print the logs if required.
            if (this.cfg.print) cli.log(info);

            this.write('error', info);
        }

        return this;
    }

    // Show waiting message.
    wait(message) {
        this.assert(isString(message), 'wait(message) => Message must be a string!');

        // Wrap this object.
        let self = this;

        // Prepend date time to the message if required.
        let msg = `${this._format(message, colr.xterm(76), ' %s')}`;

        // Creating spinner.
        let spin = new Spinner(msg);

        // Set the spinner style and then start the spinner.
        spin.setSpinnerString(18);
        spin.start();

        return {
            // Function to mark the waiting status as done.
            done() {
                // Stop and clean the spinner.
                spin.stop(true);

                // Use the success logger to mark as done.
                self.success(message);
            },
            // Function to mark the waiting status as failed.
            fail(error) {
                // Stop and clean the spinner.
                spin.stop(true);

                // Use error logger to mark as failed.
                self.error(message);

                if (error) {
                    // If error object defined, then use it to show the error stacks.
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

    /**
     * Log Message Formatter
     *
     * @param {string} message - String message to format.
     * @param {function} [signColor] - Function to color the sign.
     * @param {string} [sign] - String log sign.
     * @returns {string}
     */
    _format(message, signColor, sign) {
        this.assert(isString(message), '_message(message) => Message must be a string!');

        let date = new Date();
        let level = 0;

        // Get the indent level from message.
        message = message.replace(/^\%[\d]+\%/, $1 => {
            level = Number($1.replace(/\%/g, ''));
            return '';
        });

        // Prepend date time to the message if required.
        if (this.cfg.dtime) message = `[${colr.blackBright(date.toLocaleString())}] ${message}`;

        // Prepend log signs to the message if required.
        if (this.cfg.signs) message = `${(signColor || colr.xterm(76))(`${sign || '[i]'}`)} ${message}`;

        // Indent the message.
        message = this._indent(message, level);

        return message;
    }

    /**
     * Indent Generator
     *
     * @param {number} level - Number indent level.
     * @returns {string}
     */
    _indent(message, level) {
        this.assert(isString(message), '_indent(message, level) => Message must be a string!');
        this.assert(isNumber(level), '_indent(message, level) => Indent level must be a number!');

        // Create blank indent.
        let indent = '';

        // Iterate indent level.
        for (let i = 1; i <= level; ++i) {
            // Iterate indent size to fill spacess.
            for (let j = 1; j <= this.cfg.indent; ++j) {
                indent += ' ';
            }
        }

        // Return the message with indent at beginning.
        return `${indent}${message}`;
    }
}

// Adding to global object.
if (!global.hasOwnProperty('Loggy')) {
    global.Loggy = Loggy;
}

// Exporting class.
module.exports = Loggy;
