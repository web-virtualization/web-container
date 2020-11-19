sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/m/MessageToast',
	'sap/ui/core/ComponentContainer',
], function (Controller, JSONModel, MessageToast, ComponentContainer) {
	'use strict';
	return Controller.extend('sap.sf.consume.controller.Sample', {
		onInit: function () {

			var inputParam = {
				"selectedIds": [],
				"filterByCompetencyDetails": {
					"competencyIds": [],
					"behaviorIds": [],
					"libraryCategoryMap": [],
					"locale": "en_US"
				},
				"allowUserToChangeSelection": true,
				"useBehavior": false,
				"showByRolesTab": false,
				"selectionByCoreCompetency": false
			};

			var oModel;
			oModel = new JSONModel({
				filterData: JSON.stringify(inputParam, undefined, 4),
				inputLabels: JSON.stringify({
					dialogTitle: "Add Competencies",
					masterPageHeaderTitle: "Select Competencies",
					detailPageHeaderTitle: "Selected Competencies",
					detailPageFooterTitle: "Add"
				}, undefined, 4),
				bEnableButton: false
			});
			this.getView().setModel(oModel, "view");

		},

		onPress: function () {
			this._loadPicker();
		},

		_loadPicker: function () {
			var data = this.getView().getModel("view").getData();
			var inputParam = JSON.parse(data.filterData);
			var inputTitle = JSON.parse(data.inputLabels);
			sap.ui.component({
				name: "sap.sf.competencypicker",
				componentData: {
					inputParam: inputParam,
					inputTitle: inputTitle
				},
				manifest: true
			}).then(function (oPickerComp) {
				oPickerComp.attachCompetenciesSelected(this.onCompetenciesSelected.bind(this));
				this._oPickerComp = oPickerComp;
				this.getView().getModel("view").setProperty("/bEnableButton", true)
			}.bind(this)).catch(function (oError) {
				jQuery.sap.log.error(oError);
			});
		},

		openPicker:function(){
			this._oPickerComp.onOpenPickerDialog();
		},

		onCompetenciesSelected: function (oEvent) {
			var oSelectedItems = oEvent.getParameter("selectedItems");
			var selectedIds = '';
			oSelectedItems.forEach(competency => {
				selectedIds = selectedIds.concat(', '+competency.id);
			})
			MessageToast.show("Selected Competencies: " + selectedIds);
			console.log(selectedIds);
		},

		onExit: function () {}
	});
});