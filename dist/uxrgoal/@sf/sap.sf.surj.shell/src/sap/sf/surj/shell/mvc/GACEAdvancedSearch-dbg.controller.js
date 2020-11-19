
/**
 * @class
 * @extends sap.ui.core.Control
 * @name sap.sf.surj.shell.core.BizXResourceModel
 */

sap.ui.define('sap/sf/surj/shell/mvc/GACEAdvancedSearch.controller', [
           'jquery.sap.global',
           'sap/ui/core/mvc/Controller',
           'sap/sf/surj/shell/util/SearchUtil',
           'sap/sf/surj/shell/controls/SearchInput',
           'sap/ui/core/ValueState'
          ], function($, Controller, SearchUtil, SearchInput, ValueState) {

    "use strict";
    var oCore = sap.ui.getCore();
    var rb = oCore.getLibraryResourceBundle('sap.sf.surj.shell.i18n');
    var sPhotoNotAvailable;
    var dateFromTemp;
    var dateToTemp;

    return Controller.extend('sap.sf.surj.shell.mvc.GACEAdvancedSearch', /** @lends sap.sf.surj.shell.mvc.GACEAdvancedSearch.prototype */ {
        onInit : function() {
        	this._errorMap = {};
        },

        onAfterRendering : function(){
            var that = this;
            var oView = this.getView();
            this.mModel = oView.getModel();
            this.mModel.setProperty('/columnViewSettings', {
                "CONTINGENTWORKER": true,
                "LOCATION": true,
                "DIVISION": true,
                "DEPARTMENT": true,
                "JOBTITLE": true,
                "EMAIL": true,
                "STATUS": true
            });
            this.mModel.setSizeLimit(1000);
            // Once the advanced search results page is rendered, get the scroll delegate
            var oPage = oCore.byId(oView.getId() + '-advancedSearchResults');
            oPage.addEventDelegate({
                onAfterRendering : function() {
                    var oScrollDelegate = that.oScrollDelegate = oPage.getScrollDelegate();
                    if (oScrollDelegate) {
                        oScrollDelegate.setGrowingList($.proxy(that.checkScrollPosition, that));
                    }
                }
            });
            //Set table properties
            var oTable = oCore.byId(oView.getId() + '-searchResultsTable');
            oTable.setShowNoData(false);
        },

        onTogglePress : function(oEvt){
        	var oView = this.getView();
        	var aCheckBoxItems = oCore.byId(oView.getId() + '-advancedSearchCheckBox');
        	if(oEvt.getSource().getPressed()){
        		aCheckBoxItems.setVisible(true);
        	}else{
        		aCheckBoxItems.setVisible(false);
        	}
        },

        search : function(oEvt) {
            this.clearSearchResults();
            var oCriteria = this.createAdvancedSearchCriteria();
            var oPromise = SearchUtil.search("GACEAdvancedSearch", oCriteria);
            this.handleSearchPromise(oPromise);
            this.navigateToSearchResults();
        },

        handleSearchPromise : function(oPromise) {
            this._lastSearchPromise = oPromise;
            this.showLoading(oPromise);
            oPromise.done($.proxy(this.handleSearchResult, this));
            oPromise.fail($.proxy(this.handleSearchError, this));
        },

        handleSearchResult : function(oResponse) {
            this._lastResponse = oResponse;
            var aResponseItems = oResponse.items || [];
            var aResponseItemsNew = [];
            var oSettings = pageHeaderJsonData.settings;
            var bIsEmploymentBasedResultScope = !(oSettings && oSettings["advancedPersonSearch.personBased"] === 'true');
            var sResultScope = this.mModel.getProperty('/additionalCriteria/resultScope');

            // override settings if search scope is given through additionalCriteria
            /^(employment|person)$/i.test(sResultScope) && (bIsEmploymentBasedResultScope = /^(employment)$/i.test(sResultScope));
            // Check for Multiple Employments: GA/CE scenario
            for (var i = 0; i < aResponseItems.length; i++) {
                var oResponseItem = aResponseItems[i];
                var employments = oResponseItem.employments;
                var inactiveText = rb.getText('COMMON_InActive');
                var activeText = rb.getText('COMMON_Active');
                if (employments.length > 1) {
                    //Flatten out the structure to display data in different rows with Icons to tell if it is GA/CE scenario:
                    for (var j = 0; j < employments.length; j++) {
                        var newItem = $.extend({}, oResponseItem);
                        var employmentsRecord = oResponseItem.employments[j];
                        employmentsRecord.userId = employmentsRecord.assignmentId;
                        var newEmploymentsArray = [];
                        newEmploymentsArray.push(employmentsRecord);
                        newItem.primaryEmploymentUserId = newItem.assignmentId;
                        newItem.userId = employmentsRecord.userId;
                        newItem.employments = newEmploymentsArray;
                        if (!employments[j].title ){
                        	employments[j].title = "";
                        }
                        if (employments[j].isHomeAssignment === "true") {
                            newItem.sIconName = "sap-icon://home";
                            newItem.sTooltip = rb.getText('COMMON_Home_Assignment'); //"Home Assignment";
                        } else if (employments[j].employmentType == "GA") {
                            newItem.sIconName = "sap-icon://world";
                            newItem.sTooltip = rb.getText('COMMON_Global_Assignment'); //"Global Assignment";
                        }
                        if (employments[j].isPrimaryEmployment === "true") {
                            newItem.sIconName = "sap-icon://favorite";
                            newItem.sTooltip = rb.getText('COMMON_Primary_Employment');//"Primary Employment";
                        }
                        if (bIsEmploymentBasedResultScope && employments[j].hasOwnProperty('isContingentWorker')) {
                            newItem.isContingentWorker = employments[j].isContingentWorker;
                        }
                        if (j > 0) {
                            newItem.sDuplicate = "duplicate";
                        } else {
                            newItem.oUserPhoto = { photoSrc: this.getPhotoSrc(newItem) };
                        }
                        employments[j].status = (employments[j].isActive == "false") ? inactiveText : activeText;
                        aResponseItemsNew.push(newItem);
                    }
                } else {
                	//copy assignment Id to userId for the oData call
                	oResponseItem.userId = oResponseItem.assignmentId;
                	var employmentRecord = oResponseItem.employments[0];
                	if (employmentRecord) {
                	    if (!employmentRecord.title ) {
                	        //Title is N/A if no employments record or if single employment with no title maintained
                	        oResponseItem.employments[0].title = "";
                	    }
                        if (bIsEmploymentBasedResultScope && employmentRecord.hasOwnProperty('isContingentWorker')) {
                            oResponseItem.isContingentWorker = employmentRecord.isContingentWorker;
                        }
                	    employmentRecord.status = (employmentRecord.isActive == "false") ? inactiveText : activeText;
                	    oResponseItem.employments[0].userId = employmentRecord.assignmentId;
                    }
                    oResponseItem.oUserPhoto = { photoSrc: this.getPhotoSrc(oResponseItem) };
                    aResponseItemsNew.push(oResponseItem);
                }
            }
            // Get the current items from the model, and then append the response items
            var aModelItems = this.mModel.getProperty('/searchResultItems') || [];
            aModelItems.push.apply(aModelItems, aResponseItemsNew);
            // Save the current scroll position before adding the items
            this._scrollPosition = !this.oScrollDelegate ? { x: 0, y: 0 } : {
                x: this.oScrollDelegate.getScrollLeft(),
                y: this.oScrollDelegate.getScrollTop()
            };
            this.mModel.setProperty('/searchResultItems', aModelItems);
            var columnVisibilityData = {
                    "CONTINGENTWORKER": true,
                    "LOCATION": true,
                    "DIVISION": true,
                    "DEPARTMENT": true,
                    "JOBTITLE": true,
                    "EMAIL": true
            };
            for(var j=0; j<oResponse.columnVisibility.length; j++){
            	var key = oResponse.columnVisibility[j].key;
            	columnVisibilityData[key] = (oResponse.columnVisibility[j].value == "true") ? true : false;
            }
            this.mModel.setProperty('/columnVisiblity', columnVisibilityData);

            //Show no data text if there are no records
            if (oResponse.items.length == 0) {
                var oView = this.getView();
                var oTable = oCore.byId(oView.getId() + '-searchResultsTable');
                oTable.setShowNoData(true);
            }
        },

        resultsUpdateFinished : function() {
            var firstRow = this.getView().searchResultsTable.getItems()[0];
            firstRow && firstRow.focus();
            if (this.oScrollDelegate) {
                // Reset the scroll position to just before adding the new result items
                this.oScrollDelegate.scrollTo(this._scrollPosition.x, this._scrollPosition.y, 0);
                this.checkScrollPosition();
            }
        },

        handleSearchError : function(sErrorMessage, ex) {
            // TODO: Handle an error from the search
        },

        loadMore: function() {
            if (this._lastResponse && this._lastResponse.more) {
                var oPromise = this._lastResponse.more();
                this._lastResponse = null;
                this.handleSearchPromise(oPromise);
            }
        },

        createAdvancedSearchCriteria: function() {
            var fieldValues = this.mModel.getProperty('/textSearchFieldValue');
            var selectedFieldValues = this.mModel.getProperty('/selectedFieldValues');
            var searchParams = [];
            var param;
            for (var key in fieldValues) {
                    //Check if the data has to come from Search Input Combo or from a simple Search String:
                    if (selectedFieldValues.hasOwnProperty(key)) {
                    	param = {};
                        var names = [];
                        var nameWithExternalCode = fieldValues[key];
                        if (nameWithExternalCode){
		                    //names.push(name);
		                    names.push(nameWithExternalCode);
	                    	var ids = [];
	                    	var id = selectedFieldValues[key].id;
	                        ids.push(id);
	                        param = {
	                            "key": key,
	                            "ids": ids,
	                            "values": names
	                        };
                        }
                    } else {
                        var value = fieldValues[key];
                        value = value && value.trim();
                        if (value === "" || value === null) {
                            continue;
                        }
                        var values = [];
                        values.push(value);
                        param = {
                            "key": key,
                            "values": values
                        };
                    }
                    param.key && searchParams.push(param);
            }
            //STE-4382: If dynamic group value is provided by adopter then populate the same in the criteria params:(Generic code to cater to any field where value is supplied by adopter)
            var advFields = this.mModel.getProperty('/AdvancedFields');
            for(var k=0; k<advFields.length; k++){
            	if(advFields[k].selectedValue){
            		var ids = [];
                	var id = advFields[k].selectedValue;
                    ids.push(id);
                    param = {
                        "key": advFields[k].field,
                        "ids": ids
                    };
                    param.key && searchParams.push(param);
            	}
            }
            //Read Additional Criteria:
            var oAdditionalCriteria = this.mModel.getProperty('/additionalCriteria');
            oAdditionalCriteria = $.extend({
                oDataVersion: this.mModel.getProperty('/oDataServiceKey'),
                searchParameters: searchParams
            }, oAdditionalCriteria);
            return oAdditionalCriteria;
        },

        clearSearchResults : function() {
            this._lastSearchPromise = null;
            this._lastResponse = null;
            this.mModel.setProperty('/searchResultItems', []);
        },

        showLoading: function(oPromise){
            var oModel = this.mModel;
            if (oPromise.state() == "pending"){
                oModel.setProperty('/busy', true);
                oPromise.always(function(){
                    oModel.setProperty('/busy',false);
                });
            }
        },

        checkScrollPosition: function(){
            if (this.isScrolledBottom()){
                this.loadMore();
            }
        },

        isScrolledBottom: function(){
            if (this.oScrollDelegate){
                var scrollTop = this.oScrollDelegate.getScrollTop();
                var maxScrollTop = this.oScrollDelegate.getMaxScrollTop();
                return ((maxScrollTop - scrollTop) < 20 );
            }
            return false;
        },

        navigateToSearchResults : function() {
            this.mModel.setProperty('/view', 'searchResults');
            var oView = this.getView();
            oCore.byId(oView.getId() + '-advancedSearchContainer').to(oView.getId() + '-advancedSearchResults');
        },

        back :function(oEvt){
            this.mModel.setProperty('/view', 'searchFields');
            var oView = this.getView();
            oCore.byId(oView.getId() + '-advancedSearchContainer').to(oView.getId() + '-advancedSearchFields');
            var oTable = oCore.byId(oView.getId() + '-searchResultsTable');
            if (oTable.getShowNoData()) {
                oTable.setShowNoData(false);
            }
        },

        selectUser : function(oEvent) {
        	var oView = this.getView();
        	var table = oCore.byId(oView.getId() + '-searchResultsTable');
        	var tableData = table.getModel().getData().searchResultItems;
        	var selectedItem;
        	for (var i = 0; i < tableData.length; i++) {
        	    if (tableData[i].selectedItem) {
        	        selectedItem = tableData[i];
        	    }
        	}
        	var oSource = this.mModel.getProperty('/source');
        	if (oSource instanceof SearchInput) {
        	    var sTitle = selectedItem && selectedItem.employments[0] && selectedItem.employments[0].title;
        	    var displayValue = selectedItem && selectedItem.name;
        	    if (sTitle) {
        	    	displayValue = rb.getText('COMMON_Person_AutoComplete_Title_And_Location', [displayValue, sTitle]);
        	    }
        	    oSource.setValue(displayValue);
        	    oSource.setObjectValue(selectedItem, true);
        	    oSource.fireItemSelected({
        	        selectedItem: selectedItem
        	    });
        	}
            var fCallback = this.mModel.getProperty('/callback');
            if (typeof fCallback == 'function') {
                fCallback(selectedItem);
            }
        	this.getView().getParent().close();
        },

        cancelSearch : function() {
            this.getView().getParent().close();
        },

        selectSearchResult : function(evt) {
            var oItem = evt.getParameter("selectedItem");
            var oSource = evt.getSource();
            var oField = oSource.getBindingContext().getObject();
            this.clearChildFields(oField, oItem.code);
            this.mModel.setProperty("/selectedFieldValues/" + oField.field, oItem);
            if (oSource.getValueState() == ValueState.Error){
            	oSource.setValueState(ValueState.None);
            	this._errorMap[oField.field] = false;
            	this._updateSearchButtonState();
            }
        },

        clearChildFields : function(oField, newItemCode) {
        	var oldValue = this.mModel.getProperty("/selectedFieldValues/" + oField.field);
            //Check if there are child Fields & clear their values
            if(oField.childFields && oField.childFields.length > 0){
            	var selectedFieldValues = this.mModel.getProperty('/selectedFieldValues');
            	for(var i=0; i<oField.childFields.length; i++){
            		var childField = oField.childFields[i];
            		var oldCode = oldValue && oldValue.code;
            		if (selectedFieldValues.hasOwnProperty(childField) && oldCode != newItemCode){
            			this.mModel.setProperty("/selectedFieldValues/" + childField, '');
            			this.mModel.setProperty("/textSearchFieldValue/" + childField, '');
            		}
            	}
            }
        },

        onChange: function(evt) {
            var oSource = evt.getSource();
            this._validateInput(oSource);
        },

        onDateTypeStringInputChange: function(evt) {
            var oSource = evt.getSource();
            this._validateDateTypeStringInput(oSource);
        },

        //validate the length of search value of 'string' data type
        //will popup exception hints when exceed the maximum length
        _validateDateTypeStringInput: function (oSource) {
            var oObject = oSource.getBindingContext().getObject();
            var oField = oObject.field;
            var oText = oSource.getValue().trim();
        	if (oText.length > 100) {
        	     oSource.setValueState(ValueState.Error);
                 this._errorMap[oField] = true;
        	} else if (oSource.getValueState() == ValueState.Error) {
                 oSource.setValueState(ValueState.None);
                 this._errorMap[oField] = false;
            }
            //Enable/disable the Search button in the Advanced Search popup
            this._updateSearchButtonState();
        },


        onHireDateChange: function(evt) {
            var oSource = evt.getSource();
            //Format the date value
            var oDateFormat = sap.ui.core.format.DateFormat.getInstance({pattern: "yyyy-MM-dd"});
            var oDateObject = oSource.getDateValue();
            var oDate = oDateFormat.format(oDateObject);
            oSource.setValue(oDate);

            //todo:如果是字符串。自动parse成date
            //Save DateTemp to make sure fromDate is before toDate.
            var oObject = oSource.getBindingContext().getObject();
            if(oObject.field == "HIRE_DATE_FROM") {
                dateFromTemp = oDateObject;
            } else {
                dateToTemp = oDateObject;
            }
            this._validateHireDate(oSource);
        },

        //FromDate must be before ToDate.
        _validateHireDate: function(oSource) {
            var oObject = oSource.getBindingContext().getObject();
            var oField = oObject.field;
            if (dateFromTemp != null && dateToTemp != null) {
                if (dateFromTemp > dateToTemp) {
                    // Error: Invalid data entered in the SearchInput field
                    oSource.setValueState(ValueState.Error);
                    this._errorMap[oField] = true;
                }else {
                    oSource.setValueState(ValueState.None);
                    this._errorMap[oField] = false;
                }
            } else if (oSource.getValueState() == ValueState.Error) {
                //When only 1 Date has value.
                oSource.setValueState(ValueState.None);
                this._errorMap[oField] = false;
            }
            //Enable/disable the Search button in the Advanced Search popup
            this._updateSearchButtonState();
        },

        _validateInput: function(oSource) {
            //Do the validations to ensure that the correct value is selected
            var oText = oSource.getValue().trim();
            var oObject = oSource.getBindingContext().getObject();
            var oField = oObject.field;
            var selectedFieldValues = this.mModel.getProperty('/selectedFieldValues');
            if (oText) {
                if (selectedFieldValues.hasOwnProperty(oField)) {
                    var selectedField = selectedFieldValues[oField];
                    var selectedName = selectedField.name;
                    if (selectedField.code) {
                        selectedName = selectedName + ' (' + selectedField.code + ')';
                    }
                    //check if the selected value & the text in the Autocomplete field match
                    if (selectedName !== oText) {
                        // Error: Invalid data entered in the SearchInput field
                        oSource.setValueState(ValueState.Error);
                        this._errorMap[oField] = true;
                    }
                } else {
                    //Error: No value selected from the suggestion items
                    oSource.setValueState(ValueState.Error);
                    this._errorMap[oField] = true;
                }
            } else if (oSource.getValueState() == ValueState.Error) {
                oSource.setValueState(ValueState.None);
                this._errorMap[oField] = false;
            } else if (selectedFieldValues[oField]){
            	//Clear previous selected value
            	var oItem = {};
            	this.mModel.setProperty("/selectedFieldValues/" + oField, oItem);
            	this.clearChildFields(oObject, oText);
            }
            //Enable/disable the Search button in the Advanced Search popup
            this._updateSearchButtonState();
        },

        _updateSearchButtonState: function() {
            var oEnabled = true;
            for (var key in this._errorMap) {
                if (this._errorMap[key] === true) {
                    oEnabled = false;
                    break;
                }
            }
            oCore.byId(this.getView().getId() + '-searchButton').setEnabled(oEnabled);
        },

        /**
         * Returns a string or an object contining the source of the given Employee Search Result item's photo,
         * if the user has permission to see it, or null otherwise.
         * @param {Object} oResultItem  Employee Search Result Item
         * @return {String|Object}
         * @protected
         */
        getPhotoSrc: function (oResultItem) {
            var sPhotoSrc = null;
            if (!oResultItem) {
                return sPhotoSrc;
            }
            if (oResultItem.legacyItem) {
                oResultItem = oResultItem.legacyItem;
            }
            if (oResultItem.UserId || oResultItem.userId || oResultItem.photoUrl || oResultItem.photoSrc) {
                if (this.getPhotoViewPermission()) {
                    // handle case when RBP does not allow user image to be visible, a.k.a. oResultItem.photoViewable = false;
                    if (!oResultItem.photoViewable) {
                        if (!sPhotoNotAvailable) {
                            sPhotoNotAvailable = sap.ui.resource('sap.sf.surj.shell.img.userphoto', 'UserPhotoPlaceholder_50x50.png');
                        }
                        sPhotoSrc = sPhotoNotAvailable;
                    } else {
                        sPhotoSrc = oResultItem.photoUrl || oResultItem.photoSrc;
                    }
                    if (!sPhotoSrc) {
                        sPhotoSrc = {
                            userId: oResultItem.UserId || oResultItem.userId || '',
                            urlType: 'eduPhoto',
                            photoType: 'face',
                            mod: oResultItem.photoMod
                        };
                    }
                }
            }
            return sPhotoSrc;
        },

        /**
         * Returns `true` if the user has permission to see an Employee Search Result item's photo, or `false` otherwise.
         * @return {Boolean}
         * @protected
         */
        getPhotoViewPermission: function () {
            var oSettings = $.sap.getObject('pageHeaderJsonData.settings');
            return (oSettings && oSettings['autocomplete.enablePhoto'] === 'true') || $('#autocomplete\\.enablePhoto').attr('content') === 'true';
        }
    });
});
