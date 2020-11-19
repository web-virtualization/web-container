sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/Renderer',
    'sap/m/ListItemBaseRenderer'
], function($, Renderer, ListItemBaseRenderer) {
    var USE_SEMANTIC = ListItemBaseRenderer.apiVersion > 1;
    var oRenderer = $.extend(Renderer.extend(ListItemBaseRenderer), {
        /**
         * @param {sap.ui.core.RenderManager} oRm
         * @param {sap.sf.surj.shell.BizXMenuListItem} oLI
         */
        renderLIAttributes : function(oRm, oLI) {
            var sIcon = oLI.getIcon();
            var sUrl = oLI.getUrl();
            var sTarget = oLI.getTarget();
            var sOnclick = oLI.getOnclick();
            var aClasses = ['bizXMLIA', 'globalMenuItem', 'bizXMenuListItem'];
            if (sIcon) {
                aClasses.push('hasIcon');
            }
            if (sUrl && sUrl.indexOf('javascript:void(0)') > -1) {
                sUrl = null;
            }
            if (USE_SEMANTIC) {
                aClasses.forEach(function(sClass) {
                    oRm.class(sClass);
                });
                if (sUrl) {
                    oRm.attr('href', sUrl);
                } else {
                    oRm.attr('href', '#');
                    oRm.attr('data-preventClickDefault', 'true');
                }
                if (sOnclick) {
                    oRm.attr('data-onclick', sOnclick);
                }
                if (sTarget) {
                    oRm.attr('target', sTarget);
                }
            } else {
                aClasses.forEach(function(sClass) {
                    oRm.addClass(sClass);
                });
                if (sUrl) {
                    oRm.write(' href="');
                    oRm.writeEscaped(sUrl);
                    oRm.write('"');
                } else {
                    oRm.write(' href="#"');
                    oRm.write(' data-preventClickDefault="true"');
                }
                if (sOnclick) {
                    oRm.write(' data-onclick="', sOnclick, '"');
                }
                if (sTarget) {
                    oRm.write(' target="', sTarget, '"');
                }
            }
        },
        
        getAriaRole : function() {
            return 'menuitem';
        },
        
        openItemTag : function(oRm, oLI) {
            oLI.TagName = 'a';
            if (USE_SEMANTIC) {
                oRm.openStart('a', oLI);
            } else {
                oRm.write('<a');
            }
        },
        
        closeItemTag : function(oRm, oLI) {
            if (USE_SEMANTIC) {
                oRm.close('a');
            } else {
                oRm.write('</a>');
            }
        },

        /**
         * @param {sap.ui.core.RenderManager} oRm
         * @param {sap.sf.surj.shell.BizXMenuListItem} oLI
         */
        renderLIContentWrapper : function(oRm, oLI) {
            var sIndicatorText = oLI.getIndicatorText();
            var sLabel = oLI.getLabel();
            var sIcon = oLI.getIcon();
            if (sIcon) {
                oRm.renderControl(oLI._getImage((oLI.getId() + "-img"), "bizXMenu", oLI.getIcon(), false));
            }
            if (USE_SEMANTIC) {
                if (sLabel) {
                    oRm.text(sLabel);
                }
                if (sIndicatorText) {
                    oRm.openStart('span', oLI);
                    oRm.class('surjIndicatorText');
                    oRm.openEnd('span');
                    oRm.text(sIndicatorText);
                    oRm.close('span');
                }
            } else {
                if (sLabel) {
                    oRm.writeEscaped(sLabel);
                }
                if (sIndicatorText) {
                    oRm.write('<span class="surjIndicatorText">');
                    oRm.writeEscaped(sIndicatorText);
                    oRm.write('</span>');
                }
            }
        }
    });

    /**
     * The renderer.
     * 
     * @name sap.sf.surj.shell.BizXMenuListItemRenderer
     */
    $.sap.setObject('sap.sf.surj.shell.controls.BizXMenuListItemRenderer', oRenderer);

    return oRenderer;
});