/**
 * IMPORTANT:
 * ---------------------------------------------------------------------------------------------------
 * This file will overwrite SMRF.load in the "upgrade" inner function which is called right away.
 * Even existing pages will get this upgrade; however, this code will just rely on the old implementation
 * the only time something different happens is when the requested files are not initialized yet.
 *
 * This means that any page can now execute SMRF.load() on any file, even if that page did not have
 * the file commented somewhere.
 * ---------------------------------------------------------------------------------------------------
 */
sap.ui.define(['jquery.sap.global', './Util', 'jquery.sap.storage'], function($, Util) {
	"use strict";
	/**
	 * Upgrade the original SMRF so that it will always work even if it wasn't there to begin with.
	 */
	function upgrade() {
		var smrf = window.SMRF;
		var juic = window.juic;
		if (!juic) {
			// fake out juic to prevent errors
			// this will be replaced later if juic is executed with SMRF.load
			window.juic = {
				Logger: {error:$.sap.log.error},
				set: $.extend,
				assert: $.sap.assert
			};
		}
		if (!smrf) {
			smrf = window.SMRF = {};
		}
		if (smrf.load && smrf.load != _SMRF.load) {
			// backup the original SMRF.load
			_SMRF.loadOriginal = smrf.load.bind(smrf);
		}

		/*
		 * Commenting out updating base domain on global SMRF variables that are initially on the window.
		 * This causes undesirable affects for LMS who uses SMRF variables like IMAGES with values that should not
		 * be relative to base domain. This used to be required for clients of the theme Template for shared header
		 * but that is no longer the case, because the template does not output any SMRF variables anymore.
		 updateBaseDomain(window);
		 */

		$.extend(smrf, _SMRF);
	}

	/**
	 * Filter out any files that are SMRF ready.
	 *
	 * @param aFiles The list of files
	 * @return {Array.<String>} A new array with only files that are not SMRF ready
	 */
	function filterOutReady(aFiles, oVariables) {
		var oVersionMap = oVariables && oVariables.DEPS_VERSION_MAP;
		return aFiles.filter(function(sFile) {
			return !oVersionMap || !oVersionMap[_SMRF.normalizeUrl(sFile)];
		});
	}

	/**
	 * @param {String} src A versioned path
	 * @return {String} The unversioned path
	 */
	function getUnversionedPath(src) {
		var sPath = /^https?:\/\/[^\/]*(\/.*)$/.exec(src);
		if (sPath) {
			sPath = sPath[1];
		} else {
			sPath = src;
		}
		var aParts;
		var sUnversioned = sPath;
		if (aParts = /^(.*)(?:_dev-snapshot|_[A-Za-z\d+\-=]{32,})\.(css|js)$/.exec(sPath)) {
			sUnversioned = aParts[1] + '.' + aParts[2];
		} else if (aParts = /^(\/ui\/\w+\/\w+)_[\da-f][^\/]*(\/.*)\.(css|js)$/.exec(sPath)) {
			sUnversioned = aParts[1] + aParts[2] + '.' + aParts[3];
		}
		return sUnversioned;
	}

	/**
	 * Normalize a url to account for ajaxservices.
	 *
	 * @param {String} sUrl
	 * @return {String}
	 */
	function normalizeUrl(sUrl) {
		var aParts;
		if (aParts = /^ajaxservice\:(.*)/.exec(sUrl)) {
			var sControllerName = aParts[1];
			var oParams = Util.decodeParam(sControllerName);
			var bLegacy = oParams && (oParams.legacy == 'true');
			if (aParts = /^(.*)\?/.exec(sControllerName)) {
				sControllerName = aParts[1];
			}
			var sModuleName;
			if (aParts = /^([^\.]*)\.(.*)$/.exec(sControllerName)) {
				sModuleName = aParts[1];
				sControllerName = aParts[2];
			}
			if (!sModuleName) {
				sModuleName = 'v4';
			}
			if (sModuleName) {
				sUrl = "/ui/" + sModuleName + "/js/ajaxservice/" + sControllerName + "ASProxy.js";
			}
		}
		return sUrl;
	}

	/**
	 * @inner
	 * @return {jQuery.sap.Storage}
	 */
	function getStorage() {
		var sAjaxSecKey = window.ajaxSecKey;
		if (sAjaxSecKey) {
			var oStorage = $.sap.storage('session', '_smrf_' + sAjaxSecKey);
			return oStorage.isSupported() ? oStorage : null;
		}
	}
	/**
	 * Get a SMRF package for a combined list of files, but do not update any current variables.
	 *
	 * @param {Array.<String>} aFiles The files to get
	 * @param {Boolean} bUseAbs
	 * @param {Boolean=} bAsync default true
	 * @return {Promise.<Object>} A Promise for a SMRF package, which is just a mapping of all global variables that SMRF needs
	 */
	function getSMRFPackage(aFiles, bUseAbs, bAsync) {
		bAsync = bAsync !== false;
		var Promise = wrapPromise(bAsync);
		if (!Array.isArray(aFiles)) {
			return Promise.reject("aFiles must be an array");
		}
		var pageHeaderJsonData = window.pageHeaderJsonData;
		var userLocale = pageHeaderJsonData && pageHeaderJsonData.userLocale;
		var sCacheKey = aFiles.join(',') + '?useAbs=' + (!!bUseAbs) + (userLocale ? ('&lang=' + encodeURIComponent(userLocale)) : '');
		var oCachedPromise = _SMRF._packagePromises[sCacheKey];
		if (!bAsync && oCachedPromise && oCachedPromise.then) {
			oCachedPromise = null; // Ignore pending promises in sync mode
		}
		if (oCachedPromise) {
			return Promise.resolve(oCachedPromise);
		}

		var oStorage = _SMRF.getStorage();
		var oPackage = oStorage && oStorage.get(sCacheKey);
		if (oPackage) {
			return Promise.resolve(oPackage);
		}

		// Handle the case when the page is not on base domain
		if (!Util.isRunningBaseDomain()) {
			return Promise.reject("SMRF.load requires base domain");
		}

		// While on base domain make a direct download of the package url using AJAX and download/parse the data
		return _SMRF._packagePromises[sCacheKey] = Promise.make(function(res, rej) {

			function handleResponse(sResponseText) {
				// Pull out the inline scripts from the package
				var bScript = false;
				var aInlineScripts = [];
				var sSmrfScript = null;
				var aSrcs = [];
				var aCss = [];

				// Go through the package line by line
				sResponseText.split(/\r?\n/).forEach(function(sLine) {
					var aParts;
					if (aParts = /<link[^>]*href="([^"]*)"/.exec(sLine)) {
						aSrcs.push(Util.ensureBaseDomain(aParts[1], bUseAbs));
					} else if (aParts = /^<script[^>]*src="([^"]*)"/.exec(sLine)) {
						var src = Util.ensureBaseDomain(aParts[1], bUseAbs);
						if (getUnversionedPath(src) == _SMRF._smrfScript) {
							sSmrfScript = src;
						} else {
							aSrcs.push(src);
						}
					} else if (/^<script[^>]*><!--$/.test(sLine)) {
						bScript = true;
					} else if (sLine.indexOf("//--></script>") == 0) {
						bScript = false;
					} else if (bScript) {
						sLine && aInlineScripts.push(sLine);
					}
				});

				// back-up the original variables
				var aVariables = ['DEPS_TREE', 'DEPS_VERSION_MAP', 'IMAGES', 'RESOURCES', 'MSGS', 'dateFormatSymbols', 'decimalFormatSymbols', 'firstDayOfWeek'].map(function(sKey) {
					var oVariable = {key: sKey, value: window[sKey]};
					window[sKey] = null;
					return oVariable;
				});

				// Evaluate all the inline scripts so global variables are added to this window
				if (aInlineScripts.length > 0) {
					try {
						Util.dangerouslyEvalScript(aInlineScripts.join("\n"));
					} catch(e) {
						rej(e);
					}
				}

				var oVariables = aVariables.reduce(function(oMap, oVariable) {
					var sKey = oVariable.key;
					oMap[sKey] = window[sKey];
					window[sKey] = oVariable.value;
					return oMap;
				}, {});

				// Restore the original variables
				var oPackage = {
					files: aFiles,
					smrfScript: sSmrfScript,
					variables: oVariables
				};

				// Update all the IMAGES/RESOURCES/etc to be base domain
				updateBaseDomain(oVariables, bUseAbs);

				var oVersionMap = oVariables.DEPS_VERSION_MAP = oVariables.DEPS_VERSION_MAP || {};
				var oDepsTree = oVariables.DEPS_TREE = oVariables.DEPS_TREE || {};
				var aLinearFiles = [];
				var aCSSFiles = [];
				var oRequestedLookup = aFiles.reduce(function(oLookup, sFile) {
					oLookup[sFile] = true; // quick lookup hash to check if a file is requested
					return oLookup;
				}, {});

				aSrcs.forEach(function(src) {
					var sUnversioned = getUnversionedPath(src);
					oVersionMap[sUnversioned] = src;

					// Ignore blacklisted files, but don't ignore a file if it was explicitly asked for
					if (!_SMRF._blacklisted[sUnversioned] || oRequestedLookup[sUnversioned]) {
						// CSS files can be downloaded in parallel
						// The scripts will need to be linear download
						// Since they do not contain the DEPS_TREE information
						if (/\.css$/.test(src)) {
							aCSSFiles.push(src);
						} else {
							aLinearFiles.push(src);
						}
					} else if (!oDepsTree[src]) {
						// src is a linear file, but it was blacklisted, and so it will not be added to the linearFiles array
						// However, we still need a blacklisted file to be in the DEPS_TREE.
						// If a blacklisted file has dependencies, then those dependencies must be listed inside the _hardCodedDeps map.
						// Otherwise, it will not have dependencies other than itself.
						var aDeps = _SMRF._hardCodedDeps[sUnversioned] || [];
						aDeps = aDeps.reduce(function(aDeps, sUnversionedDep) {
							var sVersionedDep = oVersionMap[sUnversionedDep];
							if (sVersionedDep) {
								// the DEPS_VERSION_MAP must contain this hard coded dependency for this to work
								aDeps.push(sVersionedDep);
							}
							return aDeps;
						}, []);
						if (aDeps.indexOf(src) < 0) {
							aDeps.push(src); // the dependency list must include itself
						}
						oDepsTree[src] = aDeps;
					}
				});

				oPackage.linearFiles = aLinearFiles;
				oPackage.cssFiles = aCSSFiles;

				// The CSS <link> in the package will not be present in the DEPS_TREE
				aCSSFiles.forEach(function(sFile) {
					oDepsTree[sFile] = [sFile];
				});

				var aNotFound = filterOutReady(aFiles, oVariables);

				if (aNotFound.length > 0 && aLinearFiles.length == 0) {
					// If some of the files were not found, and there were no other files available, then reject
					rej("Could not find: " + aNotFound.join(","));
				} else {
					// If some of the files were not found, it's most likely because they were included as group files
					// We'll just fake it so that the list of files that were included in the SMRF package will download
					if (aNotFound.length > 0) {
						var sLastLinearFile = aLinearFiles[aLinearFiles.length-1];
						aNotFound.forEach(function(sFileName) {
							// Now when SMRF.load looks up this file, it will get the last file in the list
							// which is most likely the group file.
							oVersionMap[sFileName] = sLastLinearFile;
						});
					}

					if (oStorage) {
						oStorage.put(sCacheKey, oPackage);
					}

					if (bAsync) {
						// Enable future sync calls to work
						_SMRF._packagePromises[sCacheKey] = oPackage;
					}

					res(oPackage);
				}
			}
			
			function handleError(jqXHR) {
				rej('Error ' + jqXHR.status + ' during SMRF package download');
			}
			
			var sUrl = Util.ensureBaseDomain(_SMRF._packageUrl) + '?' + $.param({js: aFiles.map(normalizeUrl)});
			// TODO: if/when SMRF package is enabled via OData, then make this always happen even without CORS
			// Call the smrf.xhtml to get the SMRF package
			if (bAsync) {
				$.ajax({
					// The user must have a logged in session for this to work, and CORS must be available
					url: sUrl,
					xhrFields: {
						withCredentials: true
					}
				}).then(handleResponse, handleError);
			} else {
				var resp = $.ajax({
					async: false,
					// The user must have a logged in session for this to work, and CORS must be available
					url: sUrl,
					xhrFields: {
						withCredentials: true
					}
				});
				if (resp.status == 200 && resp.responseText) {
					handleResponse(resp.responseText);
				} else {
					handleError(response);
				}
			}


		});
	}

	/**
	 * Make sure that SMRF.loadOriginal is loaded properly.
	 * @inner
	 * @param {Object} oPackage
	 * @param {Boolean=} bAsync Default is true
	 * @return {Promise}
	 */
	function includeSMRF(oPackage, bAsync) {
		var Promise = wrapPromise(bAsync);
		return Promise.make(function(res, rej) {
			var sSmrfScript = oPackage && oPackage.smrfScript;
			if (_SMRF.loadOriginal) {
				// If SMRF is already available then resolve
				res(oPackage);
			} else if (sSmrfScript) {
				if (bAsync === false) {
					includeScriptSync(sSmrfScript);
					upgrade();
					res(oPackage);
					return;
				}
				// Otherwise SMRF script hasn't downloaded yet
				if (!_SMRF._scriptPromise) {
					// If the script was not already waiting, we need to find and include the smrf script
					_SMRF._scriptPromise = Promise.make(function(res, rej) {
						$.sap.includeScript(sSmrfScript, {nonce: Util.getCSPScriptNonce()}, function() {
							_SMRF._scriptPromise = null;
							upgrade();
							res(oPackage);
						}, rej);
					});
				}
				_SMRF._scriptPromise.then(res.bind(null, oPackage), rej);
			} else {
				rej("SMRF Package does not include " + _SMRF._smrfScript);
			}
		});
	}

	/**
	 * copied from xhtml output and prettified.
	 * @inner
	 */
	var MessageFormatter = {
		paramRegExpArray: [],
		getParamRegExp: function(p) {
			var r = this.paramRegExpArray[p];
			if (!r) {
				r = new RegExp('\\{' + p + '\\}', 'g');
				this.paramRegExpArray[p] = r;
			}
			return r;
		},
		format: function(pattern) {
			var r = pattern,
				p = 0,
				i;
			if (r && r.replace) {
				for (i = 1; i < arguments.length; i++) {
					r = r.replace(this.getParamRegExp(p++), arguments[i]);
				}
			}
			return r;
		}
	};

	/**
	 * The replacement for MSGS.get().
	 * @inner
	 */
	function MSGS_get(key) {
		var value = this[key];
		if (arguments.length > 1) {
			arguments[0] = value;
			return MessageFormatter.format.apply(MessageFormatter, arguments);
		} else {
			return value;
		}
	}

	/**
	 * Apply the given SMRF package to the current window.
	 *
	 * @param {Object} oPackage
	 */
	function applySMRFPackage(oPackage) {
		var oVariables = oPackage && oPackage.variables;
		if (oVariables) {
			for (var sKey in oVariables) {
				var oNewSettings = oVariables[sKey];
				// Most oNewSettings are lookup objects except sKey="firstDayOfWeek" which will be a number
				if (oNewSettings && typeof oNewSettings == 'object') {
					// If the window already has something, but also we don't want to change the reference window[sKey] already has
					var oExisting = window[sKey] = window[sKey] || {};
					for (var sFileName in oNewSettings) {
						if (!oExisting[sFileName]) {
							oExisting[sFileName] = oNewSettings[sFileName];
						}
					}
				} else {
					var oExisting = window[sKey];
					if (oExisting == null) {
						window[sKey] = oNewSettings;
					}
				}
			}
		}

		// Apply some global stuff which some legacy SMRF dependant code uses
		var oMsgs = window.MSGS = window.MSGS || {};

		if (oMsgs && !oMsgs.MessageFormatter) {
			oMsgs.MessageFormatter = MessageFormatter;
		}

		if (!window.MessageFormatter) {
			var fFormatter = window.MessageFormatter = function() {}
			fFormatter.prototype.format = function() {
				return MessageFormatter.format.apply(MessageFormatter, arguments);
			};
			window.sfMessageFormat = new fFormatter();
		}

		if (!window.jsSFMessages) {
			window.jsSFMessages = oMsgs;
		}

		if (!oMsgs.get) {
			oMsgs.get = oMsgs.get || MSGS_get;
		}
	}

	/**
	 * Get the versioned file name.
	 * @inner
	 */
	function getVersionedFile(sFile, oPackage) {
		var oVersionMap = window.DEPS_VERSION_MAP;
		var sVersionedFile = oVersionMap && oVersionMap[sFile];
		if (!sVersionedFile) {
			oVersionMap = oPackage && oPackage.variables && oPackage.variables.DEPS_VERSION_MAP;
			sVersionedFile = oVersionMap && oVersionMap[sFile];
		}
		return sVersionedFile || sFile;
	}

	/**
	 * Filter out any already downloaded files from the package. Also add any hard coded dependencies.
	 * @param {Object} oPackage
	 * @param {Boolean=} bAsync Default is true
	 * @inner
	 */
	function adjustSMRFPackage(oPackage, bAsync) {
		function adjust(oPackage) {
			var oVariables = oPackage.variables;
			var oDepsTree = oVariables && oVariables.DEPS_TREE;
			if (!oDepsTree) {
				oDepsTree = oVariables.DEPS_TREE = {};
			}

			/**
			 * The linear files must be manually added to the DEPS_TREE. Because these files are missing
			 * data from the DEPS_TREE in the SMRF package, they must load sequentially; however, only
			 * files that do not already have dependencies defined will need to be modified.
			 * 
			 * The first linear file depends on all the CSS files, then each subsequent linear file will depend
			 * on the previous linear file. If a file in the linear list is already included, append this file
			 * to the deps for the next file that is not found. This will maintain the execution order and ensure
			 * no files in the linear list get skipped.
			 */
			var aCSSFiles = oPackage.cssFiles;
			var aLinearFiles = oPackage.linearFiles;
			if (aLinearFiles && aLinearFiles.length > 0) {
				var aDeps = aCSSFiles.concat();
				aLinearFiles.forEach(function(sFileName) {
					aDeps.push(sFileName);
					var aExistingDeps = oDepsTree[sFileName];
					if (!aExistingDeps && !document.getElementById(sFileName)) {
						oDepsTree[sFileName] = aDeps;
						aDeps = [sFileName];
					}
				});
			}

			for (var sFile in oDepsTree) {
				var aDeps = oDepsTree[sFile];
				var sUnversioned = getUnversionedPath(sFile);
				var aAddFiles;
				if (/\/ajaxservice\/.*ASProxy_[^\/]*$/.test(sFile)) {
					// UI-20783 ASProxy files have hard-coded dependencies to AjaxService
					aAddFiles = _SMRF._ajaxServiceDeps;
				} else {
					aAddFiles = _SMRF._hardCodedDeps[sUnversioned];
				}
				if (aAddFiles) {
					// Map aAddFiles to the versioned filenames, and filter to only include files not already found in the aDeps array
					aAddFiles = aAddFiles.map(function(sFileName) {
						return getVersionedFile(sFileName, oPackage)
					}).filter(function(sVersionedFile) {
						return aDeps.indexOf(sVersionedFile) < 0;
					});
					// Propend all the aAddFiles at the beginning of the aDeps array
					if (aAddFiles && aAddFiles.length > 0) {
						aAddFiles.forEach(function(sNewFile) {
							if (!oDepsTree[sNewFile]) {
								oDepsTree[sNewFile] = [sNewFile];
							}
						});
						aDeps.splice.apply(aDeps, [0, 0].concat(aAddFiles));
					}
				}
				spliceAlreadyIncluded(aDeps);
			}

			return oPackage;
		}
		if (bAsync === false) {
			return adjust(filterAjaxProxies(oPackage, false));			
		} else {
			return filterAjaxProxies(oPackage, true).then(adjust);
		}
	}

	/**
	 * Filter out any already downloaded files from an array.
	 * @inner
	 */
	function spliceAlreadyIncluded(aFiles) {
		var oDepsTree = window.DEPS_TREE;
		if (aFiles && oDepsTree) {
			for (var i=aFiles.length-1; i>=0; i--) {
				var sFileName = aFiles[i];
				var aFileDeps = oDepsTree[sFileName];
				if (aFileDeps ? aFileDeps.length == 0 : document.getElementById(sFileName)) {
					aFiles.splice(i, 1);
				}
			}
		}
	}

	/**
	 * @inner
	 * @param {String} sFileName 
	 */
	function isIncludedThenInclude(sFileName) {
		var oDepsTree = window.DEPS_TREE;
		var aDeps = oDepsTree && oDepsTree[sFileName];
		var bIncluded = document.getElementById(sFileName) != null || (aDeps && aDeps.length == 0);
		if (!oDepsTree) {
			oDepsTree = window.DEPS_TREE = {};
		}
		oDepsTree[sFileName] = [];
		return bIncluded;
	}

	/**
	 * Synchronously execute some code assuming that ajax can read the response.
	 * @param {String} sFileName
	 */
	function includeScriptSync(sFileName) {
		if (isIncludedThenInclude(sFileName)) {
			return;
		}
		$.ajax({
			url: sFileName,
			async: false
		}).then(function(sContent) {
			Util.dangerouslyEvalScript(sContent);
		}, function() {
			throw new Error("Error including script: " + sFileName);
		});
	}

	/**
	 * Include a CSS file.
	 * @param {String} sFileName 
	 */
	function includeCSS(sFileName) {
		if (isIncludedThenInclude(sFileName)) {
			return;
		}
		// This is not technically synchronous, oh well
		$('<link>').attr({
			id: sFileName,
			rel: 'stylesheet',
			type: 'text/css',
			href: sFileName
		}).appendTo('head');
	}

	/**
	 * Update the current window's SMRF variables by consuming the SMRF package for the given files.
	 *
	 * This will do the following:
	 * 
	 * 1) Check if any file is not available to SMRF yet
	 * 2) For the missing files, download a SMRF package
	 * 3) Parse the package to find: smrf script tag, and global scripts
	 * 4) Eval the global scripts to get the variables and include the smrf script so SMRF.load is available
	 *
	 * If all the information is already available, then immediately resolve.
	 *
	 * @inner
	 * @param {String[]} aFiles An array of files to prepare SMRF.
	 * @param {Boolean=} bAsync Default is true
	 * @return {Promise}
	 */
	function updateSMRFVariables(aFiles, bAsync) {
		var aFilePromises = [];
		bAsync = bAsync !== false;

		// Filter out files that are already available or have promises already
		var aNeedsPackage = filterOutReady(aFiles, window).filter(function(sFile) {
			var oPromise = _SMRF._smrfVariablePromises[sFile];
			if (oPromise) {
				aFilePromises.push(oPromise);
			}
			return !oPromise;
		});

		if (!bAsync) {
			var oPackage = getSMRFPackage(aNeedsPackage, false, false);
			includeSMRF(oPackage, false);
			return applySMRFPackage(adjustSMRFPackage(oPackage, false));
		}

		// If there are any files that need a SMRF package
		if (aNeedsPackage.length > 0) {
			var oPreparePromise = getSMRFPackage(aNeedsPackage)
				.then(includeSMRF)
				.then(adjustSMRFPackage)
				.then(applySMRFPackage);

			// Store the promise away in case someone else requests these same files before the finish loading
			aNeedsPackage.forEach(function(sFile) {
				_SMRF._smrfVariablePromises[sFile] = oPreparePromise;
			});

			// Cleanup references to the promise once it finishes
			oPreparePromise.catch(function(err) {
				// Do nothing but avoid unhandled exception errors
			}).then(function() {
				aNeedsPackage.forEach(function(sFile) {
					_SMRF._smrfVariablePromises[sFile] = null;
				});
			});

			aFilePromises.push(oPreparePromise);
		} else if (_SMRF._scriptPromise) {
			aFilePromises.push(_SMRF._scriptPromise);
		}

		// Note, if aFilePromises array is empty, this will resolve right away
		return Promise.all(aFilePromises);
	}

	/**
	 * @inner
	 */
	function updateBaseDomain(oVariables, bUseAbs) {
		if (oVariables && (!Util.isRunningBaseDomain() || bUseAbs)) {
			['IMAGES', 'RESOURCES', 'DEPS_TREE', 'DEPS_VERSION_MAP'].forEach(function(sType) {
				var oMap = oVariables[sType];
				if (oMap) {
					$.extend(oMap, Util.ensureBaseDomain(oMap, bUseAbs));
				}
			});
			var oTree = oVariables.DEPS_TREE;
			if (oTree) {
				for (var sUrl in oTree) {
					var sNewUrl = Util.ensureBaseDomain(sUrl, bUseAbs);
					if (sNewUrl != sUrl) {
						var aDeps = oTree[sUrl];
						delete oTree[sUrl];
						oTree[sUrl] = aDeps;
					}
				}
			}
		}
	}

	/**
	 * @inner
	 * @param {Boolean=} bAsync Default is true
	 */
	function isAjaxServiceOverride(bAsync) {
		var Promise = wrapPromise(bAsync);
		if (_SMRF._overrideAjax != null) {
			return Promise.resolve(_SMRF._overrideAjax);
		}

		return Promise.make(function(res, rej) {
			function handle(DeferredUtil) {
				DeferredUtil.initAjaxService();
				var AjaxService = window.AjaxService;
				res(_SMRF._overrideAjax = AjaxService && AjaxService.override);
			}
			var sDef = 'sap/sf/surj/shell/util/DeferredUtil';
			if (bAsync === false) {
				handle(sap.ui.requireSync(sDef));
			} else {
				sap.ui.require([sDef], handle, rej);
			}
		});
	};

	/**
	 * Filter out AjaxService proxy files from requested files or the DEPS_TREE in the case that AjaxService
	 * is Overridden. When Overridden, it means Proxy files are not needed and therefore should never be downloaded.
	 * For UI-20113, the Proxy files, if downloaded, will throw an Exception.
	 * 
	 * @inner
	 * @param {Object|Array} oInput An array of files or a SMRF package object
	 * @param {Boolean=} bAsync Default is true
	 * @returns {Promise}
	 */
	function filterAjaxProxies(oInput, bAsync) {
		function filter(bOverride) {
			// If AjaxService is not Overridden, then we will not do any filtering.
			if (bOverride) {
				if (Array.isArray(oInput)) {
					oInput = oInput.filter(isNotAjaxServiceFile);
				} else if (oInput) {
					// Remove any proxy files from the DEPS_TREE mapping
					var oDepsTree = oInput.variables && oInput.variables.DEPS_TREE;
					if (oDepsTree) {
						Object.keys(oDepsTree).forEach(function(sFileName) {
							if (isNotAjaxServiceFile(sFileName)) {
								oDepsTree[sFileName] = oDepsTree[sFileName].filter(isNotAjaxServiceFile);
							}
						});
					}
					var aLinearFiles = oInput.linearFiles;
					if (aLinearFiles) {
						oInput.linearFiles = aLinearFiles.filter(isNotAjaxServiceFile);
					}
				}
			}
			return oInput;
		}
		if (bAsync === false) {
			return filter(isAjaxServiceOverride(false));
		} else {
			return isAjaxServiceOverride(true).then(filter);
		}
	}

	/**
	 * Determine if a given file is not an ajax proxy file.
	 * 
	 * @returns {Boolean}
	 */
	function isNotAjaxServiceFile(sFileName) {
		return !/\/(ui|js)\/ajaxservice\//.test(normalizeUrl(sFileName));
	}

	/**
	 * Get a JSON tree structure that can be printed. This can be used for debug purpose.
	 *
	 * @inner
	 * @param {String} sFileName
	 * @param {Object=} oVisited
	 */
	function getDepsTree(sFileName, oVisited) {
		if (!oVisited) {
			return updateSMRFVariables([sFileName]).then(function() {
				var oVersions = window.DEPS_VERSION_MAP || {};
				var sVersionFile = oVersions[sFileName];
				return sVersionFile ? getDepsTree(sVersionFile, {}) : '(not found) ' + sFileName;
			});
		} else if (oVisited[sFileName]) {
			return '(visited) ' + sFileName;
		} else {
			var oDepsTree = window.DEPS_TREE || {};
			var aDeps = oDepsTree[sFileName];
			var tree;
			oVisited[sFileName] = true;
			if (aDeps) {
				if (aDeps.length > 1) {
					var child = aDeps.slice(0, aDeps.length-1).map(function(sChild) {
						return getDepsTree(sChild, oVisited);
					});
					tree = {
						src: sFileName,
						dependsOn: child.length == 1 ? child[0] : child
					};
				} else if (aDeps.length == 1 && aDeps[0] == sFileName) {
					tree = '(leaf node) ' + sFileName;
				}  else if (aDeps.length != 0) {
					tree = '(invalid) ' + sFileName;
				} else {
					tree = '(already) ' + sFileName;
				}
			} else {
				tree = '(not found) ' + sFileName;
			}
			return tree;
		}
	}

	/**
	 * Flatten the deps tree for one file appending them to a list.
	 * @inner
	 * @param {String} sVersionedFile 
	 * @param {Array.<String>} aList 
	 * @param {Object} oVisited 
	 */
	function flattenDepsTree(sVersionedFile, aList, oVisited) {
		if (oVisited[sVersionedFile]) {
			return; // Don't visit the same file twice
		}
		oVisited[sVersionedFile] = true;
		var oDepsTree = window.DEPS_TREE;
		var aDeps = oDepsTree && oDepsTree[sVersionedFile];
		if (!aDeps) {
			throw new Error("Cannot find deps for: " + sVersionedFile);
		}
		aDeps.forEach(function(sFile) {
			if (sFile === sVersionedFile) {
				aList.push(sVersionedFile);
			} else {
				flattenDepsTree(sFile, aList, oVisited);
			}
		});
	}

	/**
	 * Flatten all the unversioned files to all the deps tree in sync orer.
	 * @param {Array.<String>} aUnversionedFiles
	 * @return {Array.<String>} The list of versioned files that the input files require 
	 */
	function flattenAll(aUnversionedFiles) {
		var aList = [];
		var oVisited = {};
		var oVersionMap = window.DEPS_VERSION_MAP;
		aUnversionedFiles.forEach(function(sFile) {
			var sVersionFile = oVersionMap && oVersionMap[sFile];
			if (!sVersionFile) {
				throw new Error("Could not find version for: " + sFile);
			}
			flattenDepsTree(sVersionFile, aList, oVisited);
		});
		return aList;
	}

	/**
	 * YAHOO.util.Event.onDOMReady() will never fire if YAHOO is loaded via SMRF.load after DOMReady already fired.
	 * Lots of legacy code assumes that onDOMReady always fires, and therefore will not work.
	 */
	function fixYahooDomReady(oPromise) {
		return new Promise(function(res, rej) {
			var sReadyNamespace = 'YAHOO.util.Event._ready';
			if (!$.sap.getObject(sReadyNamespace)) {
				oPromise.catch(function() {}).then(function() {
					var fReady = $.sap.getObject(sReadyNamespace);
					if (fReady) {
						$(function() {
							fReady();
							res();
						});
					} else {
						res();
					}
				});
			} else {
				res();
			}
		});
	}

	/**
	 * Return either the real Promise or a mock Promise.
	 * @inner
	 * @param {Boolean=} bAsync Default is true
	 */
	function wrapPromise(bAsync) {
		function pass(a) {
			return a;
		}
		function fReject(vReason) {
			if (vReason instanceof Error) {
				throw vReason;
			} else {
				throw new Error(vReason);
			}
		}
		return bAsync === false ? {
			make: function(fPromiseCallback) {
				var vResult;
				fPromiseCallback(function(v) {
					vResult = v;
				}, fReject);
				return vResult;
			},
			all: pass,
			resolve: pass,
			reject: fReject
		} : {
			make: function(fPromiseCallback) {
				return new Promise(fPromiseCallback);
			},
			all: Promise.all.bind(Promise),
			resolve: Promise.resolve.bind(Promise),
			reject: Promise.reject.bind(Promise)
		};
	}

	var _SMRF = {
		// can be overridden
		_scriptPromise : null,
		_smrfVariablePromises : {},
		_loadPromises : {},
		_packagePromises : {},
		_packageUrl : '/xi/ui/commonshell/pages/smrf.xhtml',
		_smrfScript : '/ui/smrf/js/smrf.js',
		_ajaxServiceDeps : [
			'/ui/ajaxservice/js/engine.js',
			'/ui/ajaxservice/js/AjaxService.js'
		],
		_hardCodedDeps : {
			// Any file that has a dependency but cannot declare it due should be listed here with hard-coded dependencies
			// This is common for extlib files where the source code is already minified and does not include SMRF includes
			"/ui/extlib/yui/js/animation/animation.js": ["/ui/extlib/yui/js/yahoo-dom-event/yahoo-dom-event.js"],
			"/ui/extlib/yui/js/connection/connection.js": ["/ui/extlib/yui/js/yahoo-dom-event/yahoo-dom-event.js"],
			"/ui/extlib/yui/js/autocomplete/autocomplete.js": ["/ui/extlib/yui/js/yahoo-dom-event/yahoo-dom-event.js"],

			// All blacklisted files that have dependencies will need to have the dependencies hard coded
			"/ui/ajaxservice/js/AjaxService.js": ["/ui/ajaxservice/js/engine.js"] // AjaxService always includes engine.js
		},

		// These are files that are blacklisted from becoming part of the "linearFiles" array
		// They are blacklisted because they are always present in the smrf.xhtml regardless of which file you give
		// and should therefore not be included as a dependency to the requested files unless the caller has explicitly
		// asked for it.
		_blacklisted : [
			// "/ui/extlib/yui/js/yahoo-dom-event/yahoo-dom-event.js",
			// "/ui/extlib/yui/js/animation/animation.js",
			// "/ui/extlib/yui/js/connection/connection.js",
			// "/ui/extlib/yui/js/autocomplete/autocomplete.js",
			// "/ui/extlib/jshash/sha256.js",
			// "/ui/juic/js/InterstitialUtil.js",
			// "/ui/juic/js/GlobalFunctions.js",
			"/ui/ajaxservice/js/AjaxService.js",
			"/ui/ajaxservice/js/engine.js",
			"/ui/extlib/XMLHttpRequest/XMLHttpRequest.js",
			"/ui/perflog/js/perflog.js"
		].reduce(function(map, src) {
			map[src]=true;
			return map;
		}, {}),

		/**
		 * Load a list of files using SMRF but do it in a way that does not require
		 * SMRF to be available on the page to begin with.
		 */
		load : function(aFiles, fCallback) {
			if (Array.isArray(aFiles)) {
				if (fCallback && typeof fCallback.callback == 'function') {
					fCallback = fCallback.callback.bind(null,fCallback.argument);
				} else if (typeof fCallback != 'function') {
					fCallback = function() {} // backup to no-operation
				}
				_SMRF.loadPromise(aFiles).then(fCallback).catch(function(err) {
					window.console && console.error(err);
				});
			} else {
				throw new Error("You must pass an array");
			}
		},

		/**
		 * Load a list of files synchronously.
		 * @param {Array.<String>} aFiles 
		 */
		loadSync : function(aFiles) {
			updateSMRFVariables(aFiles, false);
			flattenAll(aFiles).forEach(function(sFile) {
				switch(/\.(\w+)$/.exec(sFile)[1]) {
				case 'css':
					includeCSS(sFile);
					break;
				case 'js':
					includeScriptSync(sFile);
					break;
				}
			});
		},

		/**
		 * Load a list of files using SMRF safely, works even on a pure Fiori page when
		 * SMRF was not originally loaded on the page.
		 *
		 * @param {String[]} aFiles The list of files to load
		 * @return Promise
		 */
		loadPromise : function(aFiles) {
			if (typeof aFiles == 'string') {
				aFiles = [aFiles];
			}

			var oPromise = filterAjaxProxies(aFiles).then(function(aFiles) {
				// Ensure parallel loading of the same file cannot happen
				upgrade();
				var aPromises = [];
				aFiles = aFiles.filter(function(sFile) {
					var oPromise = _SMRF._loadPromises[sFile];
					if (oPromise) {
						aPromises.push(oPromise);
						return false;
					}
					return true;
				});
				if (aFiles.length > 0) {
					var oPromise = new Promise(function(res, rej) {
						updateSMRFVariables(aFiles).then(function() {
							// Call the original SMRF.load once the package is prepared
							_SMRF.loadOriginal(aFiles, res);
						}, rej);
					});
					aFiles.forEach(function(sFile) {
						_SMRF._loadPromises[sFile] = oPromise;
					});
					aPromises.push(oPromise);
				}
				return Promise.all(aPromises);
			});

			fixYahooDomReady(oPromise);

			return oPromise;
		},
		getStorage: getStorage,
		upgrade : upgrade,
		normalizeUrl : normalizeUrl,
		getSMRFPackage : getSMRFPackage,
		updateSMRFVariables : updateSMRFVariables,
		adjustSMRFPackage : adjustSMRFPackage,
		getUnversionedPath: getUnversionedPath,
		getDepsTree: getDepsTree,
		filterAjaxProxies: filterAjaxProxies,
		fixYahooDomReady: fixYahooDomReady
	};

	// Immediately upgrade SMRF if it was already available.
	upgrade();

	jQuery.sap.setObject('sap.sf.surj.shell.util.SMRF', _SMRF);
	_SMRF.__scriptAttributes = { nonce: Util.getCSPScriptNonce() };
	return _SMRF;
});