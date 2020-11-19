sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/UIComponent",
	"sap/m/Button",
	"sap/ui/model/json/JSONModel",
	"sap/sf/competencypicker/controls/CompetencyPicker",
	"sap/ui/Device",
], function ($,UIComponent, Button, JSONModel, CompetencyPicker, Device) {
	"use strict";
	var Component = UIComponent.extend("sap.sf.competencypicker.Component", {
		metadata : {
			manifest: "json",
			properties : {
				inputParam: {type : "object", defaultValue : {} },
				inputTitle: {type: "object", defaultValue: {} }
			},
			events : {
				competenciesSelected : {
					parameters : {
					  selectedItems : {type : "object"}
					}
				}
			}
		}
	});

	//=============================================================================
	//LIFECYCLE APIS
	//=============================================================================

	Component.prototype.init = function () {
	    var defaultInput = {
			selectedIds: [],
			filterByCompetencyDetails: {
				competencyIds: [],
				behaviorIds: [],
				libraryCategoryMap: [],
				locale: "en_US"
			},
			allowUserToChangeSelection: true,
			useBehavior: false,
			showByRolesTab: false,
			selectionByCoreCompetency: false
		};

		var oModel;
		if(this.getComponentData()){
		    var _inputParam = this.getComponentData().inputParam;
			if(_inputParam){
                for(const [key, value] of Object.entries(defaultInput)){
                    if(!_inputParam.hasOwnProperty(key)){
                        _inputParam[key] = value;
                    }
                }
				this.setInputParam(_inputParam);
			}else{
			    this.setInputParam(defaultInput);
			}
			if(this.getComponentData().inputTitle){
				this.setInputTitle(this.getComponentData().inputTitle);
			}
		}else{
			this.setInputParam(defaultInput);
		}

		UIComponent.prototype.init.apply(this, arguments);
		oModel = new JSONModel({
			selectedCompetencies: []
		});
		oModel.setDefaultBindingMode("OneWay");
		this.setModel(oModel, "device");
	};

	Component.prototype.createContent = function() {
		var oDialog, oButton;
		oDialog = this._getCompetencyPickerDialog();
		return oDialog;
	};

	//=============================================================================
	//EVENT HANDLERS
	//=============================================================================

	Component.prototype.onOpenPickerDialog = function () {
		var oTSD = this._getCompetencyPickerDialog();
		oTSD.createDialog();
	};

	Component.prototype.onItemsSelected = function(oEvent){
		var oItems = oEvent.getParameter("selectedItems");
		var selectedCompetencies = [];

		oItems.forEach(item => {
		    var competency = {
                id:'',
                name:'',
                roleId:''
            };
			competency.id = item.internalId;
			competency.name = item.name;
			competency.roleId = item.roleId;
			selectedCompetencies.push(competency);
		});
		this.getModel("device").oData.selectedCompetencies = selectedCompetencies;
		this.fireCompetenciesSelected({
			selectedItems:selectedCompetencies
		});
	};

	//=============================================================================
	//PRIVATE APIS
	//=============================================================================

	Component.prototype._getCompetencyPickerDialog = function () {
		if (!this._oTSD) {
			var oCompData = this.getComponentData();
			this._oTSD = new CompetencyPicker();
			this._oTSD.setInputParam(this.getInputParam());
			this._oTSD.setInputTitle(this.getInputTitle());
			this._oTSD.setResourceBundle(this.getModel("i18n").getResourceBundle());
			this._oTSD.attachItemsSelected(this.onItemsSelected.bind(this));
		}
		return this._oTSD;
	};
	return Component;
});