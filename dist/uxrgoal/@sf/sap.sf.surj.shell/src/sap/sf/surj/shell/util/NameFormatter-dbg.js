
/**
 * @name sap.sf.surj.shell.util.NameFormatter
 */

sap.ui.define('sap/sf/surj/shell/util/NameFormatter', ['jquery.sap.global'], function ($) {

    var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
    var sUserDisplayName = rb.getText('COMMON_User_Display_Name') || '{0} {1} {2}';

    var NameFormatter = {
        /**
         * @return {Boolean}
         */
        isFirstNameFirst : function() {
            return INDEX_FN < INDEX_LN;
        },

        /**
         * Split a full name bean into 2 strings to display one on top of the
         * other. Using this function will ensure that the correct order will be
         * returned, and the middle initial will be applied to the correct
         * position.
         * 
         * @param {Object} user
         * @param {string} user.firstName
         * @param {string=} user.middleInitial Middle initial is optional
         * @param {string} user.lastName
         * @return {Array.<string>} An array containing the 2 lines split
         *         appropriately
         */
        splitFullName : function(user) {
            var result = [];
            var mi = user.middleInitial || user.mi || '';
            var fn = user.firstName || user.fn || '';
            var ln = user.lastName || user.ln || '';
            /*
             * If first and last name are not provided but full name is, then
             * return the split name based on the full name's first index of a
             * space. This is not very accurate, but it is the best we can do.
             */
            if (!fn && !ln && user.fullName) {
                var i = user.fullName.indexOf(' ');
                if (i >= 0) {
                    return [ user.fullName.substring(0, i), user.fullName.substring(i + 1) ];
                } else {
                    return [ user.fullName ];
                }
            }
            for (var idx = 0; idx < SPLIT_FORMAT.length; idx++) {
                var line = $.sap.formatMessage(SPLIT_FORMAT[idx], [fn, mi, ln]);
                if (!/^\s*$/.exec(line)) {
                    result.push(line);
                }
            }
            return result;
        },

        /**
         * Format a full name from individual name fragments.
         * 
         * @param {Object} oNameInfo The name information including first/last
         * @param {Boolean=} bHasMiddleName Default is true
         */
        format : function(oNameInfo, bHasMiddleName) {

            /** Test if a string is something that will be displayed */
            var isDisplayed = function(str) {
                return !(!str || 0 === str.length || /^\s*$/.test(str));
            }

            if (!oNameInfo) {
                return "";
            }

            if (typeof bHasMiddleName == 'undefined') {
                bHasMiddleName = true;
            }

            var fn = oNameInfo.firstName != null ? oNameInfo.firstName : "";
            var mi = oNameInfo.mi != null ? oNameInfo.mi : "";
            var ln = oNameInfo.lastName != null ? oNameInfo.lastName : "";

            if (!bHasMiddleName) {
                mi = "";
            }

            if (isDisplayed(fn) || isDisplayed(mi) || isDisplayed(ln)) {
                var msg = $.sap.formatMessage(sUserDisplayName, fn, mi, ln);
                msg = msg.trim();
                msg = msg.replace(/\s{2,}/g, " ");
                return msg;
            } else {
                return "";
            }
        }
    };

    var INDEX_FN = sUserDisplayName.indexOf('{0}');
    var INDEX_LN = sUserDisplayName.indexOf('{2}');

    var ORDER_SPLIT = {
        '012' : [ [ 0, 1 ], [ 2 ] ],
        '021' : [ [ 0 ], [ 2, 1 ] ],
        '120' : [ [ 1, 2 ], [ 0 ] ],
        '102' : [ [ 1, 0 ], [ 2 ] ],
        '201' : [ [ 2 ], [ 0, 1 ] ],
        '210' : [ [ 2 ], [ 1, 0 ] ]
    };

    /**
     * This is a long winded algorithm to handle every situation and it works.
     * Although, it is very difficult to understand.
     * 
     * @inner
     */
    var SPLIT_FORMAT = (function() {
        var names = [];
        var included = 0;
        for (var idx = 0; idx < 3; idx++) {
            var formatIndex = sUserDisplayName.indexOf('{' + idx + '}');
            if (formatIndex >= 0) {
                included++;
            }
            names.push({
                index : idx,
                included : formatIndex >= 0,
                formatIndex : formatIndex
            });
        }
        switch (included) {
        case 0:
            return null;
        case 1:
            return [ sUserDisplayName ];
        case 2:
            if (names[1].included) {
                return [ sUserDisplayName ];
            }
            // Fallthrough intentional
        case 3:
            var ordered = names.concat();
            ordered.sort(function(one, two) {
                if (one.included && two.included) {
                    return one.formatIndex < two.formatIndex ? -1 : 1;
                } else {
                    return one.included ? -1 : two.included ? 1 : 0;
                }
            });
            var orderComp = "";
            for (var idx = 0; idx < 3; idx++) {
                orderComp += ordered[idx].index;
                if (ordered[idx].included) {
                    var lastIncluded = idx - 1;
                    while (lastIncluded >= 0 && !ordered[lastIncluded].included) {
                        lastIncluded--;
                    }
                    var regex = lastIncluded < 0 ? '^' : '\\{' + ordered[lastIncluded].index + '\\}[^\\s\\{]*';
                    regex += '(.*\\{' + ordered[idx].index + '\\}';
                    if (idx == 2) {
                        regex += ".*)$";
                    } else {
                        regex += '[^\\s\\{]*)';
                    }
                    ordered[idx].message = new RegExp(regex).exec(sUserDisplayName)[1];
                }
            }
            var split = ORDER_SPLIT[orderComp];
            var result = [];
            for (var idx = 0; idx < split.length; idx++) {
                var lineHasIndices = split[idx];
                var line = "";
                for (var jdx = 0; jdx < lineHasIndices.length; jdx++) {
                    var name = names[lineHasIndices[jdx]];
                    if (name.included) {
                        line += name.message;
                    }
                }
                result.push(line);
            }
            return result;
        }
    })();

    $.sap.setObject('sap.sf.surj.shell.util.NameFormatter', NameFormatter);
    return NameFormatter;
});