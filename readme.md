# Loggy

A simple NodeJS logger that print the message to the console and write the message to the log files. The module is created
to support the Stater project.

Since the Loggy is a class, you can create new loggy instance as many as you want, with different options. For example,
you can create new loggy and save the log files to the each folder on your modules.

## Usage

Install the module using `npm install --save cb-loggy`, and then load the module. After loaded, the `Loggy` class will
available on the global object.

```js
require('cb-loggy');

var loggy = new Loggy(options);
```

**Options**

* **`print`**   - Print the message to the console screen. Default: **`true`**
* **`write`**   - Write the message to the log file. Default: **`false`**
* **`dtime`**   - Add date-time to the message. Default: **`false`**
* **`signs`**   - Add log sign ([i], [!], [x]) to the message. Default: **`false`**
* **`cwd`**     - The folder path to write the log files in. Default: **`process.cwd()/logs`**

If you set the **`print`** option to **`false`**, but you define **`--verbose`** on the CLI command, the print option will be set to **`true`**.

If you set the **`write`** option to **`true`**, the log files will be written to the **`cwd`** path. Each log type will be
written to the difference files, with `info-`, `wanring-`, and `error-` as the filename prefix, followed by current `year-month-date`.
Example: `logs/info-2016-1-10.log`

**Example**

```
require('cb-loggy');

var loggy = new Loggy({
    print : true, // Print the message to the screen.
    write : true, // Write the message to the log file.
    signs : true, // Add log signs to the message.
    dtime : true, // Add date-time to the message.
});

loggy.log(loggy.color.green('Printing information message using ') + 'loggy.log()');
loggy.warn(loggy.color.yellow('Printing warning message using ') + 'loggy.warn()');
loggy.error(loggy.color.red('Printing error message using ') + 'loggy.error()');
```

![CBLoggy](https://raw.githubusercontent.com/cobolab/loggy/master/sample.png)

***
#### **`loggy.log()`**

Information logger.

**Usage**

```js
loggy.log(message);
```

* **`message`** - String message, can contains colorized strings.

**Example**

```js
var loggy = new Loggy();

loggy.log('Information message');
```

#### **`loggy.warn()`**

Warning logger.

**Usage**

```js
loggy.warn(message);
```

* **`message`** - String message, can contains colorized strings.

**Example**

```js
var loggy = new Loggy();

loggy.warn('Warning message');
```

#### **`loggy.error()`**

Error logger.

**Usage**

```js
loggy.error(message);
```

* **`message`** - String message, can contains colorized strings.

**Example**

```js
var loggy = new Loggy();

loggy.error('Error message');
```

#### **`loggy.write()`**

Write message to the log file.

**Usage**

```js
loggy.write(type, message);
```

* **`type`**    - String log type, as the file name prefix. E.g: `info`.
* **`message`** - String message, can contains colorized strings.

**Example**

```js
var loggy = new Loggy();

loggy.write('info', 'Some custom information');
```

#### **`loggy.color`**

A CLI Color object to colorize the strings. For more informations, read the [CLI Color](https://www.npmjs.com/package/cli-color) Docs.

**Example**

```js
var loggy = new Loggy();

loggy.log(loggy.color.bold('Bolded message'));
```
