/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.sf.surj.shell.controls.Table.
jQuery.sap.declare("sap.sf.surj.shell.controls.Table");
jQuery.sap.require("sap.sf.surj.shell.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new Table.
 * 
 * Accepts an object literal <code>mSettings</code> that defines initial 
 * property values, aggregated and associated objects as well as event handlers. 
 * 
 * If the name of a setting is ambiguous (e.g. a property has the same name as an event), 
 * then the framework assumes property, aggregation, association, event in that order. 
 * To override this automatic resolution, one of the prefixes "aggregation:", "association:" 
 * or "event:" can be added to the name of the setting (such a prefixed name must be
 * enclosed in single or double quotes).
 *
 * The supported settings are:
 * <ul>
 * <li>Properties
 * <ul></ul>
 * </li>
 * <li>Aggregations
 * <ul></ul>
 * </li>
 * <li>Associations
 * <ul></ul>
 * </li>
 * <li>Events
 * <ul></ul>
 * </li>
 * </ul> 

 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * @extends sap.ui.core.Control
 * @version 1.0.2-SNAPSHOT
 *
 * @constructor
 * @public
 * @name sap.sf.surj.shell.controls.Table
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.sf.surj.shell.controls.Table", { metadata : {

	library : "sap.sf.surj.shell"
}});


/**
 * Creates a new subclass of class sap.sf.surj.shell.controls.Table with name <code>sClassName</code> 
 * and enriches it with the information contained in <code>oClassInfo</code>.
 * 
 * <code>oClassInfo</code> might contain the same kind of informations as described in {@link sap.ui.core.Element.extend Element.extend}.
 *   
 * @param {string} sClassName name of the class to be created
 * @param {object} [oClassInfo] object literal with informations about the class  
 * @param {function} [FNMetaImpl] constructor function for the metadata object. If not given, it defaults to sap.ui.core.ElementMetadata.
 * @return {function} the created class / constructor function
 * @public
 * @static
 * @name sap.sf.surj.shell.controls.Table.extend
 * @function
 */

// Start of sap/sf/surj/shell/controls/Table.js
/*!
 * ${copyright}
 */

/**
 * An <code>sap.m.Table</code> extension with column resizing support. 
 *
 * @class
 * @extends sap.m.Table
 * @name sap.sf.surj.shell.controls.Table
 */
sap.ui.define([
  'jquery.sap.global',
  'sap/m/Table'
], function ($, MTable) {
  'use strict';

  var RESIZING_COLUMN_TABLE_CLASS_NAME = 'surjTableWithResizingColumn';
  var RESIZING_COLUMN_CLASS_NAME = 'resizingColumn';
  var MIN_WIDTH = 8; // 8px === .5rem
  var RESIZE_CHAR = '\ue24f';

  /**
   * Constructor for a new <code>sap.sf.surj.shell.controls.Table</code> control instance.
   *
   * @param {String} [sId] ID for the new control, generated automatically if no ID is given
   * @param {Object} [mSettings] Initial settings for the new control
   *
   * @class
   * As an extension of the <code>sap.m.Table</code> control, <code>sap.sf.surj.shell.controls.Table</code>
   * supports all features and capabilities of its parent class, to which it adds its own custom features.
   * Such a feature is its column resizing mode and the <code>useResizableColumns</code> option,
   * which serves to enables/disables this mode.
   * 
   * @version ${version}
   *
   * @extends sap.m.Table
   *
   * @since B2005
   * @constructor
   * @public
   * @alias sap.sf.surj.shell.controls.Table
   */
  var Table = MTable.extend('sap.sf.surj.shell.controls.Table', /** @lends sap.sf.surj.shell.controls.Table.prototype */ {
    renderer: {},
    metadata: {
      properties: {
        /**
         * Setting this property to <code>true</code> enables column resizing mode,
         * while setting it to <code>false</code> will disables it.
         * However, only enabling this mode does not automatically make all columns
         * resizable (which by default are not).
         * Therefore it is necessary to specify which columns are resizable by setting
         * their build-in <code>styleClass</code> property to the public static property
         * <code>sap.sf.surj.shell.controls.Table.RESIZABLE_COLUMN_CLASS_NAME</code>.
         * Example:
         * 
         * <code>
          new sap.sf.surj.shell.controls.Table({
            useResizableColumns: true,
            columns: [
              new sap.m.Column({
                width: '40px',
                header: new sap.m.Label({
                  text: 'Non-resizable, Fixed Width Column'
                })
              }),
              new sap.m.Column({
                styleClass: sap.sf.surj.shell.controls.Table.RESIZABLE_COLUMN_CLASS_NAME,
                width: '50px',
                header: new sap.m.Label({
                  text: 'Resizable, Fixed Width Column'
                })
              }),
              new sap.m.Column({
                styleClass: sap.sf.surj.shell.controls.Table.RESIZABLE_COLUMN_CLASS_NAME,
                header: new sap.m.Label({
                  text: 'Resizable Column'
                })
              })
            ]
          })
         * </code>
         */
        useResizableColumns: {
          type: 'boolean',
          defaultValue: true
        }
      }
    },

    /**
     * @constructor
     * @public
     * @override
     */
    constructor: function () {
      MTable.apply(this, arguments);
      this._initColumnResize = this._initColumnResize.bind(this);
      this.addStyleClass('surjTable');
    },

    /**
     * @public
     * @override
     */
    destroy: function () {
      MTable.prototype.destroy.apply(this, arguments);
      this._initColumnResize = null;
    },

    /**
     * @public
     * @override
     */
    onAfterRendering: function () {
      MTable.prototype.onAfterRendering.apply(this, arguments);
      if (this.getUseResizableColumns()) {
        this._initColumnResize();
      }
      return this;
    },

    /**
     * Initializes the columns marked as resizable. Used when in 'ResizableColumns' mode.
     * 
     * @private
     */
    _initColumnResize: function () {
      var aColumns = this.getColumns();
      var iWidth, sInitialWidth, $col;

      // Iterate over each column
      for (var oCol, i = 0; i < aColumns.length; i++) {
        // If the column is resizable, then initialize it as a resizable column
        oCol = aColumns[i];
        $col = oCol.$();
        if ($col.hasClass(Table.RESIZABLE_COLUMN_CLASS_NAME)) {
          // Set the resize icon for the column
          oCol.data('surj-resize-icon', RESIZE_CHAR, true);

          // Set the column width
          iWidth = parseInt(oCol.getWidth(), 10);
          if (!iWidth) {
            iWidth = $col.width();
            oCol.setWidth(iWidth + 'px', true);
          }

          // Ensure that the initial width for the column has been assigned, either from
          // the control's instance argument or else from the width determined by the browser
          sInitialWidth = oCol.data('initialWidth');
          if (!sInitialWidth) {
            sInitialWidth = oCol.getWidth();
            oCol.data('initialWidth', sInitialWidth);
          }

          // Show a 'resize handle' (a 'resize' icon) on the column to indicate that it is resizable
          this._applyColumnResizeHandlers({
            $col: oCol.$(),
            $this: this.$(),
            oCol: oCol,
            sInitialWidth: sInitialWidth,
            iWidth: iWidth
          });
        }
      }
      return this;
    },

    /**
     * Registers mouse event handlers with the resizable columns when initializing
     * them in 'ResizableColumns' mode.
     * 
     * @private
     * @param {Object} oState The state of the column during the resizing event.
     */
    _applyColumnResizeHandlers: function (oState) {
      oState.bPressed = false;
      oState.iX = null;
      oState.iX0 = null;
      oState.iCrtWidth = oState.iWidth;
      oState.onColumnMouseMove = this._onColumnResizingMouseMove.bind(this, oState);
      oState.onColumnResizingMouseUp = this._onColumnResizingMouseUp.bind(this, oState);
      oState.$col
        .on('dblclick', this._onColumnDoubleClick.bind(this, oState))
        .on('mousedown', this._onColumnMouseDown.bind(oState.oCol.getDomRef(), oState));
      return this;
    },

    /**
     * Column 'double-click' event handler. When double-click on a column clear all values
     * and reset it to its initial width.
     * 
     * @private
     * @param {Object} oState The state of the column during the resizing event.
     * @param {jQuery.Event} $event The jQuery.Event instance
     */
    _onColumnDoubleClick: function (oState, $event) {
      oState.$col.width(oState.sInitialWidth);
      oState.oCol.setWidth(oState.sInitialWidth, true);
      oState.iX = oState.iX0 = null;
      oState.iCrtWidth = oState.iWidth;
      oState.bPressed = false;
      $event.stopPropagation();
      return false;
    },

    /**
     * Column 'mouse-down' event handler. When a column's 'resize' icon is clicked (on mousedown)
     * capture its current state (position and width) and the fact that it was pressed.
     * 
     * @private
     * @param {Object} oState The state of the column during the resizing event.
     * @param {jQuery.Event} $event The jQuery.Event instance
     */
    _onColumnMouseDown: function (oState, $event) {
      var oStyle = window.getComputedStyle ? window.getComputedStyle(this, null) : this.currentStyle;
      var iOffsetX = oStyle ? $event.offsetX + parseInt(oStyle.paddingRight, 10) : $event.offsetX;

      if (iOffsetX >= (this.offsetWidth - MIN_WIDTH) && iOffsetX <= this.offsetWidth) {
        oState.iX = oState.iX0 = $event.pageX - oState.$this.rect().left;
        oState.iCrtWidth = oState.$col.width();
        oState.bPressed = true;
        oState.$this.on('mousemove', oState.onColumnMouseMove).on('mouseup', oState.onColumnResizingMouseUp);
        $event.stopPropagation();
      }
      return false;
    },

    /**
     * Table 'mousedown' event handler. When a column's 'resize' icon is clicked (on mousedown)
     * and the mouse, while pressed, moves anywhere on the table (not only the column), its current
     * horizontal location serves to determine the intermediary width of the colum.
     * 
     * @private
     * @param {Object} oState The state of the column during the resizing event.
     * @param {jQuery.Event} $event The jQuery.Event instance
     */
    _onColumnResizingMouseMove: function (oState, $event) {
      if (oState.bPressed) {
        oState.$this.addClass(RESIZING_COLUMN_TABLE_CLASS_NAME);
        oState.$col.addClass(RESIZING_COLUMN_CLASS_NAME);
        oState.iX = $event.pageX - oState.$this.rect().left;
        oState.iCrtWidth = oState.iWidth + (oState.iX - oState.iX0);
        (oState.iCrtWidth < MIN_WIDTH) && (oState.iCrtWidth = MIN_WIDTH);
        if (Math.abs(oState.iWidth - oState.iCrtWidth) > MIN_WIDTH) {
          oState.$col.width(oState.iCrtWidth);
        }
        $event.stopPropagation();
      }
      return false;
    },

    /**
     * Table 'mouseup' event handler. When the mouse is released (on mouseup) somewhere
     * on the control, after a 'mousedown' on a column's 'resize' icon, its current
     * horizontal location serves to determine the final width of the colum.
     * 
     * @private
     * @param {Object} oState The state of the column during the resizing event.
     * @param {jQuery.Event} $event The jQuery.Event instance
     */
    _onColumnResizingMouseUp: function (oState, $event) {
      if (oState.bPressed) {
        oState.iX = $event.pageX - oState.$this.rect().left;
        oState.iCrtWidth = oState.iWidth + (oState.iX - oState.iX0);
        (oState.iCrtWidth < MIN_WIDTH) && (oState.iCrtWidth = MIN_WIDTH);
        if (Math.abs(oState.iWidth - oState.iCrtWidth) > MIN_WIDTH) {
          oState.$col.width(oState.iCrtWidth);
          oState.oCol.setWidth(oState.iCrtWidth + 'px', true);
        }
        $event.stopPropagation();
      }
      oState.$col.removeClass(RESIZING_COLUMN_CLASS_NAME);
      oState.$this
        .removeClass(RESIZING_COLUMN_TABLE_CLASS_NAME)
        .off('mousemove', oState.onColumnMouseMove)
        .off('mouseup', oState.onColumnResizingMouseUp);
      oState.iX = null;
      oState.iWidth = null;
      oState.bPressed = false;
      return false;
    }
  });

  /**
   * Style class applied to those columns intended to be resizable.
   * (Use <code>sap.m.Column</code>'s build-in property <code>styleClass</code>
   * property to apply this value.)
   *
   * @public
   * @static
   */
  Table.RESIZABLE_COLUMN_CLASS_NAME = 'surjTableResizableColumn';
  return Table;
});
