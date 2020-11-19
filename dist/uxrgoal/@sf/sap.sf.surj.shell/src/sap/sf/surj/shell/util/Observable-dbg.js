sap.ui.define('sap/sf/surj/shell/util/Observable', [], function () {
    'use strict';

    return {
        createObservable: function () {
            var api = {
                observers: {},
                addEventListener: function (eventName, fn) {
                    api.attachEvent(eventName, fn);
                },
                removeEventListener: function (eventName, fn) {
                    api.detachEvent(eventName, fn);
                },
                attachEvent: function (eventName, fn) {
                    var observers = api.observers;
                    if (typeof fn === "function") {
                        observers[eventName] = observers[eventName] || [];
                        observers[eventName].push(fn);
                    }
                },
                detachEvent: function (eventName, fn) {
                    var observers = api.observers;
                    observers[eventName] = (observers[eventName] || []).filter(function (observer) { return observer !== fn });
                },
                createEvent: function (eventName, parameters) {
                    return {
                        getParameter: function (paramName) { return parameters[paramName]; },
                        getParameters: function () { return parameters; },
                        getId: function () { return eventName; }
                    };
                },
                fireEvent: function (eventName, parameters) {
                    var observers = api.observers;
                    var evt = api.createEvent(eventName, parameters);
                    (observers[eventName] || []).concat().forEach(function (observer) {
                        try {
                            observer.__once && api.detachEvent(eventName, observer);
                            observer(evt);
                        } catch (e) {
                            console.error(e);
                        }
                    });
                },
                cleanup: function () {
                    api.observers = {};
                }
            };
            return api;
        }
    }
});
