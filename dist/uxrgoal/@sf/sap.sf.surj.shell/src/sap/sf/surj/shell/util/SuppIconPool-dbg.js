
sap.ui.define('sap/sf/surj/shell/util/SuppIconPool', [
    'jquery.sap.global', 
    'sap/ui/core/IconPool'
    ], function ($, IconPool) {

    var CATEGORY = FONT_FAMILY = 'SF-supp-icons';

    /**
     * This will add all the SF-supp-icons to the IconPool. Formulate the icon
     * src like the following:
     * 
     * <code>sap-icon//SAP-supp-icons/iconName</code>
     * 
     * Example:
     * 
     * <pre>
     * var oIcon = new sap.ui.core.Icon({
     *     src:'sap-icon://SF-supp-icons/Due'
     * });
     * </pre>
     * 
     * @name SuppIconPool.js
     * @see http://gin.successfactors.com:8080/examples/SF-supp-icons/SF-supp-icons.html
     */
    $.each([

    /* Format: [ 'iconName', 'content' ] */

    [ 'Hierarchal Tree', 'e700' ],

    [ 'Open', 'e701' ],

    [ 'Blocked', 'e702' ],

    [ 'Partially Blocked', 'e703' ],

    [ 'Open Square', 'e704' ],

    [ 'Partially Adopted', 'e705' ],

    [ 'Due', 'e706' ],

    [ 'Overdue', 'e707' ],

    [ 'Sort', 'e708' ],

    [ 'Missing Parts', 'e709' ],

    [ 'Fire', 'e70A' ],

    [ 'Dangerous Chemicals', 'e70B' ],

    [ 'Share', 'e70C' ],

    [ 'Entertainment', 'e70D' ],

    [ 'Gift', 'e70E' ],

    [ 'Add Employee', 'e70F' ],

    [ 'Edit User Info', 'e710' ],

    [ 'Import', 'e711' ],

    [ 'Audio', 'e712' ],

    [ 'View Comment', 'e713' ],

    [ 'Steps', 'e714' ],

    [ 'Magnet', 'e715' ],

    [ 'Action Keyword', 'e716' ],

    [ 'Tile Browser', 'e717' ],

    [ 'Touchbase', 'e718' ],

    [ 'female', 'EFFF' ],

    [ 'male', 'EFFE' ],

    [ 'happy', 'EFFD' ],

    [ 'sad', 'EFFC' ],

    [ 'neutral', 'EFFB' ],

    [ 'building high', 'EFFA' ],

    [ 'building medium', 'EFF9' ],

    [ 'building low', 'EFF8' ],

    [ 'chart high', 'EFF7' ],

    [ 'chart medium', 'EFF6' ],

    [ 'chart low', 'EFF5' ],

    [ 'bar low', 'EFF4' ],

    [ 'bar medium', 'EFF3' ],

    [ 'bar high', 'EFF2' ],

    [ 'circle low', 'EFF1' ],

    [ 'circle medium', 'EFF0' ],

    [ 'circle full', 'EFEF' ],

    [ 'circle empty', 'EFEE' ],

    [ 'circle thick', 'EFED' ],

    [ 'key', 'EFEC' ],

    [ 'starburst', 'EFEB' ],

    [ 'group leader', 'EFEA' ],

    [ 'flag', 'EFE9' ],

    [ 'medal', 'EFE8' ],

    [ 'matrix', 'EFE7' ],

    [ 'hourglass', 'EFE6' ],

    [ 'sunset', 'EFE5' ],

    [ 'heart', 'EFE4' ],

    [ 'ring', 'EFE3' ],

    [ 'icon-heart', 'e000' ],

    [ 'icon-quarter', 'e001' ],

    [ 'icon-year', 'e002' ],

    [ 'icon-equalizer', 'e003' ],

    [ 'icon-component', 'e004' ],

    [ 'icon-component-private', 'e005' ],

    [ 'icon-raw-material', 'e006' ],

    [ 'icon-sms', 'e007' ],

    [ 'icon-add-note', 'e008' ],

    [ 'icon-change-time-horizon', 'e009' ],

    [ 'icon-table-chart-customization', 'e00a' ],

    [ 'icon-delegated-important-task', 'e00b' ],

    [ 'icon-forklift', 'e00c' ],

    [ 'icon-coins', 'e00d' ],

    [ 'icon-filter-menu', 'e00e' ],

    [ 'icon-target-to-date', 'e00f' ],

    [ 'icon-program', 'e010' ],

    [ 'icon-phase', 'e011' ],

    [ 'icon-checklist', 'e012' ],

    [ 'icon-mirrored-task', 'e013' ],

    [ 'icon-sub-project', 'e014' ],

    [ 'icon-checklist-item', 'e015' ],

    [ 'icon-adhoc-analysis', 'e016' ],

    [ 'icon-change-analysis', 'e017' ],

    [ 'icon-review-demands', 'e018' ],

    [ 'icon-project-definition', 'e019' ],

    [ 'icon-data-access', 'e01a' ],

    [ 'icon-define-shortage', 'e01b' ],

    [ 'icon-review-supplies', 'e01c' ],

    [ 'icon-change-log', 'e01d' ],

    [ 'icon-priority-1', 'e01e' ],

    [ 'icon-priority-2', 'e01f' ],

    [ 'icon-jam', 'e020' ],

    [ 'icon-milestone', 'e021' ],

    [ 'icon-bulleting-with-numbers', 'e022' ],

    [ 'icon-fs7-indent', 'e023' ],

    [ 'icon-increase-indent', 'e024' ],

    [ 'icon-bold', 'e025' ],

    [ 'icon-italic', 'e026' ],

    [ 'icon-strike-through', 'e027' ],

    [ 'icon-underline', 'e028' ],

    [ 'icon-save-as', 'e029' ],

    [ 'icon-segmentation', 'e02a' ],

    [ 'icon-context-menu', 'e02b' ],

    [ 'icon-snapshot', 'e02c' ],

    [ 'icon-subtraction-b-a', 'e02d' ],

    [ 'icon-subtraction-a-b', 'e02e' ],

    [ 'icon-intersection', 'e02f' ],

    [ 'icon-union', 'e030' ],

    [ 'icon-top', 'e031' ],

    [ 'icon-bottom', 'e032' ],

    [ 'icon-page-up', 'e033' ],

    [ 'icon-page-down', 'e034' ],

    [ 'icon-create-dashboard', 'e035' ],

    [ 'icon-excelsius-file', 'e036' ],

    [ 'icon-open-folder', 'e037' ],

    [ 'icon-neutral', 'e038' ],

    [ 'icon-split-segmentation', 'e039' ],

    [ 'icon-manage-budget', 'e03a' ],

    [ 'icon-blocked', 'e03b' ],

    [ 'icon-pipette', 'e03c' ],

    [ 'icon-top-recipe', 'e03d' ],

    [ 'icon-recipe', 'e03e' ],

    [ 'icon-ingredients', 'e03f' ],

    [ 'icon-multiple-charts', 'e040' ],

    [ 'icon-descending-bars', 'e041' ],

    [ 'icon-descending-stacked-bars', 'e042' ],

    [ 'icon-scatter-plot', 'e043' ],

    [ 'icon-spill', 'e044' ],

    [ 'icon-fire', 'e045' ],

    [ 'icon-stratification', 'e046' ],

    [ 'icon-relationship', 'e047' ],

    [ 'icon-margin-decomposition', 'e048' ],

    [ 'icon-control-group', 'e049' ],

    [ 'icon-comparison-chart', 'e04a' ],

    [ 'icon-responsible-area', 'e04b' ],

    [ 'icon-increase', 'e04c' ],

    [ 'icon-decrease', 'e04d' ],

    [ 'icon-current-stock', 'e04e' ],

    [ 'icon-expedite', 'e04f' ],

    [ 'icon-postpone', 'e050' ],

    [ 'icon-approved', 'e051' ],

    [ 'icon-partially-delivered', 'e052' ],

    [ 'icon-line-bar-chart', 'e053' ],

    [ 'icon-expand-all', 'e054' ],

    [ 'icon-submission', 'e055' ],

    [ 'icon-change-request', 'e056' ],

    [ 'icon-column-unselected', 'e057' ],

    [ 'icon-column-selected', 'e058' ],

    [ 'icon-row-unselected', 'e059' ],

    [ 'icon-row-selected', 'e05a' ],

    [ 'icon-stock-requirements', 'e05b' ],

    [ 'icon-gender-male-and-female', 'e05c' ],

    [ 'icon-icon-marital-status', 'e05d' ],

    [ 'icon-birthday', 'e05e' ],

    [ 'icon-classification', 'e05f' ],

    [ 'icon-marked-for-deletion', 'e060' ],

    [ 'icon-bullet-chart', 'e061' ],

    [ 'icon-remove-filter', 'e062' ],

    [ 'icon-bank-account', 'e063' ],

    [ 'icon-savings-account', 'e064' ],

    [ 'icon-debit-card', 'e065' ],

    [ 'icon-vip-customer', 'e066' ],

    [ 'icon-undesirable-customer', 'e067' ],

    [ 'icon-answered-change-request', 'e068' ],

    [ 'icon-collected-change-request', 'e069' ],

    [ 'icon-draw-freehand', 'e06a' ],

    [ 'icon-draw-circle', 'e06b' ],

    [ 'icon-completed', 'e06c' ],

    [ 'icon-answered', 'e06d' ],

    [ 'icon-traffic-cone', 'e06e' ],

    [ 'icon-traffic-lights', 'e06f' ],

    [ 'icon-container', 'e070' ],

    [ 'icon-container-loading', 'e071' ],

    [ 'icon-traffic-jam', 'e072' ],

    [ 'icon-products', 'e073' ],

    [ 'icon-sidepanel', 'e074' ],

    [ 'icon-split-screen', 'e075' ],

    [ 'icon-truck-driver', 'e076' ],

    [ 'icon-keep-segment', 'e077' ],

    [ 'icon-exclude-segment', 'e078' ],

    [ 'icon-separate-segments', 'e079' ],

    [ 'icon-distribute-segments', 'e07a' ],

    [ 'icon-next-open-item', 'e07b' ],

    [ 'icon-where-used', 'e07c' ],

    [ 'icon-outbound-delivery', 'e07d' ],

    [ 'icon-outbound-delivery-inactive', 'e07e' ],

    [ 'icon-outbound-delivery-active', 'e07f' ],

    [ 'icon-target', 'e080' ],

    [ 'icon-source', 'e081' ],

    [ 'icon-material', 'e082' ],

    [ 'icon-due-date', 'e083' ],

    [ 'icon-overdue', 'e084' ],

    [ 'icon-set-as-default', 'e085' ],

    [ 'icon-face-very-bad', 'e086' ],

    [ 'icon-face-bad', 'e087' ],

    [ 'icon-face-skeptical', 'e088' ],

    [ 'icon-face-neutral', 'e089' ],

    [ 'icon-face-astonished', 'e08a' ],

    [ 'icon-face-happy', 'e08b' ],

    [ 'icon-face-very-happy', 'e08c' ],

    [ 'icon-face-awful', 'e08d' ],

    [ 'icon-face-devastated', 'e08e' ],

    [ 'icon-face-okey-dokey', 'e08f' ],

    [ 'icon-alarm', 'e090' ],

    [ 'icon-activate', 'e091' ],

    [ 'icon-segment-preview-reference-objects', 'e092' ] ],

    function(nIdx, aIconInfo) {
        IconPool.addIcon(aIconInfo[0], CATEGORY, {
            fontFamily : FONT_FAMILY,
            content : aIconInfo[1]
        });
    });
    
    $.sap.setObject('sap.sf.surj.shell.util.SuppIconPool', IconPool);
    return IconPool;
});