
sap.ui.define('sap/sf/surj/shell/util/Logger', ['jquery.sap.global'], function ($) {

    /**
     * A global logger. This is useful for debugging. You can add logger
     * statements, check them in, and be confident that they will not show to
     * the end user at runtime in production (depending on the log levels
     * enabled).
     * 
     * By default only the "error" log level is enabled, you must manually
     * enable the log level if you want any additional levels to work.
     * 
     * Example usage:
     * 
     * <pre>
     * Logger.debug('This is a debug log');
     * Logger.error('This is a error log');
     * Logger.warn('This is a warning log');
     * </pre>
     * 
     * Another usage if log statements should be prefixed:
     * 
     * <pre>
     * (function(){
     *   var LOG = Logger.getLogger('MyComponent');
     *   function MyComponent() {
     *      this.register();
     *   }
     *   juic.extend(MyComponent, juic.Component, {
     *      renderHtml: function(html) {
     *          // This will log the following...
     *          // [DEBUG] MyComponent: Render Called
     *          LOG.debug('Render Called'); 
     *      }
     *   });
     * })();
     * </pre>
     */
    var Logger = {
        /**
         * Is the given log level enabled?
         * 
         * @param {string} type
         */
        isEnabled : function(level) {
            return !!ENABLED[level];
        },

        /**
         * Make the given level enabled.
         * 
         * @param {string} level
         * @param {boolean} enabled
         */
        setEnabled : function(level, enabled) {
            ENABLED[level] = enabled;
        },

        /**
         * Enable all logger levels.
         */
        enableLoggers : function() {
            for (var idx = 0; idx < LOGGERS.length; idx++) {
                this.setEnabled(LOGGERS[idx], true);
            }
        },

        /**
         * Add a listener for enabled log messages.
         * 
         * @param {Object} listener
         * @param {string=} callback
         */
        addLogListener : function(listener, callback) {
            this._addEventListener('log', listener, callback);
        },

        /**
         * Remove the log listener.
         * 
         * @param {Object} listener
         */
        removeLogListener : function(listener) {
            this._removeEventListener('log', listener);
        },

        /**
         * Enable the console logger.
         * 
         * @param {boolean} enabled
         */
        setConsoleEnabled : function(enabled) {
            if (enabled) {
                this.addLogListener(CONSOLE);
            } else {
                this.removeLogListener(CONSOLE);
            }
        },

        /**
         * In some cases you might actually want to prefix each message you log
         * with certain messages, for example all log statements by a certain
         * component should be prefixed with the class name.
         * 
         * For this reason you can call "getLogger" to return a logger object
         * which will always prefix your messages with the parameters passed.
         * 
         * @param {...} prefix You can pass variable arguments, these will be
         *            added to every log output by the returned logger instance.
         */
        getLogger : function() {
            var logger = {
                isEnabled : function(level) {
                    return Logger.isEnabled(level);
                }
            };
            var prefix = pushAll(arguments);
            for (var idx = 0; idx < LOGGERS.length; idx++) {
                (function(level) {
                    logger[level.toUpperCase()] = level;
                    logger[level] = function() {
                        var message = [ prefix.join(' ') + ': ' ];
                        pushAll(arguments, message);
                        Logger[level].apply(Logger, message);
                    }
                })(LOGGERS[idx]);
            }
            return logger;
        },

        /**
         * @param {string} type The type to use for the event
         * @param {EventTarget} handler The handler for this event
         * @param {string=} callback Optional function name for the callback
         */
        _addEventListener : function(type, handler, callback) {
            var evts = this._events || (this._events = {});
            (evts[type] || (evts[type] = [])).push({
                handler : handler,
                callback : callback ? callback : null
            });
        },

        _removeEventListener : function(type, handler) {
            var allEvts = this._events, evts;
            if (allEvts && (evts = allEvts[type])) {
                for (var i = evts.length; --i >= 0;) {
                    if (evts[i].handler === handler) {
                        evts.splice(i, 1);
                    }
                }
                if (!evts.length) {
                    delete allEvts[type];
                }
            }
        },

        dispatch : function(type, evt) {
            evt.type = type;
            evt.target = this;
            var evts = this._events;
            if (evts && (evts = evts[evt.type])) {
                var tmp = evts.slice(0);
                var ex;
                for (var i = 0; i < tmp.length; ++i) {
                    try {
                        var handler = tmp[i].handler;
                        var callback = tmp[i].callback;
                        if (callback) {
                            handler[callback](evt);
                        } else {
                            handler.handleEvent(evt);
                        }
                    } catch (e) {
                        ex = e;
                    }
                }
                if (ex)
                    throw ex;
            }
        }
    };

    /**
     * The console logger.
     * 
     * @inner
     */
    var CONSOLE = {
        handleEvent : function(event) {
            var level = event.level;
            var messages = enhanceErrorMessage(event.messages);

            if (typeof console != 'undefined' && console.log) {
                var args = [ '[' + level.toUpperCase() + '] ' ].concat(messages);
                // IE doesn't support "apply" on native functions!
                if (typeof console.log.apply == 'function') {
                    console.log.apply(console, args);
                } else {
                    console.log(args.join(''));
                }
            }
        }
    };

    /**
     * @inner
     * @param {*} values Usually will be the "arguments" variable.
     * @param {Array.<*>} toArray The array to push onto
     */
    function pushAll(values, toArray) {
        toArray = toArray || [];
        for (var idx = 0; idx < values.length; idx++) {
            toArray.push(values[idx]);
        }
        return toArray;
    }

    /**
     * @inner
     * @param {Array.<*>} messages The array which contains the Error messages
     * @return {Array.<*>} The array containing specific details for Error
     *         messages
     */
    function enhanceErrorMessage(messages) {
        var detail, err;
        for (var idx = 0; idx < messages.length; idx++) {
            err = messages[idx];
            if (err instanceof Error) {
                detail = [ idx, 1 ]; // These are the first 2 arguments to
                // splice
                detail.push(err);
                if (err.stack) {
                    detail.push(" Stack: ", err.stack);
                } else {
                    if (err.fileName) {
                        detail.push(" File Name: ", err.fileName, ".");
                    }
                    if (err.lineNumber || err.lineNo) {
                        detail.push(" Line Number: ", err.lineNumber || err.lineNo, ".");
                    }
                }
                messages.splice.apply(messages, detail);
                idx += detail.length - 1;
            }
        }
        return messages;
    }

    // --------------------------------------------------------------------------
    // Logger Initialization
    // --------------------------------------------------------------------------

    /*
     * Each of these are available as static constants on the Logger namespace.
     * You can use the constant as the argument to Logger.isEnabled
     * 
     * i.e. Logger.ERROR == 'error'
     */
    var LOGGERS = [ 'error', 'warn', 'debug', 'info' ];
    var ENABLED = {
        error : true
    };

    /*
     * This will add all the log level functions to the Logger.
     */
    for (var idx = 0; idx < LOGGERS.length; idx++) {
        (function(level) {
            // the level (uppercase) as a public static constant
            Logger[level.toUpperCase()] = level;

            // the level (lowercase) will be the logger function
            Logger[level] = function() {
                if (ENABLED[level]) {
                    this.dispatch('log', {
                        level : level,
                        messages : pushAll(arguments)
                    });
                }
            }
        })(LOGGERS[idx]);
    }

    Logger.setConsoleEnabled(true);
    var RESOURCE_NAME = typeof RESOURCES != 'undefined' && RESOURCES['/ui/surj/js/Logger.js'];
    if (typeof RESOURCE_NAME == 'string' && !/[a-f\d]{32}\.js$/.test(RESOURCE_NAME)) {
        Logger.enableLoggers();
    }

    $.sap.setObject('sap.sf.surj.shell.util.Logger', Logger);
    return Logger;
});