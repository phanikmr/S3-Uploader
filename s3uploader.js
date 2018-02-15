(function(global) {
    var Uploader = function(element) {
        "use strict";
        return {
            hide: function() {
                element.style.display = "none";
                return this;
            },
            attach: function(type, fn) {
                if (element.addEventListener) {
                    element.addEventListener(type, fn, false);
                } else if (element.attachEvent) {
                    element.attachEvent("on" + type, fn);
                }
                return function() {
                    Uploader(element).detach(type, fn);
                };
            },
            detach: function(type, fn) {
                if (element.removeEventListener) {
                    element.removeEventListener(type, fn, false);
                } else if (element.attachEvent) {
                    element.detachEvent("on" + type, fn);
                }
                return this;
            },
            contains: function(descendant) {
                if (!descendant) {
                    return false;
                }
                if (element === descendant) {
                    return true;
                }
                if (element.contains) {
                    return element.contains(descendant);
                } else {
                    return !!(descendant.compareDocumentPosition(element) & 8);
                }
            },
            insertBefore: function(elementB) {
                elementB.parentNode.insertBefore(element, elementB);
                return this;
            },
            remove: function() {
                element.parentNode.removeChild(element);
                return this;
            },
            css: function(styles) {
                if (element.style == null) {
                    throw new Uploader.Error("Can't apply style to node as it is not on the HTMLElement prototype chain!");
                }
                if (styles.opacity != null) {
                    if (typeof element.style.opacity !== "string" && typeof element.filters !== "undefined") {
                        styles.filter = "alpha(opacity=" + Math.round(100 * styles.opacity) + ")";
                    }
                }
                Uploader.extend(element.style, styles);
                return this;
            },
            hasClass: function(name, considerParent) {
                var re = new RegExp("(^| )" + name + "( |$)");
                return re.test(element.className) || !!(considerParent && re.test(element.parentNode.className));
            },
            addClass: function(name) {
                if (!Uploader(element).hasClass(name)) {
                    element.className += " " + name;
                }
                return this;
            },
            removeClass: function(name) {
                var re = new RegExp("(^| )" + name + "( |$)");
                element.className = element.className.replace(re, " ").replace(/^\s+|\s+$/g, "");
                return this;
            },
            getByClass: function(className, first) {
                var candidates, result = [];
                if (first && element.querySelector) {
                    return element.querySelector("." + className);
                } else if (element.querySelectorAll) {
                    return element.querySelectorAll("." + className);
                }
                candidates = element.getElementsByTagName("*");
                Uploader.each(candidates, function(idx, val) {
                    if (Uploader(val).hasClass(className)) {
                        result.push(val);
                    }
                });
                return first ? result[0] : result;
            },
            getFirstByClass: function(className) {
                return Uploader(element).getByClass(className, true);
            },
            children: function() {
                var children = [],
                    child = element.firstChild;
                while (child) {
                    if (child.nodeType === 1) {
                        children.push(child);
                    }
                    child = child.nextSibling;
                }
                return children;
            },
            setText: function(text) {
                element.innerText = text;
                element.textContent = text;
                return this;
            },
            clearText: function() {
                return Uploader(element).setText("");
            },
            hasAttribute: function(attrName) {
                var attrVal;
                if (element.hasAttribute) {
                    if (!element.hasAttribute(attrName)) {
                        return false;
                    }
                    return /^false$/i.exec(element.getAttribute(attrName)) == null;
                } else {
                    attrVal = element[attrName];
                    if (attrVal === undefined) {
                        return false;
                    }
                    return /^false$/i.exec(attrVal) == null;
                }
            }
        };
    };
    (function() {
        "use strict";
        Uploader.canvasToBlob = function(canvas, mime, quality) {
            return Uploader.dataUriToBlob(canvas.toDataURL(mime, quality));
        };
        Uploader.dataUriToBlob = function(dataUri) {
            var arrayBuffer, byteString, createBlob = function(data, mime) {
                    var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder,
                        blobBuilder = BlobBuilder && new BlobBuilder();
                    if (blobBuilder) {
                        blobBuilder.append(data);
                        return blobBuilder.getBlob(mime);
                    } else {
                        return new Blob([data], {
                            type: mime
                        });
                    }
                },
                intArray, mimeString;
            if (dataUri.split(",")[0].indexOf("base64") >= 0) {
                byteString = atob(dataUri.split(",")[1]);
            } else {
                byteString = decodeURI(dataUri.split(",")[1]);
            }
            mimeString = dataUri.split(",")[0].split(":")[1].split(";")[0];
            arrayBuffer = new ArrayBuffer(byteString.length);
            intArray = new Uint8Array(arrayBuffer);
            Uploader.each(byteString, function(idx, character) {
                intArray[idx] = character.charCodeAt(0);
            });
            return createBlob(arrayBuffer, mimeString);
        };
        Uploader.log = function(message, level) {
            if (window.console) {
                if (!level || level === "info") {
                    window.console.log(message);
                } else {
                    if (window.console[level]) {
                        window.console[level](message);
                    } else {
                        window.console.log("<" + level + "> " + message);
                    }
                }
            }
        };
        Uploader.isObject = function(variable) {
            return variable && !variable.nodeType && Object.prototype.toString.call(variable) === "[object Object]";
        };
        Uploader.isFunction = function(variable) {
            return typeof variable === "function";
        };
        Uploader.isArray = function(value) {
            return Object.prototype.toString.call(value) === "[object Array]" || value && window.ArrayBuffer && value.buffer && value.buffer.constructor === ArrayBuffer;
        };
        Uploader.isItemList = function(maybeItemList) {
            return Object.prototype.toString.call(maybeItemList) === "[object DataTransferItemList]";
        };
        Uploader.isNodeList = function(maybeNodeList) {
            return Object.prototype.toString.call(maybeNodeList) === "[object NodeList]" || maybeNodeList.item && maybeNodeList.namedItem;
        };
        Uploader.isString = function(maybeString) {
            return Object.prototype.toString.call(maybeString) === "[object String]";
        };
        Uploader.trimStr = function(string) {
            if (String.prototype.trim) {
                return string.trim();
            }
            return string.replace(/^\s+|\s+$/g, "");
        };
        Uploader.format = function(str) {
            var args = Array.prototype.slice.call(arguments, 1),
                newStr = str,
                nextIdxToReplace = newStr.indexOf("{}");
            Uploader.each(args, function(idx, val) {
                var strBefore = newStr.substring(0, nextIdxToReplace),
                    strAfter = newStr.substring(nextIdxToReplace + 2);
                newStr = strBefore + val + strAfter;
                nextIdxToReplace = newStr.indexOf("{}", nextIdxToReplace + val.length);
                if (nextIdxToReplace < 0) {
                    return false;
                }
            });
            return newStr;
        };
        Uploader.isFile = function(maybeFile) {
            return window.File && Object.prototype.toString.call(maybeFile) === "[object File]";
        };
        Uploader.isFileList = function(maybeFileList) {
            return window.FileList && Object.prototype.toString.call(maybeFileList) === "[object FileList]";
        };
        Uploader.isFileOrInput = function(maybeFileOrInput) {
            return Uploader.isFile(maybeFileOrInput) || Uploader.isInput(maybeFileOrInput);
        };
        Uploader.isInput = function(maybeInput, notFile) {
            var evaluateType = function(type) {
                var normalizedType = type.toLowerCase();
                if (notFile) {
                    return normalizedType !== "file";
                }
                return normalizedType === "file";
            };
            if (window.HTMLInputElement) {
                if (Object.prototype.toString.call(maybeInput) === "[object HTMLInputElement]") {
                    if (maybeInput.type && evaluateType(maybeInput.type)) {
                        return true;
                    }
                }
            }
            if (maybeInput.tagName) {
                if (maybeInput.tagName.toLowerCase() === "input") {
                    if (maybeInput.type && evaluateType(maybeInput.type)) {
                        return true;
                    }
                }
            }
            return false;
        };
        Uploader.isBlob = function(maybeBlob) {
            if (window.Blob && Object.prototype.toString.call(maybeBlob) === "[object Blob]") {
                return true;
            }
        };
        Uploader.isXhrUploadSupported = function() {
            var input = document.createElement("input");
            input.type = "file";
            return input.multiple !== undefined && typeof File !== "undefined" && typeof FormData !== "undefined" && typeof Uploader.createXhrInstance().upload !== "undefined";
        };
        Uploader.createXhrInstance = function() {
            if (window.XMLHttpRequest) {
                return new XMLHttpRequest();
            }
            try {
                return new ActiveXObject("MSXML2.XMLHTTP.3.0");
            } catch (error) {
                Uploader.log("Neither XHR or ActiveX are supported!", "error");
                return null;
            }
        };
        Uploader.isFolderDropSupported = function(dataTransfer) {
            return dataTransfer.items && dataTransfer.items.length > 0 && dataTransfer.items[0].webkitGetAsEntry;
        };
        Uploader.isFileChunkingSupported = function() {
            return !Uploader.androidStock() && Uploader.isXhrUploadSupported() && (File.prototype.slice !== undefined || File.prototype.webkitSlice !== undefined || File.prototype.mozSlice !== undefined);
        };
        Uploader.sliceBlob = function(fileOrBlob, start, end) {
            var slicer = fileOrBlob.slice || fileOrBlob.mozSlice || fileOrBlob.webkitSlice;
            return slicer.call(fileOrBlob, start, end);
        };
        Uploader.arrayBufferToHex = function(buffer) {
            var bytesAsHex = "",
                bytes = new Uint8Array(buffer);
            Uploader.each(bytes, function(idx, byt) {
                var byteAsHexStr = byt.toString(16);
                if (byteAsHexStr.length < 2) {
                    byteAsHexStr = "0" + byteAsHexStr;
                }
                bytesAsHex += byteAsHexStr;
            });
            return bytesAsHex;
        };
        Uploader.readBlobToHex = function(blob, startOffset, length) {
            var initialBlob = Uploader.sliceBlob(blob, startOffset, startOffset + length),
                fileReader = new FileReader(),
                promise = new Uploader.Promise();
            fileReader.onload = function() {
                promise.success(Uploader.arrayBufferToHex(fileReader.result));
            };
            fileReader.onerror = promise.failure;
            fileReader.readAsArrayBuffer(initialBlob);
            return promise;
        };
        Uploader.extend = function(first, second, extendNested) {
            Uploader.each(second, function(prop, val) {
                if (extendNested && Uploader.isObject(val)) {
                    if (first[prop] === undefined) {
                        first[prop] = {};
                    }
                    Uploader.extend(first[prop], val, true);
                } else {
                    first[prop] = val;
                }
            });
            return first;
        };
        Uploader.override = function(target, sourceFn) {
            var super_ = {},
                source = sourceFn(super_);
            Uploader.each(source, function(srcPropName, srcPropVal) {
                if (target[srcPropName] !== undefined) {
                    super_[srcPropName] = target[srcPropName];
                }
                target[srcPropName] = srcPropVal;
            });
            return target;
        };
        Uploader.indexOf = function(arr, elt, from) {
            if (arr.indexOf) {
                return arr.indexOf(elt, from);
            }
            from = from || 0;
            var len = arr.length;
            if (from < 0) {
                from += len;
            }
            for (; from < len; from += 1) {
                if (arr.hasOwnProperty(from) && arr[from] === elt) {
                    return from;
                }
            }
            return -1;
        };
        Uploader.getUniqueId = function() {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == "x" ? r : r & 3 | 8;
                return v.toString(16);
            });
        };
        Uploader.ie = function() {
            return navigator.userAgent.indexOf("MSIE") !== -1 || navigator.userAgent.indexOf("Trident") !== -1;
        };
        Uploader.ie7 = function() {
            return navigator.userAgent.indexOf("MSIE 7") !== -1;
        };
        Uploader.ie8 = function() {
            return navigator.userAgent.indexOf("MSIE 8") !== -1;
        };
        Uploader.ie10 = function() {
            return navigator.userAgent.indexOf("MSIE 10") !== -1;
        };
        Uploader.ie11 = function() {
            return Uploader.ie() && navigator.userAgent.indexOf("rv:11") !== -1;
        };
        Uploader.edge = function() {
            return navigator.userAgent.indexOf("Edge") >= 0;
        };
        Uploader.safari = function() {
            return navigator.vendor !== undefined && navigator.vendor.indexOf("Apple") !== -1;
        };
        Uploader.chrome = function() {
            return navigator.vendor !== undefined && navigator.vendor.indexOf("Google") !== -1;
        };
        Uploader.opera = function() {
            return navigator.vendor !== undefined && navigator.vendor.indexOf("Opera") !== -1;
        };
        Uploader.firefox = function() {
            return !Uploader.edge() && !Uploader.ie11() && navigator.userAgent.indexOf("Mozilla") !== -1 && navigator.vendor !== undefined && navigator.vendor === "";
        };
        Uploader.windows = function() {
            return navigator.platform === "Win32";
        };
        Uploader.android = function() {
            return navigator.userAgent.toLowerCase().indexOf("android") !== -1;
        };
        Uploader.androidStock = function() {
            return Uploader.android() && navigator.userAgent.toLowerCase().indexOf("chrome") < 0;
        };
        Uploader.ios6 = function() {
            return Uploader.ios() && navigator.userAgent.indexOf(" OS 6_") !== -1;
        };
        Uploader.ios7 = function() {
            return Uploader.ios() && navigator.userAgent.indexOf(" OS 7_") !== -1;
        };
        Uploader.ios8 = function() {
            return Uploader.ios() && navigator.userAgent.indexOf(" OS 8_") !== -1;
        };
        Uploader.ios800 = function() {
            return Uploader.ios() && navigator.userAgent.indexOf(" OS 8_0 ") !== -1;
        };
        Uploader.ios = function() {
            return navigator.userAgent.indexOf("iPad") !== -1 || navigator.userAgent.indexOf("iPod") !== -1 || navigator.userAgent.indexOf("iPhone") !== -1;
        };
        Uploader.iosChrome = function() {
            return Uploader.ios() && navigator.userAgent.indexOf("CriOS") !== -1;
        };
        Uploader.iosSafari = function() {
            return Uploader.ios() && !Uploader.iosChrome() && navigator.userAgent.indexOf("Safari") !== -1;
        };
        Uploader.iosSafariWebView = function() {
            return Uploader.ios() && !Uploader.iosChrome() && !Uploader.iosSafari();
        };
        Uploader.preventDefault = function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
        };
        Uploader.toElement = function() {
            var div = document.createElement("div");
            return function(html) {
                div.innerHTML = html;
                var element = div.firstChild;
                div.removeChild(element);
                return element;
            };
        }();
        Uploader.each = function(iterableItem, callback) {
            var keyOrIndex, retVal;
            if (iterableItem) {
                if (window.Storage && iterableItem.constructor === window.Storage) {
                    for (keyOrIndex = 0; keyOrIndex < iterableItem.length; keyOrIndex++) {
                        retVal = callback(iterableItem.key(keyOrIndex), iterableItem.getItem(iterableItem.key(keyOrIndex)));
                        if (retVal === false) {
                            break;
                        }
                    }
                } else if (Uploader.isArray(iterableItem) || Uploader.isItemList(iterableItem) || Uploader.isNodeList(iterableItem)) {
                    for (keyOrIndex = 0; keyOrIndex < iterableItem.length; keyOrIndex++) {
                        retVal = callback(keyOrIndex, iterableItem[keyOrIndex]);
                        if (retVal === false) {
                            break;
                        }
                    }
                } else if (Uploader.isString(iterableItem)) {
                    for (keyOrIndex = 0; keyOrIndex < iterableItem.length; keyOrIndex++) {
                        retVal = callback(keyOrIndex, iterableItem.charAt(keyOrIndex));
                        if (retVal === false) {
                            break;
                        }
                    }
                } else {
                    for (keyOrIndex in iterableItem) {
                        if (Object.prototype.hasOwnProperty.call(iterableItem, keyOrIndex)) {
                            retVal = callback(keyOrIndex, iterableItem[keyOrIndex]);
                            if (retVal === false) {
                                break;
                            }
                        }
                    }
                }
            }
        };
        Uploader.bind = function(oldFunc, context) {
            if (Uploader.isFunction(oldFunc)) {
                var args = Array.prototype.slice.call(arguments, 2);
                return function() {
                    var newArgs = Uploader.extend([], args);
                    if (arguments.length) {
                        newArgs = newArgs.concat(Array.prototype.slice.call(arguments));
                    }
                    return oldFunc.apply(context, newArgs);
                };
            }
            throw new Error("first parameter must be a function!");
        };
        Uploader.obj2url = function(obj, temp, prefixDone) {
            var uristrings = [],
                prefix = "&",
                add = function(nextObj, i) {
                    var nextTemp = temp ? /\[\]$/.test(temp) ? temp : temp + "[" + i + "]" : i;
                    if (nextTemp !== "undefined" && i !== "undefined") {
                        uristrings.push(typeof nextObj === "object" ? Uploader.obj2url(nextObj, nextTemp, true) : Object.prototype.toString.call(nextObj) === "[object Function]" ? encodeURIComponent(nextTemp) + "=" + encodeURIComponent(nextObj()) : encodeURIComponent(nextTemp) + "=" + encodeURIComponent(nextObj));
                    }
                };
            if (!prefixDone && temp) {
                prefix = /\?/.test(temp) ? /\?$/.test(temp) ? "" : "&" : "?";
                uristrings.push(temp);
                uristrings.push(Uploader.obj2url(obj));
            } else if (Object.prototype.toString.call(obj) === "[object Array]" && typeof obj !== "undefined") {
                Uploader.each(obj, function(idx, val) {
                    add(val, idx);
                });
            } else if (typeof obj !== "undefined" && obj !== null && typeof obj === "object") {
                Uploader.each(obj, function(prop, val) {
                    add(val, prop);
                });
            } else {
                uristrings.push(encodeURIComponent(temp) + "=" + encodeURIComponent(obj));
            }
            if (temp) {
                return uristrings.join(prefix);
            } else {
                return uristrings.join(prefix).replace(/^&/, "").replace(/%20/g, "+");
            }
        };
        Uploader.obj2FormData = function(obj, formData, arrayKeyName) {
            if (!formData) {
                formData = new FormData();
            }
            Uploader.each(obj, function(key, val) {
                key = arrayKeyName ? arrayKeyName + "[" + key + "]" : key;
                if (Uploader.isObject(val)) {
                    Uploader.obj2FormData(val, formData, key);
                } else if (Uploader.isFunction(val)) {
                    formData.append(key, val());
                } else {
                    formData.append(key, val);
                }
            });
            return formData;
        };
        Uploader.obj2Inputs = function(obj, form) {
            var input;
            if (!form) {
                form = document.createElement("form");
            }
            Uploader.obj2FormData(obj, {
                append: function(key, val) {
                    input = document.createElement("input");
                    input.setAttribute("name", key);
                    input.setAttribute("value", val);
                    form.appendChild(input);
                }
            });
            return form;
        };
        Uploader.parseJson = function(json) {
            if (window.JSON && Uploader.isFunction(JSON.parse)) {
                return JSON.parse(json);
            } else {
                return eval("(" + json + ")");
            }
        };
        Uploader.getExtension = function(filename) {
            var extIdx = filename.lastIndexOf(".") + 1;
            if (extIdx > 0) {
                return filename.substr(extIdx, filename.length - extIdx);
            }
        };
        Uploader.getFilename = function(blobOrFileInput) {
            if (Uploader.isInput(blobOrFileInput)) {
                return blobOrFileInput.value.replace(/.*(\/|\\)/, "");
            } else if (Uploader.isFile(blobOrFileInput)) {
                if (blobOrFileInput.fileName !== null && blobOrFileInput.fileName !== undefined) {
                    return blobOrFileInput.fileName;
                }
            }
            return blobOrFileInput.name;
        };
        Uploader.DisposeSupport = function() {
            var disposers = [];
            return {
                dispose: function() {
                    var disposer;
                    do {
                        disposer = disposers.shift();
                        if (disposer) {
                            disposer();
                        }
                    } while (disposer);
                },
                attach: function() {
                    var args = arguments;
                    this.addDisposer(Uploader(args[0]).attach.apply(this, Array.prototype.slice.call(arguments, 1)));
                },
                addDisposer: function(disposeFunction) {
                    disposers.push(disposeFunction);
                }
            };
        };
    })();
    (function() {
        "use strict";
        if (typeof define === "function" && define.amd) {
            define(function() {
                return Uploader;
            });
        } else if (typeof module !== "undefined" && module.exports) {
            module.exports = Uploader;
        } else {
            global.Uploader = Uploader;
        }
    })();
    (function() {
        "use strict";
        Uploader.Error = function(message) {
            this.message = message;
        };
        Uploader.Error.prototype = new Error();
    })();
    Uploader.version = "5.15.6";
    Uploader.supportedFeatures = function() {
        "use strict";
        var supportsUploading, supportsUploadingBlobs, supportsFileDrop, supportsAjaxFileUploading, supportsFolderDrop, supportsChunking, supportsResume, supportsUploadViaPaste, supportsUploadCors, supportsDeleteFileXdr, supportsDeleteFileCorsXhr, supportsDeleteFileCors, supportsFolderSelection, supportsImagePreviews, supportsUploadProgress;

        function testSupportsFileInputElement() {
            var supported = true,
                tempInput;
            try {
                tempInput = document.createElement("input");
                tempInput.type = "file";
                Uploader(tempInput).hide();
                if (tempInput.disabled) {
                    supported = false;
                }
            } catch (ex) {
                supported = false;
            }
            return supported;
        }

        function isChrome21OrHigher() {
            return (Uploader.chrome() || Uploader.opera()) && navigator.userAgent.match(/Chrome\/[2][1-9]|Chrome\/[3-9][0-9]/) !== undefined;
        }

        function isChrome14OrHigher() {
            return (Uploader.chrome() || Uploader.opera()) && navigator.userAgent.match(/Chrome\/[1][4-9]|Chrome\/[2-9][0-9]/) !== undefined;
        }

        function isCrossOriginXhrSupported() {
            if (window.XMLHttpRequest) {
                var xhr = Uploader.createXhrInstance();
                return xhr.withCredentials !== undefined;
            }
            return false;
        }

        function isXdrSupported() {
            return window.XDomainRequest !== undefined;
        }

        function isCrossOriginAjaxSupported() {
            if (isCrossOriginXhrSupported()) {
                return true;
            }
            return isXdrSupported();
        }

        function isFolderSelectionSupported() {
            return document.createElement("input").webkitdirectory !== undefined;
        }

        function isLocalStorageSupported() {
            try {
                return !!window.localStorage && Uploader.isFunction(window.localStorage.setItem);
            } catch (error) {
                return false;
            }
        }

        function isDragAndDropSupported() {
            var span = document.createElement("span");
            return ("draggable" in span || "ondragstart" in span && "ondrop" in span) && !Uploader.android() && !Uploader.ios();
        }
        supportsUploading = testSupportsFileInputElement();
        supportsAjaxFileUploading = supportsUploading && Uploader.isXhrUploadSupported();
        supportsUploadingBlobs = supportsAjaxFileUploading && !Uploader.androidStock();
        supportsFileDrop = supportsAjaxFileUploading && isDragAndDropSupported();
        supportsFolderDrop = supportsFileDrop && isChrome21OrHigher();
        supportsChunking = supportsAjaxFileUploading && Uploader.isFileChunkingSupported();
        supportsResume = supportsAjaxFileUploading && supportsChunking && isLocalStorageSupported();
        supportsUploadViaPaste = supportsAjaxFileUploading && isChrome14OrHigher();
        supportsUploadCors = supportsUploading && (window.postMessage !== undefined || supportsAjaxFileUploading);
        supportsDeleteFileCorsXhr = isCrossOriginXhrSupported();
        supportsDeleteFileXdr = isXdrSupported();
        supportsDeleteFileCors = isCrossOriginAjaxSupported();
        supportsFolderSelection = isFolderSelectionSupported();
        supportsImagePreviews = supportsAjaxFileUploading && window.FileReader !== undefined;
        supportsUploadProgress = function() {
            if (supportsAjaxFileUploading) {
                return !Uploader.androidStock() && !Uploader.iosChrome();
            }
            return false;
        }();
        return {
            ajaxUploading: supportsAjaxFileUploading,
            blobUploading: supportsUploadingBlobs,
            canDetermineSize: supportsAjaxFileUploading,
            chunking: supportsChunking,
            deleteFileCors: supportsDeleteFileCors,
            deleteFileCorsXdr: supportsDeleteFileXdr,
            deleteFileCorsXhr: supportsDeleteFileCorsXhr,
            dialogElement: !!window.HTMLDialogElement,
            fileDrop: supportsFileDrop,
            folderDrop: supportsFolderDrop,
            folderSelection: supportsFolderSelection,
            imagePreviews: supportsImagePreviews,
            imageValidation: supportsImagePreviews,
            itemSizeValidation: supportsAjaxFileUploading,
            pause: supportsChunking,
            progressBar: supportsUploadProgress,
            resume: supportsResume,
            scaling: supportsImagePreviews && supportsUploadingBlobs,
            tiffPreviews: Uploader.safari(),
            unlimitedScaledImageSize: !Uploader.ios(),
            uploading: supportsUploading,
            uploadCors: supportsUploadCors,
            uploadCustomHeaders: supportsAjaxFileUploading,
            uploadNonMultipart: supportsAjaxFileUploading,
            uploadViaPaste: supportsUploadViaPaste
        };
    }();
    Uploader.isGenericPromise = function(maybePromise) {
        "use strict";
        return !!(maybePromise && maybePromise.then && Uploader.isFunction(maybePromise.then));
    };
    Uploader.Promise = function() {
        "use strict";
        var successArgs, failureArgs, successCallbacks = [],
            failureCallbacks = [],
            doneCallbacks = [],
            state = 0;
        Uploader.extend(this, {
            then: function(onSuccess, onFailure) {
                if (state === 0) {
                    if (onSuccess) {
                        successCallbacks.push(onSuccess);
                    }
                    if (onFailure) {
                        failureCallbacks.push(onFailure);
                    }
                } else if (state === -1) {
                    onFailure && onFailure.apply(null, failureArgs);
                } else if (onSuccess) {
                    onSuccess.apply(null, successArgs);
                }
                return this;
            },
            done: function(callback) {
                if (state === 0) {
                    doneCallbacks.push(callback);
                } else {
                    callback.apply(null, failureArgs === undefined ? successArgs : failureArgs);
                }
                return this;
            },
            success: function() {
                state = 1;
                successArgs = arguments;
                if (successCallbacks.length) {
                    Uploader.each(successCallbacks, function(idx, callback) {
                        callback.apply(null, successArgs);
                    });
                }
                if (doneCallbacks.length) {
                    Uploader.each(doneCallbacks, function(idx, callback) {
                        callback.apply(null, successArgs);
                    });
                }
                return this;
            },
            failure: function() {
                state = -1;
                failureArgs = arguments;
                if (failureCallbacks.length) {
                    Uploader.each(failureCallbacks, function(idx, callback) {
                        callback.apply(null, failureArgs);
                    });
                }
                if (doneCallbacks.length) {
                    Uploader.each(doneCallbacks, function(idx, callback) {
                        callback.apply(null, failureArgs);
                    });
                }
                return this;
            }
        });
    };
    Uploader.BlobProxy = function(referenceBlob, onCreate) {
        "use strict";
        Uploader.extend(this, {
            referenceBlob: referenceBlob,
            create: function() {
                return onCreate(referenceBlob);
            }
        });
    };
    Uploader.UploadButton = function(o) {
        "use strict";
        var self = this,
            disposeSupport = new Uploader.DisposeSupport(),
            options = {
                acceptFiles: null,
                element: null,
                focusClass: "Uploader-upload-button-focus",
                folders: false,
                hoverClass: "Uploader-upload-button-hover",
                ios8BrowserCrashWorkaround: false,
                multiple: false,
                name: "qqfile",
                onChange: function(input) {},
                title: null
            },
            input, buttonId;
        Uploader.extend(options, o);
        buttonId = Uploader.getUniqueId();

        function createInput() {
            var input = document.createElement("input");
            input.setAttribute(Uploader.UploadButton.BUTTON_ID_ATTR_NAME, buttonId);
            input.setAttribute("title", options.title);
            self.setMultiple(options.multiple, input);
            if (options.folders && Uploader.supportedFeatures.folderSelection) {
                input.setAttribute("webkitdirectory", "");
            }
            if (options.acceptFiles) {
                input.setAttribute("accept", options.acceptFiles);
            }
            input.setAttribute("type", "file");
            input.setAttribute("name", options.name);
            Uploader(input).css({
                position: "absolute",
                right: 0,
                top: 0,
                fontFamily: "Arial",
                fontSize: Uploader.ie() && !Uploader.ie8() ? "3500px" : "118px",
                margin: 0,
                padding: 0,
                cursor: "pointer",
                opacity: 0
            });
            !Uploader.ie7() && Uploader(input).css({
                height: "100%"
            });
            options.element.appendChild(input);
            disposeSupport.attach(input, "change", function() {
                options.onChange(input);
            });
            disposeSupport.attach(input, "mouseover", function() {
                Uploader(options.element).addClass(options.hoverClass);
            });
            disposeSupport.attach(input, "mouseout", function() {
                Uploader(options.element).removeClass(options.hoverClass);
            });
            disposeSupport.attach(input, "focus", function() {
                Uploader(options.element).addClass(options.focusClass);
            });
            disposeSupport.attach(input, "blur", function() {
                Uploader(options.element).removeClass(options.focusClass);
            });
            return input;
        }
        Uploader(options.element).css({
            position: "relative",
            overflow: "hidden",
            direction: "ltr"
        });
        Uploader.extend(this, {
            getInput: function() {
                return input;
            },
            getButtonId: function() {
                return buttonId;
            },
            setMultiple: function(isMultiple, optInput) {
                var input = optInput || this.getInput();
                if (options.ios8BrowserCrashWorkaround && Uploader.ios8() && (Uploader.iosChrome() || Uploader.iosSafariWebView())) {
                    input.setAttribute("multiple", "");
                } else {
                    if (isMultiple) {
                        input.setAttribute("multiple", "");
                    } else {
                        input.removeAttribute("multiple");
                    }
                }
            },
            setAcceptFiles: function(acceptFiles) {
                if (acceptFiles !== options.acceptFiles) {
                    input.setAttribute("accept", acceptFiles);
                }
            },
            reset: function() {
                if (input.parentNode) {
                    Uploader(input).remove();
                }
                Uploader(options.element).removeClass(options.focusClass);
                input = null;
                input = createInput();
            }
        });
        input = createInput();
    };
    Uploader.UploadButton.BUTTON_ID_ATTR_NAME = "Uploader-button-id";
    Uploader.UploadData = function(uploaderProxy) {
        "use strict";
        var data = [],
            byUuid = {},
            byStatus = {},
            byProxyGroupId = {},
            byBatchId = {};

        function getDataByIds(idOrIds) {
            if (Uploader.isArray(idOrIds)) {
                var entries = [];
                Uploader.each(idOrIds, function(idx, id) {
                    entries.push(data[id]);
                });
                return entries;
            }
            return data[idOrIds];
        }

        function getDataByUuids(uuids) {
            if (Uploader.isArray(uuids)) {
                var entries = [];
                Uploader.each(uuids, function(idx, uuid) {
                    entries.push(data[byUuid[uuid]]);
                });
                return entries;
            }
            return data[byUuid[uuids]];
        }

        function getDataByStatus(status) {
            var statusResults = [],
                statuses = [].concat(status);
            Uploader.each(statuses, function(index, statusEnum) {
                var statusResultIndexes = byStatus[statusEnum];
                if (statusResultIndexes !== undefined) {
                    Uploader.each(statusResultIndexes, function(i, dataIndex) {
                        statusResults.push(data[dataIndex]);
                    });
                }
            });
            return statusResults;
        }
        Uploader.extend(this, {
            addFile: function(spec) {
                var status = spec.status || Uploader.status.SUBMITTING,
                    id = data.push({
                        name: spec.name,
                        originalName: spec.name,
                        uuid: spec.uuid,
                        size: spec.size == null ? -1 : spec.size,
                        status: status
                    }) - 1;
                if (spec.batchId) {
                    data[id].batchId = spec.batchId;
                    if (byBatchId[spec.batchId] === undefined) {
                        byBatchId[spec.batchId] = [];
                    }
                    byBatchId[spec.batchId].push(id);
                }
                if (spec.proxyGroupId) {
                    data[id].proxyGroupId = spec.proxyGroupId;
                    if (byProxyGroupId[spec.proxyGroupId] === undefined) {
                        byProxyGroupId[spec.proxyGroupId] = [];
                    }
                    byProxyGroupId[spec.proxyGroupId].push(id);
                }
                data[id].id = id;
                byUuid[spec.uuid] = id;
                if (byStatus[status] === undefined) {
                    byStatus[status] = [];
                }
                byStatus[status].push(id);
                spec.onBeforeStatusChange && spec.onBeforeStatusChange(id);
                uploaderProxy.onStatusChange(id, null, status);
                return id;
            },
            retrieve: function(optionalFilter) {
                if (Uploader.isObject(optionalFilter) && data.length) {
                    if (optionalFilter.id !== undefined) {
                        return getDataByIds(optionalFilter.id);
                    } else if (optionalFilter.uuid !== undefined) {
                        return getDataByUuids(optionalFilter.uuid);
                    } else if (optionalFilter.status) {
                        return getDataByStatus(optionalFilter.status);
                    }
                } else {
                    return Uploader.extend([], data, true);
                }
            },
            reset: function() {
                data = [];
                byUuid = {};
                byStatus = {};
                byBatchId = {};
            },
            setStatus: function(id, newStatus) {
                var oldStatus = data[id].status,
                    byStatusOldStatusIndex = Uploader.indexOf(byStatus[oldStatus], id);
                byStatus[oldStatus].splice(byStatusOldStatusIndex, 1);
                data[id].status = newStatus;
                if (byStatus[newStatus] === undefined) {
                    byStatus[newStatus] = [];
                }
                byStatus[newStatus].push(id);
                uploaderProxy.onStatusChange(id, oldStatus, newStatus);
            },
            uuidChanged: function(id, newUuid) {
                var oldUuid = data[id].uuid;
                data[id].uuid = newUuid;
                byUuid[newUuid] = id;
                delete byUuid[oldUuid];
            },
            updateName: function(id, newName) {
                data[id].name = newName;
            },
            updateSize: function(id, newSize) {
                data[id].size = newSize;
            },
            setParentId: function(targetId, parentId) {
                data[targetId].parentId = parentId;
            },
            getIdsInProxyGroup: function(id) {
                var proxyGroupId = data[id].proxyGroupId;
                if (proxyGroupId) {
                    return byProxyGroupId[proxyGroupId];
                }
                return [];
            },
            getIdsInBatch: function(id) {
                var batchId = data[id].batchId;
                return byBatchId[batchId];
            }
        });
    };
    Uploader.status = {
        SUBMITTING: "submitting",
        SUBMITTED: "submitted",
        REJECTED: "rejected",
        QUEUED: "queued",
        CANCELED: "canceled",
        PAUSED: "paused",
        UPLOADING: "uploading",
        UPLOAD_RETRYING: "retrying upload",
        UPLOAD_SUCCESSFUL: "upload successful",
        UPLOAD_FAILED: "upload failed",
        DELETE_FAILED: "delete failed",
        DELETING: "deleting",
        DELETED: "deleted"
    };
    (function() {
        "use strict";
        Uploader.basePublicApi = {
            addBlobs: function(blobDataOrArray, params, endpoint) {
                this.addFiles(blobDataOrArray, params, endpoint);
            },
            addInitialFiles: function(cannedFileList) {
                var self = this;
                Uploader.each(cannedFileList, function(index, cannedFile) {
                    self._addCannedFile(cannedFile);
                });
            },
            addFiles: function(data, params, endpoint) {
                this._maybeHandleIos8SafariWorkaround();
                var batchId = this._storedIds.length === 0 ? Uploader.getUniqueId() : this._currentBatchId,
                    processBlob = Uploader.bind(function(blob) {
                        this._handleNewFile({
                            blob: blob,
                            name: this._options.blobs.defaultName
                        }, batchId, verifiedFiles);
                    }, this),
                    processBlobData = Uploader.bind(function(blobData) {
                        this._handleNewFile(blobData, batchId, verifiedFiles);
                    }, this),
                    processCanvas = Uploader.bind(function(canvas) {
                        var blob = Uploader.canvasToBlob(canvas);
                        this._handleNewFile({
                            blob: blob,
                            name: this._options.blobs.defaultName + ".png"
                        }, batchId, verifiedFiles);
                    }, this),
                    processCanvasData = Uploader.bind(function(canvasData) {
                        var normalizedQuality = canvasData.quality && canvasData.quality / 100,
                            blob = Uploader.canvasToBlob(canvasData.canvas, canvasData.type, normalizedQuality);
                        this._handleNewFile({
                            blob: blob,
                            name: canvasData.name
                        }, batchId, verifiedFiles);
                    }, this),
                    processFileOrInput = Uploader.bind(function(fileOrInput) {
                        if (Uploader.isInput(fileOrInput) && Uploader.supportedFeatures.ajaxUploading) {
                            var files = Array.prototype.slice.call(fileOrInput.files),
                                self = this;
                            Uploader.each(files, function(idx, file) {
                                self._handleNewFile(file, batchId, verifiedFiles);
                            });
                        } else {
                            this._handleNewFile(fileOrInput, batchId, verifiedFiles);
                        }
                    }, this),
                    normalizeData = function() {
                        if (Uploader.isFileList(data)) {
                            data = Array.prototype.slice.call(data);
                        }
                        data = [].concat(data);
                    },
                    self = this,
                    verifiedFiles = [];
                this._currentBatchId = batchId;
                if (data) {
                    normalizeData();
                    Uploader.each(data, function(idx, fileContainer) {
                        if (Uploader.isFileOrInput(fileContainer)) {
                            processFileOrInput(fileContainer);
                        } else if (Uploader.isBlob(fileContainer)) {
                            processBlob(fileContainer);
                        } else if (Uploader.isObject(fileContainer)) {
                            if (fileContainer.blob && fileContainer.name) {
                                processBlobData(fileContainer);
                            } else if (fileContainer.canvas && fileContainer.name) {
                                processCanvasData(fileContainer);
                            }
                        } else if (fileContainer.tagName && fileContainer.tagName.toLowerCase() === "canvas") {
                            processCanvas(fileContainer);
                        } else {
                            self.log(fileContainer + " is not a valid file container!  Ignoring!", "warn");
                        }
                    });
                    this.log("Received " + verifiedFiles.length + " files.");
                    this._prepareItemsForUpload(verifiedFiles, params, endpoint);
                }
            },
            cancel: function(id) {
                this._handler.cancel(id);
            },
            cancelAll: function() {
                var storedIdsCopy = [],
                    self = this;
                Uploader.extend(storedIdsCopy, this._storedIds);
                Uploader.each(storedIdsCopy, function(idx, storedFileId) {
                    self.cancel(storedFileId);
                });
                this._handler.cancelAll();
            },
            clearStoredFiles: function() {
                this._storedIds = [];
            },
            continueUpload: function(id) {
                var uploadData = this._uploadData.retrieve({
                    id: id
                });
                if (!Uploader.supportedFeatures.pause || !this._options.chunking.enabled) {
                    return false;
                }
                if (uploadData.status === Uploader.status.PAUSED) {
                    this.log(Uploader.format("Paused file ID {} ({}) will be continued.  Not paused.", id, this.getName(id)));
                    this._uploadFile(id);
                    return true;
                } else {
                    this.log(Uploader.format("Ignoring continue for file ID {} ({}).  Not paused.", id, this.getName(id)), "error");
                }
                return false;
            },
            deleteFile: function(id) {
                return this._onSubmitDelete(id);
            },
            doesExist: function(fileOrBlobId) {
                return this._handler.isValid(fileOrBlobId);
            },
            drawThumbnail: function(fileId, imgOrCanvas, maxSize, fromServer, customResizeFunction) {
                var promiseToReturn = new Uploader.Promise(),
                    fileOrUrl, options;
                if (this._imageGenerator) {
                    fileOrUrl = this._thumbnailUrls[fileId];
                    options = {
                        customResizeFunction: customResizeFunction,
                        maxSize: maxSize > 0 ? maxSize : null,
                        scale: maxSize > 0
                    };
                    if (!fromServer && Uploader.supportedFeatures.imagePreviews) {
                        fileOrUrl = this.getFile(fileId);
                    }
                    if (fileOrUrl == null) {
                        promiseToReturn.failure({
                            container: imgOrCanvas,
                            error: "File or URL not found."
                        });
                    } else {
                        this._imageGenerator.generate(fileOrUrl, imgOrCanvas, options).then(function success(modifiedContainer) {
                            promiseToReturn.success(modifiedContainer);
                        }, function failure(container, reason) {
                            promiseToReturn.failure({
                                container: container,
                                error: reason || "Problem generating thumbnail"
                            });
                        });
                    }
                } else {
                    promiseToReturn.failure({
                        container: imgOrCanvas,
                        error: "Missing image generator module"
                    });
                }
                return promiseToReturn;
            },
            getButton: function(fileId) {
                return this._getButton(this._buttonIdsForFileIds[fileId]);
            },
            getEndpoint: function(fileId) {
                return this._endpointStore.get(fileId);
            },
            getFile: function(fileOrBlobId) {
                return this._handler.getFile(fileOrBlobId) || null;
            },
            getInProgress: function() {
                return this._uploadData.retrieve({
                    status: [Uploader.status.UPLOADING, Uploader.status.UPLOAD_RETRYING, Uploader.status.QUEUED]
                }).length;
            },
            getName: function(id) {
                return this._uploadData.retrieve({
                    id: id
                }).name;
            },
            getParentId: function(id) {
                var uploadDataEntry = this.getUploads({
                        id: id
                    }),
                    parentId = null;
                if (uploadDataEntry) {
                    if (uploadDataEntry.parentId !== undefined) {
                        parentId = uploadDataEntry.parentId;
                    }
                }
                return parentId;
            },
            getResumableFilesData: function() {
                return this._handler.getResumableFilesData();
            },
            getSize: function(id) {
                return this._uploadData.retrieve({
                    id: id
                }).size;
            },
            getNetUploads: function() {
                return this._netUploaded;
            },
            getRemainingAllowedItems: function() {
                var allowedItems = this._currentItemLimit;
                if (allowedItems > 0) {
                    return allowedItems - this._netUploadedOrQueued;
                }
                return null;
            },
            getUploads: function(optionalFilter) {
                return this._uploadData.retrieve(optionalFilter);
            },
            getUuid: function(id) {
                return this._uploadData.retrieve({
                    id: id
                }).uuid;
            },
            log: function(str, level) {
                if (this._options.debug && (!level || level === "info")) {
                    Uploader.log(str);
                } else if (level && level !== "info") {
                    Uploader.log(str, level);
                }
            },
            pauseUpload: function(id) {
                var uploadData = this._uploadData.retrieve({
                    id: id
                });
                if (!Uploader.supportedFeatures.pause || !this._options.chunking.enabled) {
                    return false;
                }
                if (Uploader.indexOf([Uploader.status.UPLOADING, Uploader.status.UPLOAD_RETRYING], uploadData.status) >= 0) {
                    if (this._handler.pause(id)) {
                        this._uploadData.setStatus(id, Uploader.status.PAUSED);
                        return true;
                    } else {
                        this.log(Uploader.format("Unable to pause file ID {} ({}).", id, this.getName(id)), "error");
                    }
                } else {
                    this.log(Uploader.format("Ignoring pause for file ID {} ({}).  Not in progress.", id, this.getName(id)), "error");
                }
                return false;
            },
            removeFileRef: function(id) {
                this._handler.expunge(id);
            },
            reset: function() {
                this.log("Resetting uploader...");
                this._handler.reset();
                this._storedIds = [];
                this._autoRetries = [];
                this._retryTimeouts = [];
                this._preventRetries = [];
                this._thumbnailUrls = [];
                Uploader.each(this._buttons, function(idx, button) {
                    button.reset();
                });
                this._paramsStore.reset();
                this._endpointStore.reset();
                this._netUploadedOrQueued = 0;
                this._netUploaded = 0;
                this._uploadData.reset();
                this._buttonIdsForFileIds = [];
                this._pasteHandler && this._pasteHandler.reset();
                this._options.session.refreshOnReset && this._refreshSessionData();
                this._succeededSinceLastAllComplete = [];
                this._failedSinceLastAllComplete = [];
                this._totalProgress && this._totalProgress.reset();
            },
            retry: function(id) {
                return this._manualRetry(id);
            },
            scaleImage: function(id, specs) {
                var self = this;
                return Uploader.Scaler.prototype.scaleImage(id, specs, {
                    log: Uploader.bind(self.log, self),
                    getFile: Uploader.bind(self.getFile, self),
                    uploadData: self._uploadData
                });
            },
            setCustomHeaders: function(headers, id) {
                this._customHeadersStore.set(headers, id);
            },
            setDeleteFileCustomHeaders: function(headers, id) {
                this._deleteFileCustomHeadersStore.set(headers, id);
            },
            setDeleteFileEndpoint: function(endpoint, id) {
                this._deleteFileEndpointStore.set(endpoint, id);
            },
            setDeleteFileParams: function(params, id) {
                this._deleteFileParamsStore.set(params, id);
            },
            setEndpoint: function(endpoint, id) {
                this._endpointStore.set(endpoint, id);
            },
            setForm: function(elementOrId) {
                this._updateFormSupportAndParams(elementOrId);
            },
            setItemLimit: function(newItemLimit) {
                this._currentItemLimit = newItemLimit;
            },
            setName: function(id, newName) {
                this._uploadData.updateName(id, newName);
            },
            setParams: function(params, id) {
                this._paramsStore.set(params, id);
            },
            setUuid: function(id, newUuid) {
                return this._uploadData.uuidChanged(id, newUuid);
            },
            setStatus: function(id, newStatus) {
                var fileRecord = this.getUploads({
                    id: id
                });
                if (!fileRecord) {
                    throw new Uploader.Error(id + " is not a valid file ID.");
                }
                switch (newStatus) {
                    case Uploader.status.DELETED:
                        this._onDeleteComplete(id, null, false);
                        break;

                    case Uploader.status.DELETE_FAILED:
                        this._onDeleteComplete(id, null, true);
                        break;

                    default:
                        var errorMessage = "Method setStatus called on '" + name + "' not implemented yet for " + newStatus;
                        this.log(errorMessage);
                        throw new Uploader.Error(errorMessage);
                }
            },
            uploadStoredFiles: function() {
                if (this._storedIds.length === 0) {
                    this._itemError("noFilesError");
                } else {
                    this._uploadStoredFiles();
                }
            }
        };
        Uploader.basePrivateApi = {
            _addCannedFile: function(sessionData) {
                var self = this;
                return this._uploadData.addFile({
                    uuid: sessionData.uuid,
                    name: sessionData.name,
                    size: sessionData.size,
                    status: Uploader.status.UPLOAD_SUCCESSFUL,
                    onBeforeStatusChange: function(id) {
                        sessionData.deleteFileEndpoint && self.setDeleteFileEndpoint(sessionData.deleteFileEndpoint, id);
                        sessionData.deleteFileParams && self.setDeleteFileParams(sessionData.deleteFileParams, id);
                        if (sessionData.thumbnailUrl) {
                            self._thumbnailUrls[id] = sessionData.thumbnailUrl;
                        }
                        self._netUploaded++;
                        self._netUploadedOrQueued++;
                    }
                });
            },
            _annotateWithButtonId: function(file, associatedInput) {
                if (Uploader.isFile(file)) {
                    file.qqButtonId = this._getButtonId(associatedInput);
                }
            },
            _batchError: function(message) {
                this._options.callbacks.onError(null, null, message, undefined);
            },
            _createDeleteHandler: function() {
                var self = this;
                return new Uploader.DeleteFileAjaxRequester({
                    method: this._options.deleteFile.method.toUpperCase(),
                    maxConnections: this._options.maxConnections,
                    uuidParamName: this._options.request.uuidName,
                    customHeaders: this._deleteFileCustomHeadersStore,
                    paramsStore: this._deleteFileParamsStore,
                    endpointStore: this._deleteFileEndpointStore,
                    cors: this._options.cors,
                    log: Uploader.bind(self.log, self),
                    onDelete: function(id) {
                        self._onDelete(id);
                        self._options.callbacks.onDelete(id);
                    },
                    onDeleteComplete: function(id, xhrOrXdr, isError) {
                        self._onDeleteComplete(id, xhrOrXdr, isError);
                        self._options.callbacks.onDeleteComplete(id, xhrOrXdr, isError);
                    }
                });
            },
            _createPasteHandler: function() {
                var self = this;
                return new Uploader.PasteSupport({
                    targetElement: this._options.paste.targetElement,
                    callbacks: {
                        log: Uploader.bind(self.log, self),
                        pasteReceived: function(blob) {
                            self._handleCheckedCallback({
                                name: "onPasteReceived",
                                callback: Uploader.bind(self._options.callbacks.onPasteReceived, self, blob),
                                onSuccess: Uploader.bind(self._handlePasteSuccess, self, blob),
                                identifier: "pasted image"
                            });
                        }
                    }
                });
            },
            _createStore: function(initialValue, _readOnlyValues_) {
                var store = {},
                    catchall = initialValue,
                    perIdReadOnlyValues = {},
                    readOnlyValues = _readOnlyValues_,
                    copy = function(orig) {
                        if (Uploader.isObject(orig)) {
                            return Uploader.extend({}, orig);
                        }
                        return orig;
                    },
                    getReadOnlyValues = function() {
                        if (Uploader.isFunction(readOnlyValues)) {
                            return readOnlyValues();
                        }
                        return readOnlyValues;
                    },
                    includeReadOnlyValues = function(id, existing) {
                        if (readOnlyValues && Uploader.isObject(existing)) {
                            Uploader.extend(existing, getReadOnlyValues());
                        }
                        if (perIdReadOnlyValues[id]) {
                            Uploader.extend(existing, perIdReadOnlyValues[id]);
                        }
                    };
                return {
                    set: function(val, id) {
                        if (id == null) {
                            store = {};
                            catchall = copy(val);
                        } else {
                            store[id] = copy(val);
                        }
                    },
                    get: function(id) {
                        var values;
                        if (id != null && store[id]) {
                            values = store[id];
                        } else {
                            values = copy(catchall);
                        }
                        includeReadOnlyValues(id, values);
                        return copy(values);
                    },
                    addReadOnly: function(id, values) {
                        if (Uploader.isObject(store)) {
                            if (id === null) {
                                if (Uploader.isFunction(values)) {
                                    readOnlyValues = values;
                                } else {
                                    readOnlyValues = readOnlyValues || {};
                                    Uploader.extend(readOnlyValues, values);
                                }
                            } else {
                                perIdReadOnlyValues[id] = perIdReadOnlyValues[id] || {};
                                Uploader.extend(perIdReadOnlyValues[id], values);
                            }
                        }
                    },
                    remove: function(fileId) {
                        return delete store[fileId];
                    },
                    reset: function() {
                        store = {};
                        perIdReadOnlyValues = {};
                        catchall = initialValue;
                    }
                };
            },
            _createUploadDataTracker: function() {
                var self = this;
                return new Uploader.UploadData({
                    getName: function(id) {
                        return self.getName(id);
                    },
                    getUuid: function(id) {
                        return self.getUuid(id);
                    },
                    getSize: function(id) {
                        return self.getSize(id);
                    },
                    onStatusChange: function(id, oldStatus, newStatus) {
                        self._onUploadStatusChange(id, oldStatus, newStatus);
                        self._options.callbacks.onStatusChange(id, oldStatus, newStatus);
                        self._maybeAllComplete(id, newStatus);
                        if (self._totalProgress) {
                            setTimeout(function() {
                                self._totalProgress.onStatusChange(id, oldStatus, newStatus);
                            }, 0);
                        }
                    }
                });
            },
            _createUploadButton: function(spec) {
                var self = this,
                    acceptFiles = spec.accept || this._options.validation.acceptFiles,
                    allowedExtensions = spec.allowedExtensions || this._options.validation.allowedExtensions,
                    button;

                function allowMultiple() {
                    if (Uploader.supportedFeatures.ajaxUploading) {
                        if (self._options.workarounds.iosEmptyVideos && Uploader.ios() && !Uploader.ios6() && self._isAllowedExtension(allowedExtensions, ".mov")) {
                            return false;
                        }
                        if (spec.multiple === undefined) {
                            return self._options.multiple;
                        }
                        return spec.multiple;
                    }
                    return false;
                }
                button = new Uploader.UploadButton({
                    acceptFiles: acceptFiles,
                    element: spec.element,
                    focusClass: this._options.classes.buttonFocus,
                    folders: spec.folders,
                    hoverClass: this._options.classes.buttonHover,
                    ios8BrowserCrashWorkaround: this._options.workarounds.ios8BrowserCrash,
                    multiple: allowMultiple(),
                    name: this._options.request.inputName,
                    onChange: function(input) {
                        self._onInputChange(input);
                    },
                    title: spec.title == null ? this._options.text.fileInputTitle : spec.title
                });
                this._disposeSupport.addDisposer(function() {
                    button.dispose();
                });
                self._buttons.push(button);
                return button;
            },
            _createUploadHandler: function(additionalOptions, namespace) {
                var self = this,
                    lastOnProgress = {},
                    options = {
                        debug: this._options.debug,
                        maxConnections: this._options.maxConnections,
                        cors: this._options.cors,
                        paramsStore: this._paramsStore,
                        endpointStore: this._endpointStore,
                        chunking: this._options.chunking,
                        resume: this._options.resume,
                        blobs: this._options.blobs,
                        log: Uploader.bind(self.log, self),
                        preventRetryParam: this._options.retry.preventRetryResponseProperty,
                        onProgress: function(id, name, loaded, total) {
                            if (loaded < 0 || total < 0) {
                                return;
                            }
                            if (lastOnProgress[id]) {
                                if (lastOnProgress[id].loaded !== loaded || lastOnProgress[id].total !== total) {
                                    self._onProgress(id, name, loaded, total);
                                    self._options.callbacks.onProgress(id, name, loaded, total);
                                }
                            } else {
                                self._onProgress(id, name, loaded, total);
                                self._options.callbacks.onProgress(id, name, loaded, total);
                            }
                            lastOnProgress[id] = {
                                loaded: loaded,
                                total: total
                            };
                        },
                        onComplete: function(id, name, result, xhr) {
                            delete lastOnProgress[id];
                            var status = self.getUploads({
                                    id: id
                                }).status,
                                retVal;
                            if (status === Uploader.status.UPLOAD_SUCCESSFUL || status === Uploader.status.UPLOAD_FAILED) {
                                return;
                            }
                            retVal = self._onComplete(id, name, result, xhr);
                            if (retVal instanceof Uploader.Promise) {
                                retVal.done(function() {
                                    self._options.callbacks.onComplete(id, name, result, xhr);
                                });
                            } else {
                                self._options.callbacks.onComplete(id, name, result, xhr);
                            }
                        },
                        onCancel: function(id, name, cancelFinalizationEffort) {
                            var promise = new Uploader.Promise();
                            self._handleCheckedCallback({
                                name: "onCancel",
                                callback: Uploader.bind(self._options.callbacks.onCancel, self, id, name),
                                onFailure: promise.failure,
                                onSuccess: function() {
                                    cancelFinalizationEffort.then(function() {
                                        self._onCancel(id, name);
                                    });
                                    promise.success();
                                },
                                identifier: id
                            });
                            return promise;
                        },
                        onUploadPrep: Uploader.bind(this._onUploadPrep, this),
                        onUpload: function(id, name) {
                            self._onUpload(id, name);
                            self._options.callbacks.onUpload(id, name);
                        },
                        onUploadChunk: function(id, name, chunkData) {
                            self._onUploadChunk(id, chunkData);
                            self._options.callbacks.onUploadChunk(id, name, chunkData);
                        },
                        onUploadChunkSuccess: function(id, chunkData, result, xhr) {
                            self._onUploadChunkSuccess(id, chunkData);
                            self._options.callbacks.onUploadChunkSuccess.apply(self, arguments);
                        },
                        onResume: function(id, name, chunkData) {
                            return self._options.callbacks.onResume(id, name, chunkData);
                        },
                        onAutoRetry: function(id, name, responseJSON, xhr) {
                            return self._onAutoRetry.apply(self, arguments);
                        },
                        onUuidChanged: function(id, newUuid) {
                            self.log("Server requested UUID change from '" + self.getUuid(id) + "' to '" + newUuid + "'");
                            self.setUuid(id, newUuid);
                        },
                        getName: Uploader.bind(self.getName, self),
                        getUuid: Uploader.bind(self.getUuid, self),
                        getSize: Uploader.bind(self.getSize, self),
                        setSize: Uploader.bind(self._setSize, self),
                        getDataByUuid: function(uuid) {
                            return self.getUploads({
                                uuid: uuid
                            });
                        },
                        isQueued: function(id) {
                            var status = self.getUploads({
                                id: id
                            }).status;
                            return status === Uploader.status.QUEUED || status === Uploader.status.SUBMITTED || status === Uploader.status.UPLOAD_RETRYING || status === Uploader.status.PAUSED;
                        },
                        getIdsInProxyGroup: self._uploadData.getIdsInProxyGroup,
                        getIdsInBatch: self._uploadData.getIdsInBatch
                    };
                Uploader.each(this._options.request, function(prop, val) {
                    options[prop] = val;
                });
                options.customHeaders = this._customHeadersStore;
                if (additionalOptions) {
                    Uploader.each(additionalOptions, function(key, val) {
                        options[key] = val;
                    });
                }
                return new Uploader.UploadHandlerController(options, namespace);
            },
            _fileOrBlobRejected: function(id) {
                this._netUploadedOrQueued--;
                this._uploadData.setStatus(id, Uploader.status.REJECTED);
            },
            _formatSize: function(bytes) {
                if (bytes === 0) {
                    return bytes + this._options.text.sizeSymbols[0];
                }
                var i = -1;
                do {
                    bytes = bytes / 1e3;
                    i++;
                } while (bytes > 999);
                return Math.max(bytes, .1).toFixed(1) + this._options.text.sizeSymbols[i];
            },
            _generateExtraButtonSpecs: function() {
                var self = this;
                this._extraButtonSpecs = {};
                Uploader.each(this._options.extraButtons, function(idx, extraButtonOptionEntry) {
                    var multiple = extraButtonOptionEntry.multiple,
                        validation = Uploader.extend({}, self._options.validation, true),
                        extraButtonSpec = Uploader.extend({}, extraButtonOptionEntry);
                    if (multiple === undefined) {
                        multiple = self._options.multiple;
                    }
                    if (extraButtonSpec.validation) {
                        Uploader.extend(validation, extraButtonOptionEntry.validation, true);
                    }
                    Uploader.extend(extraButtonSpec, {
                        multiple: multiple,
                        validation: validation
                    }, true);
                    self._initExtraButton(extraButtonSpec);
                });
            },
            _getButton: function(buttonId) {
                var extraButtonsSpec = this._extraButtonSpecs[buttonId];
                if (extraButtonsSpec) {
                    return extraButtonsSpec.element;
                } else if (buttonId === this._defaultButtonId) {
                    return this._options.button;
                }
            },
            _getButtonId: function(buttonOrFileInputOrFile) {
                var inputs, fileInput, fileBlobOrInput = buttonOrFileInputOrFile;
                if (fileBlobOrInput instanceof Uploader.BlobProxy) {
                    fileBlobOrInput = fileBlobOrInput.referenceBlob;
                }
                if (fileBlobOrInput && !Uploader.isBlob(fileBlobOrInput)) {
                    if (Uploader.isFile(fileBlobOrInput)) {
                        return fileBlobOrInput.qqButtonId;
                    } else if (fileBlobOrInput.tagName.toLowerCase() === "input" && fileBlobOrInput.type.toLowerCase() === "file") {
                        return fileBlobOrInput.getAttribute(Uploader.UploadButton.BUTTON_ID_ATTR_NAME);
                    }
                    inputs = fileBlobOrInput.getElementsByTagName("input");
                    Uploader.each(inputs, function(idx, input) {
                        if (input.getAttribute("type") === "file") {
                            fileInput = input;
                            return false;
                        }
                    });
                    if (fileInput) {
                        return fileInput.getAttribute(Uploader.UploadButton.BUTTON_ID_ATTR_NAME);
                    }
                }
            },
            _getNotFinished: function() {
                return this._uploadData.retrieve({
                    status: [Uploader.status.UPLOADING, Uploader.status.UPLOAD_RETRYING, Uploader.status.QUEUED, Uploader.status.SUBMITTING, Uploader.status.SUBMITTED, Uploader.status.PAUSED]
                }).length;
            },
            _getValidationBase: function(buttonId) {
                var extraButtonSpec = this._extraButtonSpecs[buttonId];
                return extraButtonSpec ? extraButtonSpec.validation : this._options.validation;
            },
            _getValidationDescriptor: function(fileWrapper) {
                if (fileWrapper.file instanceof Uploader.BlobProxy) {
                    return {
                        name: Uploader.getFilename(fileWrapper.file.referenceBlob),
                        size: fileWrapper.file.referenceBlob.size
                    };
                }
                return {
                    name: this.getUploads({
                        id: fileWrapper.id
                    }).name,
                    size: this.getUploads({
                        id: fileWrapper.id
                    }).size
                };
            },
            _getValidationDescriptors: function(fileWrappers) {
                var self = this,
                    fileDescriptors = [];
                Uploader.each(fileWrappers, function(idx, fileWrapper) {
                    fileDescriptors.push(self._getValidationDescriptor(fileWrapper));
                });
                return fileDescriptors;
            },
            _handleCameraAccess: function() {
                if (this._options.camera.ios && Uploader.ios()) {
                    var acceptIosCamera = "image/*;capture=camera",
                        button = this._options.camera.button,
                        buttonId = button ? this._getButtonId(button) : this._defaultButtonId,
                        optionRoot = this._options;
                    if (buttonId && buttonId !== this._defaultButtonId) {
                        optionRoot = this._extraButtonSpecs[buttonId];
                    }
                    optionRoot.multiple = false;
                    if (optionRoot.validation.acceptFiles === null) {
                        optionRoot.validation.acceptFiles = acceptIosCamera;
                    } else {
                        optionRoot.validation.acceptFiles += "," + acceptIosCamera;
                    }
                    Uploader.each(this._buttons, function(idx, button) {
                        if (button.getButtonId() === buttonId) {
                            button.setMultiple(optionRoot.multiple);
                            button.setAcceptFiles(optionRoot.acceptFiles);
                            return false;
                        }
                    });
                }
            },
            _handleCheckedCallback: function(details) {
                var self = this,
                    callbackRetVal = details.callback();
                if (Uploader.isGenericPromise(callbackRetVal)) {
                    this.log(details.name + " - waiting for " + details.name + " promise to be fulfilled for " + details.identifier);
                    return callbackRetVal.then(function(successParam) {
                        self.log(details.name + " promise success for " + details.identifier);
                        details.onSuccess(successParam);
                    }, function() {
                        if (details.onFailure) {
                            self.log(details.name + " promise failure for " + details.identifier);
                            details.onFailure();
                        } else {
                            self.log(details.name + " promise failure for " + details.identifier);
                        }
                    });
                }
                if (callbackRetVal !== false) {
                    details.onSuccess(callbackRetVal);
                } else {
                    if (details.onFailure) {
                        this.log(details.name + " - return value was 'false' for " + details.identifier + ".  Invoking failure callback.");
                        details.onFailure();
                    } else {
                        this.log(details.name + " - return value was 'false' for " + details.identifier + ".  Will not proceed.");
                    }
                }
                return callbackRetVal;
            },
            _handleNewFile: function(file, batchId, newFileWrapperList) {
                var self = this,
                    uuid = Uploader.getUniqueId(),
                    size = -1,
                    name = Uploader.getFilename(file),
                    actualFile = file.blob || file,
                    handler = this._customNewFileHandler ? this._customNewFileHandler : Uploader.bind(self._handleNewFileGeneric, self);
                if (!Uploader.isInput(actualFile) && actualFile.size >= 0) {
                    size = actualFile.size;
                }
                handler(actualFile, name, uuid, size, newFileWrapperList, batchId, this._options.request.uuidName, {
                    uploadData: self._uploadData,
                    paramsStore: self._paramsStore,
                    addFileToHandler: function(id, file) {
                        self._handler.add(id, file);
                        self._netUploadedOrQueued++;
                        self._trackButton(id);
                    }
                });
            },
            _handleNewFileGeneric: function(file, name, uuid, size, fileList, batchId) {
                var id = this._uploadData.addFile({
                    uuid: uuid,
                    name: name,
                    size: size,
                    batchId: batchId
                });
                this._handler.add(id, file);
                this._trackButton(id);
                this._netUploadedOrQueued++;
                fileList.push({
                    id: id,
                    file: file
                });
            },
            _handlePasteSuccess: function(blob, extSuppliedName) {
                var extension = blob.type.split("/")[1],
                    name = extSuppliedName;
                if (name == null) {
                    name = this._options.paste.defaultName;
                }
                name += "." + extension;
                this.addFiles({
                    name: name,
                    blob: blob
                });
            },
            _handleDeleteSuccess: function(id) {
                if (this.getUploads({
                        id: id
                    }).status !== Uploader.status.DELETED) {
                    var name = this.getName(id);
                    this._netUploadedOrQueued--;
                    this._netUploaded--;
                    this._handler.expunge(id);
                    this._uploadData.setStatus(id, Uploader.status.DELETED);
                    this.log("Delete request for '" + name + "' has succeeded.");
                }
            },
            _handleDeleteFailed: function(id, xhrOrXdr) {
                var name = this.getName(id);
                this._uploadData.setStatus(id, Uploader.status.DELETE_FAILED);
                this.log("Delete request for '" + name + "' has failed.", "error");
                if (!xhrOrXdr || xhrOrXdr.withCredentials === undefined) {
                    this._options.callbacks.onError(id, name, "Delete request failed", xhrOrXdr);
                } else {
                    this._options.callbacks.onError(id, name, "Delete request failed with response code " + xhrOrXdr.status, xhrOrXdr);
                }
            },
            _initExtraButton: function(spec) {
                var button = this._createUploadButton({
                    accept: spec.validation.acceptFiles,
                    allowedExtensions: spec.validation.allowedExtensions,
                    element: spec.element,
                    folders: spec.folders,
                    multiple: spec.multiple,
                    title: spec.fileInputTitle
                });
                this._extraButtonSpecs[button.getButtonId()] = spec;
            },
            _initFormSupportAndParams: function() {
                this._formSupport = Uploader.FormSupport && new Uploader.FormSupport(this._options.form, Uploader.bind(this.uploadStoredFiles, this), Uploader.bind(this.log, this));
                if (this._formSupport && this._formSupport.attachedToForm) {
                    this._paramsStore = this._createStore(this._options.request.params, this._formSupport.getFormInputsAsObject);
                    this._options.autoUpload = this._formSupport.newAutoUpload;
                    if (this._formSupport.newEndpoint) {
                        this._options.request.endpoint = this._formSupport.newEndpoint;
                    }
                } else {
                    this._paramsStore = this._createStore(this._options.request.params);
                }
            },
            _isDeletePossible: function() {
                if (!Uploader.DeleteFileAjaxRequester || !this._options.deleteFile.enabled) {
                    return false;
                }
                if (this._options.cors.expected) {
                    if (Uploader.supportedFeatures.deleteFileCorsXhr) {
                        return true;
                    }
                    if (Uploader.supportedFeatures.deleteFileCorsXdr && this._options.cors.allowXdr) {
                        return true;
                    }
                    return false;
                }
                return true;
            },
            _isAllowedExtension: function(allowed, fileName) {
                var valid = false;
                if (!allowed.length) {
                    return true;
                }
                Uploader.each(allowed, function(idx, allowedExt) {
                    if (Uploader.isString(allowedExt)) {
                        var extRegex = new RegExp("\\." + allowedExt + "$", "i");
                        if (fileName.match(extRegex) != null) {
                            valid = true;
                            return false;
                        }
                    }
                });
                return valid;
            },
            _itemError: function(code, maybeNameOrNames, item) {
                var message = this._options.messages[code],
                    allowedExtensions = [],
                    names = [].concat(maybeNameOrNames),
                    name = names[0],
                    buttonId = this._getButtonId(item),
                    validationBase = this._getValidationBase(buttonId),
                    extensionsForMessage, placeholderMatch;

                function r(name, replacement) {
                    message = message.replace(name, replacement);
                }
                Uploader.each(validationBase.allowedExtensions, function(idx, allowedExtension) {
                    if (Uploader.isString(allowedExtension)) {
                        allowedExtensions.push(allowedExtension);
                    }
                });
                extensionsForMessage = allowedExtensions.join(", ").toLowerCase();
                r("{file}", this._options.formatFileName(name));
                r("{extensions}", extensionsForMessage);
                r("{sizeLimit}", this._formatSize(validationBase.sizeLimit));
                r("{minSizeLimit}", this._formatSize(validationBase.minSizeLimit));
                placeholderMatch = message.match(/(\{\w+\})/g);
                if (placeholderMatch !== null) {
                    Uploader.each(placeholderMatch, function(idx, placeholder) {
                        r(placeholder, names[idx]);
                    });
                }
                this._options.callbacks.onError(null, name, message, undefined);
                return message;
            },
            _manualRetry: function(id, callback) {
                if (this._onBeforeManualRetry(id)) {
                    this._netUploadedOrQueued++;
                    this._uploadData.setStatus(id, Uploader.status.UPLOAD_RETRYING);
                    if (callback) {
                        callback(id);
                    } else {
                        this._handler.retry(id);
                    }
                    return true;
                }
            },
            _maybeAllComplete: function(id, status) {
                var self = this,
                    notFinished = this._getNotFinished();
                if (status === Uploader.status.UPLOAD_SUCCESSFUL) {
                    this._succeededSinceLastAllComplete.push(id);
                } else if (status === Uploader.status.UPLOAD_FAILED) {
                    this._failedSinceLastAllComplete.push(id);
                }
                if (notFinished === 0 && (this._succeededSinceLastAllComplete.length || this._failedSinceLastAllComplete.length)) {
                    setTimeout(function() {
                        self._onAllComplete(self._succeededSinceLastAllComplete, self._failedSinceLastAllComplete);
                    }, 0);
                }
            },
            _maybeHandleIos8SafariWorkaround: function() {
                var self = this;
                if (this._options.workarounds.ios8SafariUploads && Uploader.ios800() && Uploader.iosSafari()) {
                    setTimeout(function() {
                        window.alert(self._options.messages.unsupportedBrowserIos8Safari);
                    }, 0);
                    throw new Uploader.Error(this._options.messages.unsupportedBrowserIos8Safari);
                }
            },
            _maybeParseAndSendUploadError: function(id, name, response, xhr) {
                if (!response.success) {
                    if (xhr && xhr.status !== 200 && !response.error) {
                        this._options.callbacks.onError(id, name, "XHR returned response code " + xhr.status, xhr);
                    } else {
                        var errorReason = response.error ? response.error : this._options.text.defaultResponseError;
                        this._options.callbacks.onError(id, name, errorReason, xhr);
                    }
                }
            },
            _maybeProcessNextItemAfterOnValidateCallback: function(validItem, items, index, params, endpoint) {
                var self = this;
                if (items.length > index) {
                    if (validItem || !this._options.validation.stopOnFirstInvalidFile) {
                        setTimeout(function() {
                            var validationDescriptor = self._getValidationDescriptor(items[index]),
                                buttonId = self._getButtonId(items[index].file),
                                button = self._getButton(buttonId);
                            self._handleCheckedCallback({
                                name: "onValidate",
                                callback: Uploader.bind(self._options.callbacks.onValidate, self, validationDescriptor, button),
                                onSuccess: Uploader.bind(self._onValidateCallbackSuccess, self, items, index, params, endpoint),
                                onFailure: Uploader.bind(self._onValidateCallbackFailure, self, items, index, params, endpoint),
                                identifier: "Item '" + validationDescriptor.name + "', size: " + validationDescriptor.size
                            });
                        }, 0);
                    } else if (!validItem) {
                        for (; index < items.length; index++) {
                            self._fileOrBlobRejected(items[index].id);
                        }
                    }
                }
            },
            _onAllComplete: function(successful, failed) {
                this._totalProgress && this._totalProgress.onAllComplete(successful, failed, this._preventRetries);
                this._options.callbacks.onAllComplete(Uploader.extend([], successful), Uploader.extend([], failed));
                this._succeededSinceLastAllComplete = [];
                this._failedSinceLastAllComplete = [];
            },
            _onAutoRetry: function(id, name, responseJSON, xhr, callback) {
                var self = this;
                self._preventRetries[id] = responseJSON[self._options.retry.preventRetryResponseProperty];
                if (self._shouldAutoRetry(id, name, responseJSON)) {
                    var retryWaitPeriod = self._options.retry.autoAttemptDelay * 1e3;
                    self._maybeParseAndSendUploadError.apply(self, arguments);
                    self._options.callbacks.onAutoRetry(id, name, self._autoRetries[id]);
                    self._onBeforeAutoRetry(id, name);
                    self._uploadData.setStatus(id, Uploader.status.UPLOAD_RETRYING);
                    self._retryTimeouts[id] = setTimeout(function() {
                        self.log("Starting retry for " + name + "...");
                        if (callback) {
                            callback(id);
                        } else {
                            self._handler.retry(id);
                        }
                    }, retryWaitPeriod);
                    return true;
                }
            },
            _onBeforeAutoRetry: function(id, name) {
                this.log("Waiting " + this._options.retry.autoAttemptDelay + " seconds before retrying " + name + "...");
            },
            _onBeforeManualRetry: function(id) {
                var itemLimit = this._currentItemLimit,
                    fileName;
                if (this._preventRetries[id]) {
                    this.log("Retries are forbidden for id " + id, "warn");
                    return false;
                } else if (this._handler.isValid(id)) {
                    fileName = this.getName(id);
                    if (this._options.callbacks.onManualRetry(id, fileName) === false) {
                        return false;
                    }
                    if (itemLimit > 0 && this._netUploadedOrQueued + 1 > itemLimit) {
                        this._itemError("retryFailTooManyItems");
                        return false;
                    }
                    this.log("Retrying upload for '" + fileName + "' (id: " + id + ")...");
                    return true;
                } else {
                    this.log("'" + id + "' is not a valid file ID", "error");
                    return false;
                }
            },
            _onCancel: function(id, name) {
                this._netUploadedOrQueued--;
                clearTimeout(this._retryTimeouts[id]);
                var storedItemIndex = Uploader.indexOf(this._storedIds, id);
                if (!this._options.autoUpload && storedItemIndex >= 0) {
                    this._storedIds.splice(storedItemIndex, 1);
                }
                this._uploadData.setStatus(id, Uploader.status.CANCELED);
            },
            _onComplete: function(id, name, result, xhr) {
                if (!result.success) {
                    this._netUploadedOrQueued--;
                    this._uploadData.setStatus(id, Uploader.status.UPLOAD_FAILED);
                    if (result[this._options.retry.preventRetryResponseProperty] === true) {
                        this._preventRetries[id] = true;
                    }
                } else {
                    if (result.thumbnailUrl) {
                        this._thumbnailUrls[id] = result.thumbnailUrl;
                    }
                    this._netUploaded++;
                    this._uploadData.setStatus(id, Uploader.status.UPLOAD_SUCCESSFUL);
                }
                this._maybeParseAndSendUploadError(id, name, result, xhr);
                return result.success ? true : false;
            },
            _onDelete: function(id) {
                this._uploadData.setStatus(id, Uploader.status.DELETING);
            },
            _onDeleteComplete: function(id, xhrOrXdr, isError) {
                var name = this.getName(id);
                if (isError) {
                    this._handleDeleteFailed(id, xhrOrXdr);
                } else {
                    this._handleDeleteSuccess(id);
                }
            },
            _onInputChange: function(input) {
                var fileIndex;
                if (Uploader.supportedFeatures.ajaxUploading) {
                    for (fileIndex = 0; fileIndex < input.files.length; fileIndex++) {
                        this._annotateWithButtonId(input.files[fileIndex], input);
                    }
                    this.addFiles(input.files);
                } else if (input.value.length > 0) {
                    this.addFiles(input);
                }
                Uploader.each(this._buttons, function(idx, button) {
                    button.reset();
                });
            },
            _onProgress: function(id, name, loaded, total) {
                this._totalProgress && this._totalProgress.onIndividualProgress(id, loaded, total);
            },
            _onSubmit: function(id, name) {},
            _onSubmitCallbackSuccess: function(id, name) {
                this._onSubmit.apply(this, arguments);
                this._uploadData.setStatus(id, Uploader.status.SUBMITTED);
                this._onSubmitted.apply(this, arguments);
                if (this._options.autoUpload) {
                    this._options.callbacks.onSubmitted.apply(this, arguments);
                    this._uploadFile(id);
                } else {
                    this._storeForLater(id);
                    this._options.callbacks.onSubmitted.apply(this, arguments);
                }
            },
            _onSubmitDelete: function(id, onSuccessCallback, additionalMandatedParams) {
                var uuid = this.getUuid(id),
                    adjustedOnSuccessCallback;
                if (onSuccessCallback) {
                    adjustedOnSuccessCallback = Uploader.bind(onSuccessCallback, this, id, uuid, additionalMandatedParams);
                }
                if (this._isDeletePossible()) {
                    this._handleCheckedCallback({
                        name: "onSubmitDelete",
                        callback: Uploader.bind(this._options.callbacks.onSubmitDelete, this, id),
                        onSuccess: adjustedOnSuccessCallback || Uploader.bind(this._deleteHandler.sendDelete, this, id, uuid, additionalMandatedParams),
                        identifier: id
                    });
                    return true;
                } else {
                    this.log("Delete request ignored for ID " + id + ", delete feature is disabled or request not possible " + "due to CORS on a user agent that does not support pre-flighting.", "warn");
                    return false;
                }
            },
            _onSubmitted: function(id) {},
            _onTotalProgress: function(loaded, total) {
                this._options.callbacks.onTotalProgress(loaded, total);
            },
            _onUploadPrep: function(id) {},
            _onUpload: function(id, name) {
                this._uploadData.setStatus(id, Uploader.status.UPLOADING);
            },
            _onUploadChunk: function(id, chunkData) {},
            _onUploadChunkSuccess: function(id, chunkData) {
                if (!this._preventRetries[id] && this._options.retry.enableAuto) {
                    this._autoRetries[id] = 0;
                }
            },
            _onUploadStatusChange: function(id, oldStatus, newStatus) {
                if (newStatus === Uploader.status.PAUSED) {
                    clearTimeout(this._retryTimeouts[id]);
                }
            },
            _onValidateBatchCallbackFailure: function(fileWrappers) {
                var self = this;
                Uploader.each(fileWrappers, function(idx, fileWrapper) {
                    self._fileOrBlobRejected(fileWrapper.id);
                });
            },
            _onValidateBatchCallbackSuccess: function(validationDescriptors, items, params, endpoint, button) {
                var errorMessage, itemLimit = this._currentItemLimit,
                    proposedNetFilesUploadedOrQueued = this._netUploadedOrQueued;
                if (itemLimit === 0 || proposedNetFilesUploadedOrQueued <= itemLimit) {
                    if (items.length > 0) {
                        this._handleCheckedCallback({
                            name: "onValidate",
                            callback: Uploader.bind(this._options.callbacks.onValidate, this, validationDescriptors[0], button),
                            onSuccess: Uploader.bind(this._onValidateCallbackSuccess, this, items, 0, params, endpoint),
                            onFailure: Uploader.bind(this._onValidateCallbackFailure, this, items, 0, params, endpoint),
                            identifier: "Item '" + items[0].file.name + "', size: " + items[0].file.size
                        });
                    } else {
                        this._itemError("noFilesError");
                    }
                } else {
                    this._onValidateBatchCallbackFailure(items);
                    errorMessage = this._options.messages.tooManyItemsError.replace(/\{netItems\}/g, proposedNetFilesUploadedOrQueued).replace(/\{itemLimit\}/g, itemLimit);
                    this._batchError(errorMessage);
                }
            },
            _onValidateCallbackFailure: function(items, index, params, endpoint) {
                var nextIndex = index + 1;
                this._fileOrBlobRejected(items[index].id, items[index].file.name);
                this._maybeProcessNextItemAfterOnValidateCallback(false, items, nextIndex, params, endpoint);
            },
            _onValidateCallbackSuccess: function(items, index, params, endpoint) {
                var self = this,
                    nextIndex = index + 1,
                    validationDescriptor = this._getValidationDescriptor(items[index]);
                this._validateFileOrBlobData(items[index], validationDescriptor).then(function() {
                    self._upload(items[index].id, params, endpoint);
                    self._maybeProcessNextItemAfterOnValidateCallback(true, items, nextIndex, params, endpoint);
                }, function() {
                    self._maybeProcessNextItemAfterOnValidateCallback(false, items, nextIndex, params, endpoint);
                });
            },
            _prepareItemsForUpload: function(items, params, endpoint) {
                if (items.length === 0) {
                    this._itemError("noFilesError");
                    return;
                }
                var validationDescriptors = this._getValidationDescriptors(items),
                    buttonId = this._getButtonId(items[0].file),
                    button = this._getButton(buttonId);
                this._handleCheckedCallback({
                    name: "onValidateBatch",
                    callback: Uploader.bind(this._options.callbacks.onValidateBatch, this, validationDescriptors, button),
                    onSuccess: Uploader.bind(this._onValidateBatchCallbackSuccess, this, validationDescriptors, items, params, endpoint, button),
                    onFailure: Uploader.bind(this._onValidateBatchCallbackFailure, this, items),
                    identifier: "batch validation"
                });
            },
            _preventLeaveInProgress: function() {
                var self = this;
                this._disposeSupport.attach(window, "beforeunload", function(e) {
                    if (self.getInProgress()) {
                        e = e || window.event;
                        e.returnValue = self._options.messages.onLeave;
                        return self._options.messages.onLeave;
                    }
                });
            },
            _refreshSessionData: function() {
                var self = this,
                    options = this._options.session;
                if (Uploader.Session && this._options.session.endpoint != null) {
                    if (!this._session) {
                        Uploader.extend(options, {
                            cors: this._options.cors
                        });
                        options.log = Uploader.bind(this.log, this);
                        options.addFileRecord = Uploader.bind(this._addCannedFile, this);
                        this._session = new Uploader.Session(options);
                    }
                    setTimeout(function() {
                        self._session.refresh().then(function(response, xhrOrXdr) {
                            self._sessionRequestComplete();
                            self._options.callbacks.onSessionRequestComplete(response, true, xhrOrXdr);
                        }, function(response, xhrOrXdr) {
                            self._options.callbacks.onSessionRequestComplete(response, false, xhrOrXdr);
                        });
                    }, 0);
                }
            },
            _sessionRequestComplete: function() {},
            _setSize: function(id, newSize) {
                this._uploadData.updateSize(id, newSize);
                this._totalProgress && this._totalProgress.onNewSize(id);
            },
            _shouldAutoRetry: function(id, name, responseJSON) {
                var uploadData = this._uploadData.retrieve({
                    id: id
                });
                if (!this._preventRetries[id] && this._options.retry.enableAuto && uploadData.status !== Uploader.status.PAUSED) {
                    if (this._autoRetries[id] === undefined) {
                        this._autoRetries[id] = 0;
                    }
                    if (this._autoRetries[id] < this._options.retry.maxAutoAttempts) {
                        this._autoRetries[id] += 1;
                        return true;
                    }
                }
                return false;
            },
            _storeForLater: function(id) {
                this._storedIds.push(id);
            },
            _trackButton: function(id) {
                var buttonId;
                if (Uploader.supportedFeatures.ajaxUploading) {
                    buttonId = this._handler.getFile(id).qqButtonId;
                } else {
                    buttonId = this._getButtonId(this._handler.getInput(id));
                }
                if (buttonId) {
                    this._buttonIdsForFileIds[id] = buttonId;
                }
            },
            _updateFormSupportAndParams: function(formElementOrId) {
                this._options.form.element = formElementOrId;
                this._formSupport = Uploader.FormSupport && new Uploader.FormSupport(this._options.form, Uploader.bind(this.uploadStoredFiles, this), Uploader.bind(this.log, this));
                if (this._formSupport && this._formSupport.attachedToForm) {
                    this._paramsStore.addReadOnly(null, this._formSupport.getFormInputsAsObject);
                    this._options.autoUpload = this._formSupport.newAutoUpload;
                    if (this._formSupport.newEndpoint) {
                        this.setEndpoint(this._formSupport.newEndpoint);
                    }
                }
            },
            _upload: function(id, params, endpoint) {
                var name = this.getName(id);
                if (params) {
                    this.setParams(params, id);
                }
                if (endpoint) {
                    this.setEndpoint(endpoint, id);
                }
                this._handleCheckedCallback({
                    name: "onSubmit",
                    callback: Uploader.bind(this._options.callbacks.onSubmit, this, id, name),
                    onSuccess: Uploader.bind(this._onSubmitCallbackSuccess, this, id, name),
                    onFailure: Uploader.bind(this._fileOrBlobRejected, this, id, name),
                    identifier: id
                });
            },
            _uploadFile: function(id) {
                if (!this._handler.upload(id)) {
                    this._uploadData.setStatus(id, Uploader.status.QUEUED);
                }
            },
            _uploadStoredFiles: function() {
                var idToUpload, stillSubmitting, self = this;
                while (this._storedIds.length) {
                    idToUpload = this._storedIds.shift();
                    this._uploadFile(idToUpload);
                }
                stillSubmitting = this.getUploads({
                    status: Uploader.status.SUBMITTING
                }).length;
                if (stillSubmitting) {
                    Uploader.log("Still waiting for " + stillSubmitting + " files to clear submit queue. Will re-parse stored IDs array shortly.");
                    setTimeout(function() {
                        self._uploadStoredFiles();
                    }, 1e3);
                }
            },
            _validateFileOrBlobData: function(fileWrapper, validationDescriptor) {
                var self = this,
                    file = function() {
                        if (fileWrapper.file instanceof Uploader.BlobProxy) {
                            return fileWrapper.file.referenceBlob;
                        }
                        return fileWrapper.file;
                    }(),
                    name = validationDescriptor.name,
                    size = validationDescriptor.size,
                    buttonId = this._getButtonId(fileWrapper.file),
                    validationBase = this._getValidationBase(buttonId),
                    validityChecker = new Uploader.Promise();
                validityChecker.then(function() {}, function() {
                    self._fileOrBlobRejected(fileWrapper.id, name);
                });
                if (Uploader.isFileOrInput(file) && !this._isAllowedExtension(validationBase.allowedExtensions, name)) {
                    this._itemError("typeError", name, file);
                    return validityChecker.failure();
                }
                if (!this._options.validation.allowEmpty && size === 0) {
                    this._itemError("emptyError", name, file);
                    return validityChecker.failure();
                }
                if (size > 0 && validationBase.sizeLimit && size > validationBase.sizeLimit) {
                    this._itemError("sizeError", name, file);
                    return validityChecker.failure();
                }
                if (size > 0 && size < validationBase.minSizeLimit) {
                    this._itemError("minSizeError", name, file);
                    return validityChecker.failure();
                }
                if (Uploader.ImageValidation && Uploader.supportedFeatures.imagePreviews && Uploader.isFile(file)) {
                    new Uploader.ImageValidation(file, Uploader.bind(self.log, self)).validate(validationBase.image).then(validityChecker.success, function(errorCode) {
                        self._itemError(errorCode + "ImageError", name, file);
                        validityChecker.failure();
                    });
                } else {
                    validityChecker.success();
                }
                return validityChecker;
            },
            _wrapCallbacks: function() {
                var self, safeCallback, prop;
                self = this;
                safeCallback = function(name, callback, args) {
                    var errorMsg;
                    try {
                        return callback.apply(self, args);
                    } catch (exception) {
                        errorMsg = exception.message || exception.toString();
                        self.log("Caught exception in '" + name + "' callback - " + errorMsg, "error");
                    }
                };
                for (prop in this._options.callbacks) {
                    (function() {
                        var callbackName, callbackFunc;
                        callbackName = prop;
                        callbackFunc = self._options.callbacks[callbackName];
                        self._options.callbacks[callbackName] = function() {
                            return safeCallback(callbackName, callbackFunc, arguments);
                        };
                    })();
                }
            }
        };
    })();
    (function() {
        "use strict";
        Uploader.UploaderBasic = function(o) {
            var self = this;
            this._options = {
                debug: false,
                button: null,
                multiple: true,
                maxConnections: 3,
                disableCancelForFormUploads: false,
                autoUpload: true,
                request: {
                    customHeaders: {},
                    endpoint: "/server/upload",
                    filenameParam: "qqfilename",
                    forceMultipart: true,
                    inputName: "qqfile",
                    method: "POST",
                    params: {},
                    paramsInBody: true,
                    totalFileSizeName: "qqtotalfilesize",
                    uuidName: "qquuid"
                },
                validation: {
                    allowedExtensions: [],
                    sizeLimit: 0,
                    minSizeLimit: 0,
                    itemLimit: 0,
                    stopOnFirstInvalidFile: true,
                    acceptFiles: null,
                    image: {
                        maxHeight: 0,
                        maxWidth: 0,
                        minHeight: 0,
                        minWidth: 0
                    },
                    allowEmpty: false
                },
                callbacks: {
                    onSubmit: function(id, name) {},
                    onSubmitted: function(id, name) {},
                    onComplete: function(id, name, responseJSON, maybeXhr) {},
                    onAllComplete: function(successful, failed) {},
                    onCancel: function(id, name) {},
                    onUpload: function(id, name) {},
                    onUploadChunk: function(id, name, chunkData) {},
                    onUploadChunkSuccess: function(id, chunkData, responseJSON, xhr) {},
                    onResume: function(id, fileName, chunkData) {},
                    onProgress: function(id, name, loaded, total) {},
                    onTotalProgress: function(loaded, total) {},
                    onError: function(id, name, reason, maybeXhrOrXdr) {},
                    onAutoRetry: function(id, name, attemptNumber) {},
                    onManualRetry: function(id, name) {},
                    onValidateBatch: function(fileOrBlobData) {},
                    onValidate: function(fileOrBlobData) {},
                    onSubmitDelete: function(id) {},
                    onDelete: function(id) {},
                    onDeleteComplete: function(id, xhrOrXdr, isError) {},
                    onPasteReceived: function(blob) {},
                    onStatusChange: function(id, oldStatus, newStatus) {},
                    onSessionRequestComplete: function(response, success, xhrOrXdr) {}
                },
                messages: {
                    typeError: "{file} has an invalid extension. Valid extension(s): {extensions}.",
                    sizeError: "{file} is too large, maximum file size is {sizeLimit}.",
                    minSizeError: "{file} is too small, minimum file size is {minSizeLimit}.",
                    emptyError: "{file} is empty, please select files again without it.",
                    noFilesError: "No files to upload.",
                    tooManyItemsError: "Too many items ({netItems}) would be uploaded.  Item limit is {itemLimit}.",
                    maxHeightImageError: "Image is too tall.",
                    maxWidthImageError: "Image is too wide.",
                    minHeightImageError: "Image is not tall enough.",
                    minWidthImageError: "Image is not wide enough.",
                    retryFailTooManyItems: "Retry failed - you have reached your file limit.",
                    onLeave: "The files are being uploaded, if you leave now the upload will be canceled.",
                    unsupportedBrowserIos8Safari: "Unrecoverable error - this browser does not permit file uploading of any kind due to serious bugs in iOS8 Safari.  Please use iOS8 Chrome until Apple fixes these issues."
                },
                retry: {
                    enableAuto: false,
                    maxAutoAttempts: 3,
                    autoAttemptDelay: 5,
                    preventRetryResponseProperty: "preventRetry"
                },
                classes: {
                    buttonHover: "Uploader-upload-button-hover",
                    buttonFocus: "Uploader-upload-button-focus"
                },
                chunking: {
                    enabled: false,
                    concurrent: {
                        enabled: false
                    },
                    mandatory: false,
                    paramNames: {
                        partIndex: "qqpartindex",
                        partByteOffset: "qqpartbyteoffset",
                        chunkSize: "qqchunksize",
                        totalFileSize: "qqtotalfilesize",
                        totalParts: "qqtotalparts"
                    },
                    partSize: 2e6,
                    success: {
                        endpoint: null
                    }
                },
                resume: {
                    enabled: false,
                    recordsExpireIn: 7,
                    paramNames: {
                        resuming: "qqresume"
                    }
                },
                formatFileName: function(fileOrBlobName) {
                    return fileOrBlobName;
                },
                text: {
                    defaultResponseError: "Upload failure reason unknown",
                    fileInputTitle: "file input",
                    sizeSymbols: ["kB", "MB", "GB", "TB", "PB", "EB"]
                },
                deleteFile: {
                    enabled: false,
                    method: "DELETE",
                    endpoint: "/server/upload",
                    customHeaders: {},
                    params: {}
                },
                cors: {
                    expected: false,
                    sendCredentials: false,
                    allowXdr: false
                },
                blobs: {
                    defaultName: "misc_data"
                },
                paste: {
                    targetElement: null,
                    defaultName: "pasted_image"
                },
                camera: {
                    ios: false,
                    button: null
                },
                extraButtons: [],
                session: {
                    endpoint: null,
                    params: {},
                    customHeaders: {},
                    refreshOnReset: true
                },
                form: {
                    element: "Uploader-form",
                    autoUpload: false,
                    interceptSubmit: true
                },
                scaling: {
                    customResizer: null,
                    sendOriginal: true,
                    orient: true,
                    defaultType: null,
                    defaultQuality: 80,
                    failureText: "Failed to scale",
                    includeExif: false,
                    sizes: []
                },
                workarounds: {
                    iosEmptyVideos: true,
                    ios8SafariUploads: true,
                    ios8BrowserCrash: false
                }
            };
            Uploader.extend(this._options, o, true);
            this._buttons = [];
            this._extraButtonSpecs = {};
            this._buttonIdsForFileIds = [];
            this._wrapCallbacks();
            this._disposeSupport = new Uploader.DisposeSupport();
            this._storedIds = [];
            this._autoRetries = [];
            this._retryTimeouts = [];
            this._preventRetries = [];
            this._thumbnailUrls = [];
            this._netUploadedOrQueued = 0;
            this._netUploaded = 0;
            this._uploadData = this._createUploadDataTracker();
            this._initFormSupportAndParams();
            this._customHeadersStore = this._createStore(this._options.request.customHeaders);
            this._deleteFileCustomHeadersStore = this._createStore(this._options.deleteFile.customHeaders);
            this._deleteFileParamsStore = this._createStore(this._options.deleteFile.params);
            this._endpointStore = this._createStore(this._options.request.endpoint);
            this._deleteFileEndpointStore = this._createStore(this._options.deleteFile.endpoint);
            this._handler = this._createUploadHandler();
            this._deleteHandler = Uploader.DeleteFileAjaxRequester && this._createDeleteHandler();
            if (this._options.button) {
                this._defaultButtonId = this._createUploadButton({
                    element: this._options.button,
                    title: this._options.text.fileInputTitle
                }).getButtonId();
            }
            this._generateExtraButtonSpecs();
            this._handleCameraAccess();
            if (this._options.paste.targetElement) {
                if (Uploader.PasteSupport) {
                    this._pasteHandler = this._createPasteHandler();
                } else {
                    this.log("Paste support module not found", "error");
                }
            }
            this._preventLeaveInProgress();
            this._imageGenerator = Uploader.ImageGenerator && new Uploader.ImageGenerator(Uploader.bind(this.log, this));
            this._refreshSessionData();
            this._succeededSinceLastAllComplete = [];
            this._failedSinceLastAllComplete = [];
            this._scaler = Uploader.Scaler && new Uploader.Scaler(this._options.scaling, Uploader.bind(this.log, this)) || {};
            if (this._scaler.enabled) {
                this._customNewFileHandler = Uploader.bind(this._scaler.handleNewFile, this._scaler);
            }
            if (Uploader.TotalProgress && Uploader.supportedFeatures.progressBar) {
                this._totalProgress = new Uploader.TotalProgress(Uploader.bind(this._onTotalProgress, this), function(id) {
                    var entry = self._uploadData.retrieve({
                        id: id
                    });
                    return entry && entry.size || 0;
                });
            }
            this._currentItemLimit = this._options.validation.itemLimit;
        };
        Uploader.UploaderBasic.prototype = Uploader.basePublicApi;
        Uploader.extend(Uploader.UploaderBasic.prototype, Uploader.basePrivateApi);
    })();
    Uploader.AjaxRequester = function(o) {
        "use strict";
        var log, shouldParamsBeInQueryString, queue = [],
            requestData = {},
            options = {
                acceptHeader: null,
                validMethods: ["PATCH", "POST", "PUT"],
                method: "POST",
                contentType: "application/x-www-form-urlencoded",
                maxConnections: 3,
                customHeaders: {},
                endpointStore: {},
                paramsStore: {},
                mandatedParams: {},
                allowXRequestedWithAndCacheControl: true,
                successfulResponseCodes: {
                    DELETE: [200, 202, 204],
                    PATCH: [200, 201, 202, 203, 204],
                    POST: [200, 201, 202, 203, 204],
                    PUT: [200, 201, 202, 203, 204],
                    GET: [200]
                },
                cors: {
                    expected: false,
                    sendCredentials: false
                },
                log: function(str, level) {},
                onSend: function(id) {},
                onComplete: function(id, xhrOrXdr, isError) {},
                onProgress: null
            };
        Uploader.extend(options, o);
        log = options.log;
        if (Uploader.indexOf(options.validMethods, options.method) < 0) {
            throw new Error("'" + options.method + "' is not a supported method for this type of request!");
        }

        function isSimpleMethod() {
            return Uploader.indexOf(["GET", "POST", "HEAD"], options.method) >= 0;
        }

        function containsNonSimpleHeaders(headers) {
            var containsNonSimple = false;
            Uploader.each(containsNonSimple, function(idx, header) {
                if (Uploader.indexOf(["Accept", "Accept-Language", "Content-Language", "Content-Type"], header) < 0) {
                    containsNonSimple = true;
                    return false;
                }
            });
            return containsNonSimple;
        }

        function isXdr(xhr) {
            return options.cors.expected && xhr.withCredentials === undefined;
        }

        function getCorsAjaxTransport() {
            var xhrOrXdr;
            if (window.XMLHttpRequest || window.ActiveXObject) {
                xhrOrXdr = Uploader.createXhrInstance();
                if (xhrOrXdr.withCredentials === undefined) {
                    xhrOrXdr = new XDomainRequest();
                    xhrOrXdr.onload = function() {};
                    xhrOrXdr.onerror = function() {};
                    xhrOrXdr.ontimeout = function() {};
                    xhrOrXdr.onprogress = function() {};
                }
            }
            return xhrOrXdr;
        }

        function getXhrOrXdr(id, suppliedXhr) {
            var xhrOrXdr = requestData[id].xhr;
            if (!xhrOrXdr) {
                if (suppliedXhr) {
                    xhrOrXdr = suppliedXhr;
                } else {
                    if (options.cors.expected) {
                        xhrOrXdr = getCorsAjaxTransport();
                    } else {
                        xhrOrXdr = Uploader.createXhrInstance();
                    }
                }
                requestData[id].xhr = xhrOrXdr;
            }
            return xhrOrXdr;
        }

        function dequeue(id) {
            var i = Uploader.indexOf(queue, id),
                max = options.maxConnections,
                nextId;
            delete requestData[id];
            queue.splice(i, 1);
            if (queue.length >= max && i < max) {
                nextId = queue[max - 1];
                sendRequest(nextId);
            }
        }

        function onComplete(id, xdrError) {
            var xhr = getXhrOrXdr(id),
                method = options.method,
                isError = xdrError === true;
            dequeue(id);
            if (isError) {
                log(method + " request for " + id + " has failed", "error");
            } else if (!isXdr(xhr) && !isResponseSuccessful(xhr.status)) {
                isError = true;
                log(method + " request for " + id + " has failed - response code " + xhr.status, "error");
            }
            options.onComplete(id, xhr, isError);
        }

        function getParams(id) {
            var onDemandParams = requestData[id].additionalParams,
                mandatedParams = options.mandatedParams,
                params;
            if (options.paramsStore.get) {
                params = options.paramsStore.get(id);
            }
            if (onDemandParams) {
                Uploader.each(onDemandParams, function(name, val) {
                    params = params || {};
                    params[name] = val;
                });
            }
            if (mandatedParams) {
                Uploader.each(mandatedParams, function(name, val) {
                    params = params || {};
                    params[name] = val;
                });
            }
            return params;
        }

        function sendRequest(id, optXhr) {
            var xhr = getXhrOrXdr(id, optXhr),
                method = options.method,
                params = getParams(id),
                payload = requestData[id].payload,
                url;
            options.onSend(id);
            url = createUrl(id, params, requestData[id].additionalQueryParams);
            if (isXdr(xhr)) {
                xhr.onload = getXdrLoadHandler(id);
                xhr.onerror = getXdrErrorHandler(id);
            } else {
                xhr.onreadystatechange = getXhrReadyStateChangeHandler(id);
            }
            registerForUploadProgress(id);
            xhr.open(method, url, true);
            if (options.cors.expected && options.cors.sendCredentials && !isXdr(xhr)) {
                xhr.withCredentials = true;
            }
            setHeaders(id);
            log("Sending " + method + " request for " + id);
            if (payload) {
                xhr.send(payload);
            } else if (shouldParamsBeInQueryString || !params) {
                xhr.send();
            } else if (params && options.contentType && options.contentType.toLowerCase().indexOf("application/x-www-form-urlencoded") >= 0) {
                xhr.send(Uploader.obj2url(params, ""));
            } else if (params && options.contentType && options.contentType.toLowerCase().indexOf("application/json") >= 0) {
                xhr.send(JSON.stringify(params));
            } else {
                xhr.send(params);
            }
            return xhr;
        }

        function createUrl(id, params, additionalQueryParams) {
            var endpoint = options.endpointStore.get(id),
                addToPath = requestData[id].addToPath;
            if (addToPath != undefined) {
                endpoint += "/" + addToPath;
            }
            if (shouldParamsBeInQueryString && params) {
                endpoint = Uploader.obj2url(params, endpoint);
            }
            if (additionalQueryParams) {
                endpoint = Uploader.obj2url(additionalQueryParams, endpoint);
            }
            return endpoint;
        }

        function getXhrReadyStateChangeHandler(id) {
            return function() {
                if (getXhrOrXdr(id).readyState === 4) {
                    onComplete(id);
                }
            };
        }

        function registerForUploadProgress(id) {
            var onProgress = options.onProgress;
            if (onProgress) {
                getXhrOrXdr(id).upload.onprogress = function(e) {
                    if (e.lengthComputable) {
                        onProgress(id, e.loaded, e.total);
                    }
                };
            }
        }

        function getXdrLoadHandler(id) {
            return function() {
                onComplete(id);
            };
        }

        function getXdrErrorHandler(id) {
            return function() {
                onComplete(id, true);
            };
        }

        function setHeaders(id) {
            var xhr = getXhrOrXdr(id),
                customHeaders = options.customHeaders,
                onDemandHeaders = requestData[id].additionalHeaders || {},
                method = options.method,
                allHeaders = {};
            if (!isXdr(xhr)) {
                options.acceptHeader && xhr.setRequestHeader("Accept", options.acceptHeader);
                if (options.allowXRequestedWithAndCacheControl) {
                    if (!options.cors.expected || (!isSimpleMethod() || containsNonSimpleHeaders(customHeaders))) {
                        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                        xhr.setRequestHeader("Cache-Control", "no-cache");
                    }
                }
                if (options.contentType && (method === "POST" || method === "PUT")) {
                    xhr.setRequestHeader("Content-Type", options.contentType);
                }
                Uploader.extend(allHeaders, Uploader.isFunction(customHeaders) ? customHeaders(id) : customHeaders);
                Uploader.extend(allHeaders, onDemandHeaders);
                Uploader.each(allHeaders, function(name, val) {
                    xhr.setRequestHeader(name, val);
                });
            }
        }

        function isResponseSuccessful(responseCode) {
            return Uploader.indexOf(options.successfulResponseCodes[options.method], responseCode) >= 0;
        }

        function prepareToSend(id, optXhr, addToPath, additionalParams, additionalQueryParams, additionalHeaders, payload) {
            requestData[id] = {
                addToPath: addToPath,
                additionalParams: additionalParams,
                additionalQueryParams: additionalQueryParams,
                additionalHeaders: additionalHeaders,
                payload: payload
            };
            var len = queue.push(id);
            if (len <= options.maxConnections) {
                return sendRequest(id, optXhr);
            }
        }
        shouldParamsBeInQueryString = options.method === "GET" || options.method === "DELETE";
        Uploader.extend(this, {
            initTransport: function(id) {
                var path, params, headers, payload, cacheBuster, additionalQueryParams;
                return {
                    withPath: function(appendToPath) {
                        path = appendToPath;
                        return this;
                    },
                    withParams: function(additionalParams) {
                        params = additionalParams;
                        return this;
                    },
                    withQueryParams: function(_additionalQueryParams_) {
                        additionalQueryParams = _additionalQueryParams_;
                        return this;
                    },
                    withHeaders: function(additionalHeaders) {
                        headers = additionalHeaders;
                        return this;
                    },
                    withPayload: function(thePayload) {
                        payload = thePayload;
                        return this;
                    },
                    withCacheBuster: function() {
                        cacheBuster = true;
                        return this;
                    },
                    send: function(optXhr) {
                        if (cacheBuster && Uploader.indexOf(["GET", "DELETE"], options.method) >= 0) {
                            params.qqtimestamp = new Date().getTime();
                        }
                        return prepareToSend(id, optXhr, path, params, additionalQueryParams, headers, payload);
                    }
                };
            },
            canceled: function(id) {
                dequeue(id);
            }
        });
    };
    Uploader.UploadHandler = function(spec) {
        "use strict";
        var proxy = spec.proxy,
            fileState = {},
            onCancel = proxy.onCancel,
            getName = proxy.getName;
        Uploader.extend(this, {
            add: function(id, fileItem) {
                fileState[id] = fileItem;
                fileState[id].temp = {};
            },
            cancel: function(id) {
                var self = this,
                    cancelFinalizationEffort = new Uploader.Promise(),
                    onCancelRetVal = onCancel(id, getName(id), cancelFinalizationEffort);
                onCancelRetVal.then(function() {
                    if (self.isValid(id)) {
                        fileState[id].canceled = true;
                        self.expunge(id);
                    }
                    cancelFinalizationEffort.success();
                });
            },
            expunge: function(id) {
                delete fileState[id];
            },
            getThirdPartyFileId: function(id) {
                return fileState[id].key;
            },
            isValid: function(id) {
                return fileState[id] !== undefined;
            },
            reset: function() {
                fileState = {};
            },
            _getFileState: function(id) {
                return fileState[id];
            },
            _setThirdPartyFileId: function(id, thirdPartyFileId) {
                fileState[id].key = thirdPartyFileId;
            },
            _wasCanceled: function(id) {
                return !!fileState[id].canceled;
            }
        });
    };
    Uploader.UploadHandlerController = function(o, namespace) {
        "use strict";
        var controller = this,
            chunkingPossible = false,
            concurrentChunkingPossible = false,
            chunking, preventRetryResponse, log, handler, options = {
                paramsStore: {},
                maxConnections: 3,
                chunking: {
                    enabled: false,
                    multiple: {
                        enabled: false
                    }
                },
                log: function(str, level) {},
                onProgress: function(id, fileName, loaded, total) {},
                onComplete: function(id, fileName, response, xhr) {},
                onCancel: function(id, fileName) {},
                onUploadPrep: function(id) {},
                onUpload: function(id, fileName) {},
                onUploadChunk: function(id, fileName, chunkData) {},
                onUploadChunkSuccess: function(id, chunkData, response, xhr) {},
                onAutoRetry: function(id, fileName, response, xhr) {},
                onResume: function(id, fileName, chunkData) {},
                onUuidChanged: function(id, newUuid) {},
                getName: function(id) {},
                setSize: function(id, newSize) {},
                isQueued: function(id) {},
                getIdsInProxyGroup: function(id) {},
                getIdsInBatch: function(id) {}
            },
            chunked = {
                done: function(id, chunkIdx, response, xhr) {
                    var chunkData = handler._getChunkData(id, chunkIdx);
                    handler._getFileState(id).attemptingResume = false;
                    delete handler._getFileState(id).temp.chunkProgress[chunkIdx];
                    handler._getFileState(id).loaded += chunkData.size;
                    options.onUploadChunkSuccess(id, handler._getChunkDataForCallback(chunkData), response, xhr);
                },
                finalize: function(id) {
                    var size = options.getSize(id),
                        name = options.getName(id);
                    log("All chunks have been uploaded for " + id + " - finalizing....");
                    handler.finalizeChunks(id).then(function(response, xhr) {
                        log("Finalize successful for " + id);
                        var normaizedResponse = upload.normalizeResponse(response, true);
                        options.onProgress(id, name, size, size);
                        handler._maybeDeletePersistedChunkData(id);
                        upload.cleanup(id, normaizedResponse, xhr);
                    }, function(response, xhr) {
                        var normaizedResponse = upload.normalizeResponse(response, false);
                        log("Problem finalizing chunks for file ID " + id + " - " + normaizedResponse.error, "error");
                        if (normaizedResponse.reset) {
                            chunked.reset(id);
                        }
                        if (!options.onAutoRetry(id, name, normaizedResponse, xhr)) {
                            upload.cleanup(id, normaizedResponse, xhr);
                        }
                    });
                },
                handleFailure: function(chunkIdx, id, response, xhr) {
                    var name = options.getName(id);
                    log("Chunked upload request failed for " + id + ", chunk " + chunkIdx);
                    handler.clearCachedChunk(id, chunkIdx);
                    var responseToReport = upload.normalizeResponse(response, false),
                        inProgressIdx;
                    if (responseToReport.reset) {
                        chunked.reset(id);
                    } else {
                        inProgressIdx = Uploader.indexOf(handler._getFileState(id).chunking.inProgress, chunkIdx);
                        if (inProgressIdx >= 0) {
                            handler._getFileState(id).chunking.inProgress.splice(inProgressIdx, 1);
                            handler._getFileState(id).chunking.remaining.unshift(chunkIdx);
                        }
                    }
                    if (!handler._getFileState(id).temp.ignoreFailure) {
                        if (concurrentChunkingPossible) {
                            handler._getFileState(id).temp.ignoreFailure = true;
                            log(Uploader.format("Going to attempt to abort these chunks: {}. These are currently in-progress: {}.", JSON.stringify(Object.keys(handler._getXhrs(id))), JSON.stringify(handler._getFileState(id).chunking.inProgress)));
                            Uploader.each(handler._getXhrs(id), function(ckid, ckXhr) {
                                log(Uploader.format("Attempting to abort file {}.{}. XHR readyState {}. ", id, ckid, ckXhr.readyState));
                                ckXhr.abort();
                                ckXhr._cancelled = true;
                            });
                            handler.moveInProgressToRemaining(id);
                            connectionManager.free(id, true);
                        }
                        if (!options.onAutoRetry(id, name, responseToReport, xhr)) {
                            upload.cleanup(id, responseToReport, xhr);
                        }
                    }
                },
                hasMoreParts: function(id) {
                    return !!handler._getFileState(id).chunking.remaining.length;
                },
                nextPart: function(id) {
                    var nextIdx = handler._getFileState(id).chunking.remaining.shift();
                    if (nextIdx >= handler._getTotalChunks(id)) {
                        nextIdx = null;
                    }
                    return nextIdx;
                },
                reset: function(id) {
                    log("Server or callback has ordered chunking effort to be restarted on next attempt for item ID " + id, "error");
                    handler._maybeDeletePersistedChunkData(id);
                    handler.reevaluateChunking(id);
                    handler._getFileState(id).loaded = 0;
                },
                sendNext: function(id) {
                    var size = options.getSize(id),
                        name = options.getName(id),
                        chunkIdx = chunked.nextPart(id),
                        chunkData = handler._getChunkData(id, chunkIdx),
                        resuming = handler._getFileState(id).attemptingResume,
                        inProgressChunks = handler._getFileState(id).chunking.inProgress || [];
                    if (handler._getFileState(id).loaded == null) {
                        handler._getFileState(id).loaded = 0;
                    }
                    if (resuming && options.onResume(id, name, chunkData) === false) {
                        chunked.reset(id);
                        chunkIdx = chunked.nextPart(id);
                        chunkData = handler._getChunkData(id, chunkIdx);
                        resuming = false;
                    }
                    if (chunkIdx == null && inProgressChunks.length === 0) {
                        chunked.finalize(id);
                    } else {
                        log(Uploader.format("Sending chunked upload request for item {}.{}, bytes {}-{} of {}.", id, chunkIdx, chunkData.start + 1, chunkData.end, size));
                        options.onUploadChunk(id, name, handler._getChunkDataForCallback(chunkData));
                        inProgressChunks.push(chunkIdx);
                        handler._getFileState(id).chunking.inProgress = inProgressChunks;
                        if (concurrentChunkingPossible) {
                            connectionManager.open(id, chunkIdx);
                        }
                        if (concurrentChunkingPossible && connectionManager.available() && handler._getFileState(id).chunking.remaining.length) {
                            chunked.sendNext(id);
                        }
                        if (chunkData.blob.size === 0) {
                            log(Uploader.format("Chunk {} for file {} will not be uploaded, zero sized chunk.", chunkIdx, id), "error");
                            chunked.handleFailure(chunkIdx, id, "File is no longer available", null);
                        } else {
                            handler.uploadChunk(id, chunkIdx, resuming).then(function success(response, xhr) {
                                log("Chunked upload request succeeded for " + id + ", chunk " + chunkIdx);
                                handler.clearCachedChunk(id, chunkIdx);
                                var inProgressChunks = handler._getFileState(id).chunking.inProgress || [],
                                    responseToReport = upload.normalizeResponse(response, true),
                                    inProgressChunkIdx = Uploader.indexOf(inProgressChunks, chunkIdx);
                                log(Uploader.format("Chunk {} for file {} uploaded successfully.", chunkIdx, id));
                                chunked.done(id, chunkIdx, responseToReport, xhr);
                                if (inProgressChunkIdx >= 0) {
                                    inProgressChunks.splice(inProgressChunkIdx, 1);
                                }
                                handler._maybePersistChunkedState(id);
                                if (!chunked.hasMoreParts(id) && inProgressChunks.length === 0) {
                                    chunked.finalize(id);
                                } else if (chunked.hasMoreParts(id)) {
                                    chunked.sendNext(id);
                                } else {
                                    log(Uploader.format("File ID {} has no more chunks to send and these chunk indexes are still marked as in-progress: {}", id, JSON.stringify(inProgressChunks)));
                                }
                            }, function failure(response, xhr) {
                                chunked.handleFailure(chunkIdx, id, response, xhr);
                            }).done(function() {
                                handler.clearXhr(id, chunkIdx);
                            });
                        }
                    }
                }
            },
            connectionManager = {
                _open: [],
                _openChunks: {},
                _waiting: [],
                available: function() {
                    var max = options.maxConnections,
                        openChunkEntriesCount = 0,
                        openChunksCount = 0;
                    Uploader.each(connectionManager._openChunks, function(fileId, openChunkIndexes) {
                        openChunkEntriesCount++;
                        openChunksCount += openChunkIndexes.length;
                    });
                    return max - (connectionManager._open.length - openChunkEntriesCount + openChunksCount);
                },
                free: function(id, dontAllowNext) {
                    var allowNext = !dontAllowNext,
                        waitingIndex = Uploader.indexOf(connectionManager._waiting, id),
                        connectionsIndex = Uploader.indexOf(connectionManager._open, id),
                        nextId;
                    delete connectionManager._openChunks[id];
                    if (upload.getProxyOrBlob(id) instanceof Uploader.BlobProxy) {
                        log("Generated blob upload has ended for " + id + ", disposing generated blob.");
                        delete handler._getFileState(id).file;
                    }
                    if (waitingIndex >= 0) {
                        connectionManager._waiting.splice(waitingIndex, 1);
                    } else if (allowNext && connectionsIndex >= 0) {
                        connectionManager._open.splice(connectionsIndex, 1);
                        nextId = connectionManager._waiting.shift();
                        if (nextId >= 0) {
                            connectionManager._open.push(nextId);
                            upload.start(nextId);
                        }
                    }
                },
                getWaitingOrConnected: function() {
                    var waitingOrConnected = [];
                    Uploader.each(connectionManager._openChunks, function(fileId, chunks) {
                        if (chunks && chunks.length) {
                            waitingOrConnected.push(parseInt(fileId));
                        }
                    });
                    Uploader.each(connectionManager._open, function(idx, fileId) {
                        if (!connectionManager._openChunks[fileId]) {
                            waitingOrConnected.push(parseInt(fileId));
                        }
                    });
                    waitingOrConnected = waitingOrConnected.concat(connectionManager._waiting);
                    return waitingOrConnected;
                },
                isUsingConnection: function(id) {
                    return Uploader.indexOf(connectionManager._open, id) >= 0;
                },
                open: function(id, chunkIdx) {
                    if (chunkIdx == null) {
                        connectionManager._waiting.push(id);
                    }
                    if (connectionManager.available()) {
                        if (chunkIdx == null) {
                            connectionManager._waiting.pop();
                            connectionManager._open.push(id);
                        } else {
                            (function() {
                                var openChunksEntry = connectionManager._openChunks[id] || [];
                                openChunksEntry.push(chunkIdx);
                                connectionManager._openChunks[id] = openChunksEntry;
                            })();
                        }
                        return true;
                    }
                    return false;
                },
                reset: function() {
                    connectionManager._waiting = [];
                    connectionManager._open = [];
                }
            },
            simple = {
                send: function(id, name) {
                    handler._getFileState(id).loaded = 0;
                    log("Sending simple upload request for " + id);
                    handler.uploadFile(id).then(function(response, optXhr) {
                        log("Simple upload request succeeded for " + id);
                        var responseToReport = upload.normalizeResponse(response, true),
                            size = options.getSize(id);
                        options.onProgress(id, name, size, size);
                        upload.maybeNewUuid(id, responseToReport);
                        upload.cleanup(id, responseToReport, optXhr);
                    }, function(response, optXhr) {
                        log("Simple upload request failed for " + id);
                        var responseToReport = upload.normalizeResponse(response, false);
                        if (!options.onAutoRetry(id, name, responseToReport, optXhr)) {
                            upload.cleanup(id, responseToReport, optXhr);
                        }
                    });
                }
            },
            upload = {
                cancel: function(id) {
                    log("Cancelling " + id);
                    options.paramsStore.remove(id);
                    connectionManager.free(id);
                },
                cleanup: function(id, response, optXhr) {
                    var name = options.getName(id);
                    options.onComplete(id, name, response, optXhr);
                    if (handler._getFileState(id)) {
                        handler._clearXhrs && handler._clearXhrs(id);
                    }
                    connectionManager.free(id);
                },
                getProxyOrBlob: function(id) {
                    return handler.getProxy && handler.getProxy(id) || handler.getFile && handler.getFile(id);
                },
                initHandler: function() {
                    var handlerType = namespace ? Uploader[namespace] : Uploader.traditional,
                        handlerModuleSubtype = Uploader.supportedFeatures.ajaxUploading ? "Xhr" : "Form";
                    handler = new handlerType[handlerModuleSubtype + "UploadHandler"](options, {
                        getDataByUuid: options.getDataByUuid,
                        getName: options.getName,
                        getSize: options.getSize,
                        getUuid: options.getUuid,
                        log: log,
                        onCancel: options.onCancel,
                        onProgress: options.onProgress,
                        onUuidChanged: options.onUuidChanged
                    });
                    if (handler._removeExpiredChunkingRecords) {
                        handler._removeExpiredChunkingRecords();
                    }
                },
                isDeferredEligibleForUpload: function(id) {
                    return options.isQueued(id);
                },
                maybeDefer: function(id, blob) {
                    if (blob && !handler.getFile(id) && blob instanceof Uploader.BlobProxy) {
                        options.onUploadPrep(id);
                        log("Attempting to generate a blob on-demand for " + id);
                        blob.create().then(function(generatedBlob) {
                            log("Generated an on-demand blob for " + id);
                            handler.updateBlob(id, generatedBlob);
                            options.setSize(id, generatedBlob.size);
                            handler.reevaluateChunking(id);
                            upload.maybeSendDeferredFiles(id);
                        }, function(errorMessage) {
                            var errorResponse = {};
                            if (errorMessage) {
                                errorResponse.error = errorMessage;
                            }
                            log(Uploader.format("Failed to generate blob for ID {}.  Error message: {}.", id, errorMessage), "error");
                            options.onComplete(id, options.getName(id), Uploader.extend(errorResponse, preventRetryResponse), null);
                            upload.maybeSendDeferredFiles(id);
                            connectionManager.free(id);
                        });
                    } else {
                        return upload.maybeSendDeferredFiles(id);
                    }
                    return false;
                },
                maybeSendDeferredFiles: function(id) {
                    var idsInGroup = options.getIdsInProxyGroup(id),
                        uploadedThisId = false;
                    if (idsInGroup && idsInGroup.length) {
                        log("Maybe ready to upload proxy group file " + id);
                        Uploader.each(idsInGroup, function(idx, idInGroup) {
                            if (upload.isDeferredEligibleForUpload(idInGroup) && !!handler.getFile(idInGroup)) {
                                uploadedThisId = idInGroup === id;
                                upload.now(idInGroup);
                            } else if (upload.isDeferredEligibleForUpload(idInGroup)) {
                                return false;
                            }
                        });
                    } else {
                        uploadedThisId = true;
                        upload.now(id);
                    }
                    return uploadedThisId;
                },
                maybeNewUuid: function(id, response) {
                    if (response.newUuid !== undefined) {
                        options.onUuidChanged(id, response.newUuid);
                    }
                },
                normalizeResponse: function(originalResponse, successful) {
                    var response = originalResponse;
                    if (!Uploader.isObject(originalResponse)) {
                        response = {};
                        if (Uploader.isString(originalResponse) && !successful) {
                            response.error = originalResponse;
                        }
                    }
                    response.success = successful;
                    return response;
                },
                now: function(id) {
                    var name = options.getName(id);
                    if (!controller.isValid(id)) {
                        throw new Uploader.Error(id + " is not a valid file ID to upload!");
                    }
                    options.onUpload(id, name);
                    if (chunkingPossible && handler._shouldChunkThisFile(id)) {
                        chunked.sendNext(id);
                    } else {
                        simple.send(id, name);
                    }
                },
                start: function(id) {
                    var blobToUpload = upload.getProxyOrBlob(id);
                    if (blobToUpload) {
                        return upload.maybeDefer(id, blobToUpload);
                    } else {
                        upload.now(id);
                        return true;
                    }
                }
            };
        Uploader.extend(this, {
            add: function(id, file) {
                handler.add.apply(this, arguments);
            },
            upload: function(id) {
                if (connectionManager.open(id)) {
                    return upload.start(id);
                }
                return false;
            },
            retry: function(id) {
                if (concurrentChunkingPossible) {
                    handler._getFileState(id).temp.ignoreFailure = false;
                }
                if (connectionManager.isUsingConnection(id)) {
                    return upload.start(id);
                } else {
                    return controller.upload(id);
                }
            },
            cancel: function(id) {
                var cancelRetVal = handler.cancel(id);
                if (Uploader.isGenericPromise(cancelRetVal)) {
                    cancelRetVal.then(function() {
                        upload.cancel(id);
                    });
                } else if (cancelRetVal !== false) {
                    upload.cancel(id);
                }
            },
            cancelAll: function() {
                var waitingOrConnected = connectionManager.getWaitingOrConnected(),
                    i;
                if (waitingOrConnected.length) {
                    for (i = waitingOrConnected.length - 1; i >= 0; i--) {
                        controller.cancel(waitingOrConnected[i]);
                    }
                }
                connectionManager.reset();
            },
            getFile: function(id) {
                if (handler.getProxy && handler.getProxy(id)) {
                    return handler.getProxy(id).referenceBlob;
                }
                return handler.getFile && handler.getFile(id);
            },
            isProxied: function(id) {
                return !!(handler.getProxy && handler.getProxy(id));
            },
            getInput: function(id) {
                if (handler.getInput) {
                    return handler.getInput(id);
                }
            },
            reset: function() {
                log("Resetting upload handler");
                controller.cancelAll();
                connectionManager.reset();
                handler.reset();
            },
            expunge: function(id) {
                if (controller.isValid(id)) {
                    return handler.expunge(id);
                }
            },
            isValid: function(id) {
                return handler.isValid(id);
            },
            getResumableFilesData: function() {
                if (handler.getResumableFilesData) {
                    return handler.getResumableFilesData();
                }
                return [];
            },
            getThirdPartyFileId: function(id) {
                if (controller.isValid(id)) {
                    return handler.getThirdPartyFileId(id);
                }
            },
            pause: function(id) {
                if (controller.isResumable(id) && handler.pause && controller.isValid(id) && handler.pause(id)) {
                    connectionManager.free(id);
                    handler.moveInProgressToRemaining(id);
                    return true;
                }
                return false;
            },
            isResumable: function(id) {
                return !!handler.isResumable && handler.isResumable(id);
            }
        });
        Uploader.extend(options, o);
        log = options.log;
        chunkingPossible = options.chunking.enabled && Uploader.supportedFeatures.chunking;
        concurrentChunkingPossible = chunkingPossible && options.chunking.concurrent.enabled;
        preventRetryResponse = function() {
            var response = {};
            response[options.preventRetryParam] = true;
            return response;
        }();
        upload.initHandler();
    };
    Uploader.WindowReceiveMessage = function(o) {
        "use strict";
        var options = {
                log: function(message, level) {}
            },
            callbackWrapperDetachers = {};
        Uploader.extend(options, o);
        Uploader.extend(this, {
            receiveMessage: function(id, callback) {
                var onMessageCallbackWrapper = function(event) {
                    callback(event.data);
                };
                if (window.postMessage) {
                    callbackWrapperDetachers[id] = Uploader(window).attach("message", onMessageCallbackWrapper);
                } else {
                    log("iframe message passing not supported in this browser!", "error");
                }
            },
            stopReceivingMessages: function(id) {
                if (window.postMessage) {
                    var detacher = callbackWrapperDetachers[id];
                    if (detacher) {
                        detacher();
                    }
                }
            }
        });
    };
    Uploader.FormUploadHandler = function(spec) {
        "use strict";
        var options = spec.options,
            handler = this,
            proxy = spec.proxy,
            formHandlerInstanceId = Uploader.getUniqueId(),
            onloadCallbacks = {},
            detachLoadEvents = {},
            postMessageCallbackTimers = {},
            isCors = options.isCors,
            inputName = options.inputName,
            getUuid = proxy.getUuid,
            log = proxy.log,
            corsMessageReceiver = new Uploader.WindowReceiveMessage({
                log: log
            });

        function expungeFile(id) {
            delete detachLoadEvents[id];
            if (isCors) {
                clearTimeout(postMessageCallbackTimers[id]);
                delete postMessageCallbackTimers[id];
                corsMessageReceiver.stopReceivingMessages(id);
            }
            var iframe = document.getElementById(handler._getIframeName(id));
            if (iframe) {
                iframe.setAttribute("src", "javascript:false;");
                Uploader(iframe).remove();
            }
        }

        function getFileIdForIframeName(iframeName) {
            return iframeName.split("_")[0];
        }

        function initIframeForUpload(name) {
            var iframe = Uploader.toElement("<iframe src='javascript:false;' name='" + name + "' />");
            iframe.setAttribute("id", name);
            iframe.style.display = "none";
            document.body.appendChild(iframe);
            return iframe;
        }

        function registerPostMessageCallback(iframe, callback) {
            var iframeName = iframe.id,
                fileId = getFileIdForIframeName(iframeName),
                uuid = getUuid(fileId);
            onloadCallbacks[uuid] = callback;
            detachLoadEvents[fileId] = Uploader(iframe).attach("load", function() {
                if (handler.getInput(fileId)) {
                    log("Received iframe load event for CORS upload request (iframe name " + iframeName + ")");
                    postMessageCallbackTimers[iframeName] = setTimeout(function() {
                        var errorMessage = "No valid message received from loaded iframe for iframe name " + iframeName;
                        log(errorMessage, "error");
                        callback({
                            error: errorMessage
                        });
                    }, 1e3);
                }
            });
            corsMessageReceiver.receiveMessage(iframeName, function(message) {
                log("Received the following window message: '" + message + "'");
                var fileId = getFileIdForIframeName(iframeName),
                    response = handler._parseJsonResponse(message),
                    uuid = response.uuid,
                    onloadCallback;
                if (uuid && onloadCallbacks[uuid]) {
                    log("Handling response for iframe name " + iframeName);
                    clearTimeout(postMessageCallbackTimers[iframeName]);
                    delete postMessageCallbackTimers[iframeName];
                    handler._detachLoadEvent(iframeName);
                    onloadCallback = onloadCallbacks[uuid];
                    delete onloadCallbacks[uuid];
                    corsMessageReceiver.stopReceivingMessages(iframeName);
                    onloadCallback(response);
                } else if (!uuid) {
                    log("'" + message + "' does not contain a UUID - ignoring.");
                }
            });
        }
        Uploader.extend(this, new Uploader.UploadHandler(spec));
        Uploader.override(this, function(super_) {
            return {
                add: function(id, fileInput) {
                    super_.add(id, {
                        input: fileInput
                    });
                    fileInput.setAttribute("name", inputName);
                    if (fileInput.parentNode) {
                        Uploader(fileInput).remove();
                    }
                },
                expunge: function(id) {
                    expungeFile(id);
                    super_.expunge(id);
                },
                isValid: function(id) {
                    return super_.isValid(id) && handler._getFileState(id).input !== undefined;
                }
            };
        });
        Uploader.extend(this, {
            getInput: function(id) {
                return handler._getFileState(id).input;
            },
            _attachLoadEvent: function(iframe, callback) {
                var responseDescriptor;
                if (isCors) {
                    registerPostMessageCallback(iframe, callback);
                } else {
                    detachLoadEvents[iframe.id] = Uploader(iframe).attach("load", function() {
                        log("Received response for " + iframe.id);
                        if (!iframe.parentNode) {
                            return;
                        }
                        try {
                            if (iframe.contentDocument && iframe.contentDocument.body && iframe.contentDocument.body.innerHTML == "false") {
                                return;
                            }
                        } catch (error) {
                            log("Error when attempting to access iframe during handling of upload response (" + error.message + ")", "error");
                            responseDescriptor = {
                                success: false
                            };
                        }
                        callback(responseDescriptor);
                    });
                }
            },
            _createIframe: function(id) {
                var iframeName = handler._getIframeName(id);
                return initIframeForUpload(iframeName);
            },
            _detachLoadEvent: function(id) {
                if (detachLoadEvents[id] !== undefined) {
                    detachLoadEvents[id]();
                    delete detachLoadEvents[id];
                }
            },
            _getIframeName: function(fileId) {
                return fileId + "_" + formHandlerInstanceId;
            },
            _initFormForUpload: function(spec) {
                var method = spec.method,
                    endpoint = spec.endpoint,
                    params = spec.params,
                    paramsInBody = spec.paramsInBody,
                    targetName = spec.targetName,
                    form = Uploader.toElement("<form method='" + method + "' enctype='multipart/form-data'></form>"),
                    url = endpoint;
                if (paramsInBody) {
                    Uploader.obj2Inputs(params, form);
                } else {
                    url = Uploader.obj2url(params, endpoint);
                }
                form.setAttribute("action", url);
                form.setAttribute("target", targetName);
                form.style.display = "none";
                document.body.appendChild(form);
                return form;
            },
            _parseJsonResponse: function(innerHtmlOrMessage) {
                var response = {};
                try {
                    response = Uploader.parseJson(innerHtmlOrMessage);
                } catch (error) {
                    log("Error when attempting to parse iframe upload response (" + error.message + ")", "error");
                }
                return response;
            }
        });
    };
    Uploader.XhrUploadHandler = function(spec) {
        "use strict";
        var handler = this,
            namespace = spec.options.namespace,
            proxy = spec.proxy,
            chunking = spec.options.chunking,
            resume = spec.options.resume,
            chunkFiles = chunking && spec.options.chunking.enabled && Uploader.supportedFeatures.chunking,
            resumeEnabled = resume && spec.options.resume.enabled && chunkFiles && Uploader.supportedFeatures.resume,
            getName = proxy.getName,
            getSize = proxy.getSize,
            getUuid = proxy.getUuid,
            getEndpoint = proxy.getEndpoint,
            getDataByUuid = proxy.getDataByUuid,
            onUuidChanged = proxy.onUuidChanged,
            onProgress = proxy.onProgress,
            log = proxy.log;

        function abort(id) {
            Uploader.each(handler._getXhrs(id), function(xhrId, xhr) {
                var ajaxRequester = handler._getAjaxRequester(id, xhrId);
                xhr.onreadystatechange = null;
                xhr.upload.onprogress = null;
                xhr.abort();
                ajaxRequester && ajaxRequester.canceled && ajaxRequester.canceled(id);
            });
        }
        Uploader.extend(this, new Uploader.UploadHandler(spec));
        Uploader.override(this, function(super_) {
            return {
                add: function(id, blobOrProxy) {
                    if (Uploader.isFile(blobOrProxy) || Uploader.isBlob(blobOrProxy)) {
                        super_.add(id, {
                            file: blobOrProxy
                        });
                    } else if (blobOrProxy instanceof Uploader.BlobProxy) {
                        super_.add(id, {
                            proxy: blobOrProxy
                        });
                    } else {
                        throw new Error("Passed obj is not a File, Blob, or proxy");
                    }
                    handler._initTempState(id);
                    resumeEnabled && handler._maybePrepareForResume(id);
                },
                expunge: function(id) {
                    abort(id);
                    handler._maybeDeletePersistedChunkData(id);
                    handler._clearXhrs(id);
                    super_.expunge(id);
                }
            };
        });
        Uploader.extend(this, {
            clearCachedChunk: function(id, chunkIdx) {
                delete handler._getFileState(id).temp.cachedChunks[chunkIdx];
            },
            clearXhr: function(id, chunkIdx) {
                var tempState = handler._getFileState(id).temp;
                if (tempState.xhrs) {
                    delete tempState.xhrs[chunkIdx];
                }
                if (tempState.ajaxRequesters) {
                    delete tempState.ajaxRequesters[chunkIdx];
                }
            },
            finalizeChunks: function(id, responseParser) {
                var lastChunkIdx = handler._getTotalChunks(id) - 1,
                    xhr = handler._getXhr(id, lastChunkIdx);
                if (responseParser) {
                    return new Uploader.Promise().success(responseParser(xhr), xhr);
                }
                return new Uploader.Promise().success({}, xhr);
            },
            getFile: function(id) {
                return handler.isValid(id) && handler._getFileState(id).file;
            },
            getProxy: function(id) {
                return handler.isValid(id) && handler._getFileState(id).proxy;
            },
            getResumableFilesData: function() {
                var resumableFilesData = [];
                handler._iterateResumeRecords(function(key, uploadData) {
                    handler.moveInProgressToRemaining(null, uploadData.chunking.inProgress, uploadData.chunking.remaining);
                    var data = {
                        name: uploadData.name,
                        remaining: uploadData.chunking.remaining,
                        size: uploadData.size,
                        uuid: uploadData.uuid
                    };
                    if (uploadData.key) {
                        data.key = uploadData.key;
                    }
                    resumableFilesData.push(data);
                });
                return resumableFilesData;
            },
            isResumable: function(id) {
                return !!chunking && handler.isValid(id) && !handler._getFileState(id).notResumable;
            },
            moveInProgressToRemaining: function(id, optInProgress, optRemaining) {
                var inProgress = optInProgress || handler._getFileState(id).chunking.inProgress,
                    remaining = optRemaining || handler._getFileState(id).chunking.remaining;
                if (inProgress) {
                    log(Uploader.format("Moving these chunks from in-progress {}, to remaining.", JSON.stringify(inProgress)));
                    inProgress.reverse();
                    Uploader.each(inProgress, function(idx, chunkIdx) {
                        remaining.unshift(chunkIdx);
                    });
                    inProgress.length = 0;
                }
            },
            pause: function(id) {
                if (handler.isValid(id)) {
                    log(Uploader.format("Aborting XHR upload for {} '{}' due to pause instruction.", id, getName(id)));
                    handler._getFileState(id).paused = true;
                    abort(id);
                    return true;
                }
            },
            reevaluateChunking: function(id) {
                if (chunking && handler.isValid(id)) {
                    var state = handler._getFileState(id),
                        totalChunks, i;
                    delete state.chunking;
                    state.chunking = {};
                    totalChunks = handler._getTotalChunks(id);
                    if (totalChunks > 1 || chunking.mandatory) {
                        state.chunking.enabled = true;
                        state.chunking.parts = totalChunks;
                        state.chunking.remaining = [];
                        for (i = 0; i < totalChunks; i++) {
                            state.chunking.remaining.push(i);
                        }
                        handler._initTempState(id);
                    } else {
                        state.chunking.enabled = false;
                    }
                }
            },
            updateBlob: function(id, newBlob) {
                if (handler.isValid(id)) {
                    handler._getFileState(id).file = newBlob;
                }
            },
            _clearXhrs: function(id) {
                var tempState = handler._getFileState(id).temp;
                Uploader.each(tempState.ajaxRequesters, function(chunkId) {
                    delete tempState.ajaxRequesters[chunkId];
                });
                Uploader.each(tempState.xhrs, function(chunkId) {
                    delete tempState.xhrs[chunkId];
                });
            },
            _createXhr: function(id, optChunkIdx) {
                return handler._registerXhr(id, optChunkIdx, Uploader.createXhrInstance());
            },
            _getAjaxRequester: function(id, optChunkIdx) {
                var chunkIdx = optChunkIdx == null ? -1 : optChunkIdx;
                return handler._getFileState(id).temp.ajaxRequesters[chunkIdx];
            },
            _getChunkData: function(id, chunkIndex) {
                var chunkSize = chunking.partSize,
                    fileSize = getSize(id),
                    fileOrBlob = handler.getFile(id),
                    startBytes = chunkSize * chunkIndex,
                    endBytes = startBytes + chunkSize >= fileSize ? fileSize : startBytes + chunkSize,
                    totalChunks = handler._getTotalChunks(id),
                    cachedChunks = this._getFileState(id).temp.cachedChunks,
                    blob = cachedChunks[chunkIndex] || Uploader.sliceBlob(fileOrBlob, startBytes, endBytes);
                cachedChunks[chunkIndex] = blob;
                return {
                    part: chunkIndex,
                    start: startBytes,
                    end: endBytes,
                    count: totalChunks,
                    blob: blob,
                    size: endBytes - startBytes
                };
            },
            _getChunkDataForCallback: function(chunkData) {
                return {
                    partIndex: chunkData.part,
                    startByte: chunkData.start + 1,
                    endByte: chunkData.end,
                    totalParts: chunkData.count
                };
            },
            _getLocalStorageId: function(id) {
                var formatVersion = "5.0",
                    name = getName(id),
                    size = getSize(id),
                    chunkSize = chunking.partSize,
                    endpoint = getEndpoint(id);
                return Uploader.format("Uploader{}resume{}-{}-{}-{}-{}", namespace, formatVersion, name, size, chunkSize, endpoint);
            },
            _getMimeType: function(id) {
                return handler.getFile(id).type;
            },
            _getPersistableData: function(id) {
                return handler._getFileState(id).chunking;
            },
            _getTotalChunks: function(id) {
                if (chunking) {
                    var fileSize = getSize(id),
                        chunkSize = chunking.partSize;
                    return Math.ceil(fileSize / chunkSize);
                }
            },
            _getXhr: function(id, optChunkIdx) {
                var chunkIdx = optChunkIdx == null ? -1 : optChunkIdx;
                return handler._getFileState(id).temp.xhrs[chunkIdx];
            },
            _getXhrs: function(id) {
                return handler._getFileState(id).temp.xhrs;
            },
            _iterateResumeRecords: function(callback) {
                if (resumeEnabled) {
                    Uploader.each(localStorage, function(key, item) {
                        if (key.indexOf(Uploader.format("Uploader{}resume", namespace)) === 0) {
                            var uploadData = JSON.parse(item);
                            callback(key, uploadData);
                        }
                    });
                }
            },
            _initTempState: function(id) {
                handler._getFileState(id).temp = {
                    ajaxRequesters: {},
                    chunkProgress: {},
                    xhrs: {},
                    cachedChunks: {}
                };
            },
            _markNotResumable: function(id) {
                handler._getFileState(id).notResumable = true;
            },
            _maybeDeletePersistedChunkData: function(id) {
                var localStorageId;
                if (resumeEnabled && handler.isResumable(id)) {
                    localStorageId = handler._getLocalStorageId(id);
                    if (localStorageId && localStorage.getItem(localStorageId)) {
                        localStorage.removeItem(localStorageId);
                        return true;
                    }
                }
                return false;
            },
            _maybePrepareForResume: function(id) {
                var state = handler._getFileState(id),
                    localStorageId, persistedData;
                if (resumeEnabled && state.key === undefined) {
                    localStorageId = handler._getLocalStorageId(id);
                    persistedData = localStorage.getItem(localStorageId);
                    if (persistedData) {
                        persistedData = JSON.parse(persistedData);
                        if (getDataByUuid(persistedData.uuid)) {
                            handler._markNotResumable(id);
                        } else {
                            log(Uploader.format("Identified file with ID {} and name of {} as resumable.", id, getName(id)));
                            onUuidChanged(id, persistedData.uuid);
                            state.key = persistedData.key;
                            state.chunking = persistedData.chunking;
                            state.loaded = persistedData.loaded;
                            state.attemptingResume = true;
                            handler.moveInProgressToRemaining(id);
                        }
                    }
                }
            },
            _maybePersistChunkedState: function(id) {
                var state = handler._getFileState(id),
                    localStorageId, persistedData;
                if (resumeEnabled && handler.isResumable(id)) {
                    localStorageId = handler._getLocalStorageId(id);
                    persistedData = {
                        name: getName(id),
                        size: getSize(id),
                        uuid: getUuid(id),
                        key: state.key,
                        chunking: state.chunking,
                        loaded: state.loaded,
                        lastUpdated: Date.now()
                    };
                    try {
                        localStorage.setItem(localStorageId, JSON.stringify(persistedData));
                    } catch (error) {
                        log(Uploader.format("Unable to save resume data for '{}' due to error: '{}'.", id, error.toString()), "warn");
                    }
                }
            },
            _registerProgressHandler: function(id, chunkIdx, chunkSize) {
                var xhr = handler._getXhr(id, chunkIdx),
                    name = getName(id),
                    progressCalculator = {
                        simple: function(loaded, total) {
                            var fileSize = getSize(id);
                            if (loaded === total) {
                                onProgress(id, name, fileSize, fileSize);
                            } else {
                                onProgress(id, name, loaded >= fileSize ? fileSize - 1 : loaded, fileSize);
                            }
                        },
                        chunked: function(loaded, total) {
                            var chunkProgress = handler._getFileState(id).temp.chunkProgress,
                                totalSuccessfullyLoadedForFile = handler._getFileState(id).loaded,
                                loadedForRequest = loaded,
                                totalForRequest = total,
                                totalFileSize = getSize(id),
                                estActualChunkLoaded = loadedForRequest - (totalForRequest - chunkSize),
                                totalLoadedForFile = totalSuccessfullyLoadedForFile;
                            chunkProgress[chunkIdx] = estActualChunkLoaded;
                            Uploader.each(chunkProgress, function(chunkIdx, chunkLoaded) {
                                totalLoadedForFile += chunkLoaded;
                            });
                            onProgress(id, name, totalLoadedForFile, totalFileSize);
                        }
                    };
                xhr.upload.onprogress = function(e) {
                    if (e.lengthComputable) {
                        var type = chunkSize == null ? "simple" : "chunked";
                        progressCalculator[type](e.loaded, e.total);
                    }
                };
            },
            _registerXhr: function(id, optChunkIdx, xhr, optAjaxRequester) {
                var xhrsId = optChunkIdx == null ? -1 : optChunkIdx,
                    tempState = handler._getFileState(id).temp;
                tempState.xhrs = tempState.xhrs || {};
                tempState.ajaxRequesters = tempState.ajaxRequesters || {};
                tempState.xhrs[xhrsId] = xhr;
                if (optAjaxRequester) {
                    tempState.ajaxRequesters[xhrsId] = optAjaxRequester;
                }
                return xhr;
            },
            _removeExpiredChunkingRecords: function() {
                var expirationDays = resume.recordsExpireIn;
                handler._iterateResumeRecords(function(key, uploadData) {
                    var expirationDate = new Date(uploadData.lastUpdated);
                    expirationDate.setDate(expirationDate.getDate() + expirationDays);
                    if (expirationDate.getTime() <= Date.now()) {
                        log("Removing expired resume record with key " + key);
                        localStorage.removeItem(key);
                    }
                });
            },
            _shouldChunkThisFile: function(id) {
                var state = handler._getFileState(id);
                if (!state.chunking) {
                    handler.reevaluateChunking(id);
                }
                return state.chunking.enabled;
            }
        });
    };
    Uploader.DeleteFileAjaxRequester = function(o) {
        "use strict";
        var requester, options = {
            method: "DELETE",
            uuidParamName: "qquuid",
            endpointStore: {},
            maxConnections: 3,
            customHeaders: function(id) {
                return {};
            },
            paramsStore: {},
            cors: {
                expected: false,
                sendCredentials: false
            },
            log: function(str, level) {},
            onDelete: function(id) {},
            onDeleteComplete: function(id, xhrOrXdr, isError) {}
        };
        Uploader.extend(options, o);

        function getMandatedParams() {
            if (options.method.toUpperCase() === "POST") {
                return {
                    _method: "DELETE"
                };
            }
            return {};
        }
        requester = Uploader.extend(this, new Uploader.AjaxRequester({
            acceptHeader: "application/json",
            validMethods: ["POST", "DELETE"],
            method: options.method,
            endpointStore: options.endpointStore,
            paramsStore: options.paramsStore,
            mandatedParams: getMandatedParams(),
            maxConnections: options.maxConnections,
            customHeaders: function(id) {
                return options.customHeaders.get(id);
            },
            log: options.log,
            onSend: options.onDelete,
            onComplete: options.onDeleteComplete,
            cors: options.cors
        }));
        Uploader.extend(this, {
            sendDelete: function(id, uuid, additionalMandatedParams) {
                var additionalOptions = additionalMandatedParams || {};
                options.log("Submitting delete file request for " + id);
                if (options.method === "DELETE") {
                    requester.initTransport(id).withPath(uuid).withParams(additionalOptions).send();
                } else {
                    additionalOptions[options.uuidParamName] = uuid;
                    requester.initTransport(id).withParams(additionalOptions).send();
                }
            }
        });
    };
    (function() {
        function detectSubsampling(img) {
            var iw = img.naturalWidth,
                ih = img.naturalHeight,
                canvas = document.createElement("canvas"),
                ctx;
            if (iw * ih > 1024 * 1024) {
                canvas.width = canvas.height = 1;
                ctx = canvas.getContext("2d");
                ctx.drawImage(img, -iw + 1, 0);
                return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
            } else {
                return false;
            }
        }

        function detectVerticalSquash(img, iw, ih) {
            var canvas = document.createElement("canvas"),
                sy = 0,
                ey = ih,
                py = ih,
                ctx, data, alpha, ratio;
            canvas.width = 1;
            canvas.height = ih;
            ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            data = ctx.getImageData(0, 0, 1, ih).data;
            while (py > sy) {
                alpha = data[(py - 1) * 4 + 3];
                if (alpha === 0) {
                    ey = py;
                } else {
                    sy = py;
                }
                py = ey + sy >> 1;
            }
            ratio = py / ih;
            return ratio === 0 ? 1 : ratio;
        }

        function renderImageToDataURL(img, blob, options, doSquash) {
            var canvas = document.createElement("canvas"),
                mime = options.mime || "image/jpeg",
                promise = new Uploader.Promise();
            renderImageToCanvas(img, blob, canvas, options, doSquash).then(function() {
                promise.success(canvas.toDataURL(mime, options.quality || .8));
            });
            return promise;
        }

        function maybeCalculateDownsampledDimensions(spec) {
            var maxPixels = 5241e3;
            if (!Uploader.ios()) {
                throw new Uploader.Error("Downsampled dimensions can only be reliably calculated for iOS!");
            }
            if (spec.origHeight * spec.origWidth > maxPixels) {
                return {
                    newHeight: Math.round(Math.sqrt(maxPixels * (spec.origHeight / spec.origWidth))),
                    newWidth: Math.round(Math.sqrt(maxPixels * (spec.origWidth / spec.origHeight)))
                };
            }
        }

        function renderImageToCanvas(img, blob, canvas, options, doSquash) {
            var iw = img.naturalWidth,
                ih = img.naturalHeight,
                width = options.width,
                height = options.height,
                ctx = canvas.getContext("2d"),
                promise = new Uploader.Promise(),
                modifiedDimensions;
            ctx.save();
            if (options.resize) {
                return renderImageToCanvasWithCustomResizer({
                    blob: blob,
                    canvas: canvas,
                    image: img,
                    imageHeight: ih,
                    imageWidth: iw,
                    orientation: options.orientation,
                    resize: options.resize,
                    targetHeight: height,
                    targetWidth: width
                });
            }
            if (!Uploader.supportedFeatures.unlimitedScaledImageSize) {
                modifiedDimensions = maybeCalculateDownsampledDimensions({
                    origWidth: width,
                    origHeight: height
                });
                if (modifiedDimensions) {
                    Uploader.log(Uploader.format("Had to reduce dimensions due to device limitations from {}w / {}h to {}w / {}h", width, height, modifiedDimensions.newWidth, modifiedDimensions.newHeight), "warn");
                    width = modifiedDimensions.newWidth;
                    height = modifiedDimensions.newHeight;
                }
            }
            transformCoordinate(canvas, width, height, options.orientation);
            if (Uploader.ios()) {
                (function() {
                    if (detectSubsampling(img)) {
                        iw /= 2;
                        ih /= 2;
                    }
                    var d = 1024,
                        tmpCanvas = document.createElement("canvas"),
                        vertSquashRatio = doSquash ? detectVerticalSquash(img, iw, ih) : 1,
                        dw = Math.ceil(d * width / iw),
                        dh = Math.ceil(d * height / ih / vertSquashRatio),
                        sy = 0,
                        dy = 0,
                        tmpCtx, sx, dx;
                    tmpCanvas.width = tmpCanvas.height = d;
                    tmpCtx = tmpCanvas.getContext("2d");
                    while (sy < ih) {
                        sx = 0;
                        dx = 0;
                        while (sx < iw) {
                            tmpCtx.clearRect(0, 0, d, d);
                            tmpCtx.drawImage(img, -sx, -sy);
                            ctx.drawImage(tmpCanvas, 0, 0, d, d, dx, dy, dw, dh);
                            sx += d;
                            dx += dw;
                        }
                        sy += d;
                        dy += dh;
                    }
                    ctx.restore();
                    tmpCanvas = tmpCtx = null;
                })();
            } else {
                ctx.drawImage(img, 0, 0, width, height);
            }
            canvas.qqImageRendered && canvas.qqImageRendered();
            promise.success();
            return promise;
        }

        function renderImageToCanvasWithCustomResizer(resizeInfo) {
            var blob = resizeInfo.blob,
                image = resizeInfo.image,
                imageHeight = resizeInfo.imageHeight,
                imageWidth = resizeInfo.imageWidth,
                orientation = resizeInfo.orientation,
                promise = new Uploader.Promise(),
                resize = resizeInfo.resize,
                sourceCanvas = document.createElement("canvas"),
                sourceCanvasContext = sourceCanvas.getContext("2d"),
                targetCanvas = resizeInfo.canvas,
                targetHeight = resizeInfo.targetHeight,
                targetWidth = resizeInfo.targetWidth;
            transformCoordinate(sourceCanvas, imageWidth, imageHeight, orientation);
            targetCanvas.height = targetHeight;
            targetCanvas.width = targetWidth;
            sourceCanvasContext.drawImage(image, 0, 0);
            resize({
                blob: blob,
                height: targetHeight,
                image: image,
                sourceCanvas: sourceCanvas,
                targetCanvas: targetCanvas,
                width: targetWidth
            }).then(function success() {
                targetCanvas.qqImageRendered && targetCanvas.qqImageRendered();
                promise.success();
            }, promise.failure);
            return promise;
        }

        function transformCoordinate(canvas, width, height, orientation) {
            switch (orientation) {
                case 5:
                case 6:
                case 7:
                case 8:
                    canvas.width = height;
                    canvas.height = width;
                    break;

                default:
                    canvas.width = width;
                    canvas.height = height;
            }
            var ctx = canvas.getContext("2d");
            switch (orientation) {
                case 2:
                    ctx.translate(width, 0);
                    ctx.scale(-1, 1);
                    break;

                case 3:
                    ctx.translate(width, height);
                    ctx.rotate(Math.PI);
                    break;

                case 4:
                    ctx.translate(0, height);
                    ctx.scale(1, -1);
                    break;

                case 5:
                    ctx.rotate(.5 * Math.PI);
                    ctx.scale(1, -1);
                    break;

                case 6:
                    ctx.rotate(.5 * Math.PI);
                    ctx.translate(0, -height);
                    break;

                case 7:
                    ctx.rotate(.5 * Math.PI);
                    ctx.translate(width, -height);
                    ctx.scale(-1, 1);
                    break;

                case 8:
                    ctx.rotate(-.5 * Math.PI);
                    ctx.translate(-width, 0);
                    break;

                default:
                    break;
            }
        }

        function MegaPixImage(srcImage, errorCallback) {
            var self = this;
            if (window.Blob && srcImage instanceof Blob) {
                (function() {
                    var img = new Image(),
                        URL = window.URL && window.URL.createObjectURL ? window.URL : window.webkitURL && window.webkitURL.createObjectURL ? window.webkitURL : null;
                    if (!URL) {
                        throw Error("No createObjectURL function found to create blob url");
                    }
                    img.src = URL.createObjectURL(srcImage);
                    self.blob = srcImage;
                    srcImage = img;
                })();
            }
            if (!srcImage.naturalWidth && !srcImage.naturalHeight) {
                srcImage.onload = function() {
                    var listeners = self.imageLoadListeners;
                    if (listeners) {
                        self.imageLoadListeners = null;
                        setTimeout(function() {
                            for (var i = 0, len = listeners.length; i < len; i++) {
                                listeners[i]();
                            }
                        }, 0);
                    }
                };
                srcImage.onerror = errorCallback;
                this.imageLoadListeners = [];
            }
            this.srcImage = srcImage;
        }
        MegaPixImage.prototype.render = function(target, options) {
            options = options || {};
            var self = this,
                imgWidth = this.srcImage.naturalWidth,
                imgHeight = this.srcImage.naturalHeight,
                width = options.width,
                height = options.height,
                maxWidth = options.maxWidth,
                maxHeight = options.maxHeight,
                doSquash = !this.blob || this.blob.type === "image/jpeg",
                tagName = target.tagName.toLowerCase(),
                opt;
            if (this.imageLoadListeners) {
                this.imageLoadListeners.push(function() {
                    self.render(target, options);
                });
                return;
            }
            if (width && !height) {
                height = imgHeight * width / imgWidth << 0;
            } else if (height && !width) {
                width = imgWidth * height / imgHeight << 0;
            } else {
                width = imgWidth;
                height = imgHeight;
            }
            if (maxWidth && width > maxWidth) {
                width = maxWidth;
                height = imgHeight * width / imgWidth << 0;
            }
            if (maxHeight && height > maxHeight) {
                height = maxHeight;
                width = imgWidth * height / imgHeight << 0;
            }
            opt = {
                width: width,
                height: height
            }, Uploader.each(options, function(optionsKey, optionsValue) {
                opt[optionsKey] = optionsValue;
            });
            if (tagName === "img") {
                (function() {
                    var oldTargetSrc = target.src;
                    renderImageToDataURL(self.srcImage, self.blob, opt, doSquash).then(function(dataUri) {
                        target.src = dataUri;
                        oldTargetSrc === target.src && target.onload();
                    });
                })();
            } else if (tagName === "canvas") {
                renderImageToCanvas(this.srcImage, this.blob, target, opt, doSquash);
            }
            if (typeof this.onrender === "function") {
                this.onrender(target);
            }
        };
        Uploader.MegaPixImage = MegaPixImage;
    })();
    Uploader.ImageGenerator = function(log) {
        "use strict";

        function isImg(el) {
            return el.tagName.toLowerCase() === "img";
        }

        function isCanvas(el) {
            return el.tagName.toLowerCase() === "canvas";
        }

        function isImgCorsSupported() {
            return new Image().crossOrigin !== undefined;
        }

        function isCanvasSupported() {
            var canvas = document.createElement("canvas");
            return canvas.getContext && canvas.getContext("2d");
        }

        function determineMimeOfFileName(nameWithPath) {
            var pathSegments = nameWithPath.split("/"),
                name = pathSegments[pathSegments.length - 1].split("?")[0],
                extension = Uploader.getExtension(name);
            extension = extension && extension.toLowerCase();
            switch (extension) {
                case "jpeg":
                case "jpg":
                    return "image/jpeg";

                case "png":
                    return "image/png";

                case "bmp":
                    return "image/bmp";

                case "gif":
                    return "image/gif";

                case "tiff":
                case "tif":
                    return "image/tiff";
            }
        }

        function isCrossOrigin(url) {
            var targetAnchor = document.createElement("a"),
                targetProtocol, targetHostname, targetPort;
            targetAnchor.href = url;
            targetProtocol = targetAnchor.protocol;
            targetPort = targetAnchor.port;
            targetHostname = targetAnchor.hostname;
            if (targetProtocol.toLowerCase() !== window.location.protocol.toLowerCase()) {
                return true;
            }
            if (targetHostname.toLowerCase() !== window.location.hostname.toLowerCase()) {
                return true;
            }
            if (targetPort !== window.location.port && !Uploader.ie()) {
                return true;
            }
            return false;
        }

        function registerImgLoadListeners(img, promise) {
            img.onload = function() {
                img.onload = null;
                img.onerror = null;
                promise.success(img);
            };
            img.onerror = function() {
                img.onload = null;
                img.onerror = null;
                log("Problem drawing thumbnail!", "error");
                promise.failure(img, "Problem drawing thumbnail!");
            };
        }

        function registerCanvasDrawImageListener(canvas, promise) {
            canvas.qqImageRendered = function() {
                promise.success(canvas);
            };
        }

        function registerThumbnailRenderedListener(imgOrCanvas, promise) {
            var registered = isImg(imgOrCanvas) || isCanvas(imgOrCanvas);
            if (isImg(imgOrCanvas)) {
                registerImgLoadListeners(imgOrCanvas, promise);
            } else if (isCanvas(imgOrCanvas)) {
                registerCanvasDrawImageListener(imgOrCanvas, promise);
            } else {
                promise.failure(imgOrCanvas);
                log(Uploader.format("Element container of type {} is not supported!", imgOrCanvas.tagName), "error");
            }
            return registered;
        }

        function draw(fileOrBlob, container, options) {
            var drawPreview = new Uploader.Promise(),
                identifier = new Uploader.Identify(fileOrBlob, log),
                maxSize = options.maxSize,
                orient = options.orient == null ? true : options.orient,
                megapixErrorHandler = function() {
                    container.onerror = null;
                    container.onload = null;
                    log("Could not render preview, file may be too large!", "error");
                    drawPreview.failure(container, "Browser cannot render image!");
                };
            identifier.isPreviewable().then(function(mime) {
                var dummyExif = {
                        parse: function() {
                            return new Uploader.Promise().success();
                        }
                    },
                    exif = orient ? new Uploader.Exif(fileOrBlob, log) : dummyExif,
                    mpImg = new Uploader.MegaPixImage(fileOrBlob, megapixErrorHandler);
                if (registerThumbnailRenderedListener(container, drawPreview)) {
                    exif.parse().then(function(exif) {
                        var orientation = exif && exif.Orientation;
                        mpImg.render(container, {
                            maxWidth: maxSize,
                            maxHeight: maxSize,
                            orientation: orientation,
                            mime: mime,
                            resize: options.customResizeFunction
                        });
                    }, function(failureMsg) {
                        log(Uploader.format("EXIF data could not be parsed ({}).  Assuming orientation = 1.", failureMsg));
                        mpImg.render(container, {
                            maxWidth: maxSize,
                            maxHeight: maxSize,
                            mime: mime,
                            resize: options.customResizeFunction
                        });
                    });
                }
            }, function() {
                log("Not previewable");
                drawPreview.failure(container, "Not previewable");
            });
            return drawPreview;
        }

        function drawOnCanvasOrImgFromUrl(url, canvasOrImg, draw, maxSize, customResizeFunction) {
            var tempImg = new Image(),
                tempImgRender = new Uploader.Promise();
            registerThumbnailRenderedListener(tempImg, tempImgRender);
            if (isCrossOrigin(url)) {
                tempImg.crossOrigin = "anonymous";
            }
            tempImg.src = url;
            tempImgRender.then(function rendered() {
                registerThumbnailRenderedListener(canvasOrImg, draw);
                var mpImg = new Uploader.MegaPixImage(tempImg);
                mpImg.render(canvasOrImg, {
                    maxWidth: maxSize,
                    maxHeight: maxSize,
                    mime: determineMimeOfFileName(url),
                    resize: customResizeFunction
                });
            }, draw.failure);
        }

        function drawOnImgFromUrlWithCssScaling(url, img, draw, maxSize) {
            registerThumbnailRenderedListener(img, draw);
            Uploader(img).css({
                maxWidth: maxSize + "px",
                maxHeight: maxSize + "px"
            });
            img.src = url;
        }

        function drawFromUrl(url, container, options) {
            var draw = new Uploader.Promise(),
                scale = options.scale,
                maxSize = scale ? options.maxSize : null;
            if (scale && isImg(container)) {
                if (isCanvasSupported()) {
                    if (isCrossOrigin(url) && !isImgCorsSupported()) {
                        drawOnImgFromUrlWithCssScaling(url, container, draw, maxSize);
                    } else {
                        drawOnCanvasOrImgFromUrl(url, container, draw, maxSize);
                    }
                } else {
                    drawOnImgFromUrlWithCssScaling(url, container, draw, maxSize);
                }
            } else if (isCanvas(container)) {
                drawOnCanvasOrImgFromUrl(url, container, draw, maxSize);
            } else if (registerThumbnailRenderedListener(container, draw)) {
                container.src = url;
            }
            return draw;
        }
        Uploader.extend(this, {
            generate: function(fileBlobOrUrl, container, options) {
                if (Uploader.isString(fileBlobOrUrl)) {
                    log("Attempting to update thumbnail based on server response.");
                    return drawFromUrl(fileBlobOrUrl, container, options || {});
                } else {
                    log("Attempting to draw client-side image preview.");
                    return draw(fileBlobOrUrl, container, options || {});
                }
            }
        });
        this._testing = {};
        this._testing.isImg = isImg;
        this._testing.isCanvas = isCanvas;
        this._testing.isCrossOrigin = isCrossOrigin;
        this._testing.determineMimeOfFileName = determineMimeOfFileName;
    };
    Uploader.Exif = function(fileOrBlob, log) {
        "use strict";
        var TAG_IDS = [274],
            TAG_INFO = {
                274: {
                    name: "Orientation",
                    bytes: 2
                }
            };

        function parseLittleEndian(hex) {
            var result = 0,
                pow = 0;
            while (hex.length > 0) {
                result += parseInt(hex.substring(0, 2), 16) * Math.pow(2, pow);
                hex = hex.substring(2, hex.length);
                pow += 8;
            }
            return result;
        }

        function seekToApp1(offset, promise) {
            var theOffset = offset,
                thePromise = promise;
            if (theOffset === undefined) {
                theOffset = 2;
                thePromise = new Uploader.Promise();
            }
            Uploader.readBlobToHex(fileOrBlob, theOffset, 4).then(function(hex) {
                var match = /^ffe([0-9])/.exec(hex),
                    segmentLength;
                if (match) {
                    if (match[1] !== "1") {
                        segmentLength = parseInt(hex.slice(4, 8), 16);
                        seekToApp1(theOffset + segmentLength + 2, thePromise);
                    } else {
                        thePromise.success(theOffset);
                    }
                } else {
                    thePromise.failure("No EXIF header to be found!");
                }
            });
            return thePromise;
        }

        function getApp1Offset() {
            var promise = new Uploader.Promise();
            Uploader.readBlobToHex(fileOrBlob, 0, 6).then(function(hex) {
                if (hex.indexOf("ffd8") !== 0) {
                    promise.failure("Not a valid JPEG!");
                } else {
                    seekToApp1().then(function(offset) {
                        promise.success(offset);
                    }, function(error) {
                        promise.failure(error);
                    });
                }
            });
            return promise;
        }

        function isLittleEndian(app1Start) {
            var promise = new Uploader.Promise();
            Uploader.readBlobToHex(fileOrBlob, app1Start + 10, 2).then(function(hex) {
                promise.success(hex === "4949");
            });
            return promise;
        }

        function getDirEntryCount(app1Start, littleEndian) {
            var promise = new Uploader.Promise();
            Uploader.readBlobToHex(fileOrBlob, app1Start + 18, 2).then(function(hex) {
                if (littleEndian) {
                    return promise.success(parseLittleEndian(hex));
                } else {
                    promise.success(parseInt(hex, 16));
                }
            });
            return promise;
        }

        function getIfd(app1Start, dirEntries) {
            var offset = app1Start + 20,
                bytes = dirEntries * 12;
            return Uploader.readBlobToHex(fileOrBlob, offset, bytes);
        }

        function getDirEntries(ifdHex) {
            var entries = [],
                offset = 0;
            while (offset + 24 <= ifdHex.length) {
                entries.push(ifdHex.slice(offset, offset + 24));
                offset += 24;
            }
            return entries;
        }

        function getTagValues(littleEndian, dirEntries) {
            var TAG_VAL_OFFSET = 16,
                tagsToFind = Uploader.extend([], TAG_IDS),
                vals = {};
            Uploader.each(dirEntries, function(idx, entry) {
                var idHex = entry.slice(0, 4),
                    id = littleEndian ? parseLittleEndian(idHex) : parseInt(idHex, 16),
                    tagsToFindIdx = tagsToFind.indexOf(id),
                    tagValHex, tagName, tagValLength;
                if (tagsToFindIdx >= 0) {
                    tagName = TAG_INFO[id].name;
                    tagValLength = TAG_INFO[id].bytes;
                    tagValHex = entry.slice(TAG_VAL_OFFSET, TAG_VAL_OFFSET + tagValLength * 2);
                    vals[tagName] = littleEndian ? parseLittleEndian(tagValHex) : parseInt(tagValHex, 16);
                    tagsToFind.splice(tagsToFindIdx, 1);
                }
                if (tagsToFind.length === 0) {
                    return false;
                }
            });
            return vals;
        }
        Uploader.extend(this, {
            parse: function() {
                var parser = new Uploader.Promise(),
                    onParseFailure = function(message) {
                        log(Uploader.format("EXIF header parse failed: '{}' ", message));
                        parser.failure(message);
                    };
                getApp1Offset().then(function(app1Offset) {
                    log(Uploader.format("Moving forward with EXIF header parsing for '{}'", fileOrBlob.name === undefined ? "blob" : fileOrBlob.name));
                    isLittleEndian(app1Offset).then(function(littleEndian) {
                        log(Uploader.format("EXIF Byte order is {} endian", littleEndian ? "little" : "big"));
                        getDirEntryCount(app1Offset, littleEndian).then(function(dirEntryCount) {
                            log(Uploader.format("Found {} APP1 directory entries", dirEntryCount));
                            getIfd(app1Offset, dirEntryCount).then(function(ifdHex) {
                                var dirEntries = getDirEntries(ifdHex),
                                    tagValues = getTagValues(littleEndian, dirEntries);
                                log("Successfully parsed some EXIF tags");
                                parser.success(tagValues);
                            }, onParseFailure);
                        }, onParseFailure);
                    }, onParseFailure);
                }, onParseFailure);
                return parser;
            }
        });
        this._testing = {};
        this._testing.parseLittleEndian = parseLittleEndian;
    };
    Uploader.Identify = function(fileOrBlob, log) {
        "use strict";

        function isIdentifiable(magicBytes, questionableBytes) {
            var identifiable = false,
                magicBytesEntries = [].concat(magicBytes);
            Uploader.each(magicBytesEntries, function(idx, magicBytesArrayEntry) {
                if (questionableBytes.indexOf(magicBytesArrayEntry) === 0) {
                    identifiable = true;
                    return false;
                }
            });
            return identifiable;
        }
        Uploader.extend(this, {
            isPreviewable: function() {
                var self = this,
                    identifier = new Uploader.Promise(),
                    previewable = false,
                    name = fileOrBlob.name === undefined ? "blob" : fileOrBlob.name;
                log(Uploader.format("Attempting to determine if {} can be rendered in this browser", name));
                log("First pass: check type attribute of blob object.");
                if (this.isPreviewableSync()) {
                    log("Second pass: check for magic bytes in file header.");
                    Uploader.readBlobToHex(fileOrBlob, 0, 4).then(function(hex) {
                        Uploader.each(self.PREVIEWABLE_MIME_TYPES, function(mime, bytes) {
                            if (isIdentifiable(bytes, hex)) {
                                if (mime !== "image/tiff" || Uploader.supportedFeatures.tiffPreviews) {
                                    previewable = true;
                                    identifier.success(mime);
                                }
                                return false;
                            }
                        });
                        log(Uploader.format("'{}' is {} able to be rendered in this browser", name, previewable ? "" : "NOT"));
                        if (!previewable) {
                            identifier.failure();
                        }
                    }, function() {
                        log("Error reading file w/ name '" + name + "'.  Not able to be rendered in this browser.");
                        identifier.failure();
                    });
                } else {
                    identifier.failure();
                }
                return identifier;
            },
            isPreviewableSync: function() {
                var fileMime = fileOrBlob.type,
                    isRecognizedImage = Uploader.indexOf(Object.keys(this.PREVIEWABLE_MIME_TYPES), fileMime) >= 0,
                    previewable = false,
                    name = fileOrBlob.name === undefined ? "blob" : fileOrBlob.name;
                if (isRecognizedImage) {
                    if (fileMime === "image/tiff") {
                        previewable = Uploader.supportedFeatures.tiffPreviews;
                    } else {
                        previewable = true;
                    }
                }!previewable && log(name + " is not previewable in this browser per the blob's type attr");
                return previewable;
            }
        });
    };
    Uploader.Identify.prototype.PREVIEWABLE_MIME_TYPES = {
        "image/jpeg": "ffd8ff",
        "image/gif": "474946",
        "image/png": "89504e",
        "image/bmp": "424d",
        "image/tiff": ["49492a00", "4d4d002a"]
    };
    Uploader.ImageValidation = function(blob, log) {
        "use strict";

        function hasNonZeroLimits(limits) {
            var atLeastOne = false;
            Uploader.each(limits, function(limit, value) {
                if (value > 0) {
                    atLeastOne = true;
                    return false;
                }
            });
            return atLeastOne;
        }

        function getWidthHeight() {
            var sizeDetermination = new Uploader.Promise();
            new Uploader.Identify(blob, log).isPreviewable().then(function() {
                var image = new Image(),
                    url = window.URL && window.URL.createObjectURL ? window.URL : window.webkitURL && window.webkitURL.createObjectURL ? window.webkitURL : null;
                if (url) {
                    image.onerror = function() {
                        log("Cannot determine dimensions for image.  May be too large.", "error");
                        sizeDetermination.failure();
                    };
                    image.onload = function() {
                        sizeDetermination.success({
                            width: this.width,
                            height: this.height
                        });
                    };
                    image.src = url.createObjectURL(blob);
                } else {
                    log("No createObjectURL function available to generate image URL!", "error");
                    sizeDetermination.failure();
                }
            }, sizeDetermination.failure);
            return sizeDetermination;
        }

        function getFailingLimit(limits, dimensions) {
            var failingLimit;
            Uploader.each(limits, function(limitName, limitValue) {
                if (limitValue > 0) {
                    var limitMatcher = /(max|min)(Width|Height)/.exec(limitName),
                        dimensionPropName = limitMatcher[2].charAt(0).toLowerCase() + limitMatcher[2].slice(1),
                        actualValue = dimensions[dimensionPropName];
                    switch (limitMatcher[1]) {
                        case "min":
                            if (actualValue < limitValue) {
                                failingLimit = limitName;
                                return false;
                            }
                            break;

                        case "max":
                            if (actualValue > limitValue) {
                                failingLimit = limitName;
                                return false;
                            }
                            break;
                    }
                }
            });
            return failingLimit;
        }
        this.validate = function(limits) {
            var validationEffort = new Uploader.Promise();
            log("Attempting to validate image.");
            if (hasNonZeroLimits(limits)) {
                getWidthHeight().then(function(dimensions) {
                    var failingLimit = getFailingLimit(limits, dimensions);
                    if (failingLimit) {
                        validationEffort.failure(failingLimit);
                    } else {
                        validationEffort.success();
                    }
                }, validationEffort.success);
            } else {
                validationEffort.success();
            }
            return validationEffort;
        };
    };
    Uploader.Session = function(spec) {
        "use strict";
        var options = {
            endpoint: null,
            params: {},
            customHeaders: {},
            cors: {},
            addFileRecord: function(sessionData) {},
            log: function(message, level) {}
        };
        Uploader.extend(options, spec, true);

        function isJsonResponseValid(response) {
            if (Uploader.isArray(response)) {
                return true;
            }
            options.log("Session response is not an array.", "error");
        }

        function handleFileItems(fileItems, success, xhrOrXdr, promise) {
            var someItemsIgnored = false;
            success = success && isJsonResponseValid(fileItems);
            if (success) {
                Uploader.each(fileItems, function(idx, fileItem) {
                    if (fileItem.uuid == null) {
                        someItemsIgnored = true;
                        options.log(Uploader.format("Session response item {} did not include a valid UUID - ignoring.", idx), "error");
                    } else if (fileItem.name == null) {
                        someItemsIgnored = true;
                        options.log(Uploader.format("Session response item {} did not include a valid name - ignoring.", idx), "error");
                    } else {
                        try {
                            options.addFileRecord(fileItem);
                            return true;
                        } catch (err) {
                            someItemsIgnored = true;
                            options.log(err.message, "error");
                        }
                    }
                    return false;
                });
            }
            promise[success && !someItemsIgnored ? "success" : "failure"](fileItems, xhrOrXdr);
        }
        this.refresh = function() {
            var refreshEffort = new Uploader.Promise(),
                refreshCompleteCallback = function(response, success, xhrOrXdr) {
                    handleFileItems(response, success, xhrOrXdr, refreshEffort);
                },
                requesterOptions = Uploader.extend({}, options),
                requester = new Uploader.SessionAjaxRequester(Uploader.extend(requesterOptions, {
                    onComplete: refreshCompleteCallback
                }));
            requester.queryServer();
            return refreshEffort;
        };
    };
    Uploader.SessionAjaxRequester = function(spec) {
        "use strict";
        var requester, options = {
            endpoint: null,
            customHeaders: {},
            params: {},
            cors: {
                expected: false,
                sendCredentials: false
            },
            onComplete: function(response, success, xhrOrXdr) {},
            log: function(str, level) {}
        };
        Uploader.extend(options, spec);

        function onComplete(id, xhrOrXdr, isError) {
            var response = null;
            if (xhrOrXdr.responseText != null) {
                try {
                    response = Uploader.parseJson(xhrOrXdr.responseText);
                } catch (err) {
                    options.log("Problem parsing session response: " + err.message, "error");
                    isError = true;
                }
            }
            options.onComplete(response, !isError, xhrOrXdr);
        }
        requester = Uploader.extend(this, new Uploader.AjaxRequester({
            acceptHeader: "application/json",
            validMethods: ["GET"],
            method: "GET",
            endpointStore: {
                get: function() {
                    return options.endpoint;
                }
            },
            customHeaders: options.customHeaders,
            log: options.log,
            onComplete: onComplete,
            cors: options.cors
        }));
        Uploader.extend(this, {
            queryServer: function() {
                var params = Uploader.extend({}, options.params);
                options.log("Session query request.");
                requester.initTransport("sessionRefresh").withParams(params).withCacheBuster().send();
            }
        });
    };
    Uploader.Scaler = function(spec, log) {
        "use strict";
        var self = this,
            customResizeFunction = spec.customResizer,
            includeOriginal = spec.sendOriginal,
            orient = spec.orient,
            defaultType = spec.defaultType,
            defaultQuality = spec.defaultQuality / 100,
            failedToScaleText = spec.failureText,
            includeExif = spec.includeExif,
            sizes = this._getSortedSizes(spec.sizes);
        Uploader.extend(this, {
            enabled: Uploader.supportedFeatures.scaling && sizes.length > 0,
            getFileRecords: function(originalFileUuid, originalFileName, originalBlobOrBlobData) {
                var self = this,
                    records = [],
                    originalBlob = originalBlobOrBlobData.blob ? originalBlobOrBlobData.blob : originalBlobOrBlobData,
                    identifier = new Uploader.Identify(originalBlob, log);
                if (identifier.isPreviewableSync()) {
                    Uploader.each(sizes, function(idx, sizeRecord) {
                        var outputType = self._determineOutputType({
                            defaultType: defaultType,
                            requestedType: sizeRecord.type,
                            refType: originalBlob.type
                        });
                        records.push({
                            uuid: Uploader.getUniqueId(),
                            name: self._getName(originalFileName, {
                                name: sizeRecord.name,
                                type: outputType,
                                refType: originalBlob.type
                            }),
                            blob: new Uploader.BlobProxy(originalBlob, Uploader.bind(self._generateScaledImage, self, {
                                customResizeFunction: customResizeFunction,
                                maxSize: sizeRecord.maxSize,
                                orient: orient,
                                type: outputType,
                                quality: defaultQuality,
                                failedText: failedToScaleText,
                                includeExif: includeExif,
                                log: log
                            }))
                        });
                    });
                    records.push({
                        uuid: originalFileUuid,
                        name: originalFileName,
                        size: originalBlob.size,
                        blob: includeOriginal ? originalBlob : null
                    });
                } else {
                    records.push({
                        uuid: originalFileUuid,
                        name: originalFileName,
                        size: originalBlob.size,
                        blob: originalBlob
                    });
                }
                return records;
            },
            handleNewFile: function(file, name, uuid, size, fileList, batchId, uuidParamName, api) {
                var self = this,
                    buttonId = file.qqButtonId || file.blob && file.blob.qqButtonId,
                    scaledIds = [],
                    originalId = null,
                    addFileToHandler = api.addFileToHandler,
                    uploadData = api.uploadData,
                    paramsStore = api.paramsStore,
                    proxyGroupId = Uploader.getUniqueId();
                Uploader.each(self.getFileRecords(uuid, name, file), function(idx, record) {
                    var blobSize = record.size,
                        id;
                    if (record.blob instanceof Uploader.BlobProxy) {
                        blobSize = -1;
                    }
                    id = uploadData.addFile({
                        uuid: record.uuid,
                        name: record.name,
                        size: blobSize,
                        batchId: batchId,
                        proxyGroupId: proxyGroupId
                    });
                    if (record.blob instanceof Uploader.BlobProxy) {
                        scaledIds.push(id);
                    } else {
                        originalId = id;
                    }
                    if (record.blob) {
                        addFileToHandler(id, record.blob);
                        fileList.push({
                            id: id,
                            file: record.blob
                        });
                    } else {
                        uploadData.setStatus(id, Uploader.status.REJECTED);
                    }
                });
                if (originalId !== null) {
                    Uploader.each(scaledIds, function(idx, scaledId) {
                        var params = {
                            qqparentuuid: uploadData.retrieve({
                                id: originalId
                            }).uuid,
                            qqparentsize: uploadData.retrieve({
                                id: originalId
                            }).size
                        };
                        params[uuidParamName] = uploadData.retrieve({
                            id: scaledId
                        }).uuid;
                        uploadData.setParentId(scaledId, originalId);
                        paramsStore.addReadOnly(scaledId, params);
                    });
                    if (scaledIds.length) {
                        (function() {
                            var param = {};
                            param[uuidParamName] = uploadData.retrieve({
                                id: originalId
                            }).uuid;
                            paramsStore.addReadOnly(originalId, param);
                        })();
                    }
                }
            }
        });
    };
    Uploader.extend(Uploader.Scaler.prototype, {
        scaleImage: function(id, specs, api) {
            "use strict";
            if (!Uploader.supportedFeatures.scaling) {
                throw new Uploader.Error("Scaling is not supported in this browser!");
            }
            var scalingEffort = new Uploader.Promise(),
                log = api.log,
                file = api.getFile(id),
                uploadData = api.uploadData.retrieve({
                    id: id
                }),
                name = uploadData && uploadData.name,
                uuid = uploadData && uploadData.uuid,
                scalingOptions = {
                    customResizer: specs.customResizer,
                    sendOriginal: false,
                    orient: specs.orient,
                    defaultType: specs.type || null,
                    defaultQuality: specs.quality,
                    failedToScaleText: "Unable to scale",
                    sizes: [{
                        name: "",
                        maxSize: specs.maxSize
                    }]
                },
                scaler = new Uploader.Scaler(scalingOptions, log);
            if (!Uploader.Scaler || !Uploader.supportedFeatures.imagePreviews || !file) {
                scalingEffort.failure();
                log("Could not generate requested scaled image for " + id + ".  " + "Scaling is either not possible in this browser, or the file could not be located.", "error");
            } else {
                Uploader.bind(function() {
                    var record = scaler.getFileRecords(uuid, name, file)[0];
                    if (record && record.blob instanceof Uploader.BlobProxy) {
                        record.blob.create().then(scalingEffort.success, scalingEffort.failure);
                    } else {
                        log(id + " is not a scalable image!", "error");
                        scalingEffort.failure();
                    }
                }, this)();
            }
            return scalingEffort;
        },
        _determineOutputType: function(spec) {
            "use strict";
            var requestedType = spec.requestedType,
                defaultType = spec.defaultType,
                referenceType = spec.refType;
            if (!defaultType && !requestedType) {
                if (referenceType !== "image/jpeg") {
                    return "image/png";
                }
                return referenceType;
            }
            if (!requestedType) {
                return defaultType;
            }
            if (Uploader.indexOf(Object.keys(Uploader.Identify.prototype.PREVIEWABLE_MIME_TYPES), requestedType) >= 0) {
                if (requestedType === "image/tiff") {
                    return Uploader.supportedFeatures.tiffPreviews ? requestedType : defaultType;
                }
                return requestedType;
            }
            return defaultType;
        },
        _getName: function(originalName, scaledVersionProperties) {
            "use strict";
            var startOfExt = originalName.lastIndexOf("."),
                versionType = scaledVersionProperties.type || "image/png",
                referenceType = scaledVersionProperties.refType,
                scaledName = "",
                scaledExt = Uploader.getExtension(originalName),
                nameAppendage = "";
            if (scaledVersionProperties.name && scaledVersionProperties.name.trim().length) {
                nameAppendage = " (" + scaledVersionProperties.name + ")";
            }
            if (startOfExt >= 0) {
                scaledName = originalName.substr(0, startOfExt);
                if (referenceType !== versionType) {
                    scaledExt = versionType.split("/")[1];
                }
                scaledName += nameAppendage + "." + scaledExt;
            } else {
                scaledName = originalName + nameAppendage;
            }
            return scaledName;
        },
        _getSortedSizes: function(sizes) {
            "use strict";
            sizes = Uploader.extend([], sizes);
            return sizes.sort(function(a, b) {
                if (a.maxSize > b.maxSize) {
                    return 1;
                }
                if (a.maxSize < b.maxSize) {
                    return -1;
                }
                return 0;
            });
        },
        _generateScaledImage: function(spec, sourceFile) {
            "use strict";
            var self = this,
                customResizeFunction = spec.customResizeFunction,
                log = spec.log,
                maxSize = spec.maxSize,
                orient = spec.orient,
                type = spec.type,
                quality = spec.quality,
                failedText = spec.failedText,
                includeExif = spec.includeExif && sourceFile.type === "image/jpeg" && type === "image/jpeg",
                scalingEffort = new Uploader.Promise(),
                imageGenerator = new Uploader.ImageGenerator(log),
                canvas = document.createElement("canvas");
            log("Attempting to generate scaled version for " + sourceFile.name);
            imageGenerator.generate(sourceFile, canvas, {
                maxSize: maxSize,
                orient: orient,
                customResizeFunction: customResizeFunction
            }).then(function() {
                var scaledImageDataUri = canvas.toDataURL(type, quality),
                    signalSuccess = function() {
                        log("Success generating scaled version for " + sourceFile.name);
                        var blob = Uploader.dataUriToBlob(scaledImageDataUri);
                        scalingEffort.success(blob);
                    };
                if (includeExif) {
                    self._insertExifHeader(sourceFile, scaledImageDataUri, log).then(function(scaledImageDataUriWithExif) {
                        scaledImageDataUri = scaledImageDataUriWithExif;
                        signalSuccess();
                    }, function() {
                        log("Problem inserting EXIF header into scaled image.  Using scaled image w/out EXIF data.", "error");
                        signalSuccess();
                    });
                } else {
                    signalSuccess();
                }
            }, function() {
                log("Failed attempt to generate scaled version for " + sourceFile.name, "error");
                scalingEffort.failure(failedText);
            });
            return scalingEffort;
        },
        _insertExifHeader: function(originalImage, scaledImageDataUri, log) {
            "use strict";
            var reader = new FileReader(),
                insertionEffort = new Uploader.Promise(),
                originalImageDataUri = "";
            reader.onload = function() {
                originalImageDataUri = reader.result;
                insertionEffort.success(Uploader.ExifRestorer.restore(originalImageDataUri, scaledImageDataUri));
            };
            reader.onerror = function() {
                log("Problem reading " + originalImage.name + " during attempt to transfer EXIF data to scaled version.", "error");
                insertionEffort.failure();
            };
            reader.readAsDataURL(originalImage);
            return insertionEffort;
        },
        _dataUriToBlob: function(dataUri) {
            "use strict";
            var byteString, mimeString, arrayBuffer, intArray;
            if (dataUri.split(",")[0].indexOf("base64") >= 0) {
                byteString = atob(dataUri.split(",")[1]);
            } else {
                byteString = decodeURI(dataUri.split(",")[1]);
            }
            mimeString = dataUri.split(",")[0].split(":")[1].split(";")[0];
            arrayBuffer = new ArrayBuffer(byteString.length);
            intArray = new Uint8Array(arrayBuffer);
            Uploader.each(byteString, function(idx, character) {
                intArray[idx] = character.charCodeAt(0);
            });
            return this._createBlob(arrayBuffer, mimeString);
        },
        _createBlob: function(data, mime) {
            "use strict";
            var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder,
                blobBuilder = BlobBuilder && new BlobBuilder();
            if (blobBuilder) {
                blobBuilder.append(data);
                return blobBuilder.getBlob(mime);
            } else {
                return new Blob([data], {
                    type: mime
                });
            }
        }
    });
    Uploader.ExifRestorer = function() {
        var ExifRestorer = {};
        ExifRestorer.KEY_STR = "ABCDEFGHIJKLMNOP" + "QRSTUVWXYZabcdef" + "ghijklmnopqrstuv" + "wxyz0123456789+/" + "=";
        ExifRestorer.encode64 = function(input) {
            var output = "",
                chr1, chr2, chr3 = "",
                enc1, enc2, enc3, enc4 = "",
                i = 0;
            do {
                chr1 = input[i++];
                chr2 = input[i++];
                chr3 = input[i++];
                enc1 = chr1 >> 2;
                enc2 = (chr1 & 3) << 4 | chr2 >> 4;
                enc3 = (chr2 & 15) << 2 | chr3 >> 6;
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output + this.KEY_STR.charAt(enc1) + this.KEY_STR.charAt(enc2) + this.KEY_STR.charAt(enc3) + this.KEY_STR.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);
            return output;
        };
        ExifRestorer.restore = function(origFileBase64, resizedFileBase64) {
            var expectedBase64Header = "data:image/jpeg;base64,";
            if (!origFileBase64.match(expectedBase64Header)) {
                return resizedFileBase64;
            }
            var rawImage = this.decode64(origFileBase64.replace(expectedBase64Header, ""));
            var segments = this.slice2Segments(rawImage);
            var image = this.exifManipulation(resizedFileBase64, segments);
            return expectedBase64Header + this.encode64(image);
        };
        ExifRestorer.exifManipulation = function(resizedFileBase64, segments) {
            var exifArray = this.getExifArray(segments),
                newImageArray = this.insertExif(resizedFileBase64, exifArray),
                aBuffer = new Uint8Array(newImageArray);
            return aBuffer;
        };
        ExifRestorer.getExifArray = function(segments) {
            var seg;
            for (var x = 0; x < segments.length; x++) {
                seg = segments[x];
                if (seg[0] == 255 & seg[1] == 225) {
                    return seg;
                }
            }
            return [];
        };
        ExifRestorer.insertExif = function(resizedFileBase64, exifArray) {
            var imageData = resizedFileBase64.replace("data:image/jpeg;base64,", ""),
                buf = this.decode64(imageData),
                separatePoint = buf.indexOf(255, 3),
                mae = buf.slice(0, separatePoint),
                ato = buf.slice(separatePoint),
                array = mae;
            array = array.concat(exifArray);
            array = array.concat(ato);
            return array;
        };
        ExifRestorer.slice2Segments = function(rawImageArray) {
            var head = 0,
                segments = [];
            while (1) {
                if (rawImageArray[head] == 255 & rawImageArray[head + 1] == 218) {
                    break;
                }
                if (rawImageArray[head] == 255 & rawImageArray[head + 1] == 216) {
                    head += 2;
                } else {
                    var length = rawImageArray[head + 2] * 256 + rawImageArray[head + 3],
                        endPoint = head + length + 2,
                        seg = rawImageArray.slice(head, endPoint);
                    segments.push(seg);
                    head = endPoint;
                }
                if (head > rawImageArray.length) {
                    break;
                }
            }
            return segments;
        };
        ExifRestorer.decode64 = function(input) {
            var output = "",
                chr1, chr2, chr3 = "",
                enc1, enc2, enc3, enc4 = "",
                i = 0,
                buf = [];
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                throw new Error("There were invalid base64 characters in the input text.  " + "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            do {
                enc1 = this.KEY_STR.indexOf(input.charAt(i++));
                enc2 = this.KEY_STR.indexOf(input.charAt(i++));
                enc3 = this.KEY_STR.indexOf(input.charAt(i++));
                enc4 = this.KEY_STR.indexOf(input.charAt(i++));
                chr1 = enc1 << 2 | enc2 >> 4;
                chr2 = (enc2 & 15) << 4 | enc3 >> 2;
                chr3 = (enc3 & 3) << 6 | enc4;
                buf.push(chr1);
                if (enc3 != 64) {
                    buf.push(chr2);
                }
                if (enc4 != 64) {
                    buf.push(chr3);
                }
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);
            return buf;
        };
        return ExifRestorer;
    }();
    Uploader.TotalProgress = function(callback, getSize) {
        "use strict";
        var perFileProgress = {},
            totalLoaded = 0,
            totalSize = 0,
            lastLoadedSent = -1,
            lastTotalSent = -1,
            callbackProxy = function(loaded, total) {
                if (loaded !== lastLoadedSent || total !== lastTotalSent) {
                    callback(loaded, total);
                }
                lastLoadedSent = loaded;
                lastTotalSent = total;
            },
            noRetryableFiles = function(failed, retryable) {
                var none = true;
                Uploader.each(failed, function(idx, failedId) {
                    if (Uploader.indexOf(retryable, failedId) >= 0) {
                        none = false;
                        return false;
                    }
                });
                return none;
            },
            onCancel = function(id) {
                updateTotalProgress(id, -1, -1);
                delete perFileProgress[id];
            },
            onAllComplete = function(successful, failed, retryable) {
                if (failed.length === 0 || noRetryableFiles(failed, retryable)) {
                    callbackProxy(totalSize, totalSize);
                    this.reset();
                }
            },
            onNew = function(id) {
                var size = getSize(id);
                if (size > 0) {
                    updateTotalProgress(id, 0, size);
                    perFileProgress[id] = {
                        loaded: 0,
                        total: size
                    };
                }
            },
            updateTotalProgress = function(id, newLoaded, newTotal) {
                var oldLoaded = perFileProgress[id] ? perFileProgress[id].loaded : 0,
                    oldTotal = perFileProgress[id] ? perFileProgress[id].total : 0;
                if (newLoaded === -1 && newTotal === -1) {
                    totalLoaded -= oldLoaded;
                    totalSize -= oldTotal;
                } else {
                    if (newLoaded) {
                        totalLoaded += newLoaded - oldLoaded;
                    }
                    if (newTotal) {
                        totalSize += newTotal - oldTotal;
                    }
                }
                callbackProxy(totalLoaded, totalSize);
            };
        Uploader.extend(this, {
            onAllComplete: onAllComplete,
            onStatusChange: function(id, oldStatus, newStatus) {
                if (newStatus === Uploader.status.CANCELED || newStatus === Uploader.status.REJECTED) {
                    onCancel(id);
                } else if (newStatus === Uploader.status.SUBMITTING) {
                    onNew(id);
                }
            },
            onIndividualProgress: function(id, loaded, total) {
                updateTotalProgress(id, loaded, total);
                perFileProgress[id] = {
                    loaded: loaded,
                    total: total
                };
            },
            onNewSize: function(id) {
                onNew(id);
            },
            reset: function() {
                perFileProgress = {};
                totalLoaded = 0;
                totalSize = 0;
            }
        });
    };
    Uploader.PasteSupport = function(o) {
        "use strict";
        var options, detachPasteHandler;
        options = {
            targetElement: null,
            callbacks: {
                log: function(message, level) {},
                pasteReceived: function(blob) {}
            }
        };

        function isImage(item) {
            return item.type && item.type.indexOf("image/") === 0;
        }

        function registerPasteHandler() {
            detachPasteHandler = Uploader(options.targetElement).attach("paste", function(event) {
                var clipboardData = event.clipboardData;
                if (clipboardData) {
                    Uploader.each(clipboardData.items, function(idx, item) {
                        if (isImage(item)) {
                            var blob = item.getAsFile();
                            options.callbacks.pasteReceived(blob);
                        }
                    });
                }
            });
        }

        function unregisterPasteHandler() {
            if (detachPasteHandler) {
                detachPasteHandler();
            }
        }
        Uploader.extend(options, o);
        registerPasteHandler();
        Uploader.extend(this, {
            reset: function() {
                unregisterPasteHandler();
            }
        });
    };
    Uploader.FormSupport = function(options, startUpload, log) {
        "use strict";
        var self = this,
            interceptSubmit = options.interceptSubmit,
            formEl = options.element,
            autoUpload = options.autoUpload;
        Uploader.extend(this, {
            newEndpoint: null,
            newAutoUpload: autoUpload,
            attachedToForm: false,
            getFormInputsAsObject: function() {
                if (formEl == null) {
                    return null;
                }
                return self._form2Obj(formEl);
            }
        });

        function determineNewEndpoint(formEl) {
            if (formEl.getAttribute("action")) {
                self.newEndpoint = formEl.getAttribute("action");
            }
        }

        function validateForm(formEl, nativeSubmit) {
            if (formEl.checkValidity && !formEl.checkValidity()) {
                log("Form did not pass validation checks - will not upload.", "error");
                nativeSubmit();
            } else {
                return true;
            }
        }

        function maybeUploadOnSubmit(formEl) {
            var nativeSubmit = formEl.submit;
            Uploader(formEl).attach("submit", function(event) {
                event = event || window.event;
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
                validateForm(formEl, nativeSubmit) && startUpload();
            });
            formEl.submit = function() {
                validateForm(formEl, nativeSubmit) && startUpload();
            };
        }

        function determineFormEl(formEl) {
            if (formEl) {
                if (Uploader.isString(formEl)) {
                    formEl = document.getElementById(formEl);
                }
                if (formEl) {
                    log("Attaching to form element.");
                    determineNewEndpoint(formEl);
                    interceptSubmit && maybeUploadOnSubmit(formEl);
                }
            }
            return formEl;
        }
        formEl = determineFormEl(formEl);
        this.attachedToForm = !!formEl;
    };
    Uploader.extend(Uploader.FormSupport.prototype, {
        _form2Obj: function(form) {
            "use strict";
            var obj = {},
                notIrrelevantType = function(type) {
                    var irrelevantTypes = ["button", "image", "reset", "submit"];
                    return Uploader.indexOf(irrelevantTypes, type.toLowerCase()) < 0;
                },
                radioOrCheckbox = function(type) {
                    return Uploader.indexOf(["checkbox", "radio"], type.toLowerCase()) >= 0;
                },
                ignoreValue = function(el) {
                    if (radioOrCheckbox(el.type) && !el.checked) {
                        return true;
                    }
                    return el.disabled && el.type.toLowerCase() !== "hidden";
                },
                selectValue = function(select) {
                    var value = null;
                    Uploader.each(Uploader(select).children(), function(idx, child) {
                        if (child.tagName.toLowerCase() === "option" && child.selected) {
                            value = child.value;
                            return false;
                        }
                    });
                    return value;
                };
            Uploader.each(form.elements, function(idx, el) {
                if ((Uploader.isInput(el, true) || el.tagName.toLowerCase() === "textarea") && notIrrelevantType(el.type) && !ignoreValue(el)) {
                    obj[el.name] = el.value;
                } else if (el.tagName.toLowerCase() === "select" && !ignoreValue(el)) {
                    var value = selectValue(el);
                    if (value !== null) {
                        obj[el.name] = value;
                    }
                }
            });
            return obj;
        }
    });
    Uploader.CryptoJS = function(Math, undefined) {
        var C = {};
        var C_lib = C.lib = {};
        var Base = C_lib.Base = function() {
            function F() {}
            return {
                extend: function(overrides) {
                    F.prototype = this;
                    var subtype = new F();
                    if (overrides) {
                        subtype.mixIn(overrides);
                    }
                    if (!subtype.hasOwnProperty("init")) {
                        subtype.init = function() {
                            subtype.$super.init.apply(this, arguments);
                        };
                    }
                    subtype.init.prototype = subtype;
                    subtype.$super = this;
                    return subtype;
                },
                create: function() {
                    var instance = this.extend();
                    instance.init.apply(instance, arguments);
                    return instance;
                },
                init: function() {},
                mixIn: function(properties) {
                    for (var propertyName in properties) {
                        if (properties.hasOwnProperty(propertyName)) {
                            this[propertyName] = properties[propertyName];
                        }
                    }
                    if (properties.hasOwnProperty("toString")) {
                        this.toString = properties.toString;
                    }
                },
                clone: function() {
                    return this.init.prototype.extend(this);
                }
            };
        }();
        var WordArray = C_lib.WordArray = Base.extend({
            init: function(words, sigBytes) {
                words = this.words = words || [];
                if (sigBytes != undefined) {
                    this.sigBytes = sigBytes;
                } else {
                    this.sigBytes = words.length * 4;
                }
            },
            toString: function(encoder) {
                return (encoder || Hex).stringify(this);
            },
            concat: function(wordArray) {
                var thisWords = this.words;
                var thatWords = wordArray.words;
                var thisSigBytes = this.sigBytes;
                var thatSigBytes = wordArray.sigBytes;
                this.clamp();
                if (thisSigBytes % 4) {
                    for (var i = 0; i < thatSigBytes; i++) {
                        var thatByte = thatWords[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                        thisWords[thisSigBytes + i >>> 2] |= thatByte << 24 - (thisSigBytes + i) % 4 * 8;
                    }
                } else if (thatWords.length > 65535) {
                    for (var i = 0; i < thatSigBytes; i += 4) {
                        thisWords[thisSigBytes + i >>> 2] = thatWords[i >>> 2];
                    }
                } else {
                    thisWords.push.apply(thisWords, thatWords);
                }
                this.sigBytes += thatSigBytes;
                return this;
            },
            clamp: function() {
                var words = this.words;
                var sigBytes = this.sigBytes;
                words[sigBytes >>> 2] &= 4294967295 << 32 - sigBytes % 4 * 8;
                words.length = Math.ceil(sigBytes / 4);
            },
            clone: function() {
                var clone = Base.clone.call(this);
                clone.words = this.words.slice(0);
                return clone;
            },
            random: function(nBytes) {
                var words = [];
                for (var i = 0; i < nBytes; i += 4) {
                    words.push(Math.random() * 4294967296 | 0);
                }
                return new WordArray.init(words, nBytes);
            }
        });
        var C_enc = C.enc = {};
        var Hex = C_enc.Hex = {
            stringify: function(wordArray) {
                var words = wordArray.words;
                var sigBytes = wordArray.sigBytes;
                var hexChars = [];
                for (var i = 0; i < sigBytes; i++) {
                    var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                    hexChars.push((bite >>> 4).toString(16));
                    hexChars.push((bite & 15).toString(16));
                }
                return hexChars.join("");
            },
            parse: function(hexStr) {
                var hexStrLength = hexStr.length;
                var words = [];
                for (var i = 0; i < hexStrLength; i += 2) {
                    words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << 24 - i % 8 * 4;
                }
                return new WordArray.init(words, hexStrLength / 2);
            }
        };
        var Latin1 = C_enc.Latin1 = {
            stringify: function(wordArray) {
                var words = wordArray.words;
                var sigBytes = wordArray.sigBytes;
                var latin1Chars = [];
                for (var i = 0; i < sigBytes; i++) {
                    var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                    latin1Chars.push(String.fromCharCode(bite));
                }
                return latin1Chars.join("");
            },
            parse: function(latin1Str) {
                var latin1StrLength = latin1Str.length;
                var words = [];
                for (var i = 0; i < latin1StrLength; i++) {
                    words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
                }
                return new WordArray.init(words, latin1StrLength);
            }
        };
        var Utf8 = C_enc.Utf8 = {
            stringify: function(wordArray) {
                try {
                    return decodeURIComponent(escape(Latin1.stringify(wordArray)));
                } catch (e) {
                    throw new Error("Malformed UTF-8 data");
                }
            },
            parse: function(utf8Str) {
                return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
            }
        };
        var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
            reset: function() {
                this._data = new WordArray.init();
                this._nDataBytes = 0;
            },
            _append: function(data) {
                if (typeof data == "string") {
                    data = Utf8.parse(data);
                }
                this._data.concat(data);
                this._nDataBytes += data.sigBytes;
            },
            _process: function(doFlush) {
                var data = this._data;
                var dataWords = data.words;
                var dataSigBytes = data.sigBytes;
                var blockSize = this.blockSize;
                var blockSizeBytes = blockSize * 4;
                var nBlocksReady = dataSigBytes / blockSizeBytes;
                if (doFlush) {
                    nBlocksReady = Math.ceil(nBlocksReady);
                } else {
                    nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
                }
                var nWordsReady = nBlocksReady * blockSize;
                var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);
                if (nWordsReady) {
                    for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                        this._doProcessBlock(dataWords, offset);
                    }
                    var processedWords = dataWords.splice(0, nWordsReady);
                    data.sigBytes -= nBytesReady;
                }
                return new WordArray.init(processedWords, nBytesReady);
            },
            clone: function() {
                var clone = Base.clone.call(this);
                clone._data = this._data.clone();
                return clone;
            },
            _minBufferSize: 0
        });
        var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
            cfg: Base.extend(),
            init: function(cfg) {
                this.cfg = this.cfg.extend(cfg);
                this.reset();
            },
            reset: function() {
                BufferedBlockAlgorithm.reset.call(this);
                this._doReset();
            },
            update: function(messageUpdate) {
                this._append(messageUpdate);
                this._process();
                return this;
            },
            finalize: function(messageUpdate) {
                if (messageUpdate) {
                    this._append(messageUpdate);
                }
                var hash = this._doFinalize();
                return hash;
            },
            blockSize: 512 / 32,
            _createHelper: function(hasher) {
                return function(message, cfg) {
                    return new hasher.init(cfg).finalize(message);
                };
            },
            _createHmacHelper: function(hasher) {
                return function(message, key) {
                    return new C_algo.HMAC.init(hasher, key).finalize(message);
                };
            }
        });
        var C_algo = C.algo = {};
        return C;
    }(Math);
    (function() {
        var C = Uploader.CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var C_enc = C.enc;
        var Base64 = C_enc.Base64 = {
            stringify: function(wordArray) {
                var words = wordArray.words;
                var sigBytes = wordArray.sigBytes;
                var map = this._map;
                wordArray.clamp();
                var base64Chars = [];
                for (var i = 0; i < sigBytes; i += 3) {
                    var byte1 = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                    var byte2 = words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
                    var byte3 = words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
                    var triplet = byte1 << 16 | byte2 << 8 | byte3;
                    for (var j = 0; j < 4 && i + j * .75 < sigBytes; j++) {
                        base64Chars.push(map.charAt(triplet >>> 6 * (3 - j) & 63));
                    }
                }
                var paddingChar = map.charAt(64);
                if (paddingChar) {
                    while (base64Chars.length % 4) {
                        base64Chars.push(paddingChar);
                    }
                }
                return base64Chars.join("");
            },
            parse: function(base64Str) {
                var base64StrLength = base64Str.length;
                var map = this._map;
                var paddingChar = map.charAt(64);
                if (paddingChar) {
                    var paddingIndex = base64Str.indexOf(paddingChar);
                    if (paddingIndex != -1) {
                        base64StrLength = paddingIndex;
                    }
                }
                var words = [];
                var nBytes = 0;
                for (var i = 0; i < base64StrLength; i++) {
                    if (i % 4) {
                        var bits1 = map.indexOf(base64Str.charAt(i - 1)) << i % 4 * 2;
                        var bits2 = map.indexOf(base64Str.charAt(i)) >>> 6 - i % 4 * 2;
                        words[nBytes >>> 2] |= (bits1 | bits2) << 24 - nBytes % 4 * 8;
                        nBytes++;
                    }
                }
                return WordArray.create(words, nBytes);
            },
            _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
        };
    })();
    (function() {
        var C = Uploader.CryptoJS;
        var C_lib = C.lib;
        var Base = C_lib.Base;
        var C_enc = C.enc;
        var Utf8 = C_enc.Utf8;
        var C_algo = C.algo;
        var HMAC = C_algo.HMAC = Base.extend({
            init: function(hasher, key) {
                hasher = this._hasher = new hasher.init();
                if (typeof key == "string") {
                    key = Utf8.parse(key);
                }
                var hasherBlockSize = hasher.blockSize;
                var hasherBlockSizeBytes = hasherBlockSize * 4;
                if (key.sigBytes > hasherBlockSizeBytes) {
                    key = hasher.finalize(key);
                }
                key.clamp();
                var oKey = this._oKey = key.clone();
                var iKey = this._iKey = key.clone();
                var oKeyWords = oKey.words;
                var iKeyWords = iKey.words;
                for (var i = 0; i < hasherBlockSize; i++) {
                    oKeyWords[i] ^= 1549556828;
                    iKeyWords[i] ^= 909522486;
                }
                oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;
                this.reset();
            },
            reset: function() {
                var hasher = this._hasher;
                hasher.reset();
                hasher.update(this._iKey);
            },
            update: function(messageUpdate) {
                this._hasher.update(messageUpdate);
                return this;
            },
            finalize: function(messageUpdate) {
                var hasher = this._hasher;
                var innerHash = hasher.finalize(messageUpdate);
                hasher.reset();
                var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));
                return hmac;
            }
        });
    })();
    (function() {
        var C = Uploader.CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_algo = C.algo;
        var W = [];
        var SHA1 = C_algo.SHA1 = Hasher.extend({
            _doReset: function() {
                this._hash = new WordArray.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
            },
            _doProcessBlock: function(M, offset) {
                var H = this._hash.words;
                var a = H[0];
                var b = H[1];
                var c = H[2];
                var d = H[3];
                var e = H[4];
                for (var i = 0; i < 80; i++) {
                    if (i < 16) {
                        W[i] = M[offset + i] | 0;
                    } else {
                        var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
                        W[i] = n << 1 | n >>> 31;
                    }
                    var t = (a << 5 | a >>> 27) + e + W[i];
                    if (i < 20) {
                        t += (b & c | ~b & d) + 1518500249;
                    } else if (i < 40) {
                        t += (b ^ c ^ d) + 1859775393;
                    } else if (i < 60) {
                        t += (b & c | b & d | c & d) - 1894007588;
                    } else {
                        t += (b ^ c ^ d) - 899497514;
                    }
                    e = d;
                    d = c;
                    c = b << 30 | b >>> 2;
                    b = a;
                    a = t;
                }
                H[0] = H[0] + a | 0;
                H[1] = H[1] + b | 0;
                H[2] = H[2] + c | 0;
                H[3] = H[3] + d | 0;
                H[4] = H[4] + e | 0;
            },
            _doFinalize: function() {
                var data = this._data;
                var dataWords = data.words;
                var nBitsTotal = this._nDataBytes * 8;
                var nBitsLeft = data.sigBytes * 8;
                dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
                dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(nBitsTotal / 4294967296);
                dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
                data.sigBytes = dataWords.length * 4;
                this._process();
                return this._hash;
            },
            clone: function() {
                var clone = Hasher.clone.call(this);
                clone._hash = this._hash.clone();
                return clone;
            }
        });
        C.SHA1 = Hasher._createHelper(SHA1);
        C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
    })();
    (function(Math) {
        var C = Uploader.CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_algo = C.algo;
        var H = [];
        var K = [];
        (function() {
            function isPrime(n) {
                var sqrtN = Math.sqrt(n);
                for (var factor = 2; factor <= sqrtN; factor++) {
                    if (!(n % factor)) {
                        return false;
                    }
                }
                return true;
            }

            function getFractionalBits(n) {
                return (n - (n | 0)) * 4294967296 | 0;
            }
            var n = 2;
            var nPrime = 0;
            while (nPrime < 64) {
                if (isPrime(n)) {
                    if (nPrime < 8) {
                        H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
                    }
                    K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));
                    nPrime++;
                }
                n++;
            }
        })();
        var W = [];
        var SHA256 = C_algo.SHA256 = Hasher.extend({
            _doReset: function() {
                this._hash = new WordArray.init(H.slice(0));
            },
            _doProcessBlock: function(M, offset) {
                var H = this._hash.words;
                var a = H[0];
                var b = H[1];
                var c = H[2];
                var d = H[3];
                var e = H[4];
                var f = H[5];
                var g = H[6];
                var h = H[7];
                for (var i = 0; i < 64; i++) {
                    if (i < 16) {
                        W[i] = M[offset + i] | 0;
                    } else {
                        var gamma0x = W[i - 15];
                        var gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
                        var gamma1x = W[i - 2];
                        var gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
                        W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
                    }
                    var ch = e & f ^ ~e & g;
                    var maj = a & b ^ a & c ^ b & c;
                    var sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
                    var sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
                    var t1 = h + sigma1 + ch + K[i] + W[i];
                    var t2 = sigma0 + maj;
                    h = g;
                    g = f;
                    f = e;
                    e = d + t1 | 0;
                    d = c;
                    c = b;
                    b = a;
                    a = t1 + t2 | 0;
                }
                H[0] = H[0] + a | 0;
                H[1] = H[1] + b | 0;
                H[2] = H[2] + c | 0;
                H[3] = H[3] + d | 0;
                H[4] = H[4] + e | 0;
                H[5] = H[5] + f | 0;
                H[6] = H[6] + g | 0;
                H[7] = H[7] + h | 0;
            },
            _doFinalize: function() {
                var data = this._data;
                var dataWords = data.words;
                var nBitsTotal = this._nDataBytes * 8;
                var nBitsLeft = data.sigBytes * 8;
                dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
                dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(nBitsTotal / 4294967296);
                dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
                data.sigBytes = dataWords.length * 4;
                this._process();
                return this._hash;
            },
            clone: function() {
                var clone = Hasher.clone.call(this);
                clone._hash = this._hash.clone();
                return clone;
            }
        });
        C.SHA256 = Hasher._createHelper(SHA256);
        C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
    })(Math);
    (function() {
        if (typeof ArrayBuffer != "function") {
            return;
        }
        var C = Uploader.CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var superInit = WordArray.init;
        var subInit = WordArray.init = function(typedArray) {
            if (typedArray instanceof ArrayBuffer) {
                typedArray = new Uint8Array(typedArray);
            }
            if (typedArray instanceof Int8Array || typedArray instanceof Uint8ClampedArray || typedArray instanceof Int16Array || typedArray instanceof Uint16Array || typedArray instanceof Int32Array || typedArray instanceof Uint32Array || typedArray instanceof Float32Array || typedArray instanceof Float64Array) {
                typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
            }
            if (typedArray instanceof Uint8Array) {
                var typedArrayByteLength = typedArray.byteLength;
                var words = [];
                for (var i = 0; i < typedArrayByteLength; i++) {
                    words[i >>> 2] |= typedArray[i] << 24 - i % 4 * 8;
                }
                superInit.call(this, words, typedArrayByteLength);
            } else {
                superInit.apply(this, arguments);
            }
        };
        subInit.prototype = WordArray;
    })();
    Uploader.s3 = Uploader.s3 || {};
    Uploader.s3.util = Uploader.s3.util || function() {
        "use strict";
        return {
            ALGORITHM_PARAM_NAME: "x-amz-algorithm",
            AWS_PARAM_PREFIX: "x-amz-meta-",
            CREDENTIAL_PARAM_NAME: "x-amz-credential",
            DATE_PARAM_NAME: "x-amz-date",
            REDUCED_REDUNDANCY_PARAM_NAME: "x-amz-storage-class",
            REDUCED_REDUNDANCY_PARAM_VALUE: "REDUCED_REDUNDANCY",
            SERVER_SIDE_ENCRYPTION_PARAM_NAME: "x-amz-server-side-encryption",
            SERVER_SIDE_ENCRYPTION_PARAM_VALUE: "AES256",
            SESSION_TOKEN_PARAM_NAME: "x-amz-security-token",
            V4_ALGORITHM_PARAM_VALUE: "AWS4-HMAC-SHA256",
            V4_SIGNATURE_PARAM_NAME: "x-amz-signature",
            CASE_SENSITIVE_PARAM_NAMES: ["Cache-Control", "Content-Disposition", "Content-Encoding", "Content-MD5"],
            UNSIGNABLE_REST_HEADER_NAMES: ["Cache-Control", "Content-Disposition", "Content-Encoding", "Content-MD5"],
            UNPREFIXED_PARAM_NAMES: ["Cache-Control", "Content-Disposition", "Content-Encoding", "Content-MD5", "x-amz-server-side-encryption", "x-amz-server-side-encryption-aws-kms-key-id", "x-amz-server-side-encryption-customer-algorithm", "x-amz-server-side-encryption-customer-key", "x-amz-server-side-encryption-customer-key-MD5"],
            getBucket: function(endpoint) {
                var patterns = [/^(?:https?:\/\/)?([a-z0-9.\-_]+)\.s3(?:-[a-z0-9\-]+)?\.amazonaws\.com/i, /^(?:https?:\/\/)?s3(?:-[a-z0-9\-]+)?\.amazonaws\.com\/([a-z0-9.\-_]+)/i, /^(?:https?:\/\/)?([a-z0-9.\-_]+)/i],
                    bucket;
                Uploader.each(patterns, function(idx, pattern) {
                    var match = pattern.exec(endpoint);
                    if (match) {
                        bucket = match[1];
                        return false;
                    }
                });
                return bucket;
            },
            _getPrefixedParamName: function(name) {
                if (Uploader.indexOf(Uploader.s3.util.UNPREFIXED_PARAM_NAMES, name) >= 0) {
                    return name;
                }
                return Uploader.s3.util.AWS_PARAM_PREFIX + name;
            },
            getPolicy: function(spec) {
                var policy = {},
                    conditions = [],
                    bucket = spec.bucket,
                    date = spec.date,
                    drift = spec.clockDrift,
                    key = spec.key,
                    accessKey = spec.accessKey,
                    acl = spec.acl,
                    type = spec.type,
                    expectedStatus = spec.expectedStatus,
                    sessionToken = spec.sessionToken,
                    params = spec.params,
                    successRedirectUrl = Uploader.s3.util.getSuccessRedirectAbsoluteUrl(spec.successRedirectUrl),
                    minFileSize = spec.minFileSize,
                    maxFileSize = spec.maxFileSize,
                    reducedRedundancy = spec.reducedRedundancy,
                    region = spec.region,
                    serverSideEncryption = spec.serverSideEncryption,
                    signatureVersion = spec.signatureVersion;
                policy.expiration = Uploader.s3.util.getPolicyExpirationDate(date, drift);
                conditions.push({
                    acl: acl
                });
                conditions.push({
                    bucket: bucket
                });
                if (type) {
                    conditions.push({
                        "Content-Type": type
                    });
                }
                if (expectedStatus) {
                    conditions.push({
                        success_action_status: expectedStatus.toString()
                    });
                }
                if (successRedirectUrl) {
                    conditions.push({
                        success_action_redirect: successRedirectUrl
                    });
                }
                if (reducedRedundancy) {
                    conditions.push({});
                    conditions[conditions.length - 1][Uploader.s3.util.REDUCED_REDUNDANCY_PARAM_NAME] = Uploader.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE;
                }
                if (sessionToken) {
                    conditions.push({});
                    conditions[conditions.length - 1][Uploader.s3.util.SESSION_TOKEN_PARAM_NAME] = sessionToken;
                }
                if (serverSideEncryption) {
                    conditions.push({});
                    conditions[conditions.length - 1][Uploader.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME] = Uploader.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE;
                }
                if (signatureVersion === 2) {
                    conditions.push({
                        key: key
                    });
                } else if (signatureVersion === 4) {
                    conditions.push({});
                    conditions[conditions.length - 1][Uploader.s3.util.ALGORITHM_PARAM_NAME] = Uploader.s3.util.V4_ALGORITHM_PARAM_VALUE;
                    conditions.push({});
                    conditions[conditions.length - 1].key = key;
                    conditions.push({});
                    conditions[conditions.length - 1][Uploader.s3.util.CREDENTIAL_PARAM_NAME] = Uploader.s3.util.getV4CredentialsString({
                        date: date,
                        key: accessKey,
                        region: region
                    });
                    conditions.push({});
                    conditions[conditions.length - 1][Uploader.s3.util.DATE_PARAM_NAME] = Uploader.s3.util.getV4PolicyDate(date, drift);
                }
                Uploader.each(params, function(name, val) {
                    var awsParamName = Uploader.s3.util._getPrefixedParamName(name),
                        param = {};
                    if (Uploader.indexOf(Uploader.s3.util.UNPREFIXED_PARAM_NAMES, awsParamName) >= 0) {
                        param[awsParamName] = val;
                    } else {
                        param[awsParamName] = encodeURIComponent(val);
                    }
                    conditions.push(param);
                });
                policy.conditions = conditions;
                Uploader.s3.util.enforceSizeLimits(policy, minFileSize, maxFileSize);
                return policy;
            },
            refreshPolicyCredentials: function(policy, newSessionToken) {
                var sessionTokenFound = false;
                Uploader.each(policy.conditions, function(oldCondIdx, oldCondObj) {
                    Uploader.each(oldCondObj, function(oldCondName, oldCondVal) {
                        if (oldCondName === Uploader.s3.util.SESSION_TOKEN_PARAM_NAME) {
                            oldCondObj[oldCondName] = newSessionToken;
                            sessionTokenFound = true;
                        }
                    });
                });
                if (!sessionTokenFound) {
                    policy.conditions.push({});
                    policy.conditions[policy.conditions.length - 1][Uploader.s3.util.SESSION_TOKEN_PARAM_NAME] = newSessionToken;
                }
            },
            generateAwsParams: function(spec, signPolicyCallback) {
                var awsParams = {},
                    customParams = spec.params,
                    promise = new Uploader.Promise(),
                    sessionToken = spec.sessionToken,
                    drift = spec.clockDrift,
                    type = spec.type,
                    key = spec.key,
                    accessKey = spec.accessKey,
                    acl = spec.acl,
                    expectedStatus = spec.expectedStatus,
                    successRedirectUrl = Uploader.s3.util.getSuccessRedirectAbsoluteUrl(spec.successRedirectUrl),
                    reducedRedundancy = spec.reducedRedundancy,
                    region = spec.region,
                    serverSideEncryption = spec.serverSideEncryption,
                    signatureVersion = spec.signatureVersion,
                    now = new Date(),
                    log = spec.log,
                    policyJson;
                spec.date = now;
                policyJson = Uploader.s3.util.getPolicy(spec);
                awsParams.key = key;
                if (type) {
                    awsParams["Content-Type"] = type;
                }
                if (expectedStatus) {
                    awsParams.success_action_status = expectedStatus;
                }
                if (successRedirectUrl) {
                    awsParams.success_action_redirect = successRedirectUrl;
                }
                if (reducedRedundancy) {
                    awsParams[Uploader.s3.util.REDUCED_REDUNDANCY_PARAM_NAME] = Uploader.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE;
                }
                if (serverSideEncryption) {
                    awsParams[Uploader.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME] = Uploader.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE;
                }
                if (sessionToken) {
                    awsParams[Uploader.s3.util.SESSION_TOKEN_PARAM_NAME] = sessionToken;
                }
                awsParams.acl = acl;
                Uploader.each(customParams, function(name, val) {
                    var awsParamName = Uploader.s3.util._getPrefixedParamName(name);
                    if (Uploader.indexOf(Uploader.s3.util.UNPREFIXED_PARAM_NAMES, awsParamName) >= 0) {
                        awsParams[awsParamName] = val;
                    } else {
                        awsParams[awsParamName] = encodeURIComponent(val);
                    }
                });
                if (signatureVersion === 2) {
                    awsParams.AWSAccessKeyId = accessKey;
                } else if (signatureVersion === 4) {
                    awsParams[Uploader.s3.util.ALGORITHM_PARAM_NAME] = Uploader.s3.util.V4_ALGORITHM_PARAM_VALUE;
                    awsParams[Uploader.s3.util.CREDENTIAL_PARAM_NAME] = Uploader.s3.util.getV4CredentialsString({
                        date: now,
                        key: accessKey,
                        region: region
                    });
                    awsParams[Uploader.s3.util.DATE_PARAM_NAME] = Uploader.s3.util.getV4PolicyDate(now, drift);
                }
                signPolicyCallback(policyJson).then(function(policyAndSignature, updatedAccessKey, updatedSessionToken) {
                    awsParams.policy = policyAndSignature.policy;
                    if (spec.signatureVersion === 2) {
                        awsParams.signature = policyAndSignature.signature;
                        if (updatedAccessKey) {
                            awsParams.AWSAccessKeyId = updatedAccessKey;
                        }
                    } else if (spec.signatureVersion === 4) {
                        awsParams[Uploader.s3.util.V4_SIGNATURE_PARAM_NAME] = policyAndSignature.signature;
                    }
                    if (updatedSessionToken) {
                        awsParams[Uploader.s3.util.SESSION_TOKEN_PARAM_NAME] = updatedSessionToken;
                    }
                    promise.success(awsParams);
                }, function(errorMessage) {
                    errorMessage = errorMessage || "Can't continue further with request to S3 as we did not receive " + "a valid signature and policy from the server.";
                    log("Policy signing failed.  " + errorMessage, "error");
                    promise.failure(errorMessage);
                });
                return promise;
            },
            enforceSizeLimits: function(policy, minSize, maxSize) {
                var adjustedMinSize = minSize < 0 ? 0 : minSize,
                    adjustedMaxSize = maxSize <= 0 ? 9007199254740992 : maxSize;
                if (minSize > 0 || maxSize > 0) {
                    policy.conditions.push(["content-length-range", adjustedMinSize.toString(), adjustedMaxSize.toString()]);
                }
            },
            getPolicyExpirationDate: function(date, drift) {
                var adjustedDate = new Date(date.getTime() + drift);
                return Uploader.s3.util.getPolicyDate(adjustedDate, 5);
            },
            getCredentialsDate: function(date) {
                return date.getUTCFullYear() + "" + ("0" + (date.getUTCMonth() + 1)).slice(-2) + ("0" + date.getUTCDate()).slice(-2);
            },
            getPolicyDate: function(date, _minutesToAdd_) {
                var minutesToAdd = _minutesToAdd_ || 0,
                    pad, r;
                date.setMinutes(date.getMinutes() + (minutesToAdd || 0));
                if (Date.prototype.toISOString) {
                    return date.toISOString();
                } else {
                    pad = function(number) {
                        r = String(number);
                        if (r.length === 1) {
                            r = "0" + r;
                        }
                        return r;
                    };
                    return date.getUTCFullYear() + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate()) + "T" + pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":" + pad(date.getUTCSeconds()) + "." + String((date.getUTCMilliseconds() / 1e3).toFixed(3)).slice(2, 5) + "Z";
                }
            },
            parseIframeResponse: function(iframe) {
                var doc = iframe.contentDocument || iframe.contentWindow.document,
                    queryString = doc.location.search,
                    match = /bucket=(.+)&key=(.+)&etag=(.+)/.exec(queryString);
                if (match) {
                    return {
                        bucket: match[1],
                        key: match[2],
                        etag: match[3].replace(/%22/g, "")
                    };
                }
            },
            getSuccessRedirectAbsoluteUrl: function(successRedirectUrl) {
                if (successRedirectUrl) {
                    var targetAnchorContainer = document.createElement("div"),
                        targetAnchor;
                    if (Uploader.ie7()) {
                        targetAnchorContainer.innerHTML = "<a href='" + successRedirectUrl + "'></a>";
                        targetAnchor = targetAnchorContainer.firstChild;
                        return targetAnchor.href;
                    } else {
                        targetAnchor = document.createElement("a");
                        targetAnchor.href = successRedirectUrl;
                        targetAnchor.href = targetAnchor.href;
                        return targetAnchor.href;
                    }
                }
            },
            getV4CredentialsString: function(spec) {
                return spec.key + "/" + Uploader.s3.util.getCredentialsDate(spec.date) + "/" + spec.region + "/s3/aws4_request";
            },
            getV4PolicyDate: function(date, drift) {
                var adjustedDate = new Date(date.getTime() + drift);
                return Uploader.s3.util.getCredentialsDate(adjustedDate) + "T" + ("0" + adjustedDate.getUTCHours()).slice(-2) + ("0" + adjustedDate.getUTCMinutes()).slice(-2) + ("0" + adjustedDate.getUTCSeconds()).slice(-2) + "Z";
            },
            encodeQueryStringParam: function(param) {
                var percentEncoded = encodeURIComponent(param);
                percentEncoded = percentEncoded.replace(/[!'()]/g, escape);
                percentEncoded = percentEncoded.replace(/\*/g, "%2A");
                return percentEncoded.replace(/%20/g, "+");
            },
            uriEscape: function(string) {
                var output = encodeURIComponent(string);
                output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);
                output = output.replace(/[*]/g, function(ch) {
                    return "%" + ch.charCodeAt(0).toString(16).toUpperCase();
                });
                return output;
            },
            uriEscapePath: function(path) {
                var parts = [];
                Uploader.each(path.split("/"), function(idx, item) {
                    parts.push(Uploader.s3.util.uriEscape(item));
                });
                return parts.join("/");
            }
        };
    }();
    (function() {
        "use strict";
        Uploader.nonTraditionalBasePublicApi = {
            setUploadSuccessParams: function(params, id) {
                this._uploadSuccessParamsStore.set(params, id);
            },
            setUploadSuccessEndpoint: function(endpoint, id) {
                this._uploadSuccessEndpointStore.set(endpoint, id);
            }
        };
        Uploader.nonTraditionalBasePrivateApi = {
            _onComplete: function(id, name, result, xhr) {
                var success = result.success ? true : false,
                    self = this,
                    onCompleteArgs = arguments,
                    successEndpoint = this._uploadSuccessEndpointStore.get(id),
                    successCustomHeaders = this._options.uploadSuccess.customHeaders,
                    successMethod = this._options.uploadSuccess.method,
                    cors = this._options.cors,
                    promise = new Uploader.Promise(),
                    uploadSuccessParams = this._uploadSuccessParamsStore.get(id),
                    fileParams = this._paramsStore.get(id),
                    onSuccessFromServer = function(successRequestResult) {
                        delete self._failedSuccessRequestCallbacks[id];
                        Uploader.extend(result, successRequestResult);
                        Uploader.UploaderBasic.prototype._onComplete.apply(self, onCompleteArgs);
                        promise.success(successRequestResult);
                    },
                    onFailureFromServer = function(successRequestResult) {
                        var callback = submitSuccessRequest;
                        Uploader.extend(result, successRequestResult);
                        if (result && result.reset) {
                            callback = null;
                        }
                        if (!callback) {
                            delete self._failedSuccessRequestCallbacks[id];
                        } else {
                            self._failedSuccessRequestCallbacks[id] = callback;
                        }
                        if (!self._onAutoRetry(id, name, result, xhr, callback)) {
                            Uploader.UploaderBasic.prototype._onComplete.apply(self, onCompleteArgs);
                            promise.failure(successRequestResult);
                        }
                    },
                    submitSuccessRequest, successAjaxRequester;
                if (success && successEndpoint) {
                    successAjaxRequester = new Uploader.UploadSuccessAjaxRequester({
                        endpoint: successEndpoint,
                        method: successMethod,
                        customHeaders: successCustomHeaders,
                        cors: cors,
                        log: Uploader.bind(this.log, this)
                    });
                    Uploader.extend(uploadSuccessParams, self._getEndpointSpecificParams(id, result, xhr), true);
                    fileParams && Uploader.extend(uploadSuccessParams, fileParams, true);
                    submitSuccessRequest = Uploader.bind(function() {
                        successAjaxRequester.sendSuccessRequest(id, uploadSuccessParams).then(onSuccessFromServer, onFailureFromServer);
                    }, self);
                    submitSuccessRequest();
                    return promise;
                }
                return Uploader.UploaderBasic.prototype._onComplete.apply(this, arguments);
            },
            _manualRetry: function(id) {
                var successRequestCallback = this._failedSuccessRequestCallbacks[id];
                return Uploader.UploaderBasic.prototype._manualRetry.call(this, id, successRequestCallback);
            }
        };
    })();
    (function() {
        "use strict";
        Uploader.s3.UploaderBasic = function(o) {
            var options = {
                request: {
                    accessKey: null,
                    clockDrift: 0
                },
                objectProperties: {
                    acl: "private",
                    bucket: Uploader.bind(function(id) {
                        return Uploader.s3.util.getBucket(this.getEndpoint(id));
                    }, this),
                    host: Uploader.bind(function(id) {
                        return /(?:http|https):\/\/(.+)(?:\/.+)?/.exec(this._endpointStore.get(id))[1];
                    }, this),
                    key: "uuid",
                    reducedRedundancy: false,
                    region: "us-east-1",
                    serverSideEncryption: false
                },
                credentials: {
                    accessKey: null,
                    secretKey: null,
                    expiration: null,
                    sessionToken: null
                },
                signature: {
                    customHeaders: {},
                    endpoint: null,
                    version: 2
                },
                uploadSuccess: {
                    endpoint: null,
                    method: "POST",
                    params: {},
                    customHeaders: {}
                },
                iframeSupport: {
                    localBlankPagePath: null
                },
                chunking: {
                    partSize: 5242880
                },
                cors: {
                    allowXdr: true
                },
                callbacks: {
                    onCredentialsExpired: function() {}
                }
            };
            Uploader.extend(options, o, true);
            if (!this.setCredentials(options.credentials, true)) {
                this._currentCredentials.accessKey = options.request.accessKey;
            }
            this._aclStore = this._createStore(options.objectProperties.acl);
            Uploader.UploaderBasic.call(this, options);
            this._uploadSuccessParamsStore = this._createStore(this._options.uploadSuccess.params);
            this._uploadSuccessEndpointStore = this._createStore(this._options.uploadSuccess.endpoint);
            this._failedSuccessRequestCallbacks = {};
            this._cannedKeys = {};
            this._cannedBuckets = {};
            this._buckets = {};
            this._hosts = {};
        };
        Uploader.extend(Uploader.s3.UploaderBasic.prototype, Uploader.basePublicApi);
        Uploader.extend(Uploader.s3.UploaderBasic.prototype, Uploader.basePrivateApi);
        Uploader.extend(Uploader.s3.UploaderBasic.prototype, Uploader.nonTraditionalBasePublicApi);
        Uploader.extend(Uploader.s3.UploaderBasic.prototype, Uploader.nonTraditionalBasePrivateApi);
        Uploader.extend(Uploader.s3.UploaderBasic.prototype, {
            getBucket: function(id) {
                if (this._cannedBuckets[id] == null) {
                    return this._buckets[id];
                }
                return this._cannedBuckets[id];
            },
            getKey: function(id) {
                if (this._cannedKeys[id] == null) {
                    return this._handler.getThirdPartyFileId(id);
                }
                return this._cannedKeys[id];
            },
            reset: function() {
                Uploader.UploaderBasic.prototype.reset.call(this);
                this._failedSuccessRequestCallbacks = [];
                this._buckets = {};
                this._hosts = {};
            },
            setCredentials: function(credentials, ignoreEmpty) {
                if (credentials && credentials.secretKey) {
                    if (!credentials.accessKey) {
                        throw new Uploader.Error("Invalid credentials: no accessKey");
                    } else if (!credentials.expiration) {
                        throw new Uploader.Error("Invalid credentials: no expiration");
                    } else {
                        this._currentCredentials = Uploader.extend({}, credentials);
                        if (Uploader.isString(credentials.expiration)) {
                            this._currentCredentials.expiration = new Date(credentials.expiration);
                        }
                    }
                    return true;
                } else if (!ignoreEmpty) {
                    throw new Uploader.Error("Invalid credentials parameter!");
                } else {
                    this._currentCredentials = {};
                }
            },
            setAcl: function(acl, id) {
                this._aclStore.set(acl, id);
            },
            _createUploadHandler: function() {
                var self = this,
                    additionalOptions = {
                        aclStore: this._aclStore,
                        getBucket: Uploader.bind(this._determineBucket, this),
                        getHost: Uploader.bind(this._determineHost, this),
                        getKeyName: Uploader.bind(this._determineKeyName, this),
                        iframeSupport: this._options.iframeSupport,
                        objectProperties: this._options.objectProperties,
                        signature: this._options.signature,
                        clockDrift: this._options.request.clockDrift,
                        validation: {
                            minSizeLimit: this._options.validation.minSizeLimit,
                            maxSizeLimit: this._options.validation.sizeLimit
                        }
                    };
                Uploader.override(this._endpointStore, function(super_) {
                    return {
                        get: function(id) {
                            var endpoint = super_.get(id);
                            if (endpoint.indexOf("http") < 0) {
                                return "http://" + endpoint;
                            }
                            return endpoint;
                        }
                    };
                });
                Uploader.override(this._paramsStore, function(super_) {
                    return {
                        get: function(id) {
                            var oldParams = super_.get(id),
                                modifiedParams = {};
                            Uploader.each(oldParams, function(name, val) {
                                var paramName = name;
                                if (Uploader.indexOf(Uploader.s3.util.CASE_SENSITIVE_PARAM_NAMES, paramName) < 0) {
                                    paramName = paramName.toLowerCase();
                                }
                                modifiedParams[paramName] = Uploader.isFunction(val) ? val() : val;
                            });
                            return modifiedParams;
                        }
                    };
                });
                additionalOptions.signature.credentialsProvider = {
                    get: function() {
                        return self._currentCredentials;
                    },
                    onExpired: function() {
                        var updateCredentials = new Uploader.Promise(),
                            callbackRetVal = self._options.callbacks.onCredentialsExpired();
                        if (Uploader.isGenericPromise(callbackRetVal)) {
                            callbackRetVal.then(function(credentials) {
                                try {
                                    self.setCredentials(credentials);
                                    updateCredentials.success();
                                } catch (error) {
                                    self.log("Invalid credentials returned from onCredentialsExpired callback! (" + error.message + ")", "error");
                                    updateCredentials.failure("onCredentialsExpired did not return valid credentials.");
                                }
                            }, function(errorMsg) {
                                self.log("onCredentialsExpired callback indicated failure! (" + errorMsg + ")", "error");
                                updateCredentials.failure("onCredentialsExpired callback failed.");
                            });
                        } else {
                            self.log("onCredentialsExpired callback did not return a promise!", "error");
                            updateCredentials.failure("Unexpected return value for onCredentialsExpired.");
                        }
                        return updateCredentials;
                    }
                };
                return Uploader.UploaderBasic.prototype._createUploadHandler.call(this, additionalOptions, "s3");
            },
            _determineObjectPropertyValue: function(id, property) {
                var maybe = this._options.objectProperties[property],
                    promise = new Uploader.Promise(),
                    self = this;
                if (Uploader.isFunction(maybe)) {
                    maybe = maybe(id);
                    if (Uploader.isGenericPromise(maybe)) {
                        promise = maybe;
                    } else {
                        promise.success(maybe);
                    }
                } else if (Uploader.isString(maybe)) {
                    promise.success(maybe);
                }
                promise.then(function success(value) {
                    self["_" + property + "s"][id] = value;
                }, function failure(errorMsg) {
                    Uploader.log("Problem determining " + property + " for ID " + id + " (" + errorMsg + ")", "error");
                });
                return promise;
            },
            _determineBucket: function(id) {
                return this._determineObjectPropertyValue(id, "bucket");
            },
            _determineHost: function(id) {
                return this._determineObjectPropertyValue(id, "host");
            },
            _determineKeyName: function(id, filename) {
                var promise = new Uploader.Promise(),
                    keynameLogic = this._options.objectProperties.key,
                    extension = Uploader.getExtension(filename),
                    onGetKeynameFailure = promise.failure,
                    onGetKeynameSuccess = function(keyname, extension) {
                        var keynameToUse = keyname;
                        if (extension !== undefined) {
                            keynameToUse += "." + extension;
                        }
                        promise.success(keynameToUse);
                    };
                switch (keynameLogic) {
                    case "uuid":
                        onGetKeynameSuccess(this.getUuid(id), extension);
                        break;

                    case "filename":
                        onGetKeynameSuccess(filename);
                        break;

                    default:
                        if (Uploader.isFunction(keynameLogic)) {
                            this._handleKeynameFunction(keynameLogic, id, onGetKeynameSuccess, onGetKeynameFailure);
                        } else {
                            this.log(keynameLogic + " is not a valid value for the s3.keyname option!", "error");
                            onGetKeynameFailure();
                        }
                }
                return promise;
            },
            _handleKeynameFunction: function(keynameFunc, id, successCallback, failureCallback) {
                var self = this,
                    onSuccess = function(keyname) {
                        successCallback(keyname);
                    },
                    onFailure = function(reason) {
                        self.log(Uploader.format("Failed to retrieve key name for {}.  Reason: {}", id, reason || "null"), "error");
                        failureCallback(reason);
                    },
                    keyname = keynameFunc.call(this, id);
                if (Uploader.isGenericPromise(keyname)) {
                    keyname.then(onSuccess, onFailure);
                } else if (keyname == null) {
                    onFailure();
                } else {
                    onSuccess(keyname);
                }
            },
            _getEndpointSpecificParams: function(id, response, maybeXhr) {
                var params = {
                    key: this.getKey(id),
                    uuid: this.getUuid(id),
                    name: this.getName(id),
                    bucket: this.getBucket(id)
                };
                if (maybeXhr && maybeXhr.getResponseHeader("ETag")) {
                    params.etag = maybeXhr.getResponseHeader("ETag");
                } else if (response.etag) {
                    params.etag = response.etag;
                }
                return params;
            },
            _onSubmitDelete: function(id, onSuccessCallback) {
                var additionalMandatedParams = {
                    key: this.getKey(id),
                    bucket: this.getBucket(id)
                };
                return Uploader.UploaderBasic.prototype._onSubmitDelete.call(this, id, onSuccessCallback, additionalMandatedParams);
            },
            _addCannedFile: function(sessionData) {
                var id;
                if (sessionData.s3Key == null) {
                    throw new Uploader.Error("Did not find s3Key property in server session response.  This is required!");
                } else {
                    id = Uploader.UploaderBasic.prototype._addCannedFile.apply(this, arguments);
                    this._cannedKeys[id] = sessionData.s3Key;
                    this._cannedBuckets[id] = sessionData.s3Bucket;
                }
                return id;
            }
        });
    })();
    if (!window.Uint8ClampedArray) {
        window.Uint8ClampedArray = function() {};
    }
    Uploader.s3.RequestSigner = function(o) {
        "use strict";
        var requester, thisSignatureRequester = this,
            pendingSignatures = {},
            options = {
                expectingPolicy: false,
                method: "POST",
                signatureSpec: {
                    drift: 0,
                    credentialsProvider: {},
                    endpoint: null,
                    customHeaders: {},
                    version: 2
                },
                maxConnections: 3,
                endpointStore: {},
                paramsStore: {},
                cors: {
                    expected: false,
                    sendCredentials: false
                },
                log: function(str, level) {}
            },
            credentialsProvider, generateHeaders = function(signatureConstructor, signature, promise) {
                var headers = signatureConstructor.getHeaders();
                if (options.signatureSpec.version === 4) {
                    headers.Authorization = Uploader.s3.util.V4_ALGORITHM_PARAM_VALUE + " Credential=" + options.signatureSpec.credentialsProvider.get().accessKey + "/" + Uploader.s3.util.getCredentialsDate(signatureConstructor.getRequestDate()) + "/" + options.signatureSpec.region + "/" + "s3/aws4_request," + "SignedHeaders=" + signatureConstructor.getSignedHeaders() + "," + "Signature=" + signature;
                } else {
                    headers.Authorization = "AWS " + options.signatureSpec.credentialsProvider.get().accessKey + ":" + signature;
                }
                promise.success(headers, signatureConstructor.getEndOfUrl());
            },
            v2 = {
                getStringToSign: function(signatureSpec) {
                    return Uploader.format("{}\n{}\n{}\n\n{}/{}/{}", signatureSpec.method, signatureSpec.contentMd5 || "", signatureSpec.contentType || "", signatureSpec.headersStr || "\n", signatureSpec.bucket, signatureSpec.endOfUrl);
                },
                signApiRequest: function(signatureConstructor, headersStr, signatureEffort) {
                    var headersWordArray = Uploader.CryptoJS.enc.Utf8.parse(headersStr),
                        headersHmacSha1 = Uploader.CryptoJS.HmacSHA1(headersWordArray, credentialsProvider.get().secretKey),
                        headersHmacSha1Base64 = Uploader.CryptoJS.enc.Base64.stringify(headersHmacSha1);
                    generateHeaders(signatureConstructor, headersHmacSha1Base64, signatureEffort);
                },
                signPolicy: function(policy, signatureEffort, updatedAccessKey, updatedSessionToken) {
                    var policyStr = JSON.stringify(policy),
                        policyWordArray = Uploader.CryptoJS.enc.Utf8.parse(policyStr),
                        base64Policy = Uploader.CryptoJS.enc.Base64.stringify(policyWordArray),
                        policyHmacSha1 = Uploader.CryptoJS.HmacSHA1(base64Policy, credentialsProvider.get().secretKey),
                        policyHmacSha1Base64 = Uploader.CryptoJS.enc.Base64.stringify(policyHmacSha1);
                    signatureEffort.success({
                        policy: base64Policy,
                        signature: policyHmacSha1Base64
                    }, updatedAccessKey, updatedSessionToken);
                }
            },
            v4 = {
                getCanonicalQueryString: function(endOfUri) {
                    var queryParamIdx = endOfUri.indexOf("?"),
                        canonicalQueryString = "",
                        encodedQueryParams, encodedQueryParamNames, queryStrings;
                    if (queryParamIdx >= 0) {
                        encodedQueryParams = {};
                        queryStrings = endOfUri.substr(queryParamIdx + 1).split("&");
                        Uploader.each(queryStrings, function(idx, queryString) {
                            var nameAndVal = queryString.split("="),
                                paramVal = nameAndVal[1];
                            if (paramVal == null) {
                                paramVal = "";
                            }
                            encodedQueryParams[encodeURIComponent(nameAndVal[0])] = encodeURIComponent(paramVal);
                        });
                        encodedQueryParamNames = Object.keys(encodedQueryParams).sort();
                        encodedQueryParamNames.forEach(function(encodedQueryParamName, idx) {
                            canonicalQueryString += encodedQueryParamName + "=" + encodedQueryParams[encodedQueryParamName];
                            if (idx < encodedQueryParamNames.length - 1) {
                                canonicalQueryString += "&";
                            }
                        });
                    }
                    return canonicalQueryString;
                },
                getCanonicalRequest: function(signatureSpec) {
                    return Uploader.format("{}\n{}\n{}\n{}\n{}\n{}", signatureSpec.method, v4.getCanonicalUri(signatureSpec.endOfUrl), v4.getCanonicalQueryString(signatureSpec.endOfUrl), signatureSpec.headersStr || "\n", v4.getSignedHeaders(signatureSpec.headerNames), signatureSpec.hashedContent);
                },
                getCanonicalUri: function(endOfUri) {
                    var path = endOfUri,
                        queryParamIdx = endOfUri.indexOf("?");
                    if (queryParamIdx > 0) {
                        path = endOfUri.substr(0, queryParamIdx);
                    }
                    return "/" + path;
                },
                getEncodedHashedPayload: function(body) {
                    var promise = new Uploader.Promise(),
                        reader;
                    if (Uploader.isBlob(body)) {
                        reader = new FileReader();
                        reader.onloadend = function(e) {
                            if (e.target.readyState === FileReader.DONE) {
                                if (e.target.error) {
                                    promise.failure(e.target.error);
                                } else {
                                    var wordArray = Uploader.CryptoJS.lib.WordArray.create(e.target.result);
                                    promise.success(Uploader.CryptoJS.SHA256(wordArray).toString());
                                }
                            }
                        };
                        reader.readAsArrayBuffer(body);
                    } else {
                        body = body || "";
                        promise.success(Uploader.CryptoJS.SHA256(body).toString());
                    }
                    return promise;
                },
                getScope: function(date, region) {
                    return Uploader.s3.util.getCredentialsDate(date) + "/" + region + "/s3/aws4_request";
                },
                getStringToSign: function(signatureSpec) {
                    var canonicalRequest = v4.getCanonicalRequest(signatureSpec),
                        date = Uploader.s3.util.getV4PolicyDate(signatureSpec.date, signatureSpec.drift),
                        hashedRequest = Uploader.CryptoJS.SHA256(canonicalRequest).toString(),
                        scope = v4.getScope(signatureSpec.date, options.signatureSpec.region),
                        stringToSignTemplate = "AWS4-HMAC-SHA256\n{}\n{}\n{}";
                    return {
                        hashed: Uploader.format(stringToSignTemplate, date, scope, hashedRequest),
                        raw: Uploader.format(stringToSignTemplate, date, scope, canonicalRequest)
                    };
                },
                getSignedHeaders: function(headerNames) {
                    var signedHeaders = "";
                    headerNames.forEach(function(headerName, idx) {
                        signedHeaders += headerName.toLowerCase();
                        if (idx < headerNames.length - 1) {
                            signedHeaders += ";";
                        }
                    });
                    return signedHeaders;
                },
                signApiRequest: function(signatureConstructor, headersStr, signatureEffort) {
                    var secretKey = credentialsProvider.get().secretKey,
                        headersPattern = /.+\n.+\n(\d+)\/(.+)\/s3\/.+\n(.+)/,
                        matches = headersPattern.exec(headersStr),
                        dateKey, dateRegionKey, dateRegionServiceKey, signingKey;
                    dateKey = Uploader.CryptoJS.HmacSHA256(matches[1], "AWS4" + secretKey);
                    dateRegionKey = Uploader.CryptoJS.HmacSHA256(matches[2], dateKey);
                    dateRegionServiceKey = Uploader.CryptoJS.HmacSHA256("s3", dateRegionKey);
                    signingKey = Uploader.CryptoJS.HmacSHA256("aws4_request", dateRegionServiceKey);
                    generateHeaders(signatureConstructor, Uploader.CryptoJS.HmacSHA256(headersStr, signingKey), signatureEffort);
                },
                signPolicy: function(policy, signatureEffort, updatedAccessKey, updatedSessionToken) {
                    var policyStr = JSON.stringify(policy),
                        policyWordArray = Uploader.CryptoJS.enc.Utf8.parse(policyStr),
                        base64Policy = Uploader.CryptoJS.enc.Base64.stringify(policyWordArray),
                        secretKey = credentialsProvider.get().secretKey,
                        credentialPattern = /.+\/(.+)\/(.+)\/s3\/aws4_request/,
                        credentialCondition = function() {
                            var credential = null;
                            Uploader.each(policy.conditions, function(key, condition) {
                                var val = condition["x-amz-credential"];
                                if (val) {
                                    credential = val;
                                    return false;
                                }
                            });
                            return credential;
                        }(),
                        matches, dateKey, dateRegionKey, dateRegionServiceKey, signingKey;
                    matches = credentialPattern.exec(credentialCondition);
                    dateKey = Uploader.CryptoJS.HmacSHA256(matches[1], "AWS4" + secretKey);
                    dateRegionKey = Uploader.CryptoJS.HmacSHA256(matches[2], dateKey);
                    dateRegionServiceKey = Uploader.CryptoJS.HmacSHA256("s3", dateRegionKey);
                    signingKey = Uploader.CryptoJS.HmacSHA256("aws4_request", dateRegionServiceKey);
                    signatureEffort.success({
                        policy: base64Policy,
                        signature: Uploader.CryptoJS.HmacSHA256(base64Policy, signingKey).toString()
                    }, updatedAccessKey, updatedSessionToken);
                }
            };
        Uploader.extend(options, o, true);
        credentialsProvider = options.signatureSpec.credentialsProvider;

        function handleSignatureReceived(id, xhrOrXdr, isError) {
            var responseJson = xhrOrXdr.responseText,
                pendingSignatureData = pendingSignatures[id],
                promise = pendingSignatureData.promise,
                signatureConstructor = pendingSignatureData.signatureConstructor,
                errorMessage, response;
            delete pendingSignatures[id];
            if (responseJson) {
                try {
                    response = Uploader.parseJson(responseJson);
                } catch (error) {
                    options.log("Error attempting to parse signature response: " + error, "error");
                }
            }
            if (response && response.error) {
                isError = true;
                errorMessage = response.error;
            } else if (response && response.invalid) {
                isError = true;
                errorMessage = "Invalid policy document or request headers!";
            } else if (response) {
                if (options.expectingPolicy && !response.policy) {
                    isError = true;
                    errorMessage = "Response does not include the base64 encoded policy!";
                } else if (!response.signature) {
                    isError = true;
                    errorMessage = "Response does not include the signature!";
                }
            } else {
                isError = true;
                errorMessage = "Received an empty or invalid response from the server!";
            }
            if (isError) {
                if (errorMessage) {
                    options.log(errorMessage, "error");
                }
                promise.failure(errorMessage);
            } else if (signatureConstructor) {
                generateHeaders(signatureConstructor, response.signature, promise);
            } else {
                promise.success(response);
            }
        }

        function getStringToSignArtifacts(id, version, requestInfo) {
            var promise = new Uploader.Promise(),
                method = "POST",
                headerNames = [],
                headersStr = "",
                now = new Date(),
                endOfUrl, signatureSpec, toSign, generateStringToSign = function(requestInfo) {
                    var contentMd5, headerIndexesToRemove = [];
                    Uploader.each(requestInfo.headers, function(name) {
                        headerNames.push(name);
                    });
                    headerNames.sort();
                    Uploader.each(headerNames, function(idx, headerName) {
                        if (Uploader.indexOf(Uploader.s3.util.UNSIGNABLE_REST_HEADER_NAMES, headerName) < 0) {
                            headersStr += headerName.toLowerCase() + ":" + requestInfo.headers[headerName].trim() + "\n";
                        } else if (headerName === "Content-MD5") {
                            contentMd5 = requestInfo.headers[headerName];
                        } else {
                            headerIndexesToRemove.unshift(idx);
                        }
                    });
                    Uploader.each(headerIndexesToRemove, function(idx, headerIdx) {
                        headerNames.splice(headerIdx, 1);
                    });
                    signatureSpec = {
                        bucket: requestInfo.bucket,
                        contentMd5: contentMd5,
                        contentType: requestInfo.contentType,
                        date: now,
                        drift: options.signatureSpec.drift,
                        endOfUrl: endOfUrl,
                        hashedContent: requestInfo.hashedContent,
                        headerNames: headerNames,
                        headersStr: headersStr,
                        method: method
                    };
                    toSign = version === 2 ? v2.getStringToSign(signatureSpec) : v4.getStringToSign(signatureSpec);
                    return {
                        date: now,
                        endOfUrl: endOfUrl,
                        signedHeaders: version === 4 ? v4.getSignedHeaders(signatureSpec.headerNames) : null,
                        toSign: version === 4 ? toSign.hashed : toSign,
                        toSignRaw: version === 4 ? toSign.raw : toSign
                    };
                };
            switch (requestInfo.type) {
                case thisSignatureRequester.REQUEST_TYPE.MULTIPART_ABORT:
                    method = "DELETE";
                    endOfUrl = Uploader.format("uploadId={}", requestInfo.uploadId);
                    break;

                case thisSignatureRequester.REQUEST_TYPE.MULTIPART_INITIATE:
                    endOfUrl = "uploads";
                    break;

                case thisSignatureRequester.REQUEST_TYPE.MULTIPART_COMPLETE:
                    endOfUrl = Uploader.format("uploadId={}", requestInfo.uploadId);
                    break;

                case thisSignatureRequester.REQUEST_TYPE.MULTIPART_UPLOAD:
                    method = "PUT";
                    endOfUrl = Uploader.format("partNumber={}&uploadId={}", requestInfo.partNum, requestInfo.uploadId);
                    break;
            }
            endOfUrl = requestInfo.key + "?" + endOfUrl;
            if (version === 4) {
                v4.getEncodedHashedPayload(requestInfo.content).then(function(hashedContent) {
                    requestInfo.headers["x-amz-content-sha256"] = hashedContent;
                    requestInfo.headers.Host = requestInfo.host;
                    requestInfo.headers["x-amz-date"] = Uploader.s3.util.getV4PolicyDate(now, options.signatureSpec.drift);
                    requestInfo.hashedContent = hashedContent;
                    promise.success(generateStringToSign(requestInfo));
                }, function(err) {
                    promise.failure(err);
                });
            } else {
                promise.success(generateStringToSign(requestInfo));
            }
            return promise;
        }

        function determineSignatureClientSide(id, toBeSigned, signatureEffort, updatedAccessKey, updatedSessionToken) {
            var updatedHeaders;
            if (toBeSigned.signatureConstructor) {
                if (updatedSessionToken) {
                    updatedHeaders = toBeSigned.signatureConstructor.getHeaders();
                    updatedHeaders[Uploader.s3.util.SESSION_TOKEN_PARAM_NAME] = updatedSessionToken;
                    toBeSigned.signatureConstructor.withHeaders(updatedHeaders);
                }
                toBeSigned.signatureConstructor.getToSign(id).then(function(signatureArtifacts) {
                    signApiRequest(toBeSigned.signatureConstructor, signatureArtifacts.stringToSign, signatureEffort);
                }, function(err) {
                    signatureEffort.failure(err);
                });
            } else {
                updatedSessionToken && Uploader.s3.util.refreshPolicyCredentials(toBeSigned, updatedSessionToken);
                signPolicy(toBeSigned, signatureEffort, updatedAccessKey, updatedSessionToken);
            }
        }

        function signPolicy(policy, signatureEffort, updatedAccessKey, updatedSessionToken) {
            if (options.signatureSpec.version === 4) {
                v4.signPolicy(policy, signatureEffort, updatedAccessKey, updatedSessionToken);
            } else {
                v2.signPolicy(policy, signatureEffort, updatedAccessKey, updatedSessionToken);
            }
        }

        function signApiRequest(signatureConstructor, headersStr, signatureEffort) {
            if (options.signatureSpec.version === 4) {
                v4.signApiRequest(signatureConstructor, headersStr, signatureEffort);
            } else {
                v2.signApiRequest(signatureConstructor, headersStr, signatureEffort);
            }
        }
        requester = Uploader.extend(this, new Uploader.AjaxRequester({
            acceptHeader: "application/json",
            method: options.method,
            contentType: "application/json; charset=utf-8",
            endpointStore: {
                get: function() {
                    return options.signatureSpec.endpoint;
                }
            },
            paramsStore: options.paramsStore,
            maxConnections: options.maxConnections,
            customHeaders: options.signatureSpec.customHeaders,
            log: options.log,
            onComplete: handleSignatureReceived,
            cors: options.cors
        }));
        Uploader.extend(this, {
            getSignature: function(id, toBeSigned) {
                var params = toBeSigned,
                    signatureConstructor = toBeSigned.signatureConstructor,
                    signatureEffort = new Uploader.Promise(),
                    queryParams;
                if (options.signatureSpec.version === 4) {
                    queryParams = {
                        v4: true
                    };
                }
                if (credentialsProvider.get().secretKey && Uploader.CryptoJS) {
                    if (credentialsProvider.get().expiration.getTime() > Date.now()) {
                        determineSignatureClientSide(id, toBeSigned, signatureEffort);
                    } else {
                        credentialsProvider.onExpired().then(function() {
                            determineSignatureClientSide(id, toBeSigned, signatureEffort, credentialsProvider.get().accessKey, credentialsProvider.get().sessionToken);
                        }, function(errorMsg) {
                            options.log("Attempt to update expired credentials apparently failed! Unable to sign request.  ", "error");
                            signatureEffort.failure("Unable to sign request - expired credentials.");
                        });
                    }
                } else {
                    options.log("Submitting S3 signature request for " + id);
                    if (signatureConstructor) {
                        signatureConstructor.getToSign(id).then(function(signatureArtifacts) {
                            params = {
                                headers: signatureArtifacts.stringToSignRaw
                            };
                            requester.initTransport(id).withParams(params).withQueryParams(queryParams).send();
                        }, function(err) {
                            options.log("Failed to construct signature. ", "error");
                            signatureEffort.failure("Failed to construct signature.");
                        });
                    } else {
                        requester.initTransport(id).withParams(params).withQueryParams(queryParams).send();
                    }
                    pendingSignatures[id] = {
                        promise: signatureEffort,
                        signatureConstructor: signatureConstructor
                    };
                }
                return signatureEffort;
            },
            constructStringToSign: function(type, bucket, host, key) {
                var headers = {},
                    uploadId, content, contentType, partNum, artifacts;
                return {
                    withHeaders: function(theHeaders) {
                        headers = theHeaders;
                        return this;
                    },
                    withUploadId: function(theUploadId) {
                        uploadId = theUploadId;
                        return this;
                    },
                    withContent: function(theContent) {
                        content = theContent;
                        return this;
                    },
                    withContentType: function(theContentType) {
                        contentType = theContentType;
                        return this;
                    },
                    withPartNum: function(thePartNum) {
                        partNum = thePartNum;
                        return this;
                    },
                    getToSign: function(id) {
                        var sessionToken = credentialsProvider.get().sessionToken,
                            promise = new Uploader.Promise(),
                            adjustedDate = new Date(Date.now() + options.signatureSpec.drift);
                        headers["x-amz-date"] = adjustedDate.toUTCString();
                        if (sessionToken) {
                            headers[Uploader.s3.util.SESSION_TOKEN_PARAM_NAME] = sessionToken;
                        }
                        getStringToSignArtifacts(id, options.signatureSpec.version, {
                            bucket: bucket,
                            content: content,
                            contentType: contentType,
                            headers: headers,
                            host: host,
                            key: key,
                            partNum: partNum,
                            type: type,
                            uploadId: uploadId
                        }).then(function(_artifacts_) {
                            artifacts = _artifacts_;
                            promise.success({
                                headers: function() {
                                    if (contentType) {
                                        headers["Content-Type"] = contentType;
                                    }
                                    delete headers.Host;
                                    return headers;
                                }(),
                                date: artifacts.date,
                                endOfUrl: artifacts.endOfUrl,
                                signedHeaders: artifacts.signedHeaders,
                                stringToSign: artifacts.toSign,
                                stringToSignRaw: artifacts.toSignRaw
                            });
                        }, function(err) {
                            promise.failure(err);
                        });
                        return promise;
                    },
                    getHeaders: function() {
                        return Uploader.extend({}, headers);
                    },
                    getEndOfUrl: function() {
                        return artifacts && artifacts.endOfUrl;
                    },
                    getRequestDate: function() {
                        return artifacts && artifacts.date;
                    },
                    getSignedHeaders: function() {
                        return artifacts && artifacts.signedHeaders;
                    }
                };
            }
        });
    };
    Uploader.s3.RequestSigner.prototype.REQUEST_TYPE = {
        MULTIPART_INITIATE: "multipart_initiate",
        MULTIPART_COMPLETE: "multipart_complete",
        MULTIPART_ABORT: "multipart_abort",
        MULTIPART_UPLOAD: "multipart_upload"
    };
    Uploader.UploadSuccessAjaxRequester = function(o) {
        "use strict";
        var requester, pendingRequests = [],
            options = {
                method: "POST",
                endpoint: null,
                maxConnections: 3,
                customHeaders: {},
                paramsStore: {},
                cors: {
                    expected: false,
                    sendCredentials: false
                },
                log: function(str, level) {}
            };
        Uploader.extend(options, o);

        function handleSuccessResponse(id, xhrOrXdr, isError) {
            var promise = pendingRequests[id],
                responseJson = xhrOrXdr.responseText,
                successIndicator = {
                    success: true
                },
                failureIndicator = {
                    success: false
                },
                parsedResponse;
            delete pendingRequests[id];
            options.log(Uploader.format("Received the following response body to an upload success request for id {}: {}", id, responseJson));
            try {
                parsedResponse = Uploader.parseJson(responseJson);
                if (isError || parsedResponse && (parsedResponse.error || parsedResponse.success === false)) {
                    options.log("Upload success request was rejected by the server.", "error");
                    promise.failure(Uploader.extend(parsedResponse, failureIndicator));
                } else {
                    options.log("Upload success was acknowledged by the server.");
                    promise.success(Uploader.extend(parsedResponse, successIndicator));
                }
            } catch (error) {
                if (isError) {
                    options.log(Uploader.format("Your server indicated failure in its upload success request response for id {}!", id), "error");
                    promise.failure(failureIndicator);
                } else {
                    options.log("Upload success was acknowledged by the server.");
                    promise.success(successIndicator);
                }
            }
        }
        requester = Uploader.extend(this, new Uploader.AjaxRequester({
            acceptHeader: "application/json",
            method: options.method,
            endpointStore: {
                get: function() {
                    return options.endpoint;
                }
            },
            paramsStore: options.paramsStore,
            maxConnections: options.maxConnections,
            customHeaders: options.customHeaders,
            log: options.log,
            onComplete: handleSuccessResponse,
            cors: options.cors
        }));
        Uploader.extend(this, {
            sendSuccessRequest: function(id, spec) {
                var promise = new Uploader.Promise();
                options.log("Submitting upload success request/notification for " + id);
                requester.initTransport(id).withParams(spec).send();
                pendingRequests[id] = promise;
                return promise;
            }
        });
    };
    Uploader.s3.InitiateMultipartAjaxRequester = function(o) {
        "use strict";
        var requester, pendingInitiateRequests = {},
            options = {
                filenameParam: "qqfilename",
                method: "POST",
                endpointStore: null,
                paramsStore: null,
                signatureSpec: null,
                aclStore: null,
                reducedRedundancy: false,
                serverSideEncryption: false,
                maxConnections: 3,
                getContentType: function(id) {},
                getBucket: function(id) {},
                getHost: function(id) {},
                getKey: function(id) {},
                getName: function(id) {},
                log: function(str, level) {}
            },
            getSignatureAjaxRequester;
        Uploader.extend(options, o);
        getSignatureAjaxRequester = new Uploader.s3.RequestSigner({
            endpointStore: options.endpointStore,
            signatureSpec: options.signatureSpec,
            cors: options.cors,
            log: options.log
        });

        function getHeaders(id) {
            var bucket = options.getBucket(id),
                host = options.getHost(id),
                headers = {},
                promise = new Uploader.Promise(),
                key = options.getKey(id),
                signatureConstructor;
            headers["x-amz-acl"] = options.aclStore.get(id);
            if (options.reducedRedundancy) {
                headers[Uploader.s3.util.REDUCED_REDUNDANCY_PARAM_NAME] = Uploader.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE;
            }
            if (options.serverSideEncryption) {
                headers[Uploader.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME] = Uploader.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE;
            }
            headers[Uploader.s3.util.AWS_PARAM_PREFIX + options.filenameParam] = encodeURIComponent(options.getName(id));
            Uploader.each(options.paramsStore.get(id), function(name, val) {
                if (Uploader.indexOf(Uploader.s3.util.UNPREFIXED_PARAM_NAMES, name) >= 0) {
                    headers[name] = val;
                } else {
                    headers[Uploader.s3.util.AWS_PARAM_PREFIX + name] = encodeURIComponent(val);
                }
            });
            signatureConstructor = getSignatureAjaxRequester.constructStringToSign(getSignatureAjaxRequester.REQUEST_TYPE.MULTIPART_INITIATE, bucket, host, key).withContentType(options.getContentType(id)).withHeaders(headers);
            getSignatureAjaxRequester.getSignature(id, {
                signatureConstructor: signatureConstructor
            }).then(promise.success, promise.failure);
            return promise;
        }

        function handleInitiateRequestComplete(id, xhr, isError) {
            var promise = pendingInitiateRequests[id],
                domParser = new DOMParser(),
                responseDoc = domParser.parseFromString(xhr.responseText, "application/xml"),
                uploadIdElements, messageElements, uploadId, errorMessage, status;
            delete pendingInitiateRequests[id];
            if (isError) {
                status = xhr.status;
                messageElements = responseDoc.getElementsByTagName("Message");
                if (messageElements.length > 0) {
                    errorMessage = messageElements[0].textContent;
                }
            } else {
                uploadIdElements = responseDoc.getElementsByTagName("UploadId");
                if (uploadIdElements.length > 0) {
                    uploadId = uploadIdElements[0].textContent;
                } else {
                    errorMessage = "Upload ID missing from request";
                }
            }
            if (uploadId === undefined) {
                if (errorMessage) {
                    options.log(Uploader.format("Specific problem detected initiating multipart upload request for {}: '{}'.", id, errorMessage), "error");
                } else {
                    options.log(Uploader.format("Unexplained error with initiate multipart upload request for {}.  Status code {}.", id, status), "error");
                }
                promise.failure("Problem initiating upload request.", xhr);
            } else {
                options.log(Uploader.format("Initiate multipart upload request successful for {}.  Upload ID is {}", id, uploadId));
                promise.success(uploadId, xhr);
            }
        }
        requester = Uploader.extend(this, new Uploader.AjaxRequester({
            method: options.method,
            contentType: null,
            endpointStore: options.endpointStore,
            maxConnections: options.maxConnections,
            allowXRequestedWithAndCacheControl: false,
            log: options.log,
            onComplete: handleInitiateRequestComplete,
            successfulResponseCodes: {
                POST: [200]
            }
        }));
        Uploader.extend(this, {
            send: function(id) {
                var promise = new Uploader.Promise();
                getHeaders(id).then(function(headers, endOfUrl) {
                    options.log("Submitting S3 initiate multipart upload request for " + id);
                    pendingInitiateRequests[id] = promise;
                    requester.initTransport(id).withPath(endOfUrl).withHeaders(headers).send();
                }, promise.failure);
                return promise;
            }
        });
    };
    Uploader.s3.CompleteMultipartAjaxRequester = function(o) {
        "use strict";
        var requester, pendingCompleteRequests = {},
            options = {
                method: "POST",
                contentType: "text/xml",
                endpointStore: null,
                signatureSpec: null,
                maxConnections: 3,
                getBucket: function(id) {},
                getHost: function(id) {},
                getKey: function(id) {},
                log: function(str, level) {}
            },
            getSignatureAjaxRequester;
        Uploader.extend(options, o);
        getSignatureAjaxRequester = new Uploader.s3.RequestSigner({
            endpointStore: options.endpointStore,
            signatureSpec: options.signatureSpec,
            cors: options.cors,
            log: options.log
        });

        function getHeaders(id, uploadId, body) {
            var headers = {},
                promise = new Uploader.Promise(),
                bucket = options.getBucket(id),
                host = options.getHost(id),
                signatureConstructor = getSignatureAjaxRequester.constructStringToSign(getSignatureAjaxRequester.REQUEST_TYPE.MULTIPART_COMPLETE, bucket, host, options.getKey(id)).withUploadId(uploadId).withContent(body).withContentType("application/xml; charset=UTF-8");
            getSignatureAjaxRequester.getSignature(id, {
                signatureConstructor: signatureConstructor
            }).then(promise.success, promise.failure);
            return promise;
        }

        function handleCompleteRequestComplete(id, xhr, isError) {
            var promise = pendingCompleteRequests[id],
                domParser = new DOMParser(),
                bucket = options.getBucket(id),
                key = options.getKey(id),
                responseDoc = domParser.parseFromString(xhr.responseText, "application/xml"),
                bucketEls = responseDoc.getElementsByTagName("Bucket"),
                keyEls = responseDoc.getElementsByTagName("Key");
            delete pendingCompleteRequests[id];
            options.log(Uploader.format("Complete response status {}, body = {}", xhr.status, xhr.responseText));
            if (isError) {
                options.log(Uploader.format("Complete Multipart Upload request for {} failed with status {}.", id, xhr.status), "error");
            } else {
                if (bucketEls.length && keyEls.length) {
                    if (bucketEls[0].textContent !== bucket) {
                        isError = true;
                        options.log(Uploader.format("Wrong bucket in response to Complete Multipart Upload request for {}.", id), "error");
                    }
                } else {
                    isError = true;
                    options.log(Uploader.format("Missing bucket and/or key in response to Complete Multipart Upload request for {}.", id), "error");
                }
            }
            if (isError) {
                promise.failure("Problem combining the file parts!", xhr);
            } else {
                promise.success({}, xhr);
            }
        }

        function getCompleteRequestBody(etagEntries) {
            var doc = document.implementation.createDocument(null, "CompleteMultipartUpload", null);
            etagEntries.sort(function(a, b) {
                return a.part - b.part;
            });
            Uploader.each(etagEntries, function(idx, etagEntry) {
                var part = etagEntry.part,
                    etag = etagEntry.etag,
                    partEl = doc.createElement("Part"),
                    partNumEl = doc.createElement("PartNumber"),
                    partNumTextEl = doc.createTextNode(part),
                    etagTextEl = doc.createTextNode(etag),
                    etagEl = doc.createElement("ETag");
                etagEl.appendChild(etagTextEl);
                partNumEl.appendChild(partNumTextEl);
                partEl.appendChild(partNumEl);
                partEl.appendChild(etagEl);
                Uploader(doc).children()[0].appendChild(partEl);
            });
            return new XMLSerializer().serializeToString(doc);
        }
        requester = Uploader.extend(this, new Uploader.AjaxRequester({
            method: options.method,
            contentType: "application/xml; charset=UTF-8",
            endpointStore: options.endpointStore,
            maxConnections: options.maxConnections,
            allowXRequestedWithAndCacheControl: false,
            log: options.log,
            onComplete: handleCompleteRequestComplete,
            successfulResponseCodes: {
                POST: [200]
            }
        }));
        Uploader.extend(this, {
            send: function(id, uploadId, etagEntries) {
                var promise = new Uploader.Promise(),
                    body = getCompleteRequestBody(etagEntries);
                getHeaders(id, uploadId, body).then(function(headers, endOfUrl) {
                    options.log("Submitting S3 complete multipart upload request for " + id);
                    pendingCompleteRequests[id] = promise;
                    delete headers["Content-Type"];
                    requester.initTransport(id).withPath(endOfUrl).withHeaders(headers).withPayload(body).send();
                }, promise.failure);
                return promise;
            }
        });
    };
    Uploader.s3.AbortMultipartAjaxRequester = function(o) {
        "use strict";
        var requester, options = {
                method: "DELETE",
                endpointStore: null,
                signatureSpec: null,
                maxConnections: 3,
                getBucket: function(id) {},
                getHost: function(id) {},
                getKey: function(id) {},
                log: function(str, level) {}
            },
            getSignatureAjaxRequester;
        Uploader.extend(options, o);
        getSignatureAjaxRequester = new Uploader.s3.RequestSigner({
            endpointStore: options.endpointStore,
            signatureSpec: options.signatureSpec,
            cors: options.cors,
            log: options.log
        });

        function getHeaders(id, uploadId) {
            var headers = {},
                promise = new Uploader.Promise(),
                bucket = options.getBucket(id),
                host = options.getHost(id),
                signatureConstructor = getSignatureAjaxRequester.constructStringToSign(getSignatureAjaxRequester.REQUEST_TYPE.MULTIPART_ABORT, bucket, host, options.getKey(id)).withUploadId(uploadId);
            getSignatureAjaxRequester.getSignature(id, {
                signatureConstructor: signatureConstructor
            }).then(promise.success, promise.failure);
            return promise;
        }

        function handleAbortRequestComplete(id, xhr, isError) {
            var domParser = new DOMParser(),
                responseDoc = domParser.parseFromString(xhr.responseText, "application/xml"),
                errorEls = responseDoc.getElementsByTagName("Error"),
                awsErrorMsg;
            options.log(Uploader.format("Abort response status {}, body = {}", xhr.status, xhr.responseText));
            if (isError) {
                options.log(Uploader.format("Abort Multipart Upload request for {} failed with status {}.", id, xhr.status), "error");
            } else {
                if (errorEls.length) {
                    isError = true;
                    awsErrorMsg = responseDoc.getElementsByTagName("Message")[0].textContent;
                    options.log(Uploader.format("Failed to Abort Multipart Upload request for {}.  Error: {}", id, awsErrorMsg), "error");
                } else {
                    options.log(Uploader.format("Abort MPU request succeeded for file ID {}.", id));
                }
            }
        }
        requester = Uploader.extend(this, new Uploader.AjaxRequester({
            validMethods: ["DELETE"],
            method: options.method,
            contentType: null,
            endpointStore: options.endpointStore,
            maxConnections: options.maxConnections,
            allowXRequestedWithAndCacheControl: false,
            log: options.log,
            onComplete: handleAbortRequestComplete,
            successfulResponseCodes: {
                DELETE: [204]
            }
        }));
        Uploader.extend(this, {
            send: function(id, uploadId) {
                getHeaders(id, uploadId).then(function(headers, endOfUrl) {
                    options.log("Submitting S3 Abort multipart upload request for " + id);
                    requester.initTransport(id).withPath(endOfUrl).withHeaders(headers).send();
                });
            }
        });
    };
    Uploader.s3.XhrUploadHandler = function(spec, proxy) {
        "use strict";
        var getName = proxy.getName,
            log = proxy.log,
            clockDrift = spec.clockDrift,
            expectedStatus = 200,
            onGetBucket = spec.getBucket,
            onGetHost = spec.getHost,
            onGetKeyName = spec.getKeyName,
            filenameParam = spec.filenameParam,
            paramsStore = spec.paramsStore,
            endpointStore = spec.endpointStore,
            aclStore = spec.aclStore,
            reducedRedundancy = spec.objectProperties.reducedRedundancy,
            region = spec.objectProperties.region,
            serverSideEncryption = spec.objectProperties.serverSideEncryption,
            validation = spec.validation,
            signature = Uploader.extend({
                region: region,
                drift: clockDrift
            }, spec.signature),
            handler = this,
            credentialsProvider = spec.signature.credentialsProvider,
            chunked = {
                combine: function(id) {
                    var uploadId = handler._getPersistableData(id).uploadId,
                        etagMap = handler._getPersistableData(id).etags,
                        result = new Uploader.Promise();
                    requesters.completeMultipart.send(id, uploadId, etagMap).then(result.success, function failure(reason, xhr) {
                        result.failure(upload.done(id, xhr).response, xhr);
                    });
                    return result;
                },
                done: function(id, xhr, chunkIdx) {
                    var response = upload.response.parse(id, xhr),
                        etag;
                    if (response.success) {
                        etag = xhr.getResponseHeader("ETag");
                        if (!handler._getPersistableData(id).etags) {
                            handler._getPersistableData(id).etags = [];
                        }
                        handler._getPersistableData(id).etags.push({
                            part: chunkIdx + 1,
                            etag: etag
                        });
                    }
                },
                initHeaders: function(id, chunkIdx, blob) {
                    var headers = {},
                        bucket = upload.bucket.getName(id),
                        host = upload.host.getName(id),
                        key = upload.key.urlSafe(id),
                        promise = new Uploader.Promise(),
                        signatureConstructor = requesters.restSignature.constructStringToSign(requesters.restSignature.REQUEST_TYPE.MULTIPART_UPLOAD, bucket, host, key).withPartNum(chunkIdx + 1).withContent(blob).withUploadId(handler._getPersistableData(id).uploadId);
                    requesters.restSignature.getSignature(id + "." + chunkIdx, {
                        signatureConstructor: signatureConstructor
                    }).then(promise.success, promise.failure);
                    return promise;
                },
                put: function(id, chunkIdx) {
                    var xhr = handler._createXhr(id, chunkIdx),
                        chunkData = handler._getChunkData(id, chunkIdx),
                        domain = spec.endpointStore.get(id),
                        promise = new Uploader.Promise();
                    chunked.initHeaders(id, chunkIdx, chunkData.blob).then(function(headers, endOfUrl) {
                        if (xhr._cancelled) {
                            log(Uploader.format("Upload of item {}.{} cancelled. Upload will not start after successful signature request.", id, chunkIdx));
                            promise.failure({
                                error: "Chunk upload cancelled"
                            });
                        } else {
                            var url = domain + "/" + endOfUrl;
                            handler._registerProgressHandler(id, chunkIdx, chunkData.size);
                            upload.track(id, xhr, chunkIdx).then(promise.success, promise.failure);
                            xhr.open("PUT", url, true);
                            var hasContentType = false;
                            Uploader.each(headers, function(name, val) {
                                if (name === "Content-Type") {
                                    hasContentType = true;
                                }
                                xhr.setRequestHeader(name, val);
                            });
                            if (!hasContentType) {
                                xhr.setRequestHeader("Content-Type", "");
                            }
                            xhr.send(chunkData.blob);
                        }
                    }, function() {
                        promise.failure({
                            error: "Problem signing the chunk!"
                        }, xhr);
                    });
                    return promise;
                },
                send: function(id, chunkIdx) {
                    var promise = new Uploader.Promise();
                    chunked.setup(id).then(function() {
                        chunked.put(id, chunkIdx).then(promise.success, promise.failure);
                    }, function(errorMessage, xhr) {
                        promise.failure({
                            error: errorMessage
                        }, xhr);
                    });
                    return promise;
                },
                setup: function(id) {
                    var promise = new Uploader.Promise(),
                        uploadId = handler._getPersistableData(id).uploadId,
                        uploadIdPromise = new Uploader.Promise();
                    if (!uploadId) {
                        handler._getPersistableData(id).uploadId = uploadIdPromise;
                        requesters.initiateMultipart.send(id).then(function(uploadId) {
                            handler._getPersistableData(id).uploadId = uploadId;
                            uploadIdPromise.success(uploadId);
                            promise.success(uploadId);
                        }, function(errorMsg, xhr) {
                            handler._getPersistableData(id).uploadId = null;
                            promise.failure(errorMsg, xhr);
                            uploadIdPromise.failure(errorMsg, xhr);
                        });
                    } else if (uploadId instanceof Uploader.Promise) {
                        uploadId.then(function(uploadId) {
                            promise.success(uploadId);
                        });
                    } else {
                        promise.success(uploadId);
                    }
                    return promise;
                }
            },
            requesters = {
                abortMultipart: new Uploader.s3.AbortMultipartAjaxRequester({
                    endpointStore: endpointStore,
                    signatureSpec: signature,
                    cors: spec.cors,
                    log: log,
                    getBucket: function(id) {
                        return upload.bucket.getName(id);
                    },
                    getHost: function(id) {
                        return upload.host.getName(id);
                    },
                    getKey: function(id) {
                        return upload.key.urlSafe(id);
                    }
                }),
                completeMultipart: new Uploader.s3.CompleteMultipartAjaxRequester({
                    endpointStore: endpointStore,
                    signatureSpec: signature,
                    cors: spec.cors,
                    log: log,
                    getBucket: function(id) {
                        return upload.bucket.getName(id);
                    },
                    getHost: function(id) {
                        return upload.host.getName(id);
                    },
                    getKey: function(id) {
                        return upload.key.urlSafe(id);
                    }
                }),
                initiateMultipart: new Uploader.s3.InitiateMultipartAjaxRequester({
                    filenameParam: filenameParam,
                    endpointStore: endpointStore,
                    paramsStore: paramsStore,
                    signatureSpec: signature,
                    aclStore: aclStore,
                    reducedRedundancy: reducedRedundancy,
                    serverSideEncryption: serverSideEncryption,
                    cors: spec.cors,
                    log: log,
                    getContentType: function(id) {
                        return handler._getMimeType(id);
                    },
                    getBucket: function(id) {
                        return upload.bucket.getName(id);
                    },
                    getHost: function(id) {
                        return upload.host.getName(id);
                    },
                    getKey: function(id) {
                        return upload.key.urlSafe(id);
                    },
                    getName: function(id) {
                        return getName(id);
                    }
                }),
                policySignature: new Uploader.s3.RequestSigner({
                    expectingPolicy: true,
                    signatureSpec: signature,
                    cors: spec.cors,
                    log: log
                }),
                restSignature: new Uploader.s3.RequestSigner({
                    endpointStore: endpointStore,
                    signatureSpec: signature,
                    cors: spec.cors,
                    log: log
                })
            },
            simple = {
                initParams: function(id) {
                    var customParams = paramsStore.get(id);
                    customParams[filenameParam] = getName(id);
                    return Uploader.s3.util.generateAwsParams({
                        endpoint: endpointStore.get(id),
                        clockDrift: clockDrift,
                        params: customParams,
                        type: handler._getMimeType(id),
                        bucket: upload.bucket.getName(id),
                        key: handler.getThirdPartyFileId(id),
                        accessKey: credentialsProvider.get().accessKey,
                        sessionToken: credentialsProvider.get().sessionToken,
                        acl: aclStore.get(id),
                        expectedStatus: expectedStatus,
                        minFileSize: validation.minSizeLimit,
                        maxFileSize: validation.maxSizeLimit,
                        reducedRedundancy: reducedRedundancy,
                        region: region,
                        serverSideEncryption: serverSideEncryption,
                        signatureVersion: signature.version,
                        log: log
                    }, Uploader.bind(requesters.policySignature.getSignature, this, id));
                },
                send: function(id) {
                    var promise = new Uploader.Promise(),
                        xhr = handler._createXhr(id),
                        fileOrBlob = handler.getFile(id);
                    handler._registerProgressHandler(id);
                    upload.track(id, xhr).then(promise.success, promise.failure);
                    simple.setup(id, xhr, fileOrBlob).then(function(toSend) {
                        log("Sending upload request for " + id);
                        xhr.send(toSend);
                    }, promise.failure);
                    return promise;
                },
                setup: function(id, xhr, fileOrBlob) {
                    var formData = new FormData(),
                        endpoint = endpointStore.get(id),
                        url = endpoint,
                        promise = new Uploader.Promise();
                    simple.initParams(id).then(function(awsParams) {
                        xhr.open("POST", url, true);
                        Uploader.obj2FormData(awsParams, formData);
                        formData.append("file", fileOrBlob);
                        promise.success(formData);
                    }, function(errorMessage) {
                        promise.failure({
                            error: errorMessage
                        });
                    });
                    return promise;
                }
            },
            upload = {
                bucket: {
                    promise: function(id) {
                        var promise = new Uploader.Promise(),
                            cachedBucket = handler._getFileState(id).bucket;
                        if (cachedBucket) {
                            promise.success(cachedBucket);
                        } else {
                            onGetBucket(id).then(function(bucket) {
                                handler._getFileState(id).bucket = bucket;
                                promise.success(bucket);
                            }, promise.failure);
                        }
                        return promise;
                    },
                    getName: function(id) {
                        return handler._getFileState(id).bucket;
                    }
                },
                host: {
                    promise: function(id) {
                        var promise = new Uploader.Promise(),
                            cachedHost = handler._getFileState(id).host;
                        if (cachedHost) {
                            promise.success(cachedHost);
                        } else {
                            onGetHost(id).then(function(host) {
                                handler._getFileState(id).host = host;
                                promise.success(host);
                            }, promise.failure);
                        }
                        return promise;
                    },
                    getName: function(id) {
                        return handler._getFileState(id).host;
                    }
                },
                done: function(id, xhr) {
                    var response = upload.response.parse(id, xhr),
                        isError = response.success !== true;
                    if (isError && upload.response.shouldReset(response.code)) {
                        log("This is an unrecoverable error, we must restart the upload entirely on the next retry attempt.", "error");
                        response.reset = true;
                    }
                    return {
                        success: !isError,
                        response: response
                    };
                },
                key: {
                    promise: function(id) {
                        var promise = new Uploader.Promise(),
                            key = handler.getThirdPartyFileId(id);
                        if (key == null) {
                            handler._setThirdPartyFileId(id, promise);
                            onGetKeyName(id, getName(id)).then(function(keyName) {
                                handler._setThirdPartyFileId(id, keyName);
                                promise.success(keyName);
                            }, function(errorReason) {
                                handler._setThirdPartyFileId(id, null);
                                promise.failure(errorReason);
                            });
                        } else if (Uploader.isGenericPromise(key)) {
                            key.then(promise.success, promise.failure);
                        } else {
                            promise.success(key);
                        }
                        return promise;
                    },
                    urlSafe: function(id) {
                        var encodedKey = handler.getThirdPartyFileId(id);
                        return Uploader.s3.util.uriEscapePath(encodedKey);
                    }
                },
                response: {
                    parse: function(id, xhr) {
                        var response = {},
                            parsedErrorProps;
                        try {
                            log(Uploader.format("Received response status {} with body: {}", xhr.status, xhr.responseText));
                            if (xhr.status === expectedStatus) {
                                response.success = true;
                            } else {
                                parsedErrorProps = upload.response.parseError(xhr.responseText);
                                if (parsedErrorProps) {
                                    response.error = parsedErrorProps.message;
                                    response.code = parsedErrorProps.code;
                                }
                            }
                        } catch (error) {
                            log("Error when attempting to parse xhr response text (" + error.message + ")", "error");
                        }
                        return response;
                    },
                    parseError: function(awsResponseXml) {
                        var parser = new DOMParser(),
                            parsedDoc = parser.parseFromString(awsResponseXml, "application/xml"),
                            errorEls = parsedDoc.getElementsByTagName("Error"),
                            errorDetails = {},
                            codeEls, messageEls;
                        if (errorEls.length) {
                            codeEls = parsedDoc.getElementsByTagName("Code");
                            messageEls = parsedDoc.getElementsByTagName("Message");
                            if (messageEls.length) {
                                errorDetails.message = messageEls[0].textContent;
                            }
                            if (codeEls.length) {
                                errorDetails.code = codeEls[0].textContent;
                            }
                            return errorDetails;
                        }
                    },
                    shouldReset: function(errorCode) {
                        return errorCode === "EntityTooSmall" || errorCode === "InvalidPart" || errorCode === "InvalidPartOrder" || errorCode === "NoSuchUpload";
                    }
                },
                start: function(id, optChunkIdx) {
                    var promise = new Uploader.Promise();
                    upload.key.promise(id).then(function() {
                        upload.bucket.promise(id).then(function() {
                            upload.host.promise(id).then(function() {
                                if (optChunkIdx == null) {
                                    simple.send(id).then(promise.success, promise.failure);
                                } else {
                                    chunked.send(id, optChunkIdx).then(promise.success, promise.failure);
                                }
                            });
                        });
                    }, function(errorReason) {
                        promise.failure({
                            error: errorReason
                        });
                    });
                    return promise;
                },
                track: function(id, xhr, optChunkIdx) {
                    var promise = new Uploader.Promise();
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                            var result;
                            if (optChunkIdx == null) {
                                result = upload.done(id, xhr);
                                promise[result.success ? "success" : "failure"](result.response, xhr);
                            } else {
                                chunked.done(id, xhr, optChunkIdx);
                                result = upload.done(id, xhr);
                                promise[result.success ? "success" : "failure"](result.response, xhr);
                            }
                        }
                    };
                    return promise;
                }
            };
        Uploader.extend(this, {
            uploadChunk: upload.start,
            uploadFile: upload.start
        });
        Uploader.extend(this, new Uploader.XhrUploadHandler({
            options: Uploader.extend({
                namespace: "s3"
            }, spec),
            proxy: Uploader.extend({
                getEndpoint: spec.endpointStore.get
            }, proxy)
        }));
        Uploader.override(this, function(super_) {
            return {
                expunge: function(id) {
                    var uploadId = handler._getPersistableData(id) && handler._getPersistableData(id).uploadId,
                        existedInLocalStorage = handler._maybeDeletePersistedChunkData(id);
                    if (uploadId !== undefined && existedInLocalStorage) {
                        requesters.abortMultipart.send(id, uploadId);
                    }
                    super_.expunge(id);
                },
                finalizeChunks: function(id) {
                    return chunked.combine(id);
                },
                _getLocalStorageId: function(id) {
                    var baseStorageId = super_._getLocalStorageId(id),
                        bucketName = upload.bucket.getName(id);
                    return baseStorageId + "-" + bucketName;
                }
            };
        });
    };
    Uploader.s3.FormUploadHandler = function(options, proxy) {
        "use strict";
        var handler = this,
            clockDrift = options.clockDrift,
            onUuidChanged = proxy.onUuidChanged,
            getName = proxy.getName,
            getUuid = proxy.getUuid,
            log = proxy.log,
            onGetBucket = options.getBucket,
            onGetKeyName = options.getKeyName,
            filenameParam = options.filenameParam,
            paramsStore = options.paramsStore,
            endpointStore = options.endpointStore,
            aclStore = options.aclStore,
            reducedRedundancy = options.objectProperties.reducedRedundancy,
            region = options.objectProperties.region,
            serverSideEncryption = options.objectProperties.serverSideEncryption,
            validation = options.validation,
            signature = options.signature,
            successRedirectUrl = options.iframeSupport.localBlankPagePath,
            credentialsProvider = options.signature.credentialsProvider,
            getSignatureAjaxRequester = new Uploader.s3.RequestSigner({
                signatureSpec: signature,
                cors: options.cors,
                log: log
            });
        if (successRedirectUrl === undefined) {
            throw new Error("successRedirectEndpoint MUST be defined if you intend to use browsers that do not support the File API!");
        }

        function isValidResponse(id, iframe) {
            var response, endpoint = options.endpointStore.get(id),
                bucket = handler._getFileState(id).bucket,
                doc, innerHtml, responseData;
            try {
                doc = iframe.contentDocument || iframe.contentWindow.document;
                innerHtml = doc.body.innerHTML;
                responseData = Uploader.s3.util.parseIframeResponse(iframe);
                if (responseData.bucket === bucket && responseData.key === Uploader.s3.util.encodeQueryStringParam(handler.getThirdPartyFileId(id))) {
                    return true;
                }
                log("Response from AWS included an unexpected bucket or key name.", "error");
            } catch (error) {
                log("Error when attempting to parse form upload response (" + error.message + ")", "error");
            }
            return false;
        }

        function generateAwsParams(id) {
            var customParams = paramsStore.get(id);
            customParams[filenameParam] = getName(id);
            return Uploader.s3.util.generateAwsParams({
                endpoint: endpointStore.get(id),
                clockDrift: clockDrift,
                params: customParams,
                bucket: handler._getFileState(id).bucket,
                key: handler.getThirdPartyFileId(id),
                accessKey: credentialsProvider.get().accessKey,
                sessionToken: credentialsProvider.get().sessionToken,
                acl: aclStore.get(id),
                minFileSize: validation.minSizeLimit,
                maxFileSize: validation.maxSizeLimit,
                successRedirectUrl: successRedirectUrl,
                reducedRedundancy: reducedRedundancy,
                region: region,
                serverSideEncryption: serverSideEncryption,
                signatureVersion: signature.version,
                log: log
            }, Uploader.bind(getSignatureAjaxRequester.getSignature, this, id));
        }

        function createForm(id, iframe) {
            var promise = new Uploader.Promise(),
                method = "POST",
                endpoint = options.endpointStore.get(id),
                fileName = getName(id);
            generateAwsParams(id).then(function(params) {
                var form = handler._initFormForUpload({
                    method: method,
                    endpoint: endpoint,
                    params: params,
                    paramsInBody: true,
                    targetName: iframe.name
                });
                promise.success(form);
            }, function(errorMessage) {
                promise.failure(errorMessage);
                handleFinishedUpload(id, iframe, fileName, {
                    error: errorMessage
                });
            });
            return promise;
        }

        function handleUpload(id) {
            var iframe = handler._createIframe(id),
                input = handler.getInput(id),
                promise = new Uploader.Promise();
            createForm(id, iframe).then(function(form) {
                form.appendChild(input);
                handler._attachLoadEvent(iframe, function(response) {
                    log("iframe loaded");
                    if (response) {
                        if (response.success === false) {
                            log("Amazon likely rejected the upload request", "error");
                            promise.failure(response);
                        }
                    } else {
                        response = {};
                        response.success = isValidResponse(id, iframe);
                        if (response.success === false) {
                            log("A success response was received by Amazon, but it was invalid in some way.", "error");
                            promise.failure(response);
                        } else {
                            Uploader.extend(response, Uploader.s3.util.parseIframeResponse(iframe));
                            promise.success(response);
                        }
                    }
                    handleFinishedUpload(id, iframe);
                });
                log("Sending upload request for " + id);
                form.submit();
                Uploader(form).remove();
            }, promise.failure);
            return promise;
        }

        function handleFinishedUpload(id, iframe) {
            handler._detachLoadEvent(id);
            iframe && Uploader(iframe).remove();
        }
        Uploader.extend(this, new Uploader.FormUploadHandler({
            options: {
                isCors: false,
                inputName: "file"
            },
            proxy: {
                onCancel: options.onCancel,
                onUuidChanged: onUuidChanged,
                getName: getName,
                getUuid: getUuid,
                log: log
            }
        }));
        Uploader.extend(this, {
            uploadFile: function(id) {
                var name = getName(id),
                    promise = new Uploader.Promise();
                if (handler.getThirdPartyFileId(id)) {
                    if (handler._getFileState(id).bucket) {
                        handleUpload(id).then(promise.success, promise.failure);
                    } else {
                        onGetBucket(id).then(function(bucket) {
                            handler._getFileState(id).bucket = bucket;
                            handleUpload(id).then(promise.success, promise.failure);
                        });
                    }
                } else {
                    onGetKeyName(id, name).then(function(key) {
                        onGetBucket(id).then(function(bucket) {
                            handler._getFileState(id).bucket = bucket;
                            handler._setThirdPartyFileId(id, key);
                            handleUpload(id).then(promise.success, promise.failure);
                        }, function(errorReason) {
                            promise.failure({
                                error: errorReason
                            });
                        });
                    }, function(errorReason) {
                        promise.failure({
                            error: errorReason
                        });
                    });
                }
                return promise;
            }
        });
    };

    (function() {
        "use strict";

        var FAR_FUTURE = new Date('2060-10-22'),
            HOURS_AGO,
            PENDING = 0,
            EVAPORATING = 2,
            COMPLETE = 3,
            PAUSED = 4,
            CANCELED = 5,
            ERROR = 10,
            ABORTED = 20,
            PAUSING = 30,
            PAUSED_STATUSES = [PAUSED, PAUSING],
            ACTIVE_STATUSES = [PENDING, EVAPORATING, ERROR],
            ETAG_OF_0_LENGTH_BLOB = '"d41d8cd98f00b204e9800998ecf8427e"',
            PARTS_MONITOR_INTERVAL_MS = 2 * 60 * 1000,
            IMMUTABLE_OPTIONS = [
                'maxConcurrentParts',
                'logging',
                'cloudfront',
                'encodeFilename',
                'computeContentMd5',
                'allowS3ExistenceOptimization',
                'onlyRetryForSameFileName',
                'timeUrl',
                'cryptoMd5Method',
                'cryptoHexEncodedHash256',
                'awsRegion',
                'awsSignatureVersion',
                'evaporateChanged'
            ],
            S3_EXTRA_ENCODED_CHARS = {
                33: "%21", // !
                39: "%27", // '
                40: "%28", // (
                41: "%29", // )
                42: "%2A" // *
            },
            l;

        var Evaporate = function(config) {
            this.config = extend({
                readableStreams: false,
                readableStreamPartMethod: null,
                bucket: null,
                logging: false,
                maxConcurrentParts: 5,
                partSize: 6 * 1024 * 1024,
                retryBackoffPower: 2,
                maxRetryBackoffSecs: 300,
                progressIntervalMS: 1000,
                cloudfront: false,
                s3Acceleration: false,
                mockLocalStorage: false,
                encodeFilename: true,
                computeContentMd5: true,
                allowS3ExistenceOptimization: false,
                onlyRetryForSameFileName: false,
                timeUrl: null,
                cryptoMd5Method: function(data) {
                    const md = forge.md.md5.create();
                    md.update(data);
                    return forge.util.encode64(md.digest());
                },
                cryptoHexEncodedHash256: function(data) {
                    const md = forge.md.sha256.create();
                    md.update(data);
                    return md.digest().toHex();
                },
                aws_key: null,
                awsRegion: 'us-west-1',
                awsSignatureVersion: '4',
                sendCanonicalRequestToSignerUrl: false,
                s3FileCacheHoursAgo: null, // Must be a whole number of hours. Will be interpreted as negative (hours in the past).
                signParams: {},
                signHeaders: {},
                customAuthMethod: undefined,
                maxFileSize: null,
                signResponseHandler: null,
                xhrWithCredentials: false,
                // undocumented, experimental
                localTimeOffset: undefined,
                evaporateChanged: function() {},
                abortCompletionThrottlingMs: 1000
            }, config);

            if (typeof window !== 'undefined' && window.console) {
                l = window.console;
                l.d = l.log;
                l.w = window.console.warn ? l.warn : l.d;
                l.e = window.console.error ? l.error : l.d;
            }

            this._instantiationError = this.validateEvaporateOptions();
            if (typeof this._instantiationError === 'string') {
                this.supported = false;
                return;
            } else {
                delete this._instantiationError;
            }

            if (!this.config.logging) {
                // Reset the logger to be a no_op
                l = noOpLogger();
            }

            var _d = new Date();
            HOURS_AGO = new Date(_d.setHours(_d.getHours() - (this.config.s3FileCacheHoursAgo || -100)));
            if (typeof config.localTimeOffset === 'number') {
                this.localTimeOffset = config.localTimeOffset;
            } else {
                var self = this;
                Evaporate.getLocalTimeOffset(this.config)
                    .then(function(offset) {
                        self.localTimeOffset = offset;
                    });
            }
            this.pendingFiles = {};
            this.queuedFiles = [];
            this.filesInProcess = [];
            historyCache = new HistoryCache(this.config.mockLocalStorage);
        };
        Evaporate.create = function(config) {
            var evapConfig = extend({}, config);
            return Evaporate.getLocalTimeOffset(evapConfig)
                .then(function(offset) {
                    evapConfig.localTimeOffset = offset;
                    return new Promise(function(resolve, reject) {
                        var e = new Evaporate(evapConfig);
                        if (e.supported === true) {
                            resolve(e);
                        } else {
                            reject(e._instantiationError);
                        }
                    });
                });
        };
        Evaporate.getLocalTimeOffset = function(config) {
            return new Promise(function(resolve, reject) {
                if (typeof config.localTimeOffset === 'number') {
                    return resolve(config.localTimeOffset);
                }
                if (config.timeUrl) {
                    var xhr = new XMLHttpRequest();

                    xhr.open("GET", config.timeUrl + '?requestTime=' + new Date().getTime());
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                var server_date = new Date(Date.parse(xhr.responseText)),
                                    offset = server_date - new Date();
                                l.d('localTimeOffset is', offset, 'ms');
                                resolve(offset);
                            }
                        }
                    };

                    xhr.onerror = function(xhr) {
                        l.e('xhr error timeUrl', xhr);
                        reject('Fetching offset time failed with status: ' + xhr.status);
                    };
                    xhr.send();
                } else {
                    resolve(0);
                }
            });
        };
        Evaporate.prototype.config = {};
        Evaporate.prototype.localTimeOffset = 0;
        Evaporate.prototype.supported = false;
        Evaporate.prototype._instantiationError = undefined;
        Evaporate.prototype.evaporatingCount = 0;
        Evaporate.prototype.pendingFiles = {};
        Evaporate.prototype.filesInProcess = [];
        Evaporate.prototype.queuedFiles = [];
        Evaporate.prototype.startNextFile = function(reason) {
            if (!this.queuedFiles.length ||
                this.evaporatingCount >= this.config.maxConcurrentParts) { return; }
            var fileUpload = this.queuedFiles.shift();
            if (fileUpload.status === PENDING) {
                l.d('Starting', decodeURIComponent(fileUpload.name), 'reason:', reason);
                this.evaporatingCnt(+1);
                fileUpload.start();
            } else {
                // Add the file back to the stack, it's not ready
                l.d('Requeued', decodeURIComponent(fileUpload.name), 'status:', fileUpload.status, 'reason:', reason);
                this.queuedFiles.push(fileUpload);
            }
        };
        Evaporate.prototype.fileCleanup = function(fileUpload) {
            removeAtIndex(this.queuedFiles, fileUpload);
            if (removeAtIndex(this.filesInProcess, fileUpload)) {
                this.evaporatingCnt(-1);
            }
            fileUpload.done();
            this.consumeRemainingSlots();
        };
        Evaporate.prototype.queueFile = function(fileUpload) {
            this.filesInProcess.push(fileUpload);
            this.queuedFiles.push(fileUpload);
            if (this.filesInProcess.length === 1) {
                this.startNextFile('first file');
            }
        };
        Evaporate.prototype.add = function(file, pConfig) {
            var self = this,
                fileConfig;
            return new Promise(function(resolve, reject) {
                var c = extend(pConfig, {});

                IMMUTABLE_OPTIONS.forEach(function(a) { delete c[a]; });

                fileConfig = extend(self.config, c);

                if (typeof file === 'undefined' || typeof file.file === 'undefined') {
                    return reject('Missing file');
                }
                if (fileConfig.maxFileSize && file.file.size > fileConfig.maxFileSize) {
                    return reject('File size too large. Maximum size allowed is ' + fileConfig.maxFileSize);
                }
                if (typeof file.name === 'undefined') {
                    return reject('Missing attribute: name');
                }

                if (fileConfig.encodeFilename) {
                    // correctly encode to an S3 object name, considering '/' and ' '
                    file.name = s3EncodedObjectName(file.name);
                }

                var fileUpload = new FileUpload(extend({
                        started: function() {},
                        uploadInitiated: function() {},
                        progress: function() {},
                        complete: function() {},
                        cancelled: function() {},
                        paused: function() {},
                        resumed: function() {},
                        pausing: function() {},
                        nameChanged: function() {},
                        info: function() {},
                        warn: function() {},
                        error: function() {},
                        beforeSigner: undefined,
                        xAmzHeadersAtInitiate: {},
                        notSignedHeadersAtInitiate: {},
                        xAmzHeadersCommon: null,
                        xAmzHeadersAtUpload: {},
                        xAmzHeadersAtComplete: {}
                    }, file, {
                        status: PENDING,
                        priority: 0,
                        loadedBytes: 0,
                        sizeBytes: file.file.size,
                        eTag: ''
                    }), fileConfig, self),
                    fileKey = fileUpload.id;

                self.pendingFiles[fileKey] = fileUpload;

                self.queueFile(fileUpload);

                // Resolve or reject the Add promise based on how the fileUpload completes
                fileUpload.deferredCompletion.promise
                    .then(
                        function() {
                            self.fileCleanup(fileUpload);
                            resolve(decodeURIComponent(fileUpload.name));
                        },
                        function(reason) {
                            self.fileCleanup(fileUpload);
                            reject(reason);
                        }
                    );
            })
        };
        Evaporate.prototype.cancel = function(id) {
            return typeof id === 'undefined' ? this._cancelAll() : this._cancelOne(id);
        };
        Evaporate.prototype._cancelAll = function() {
            l.d('Canceling all file uploads');
            var promises = [];
            for (var key in this.pendingFiles) {
                if (this.pendingFiles.hasOwnProperty(key)) {
                    var file = this.pendingFiles[key];
                    if (ACTIVE_STATUSES.indexOf(file.status) > -1) {
                        promises.push(file.stop());
                    }
                }
            }
            if (!promises.length) {
                promises.push(Promise.reject('No files to cancel.'));
            }
            return Promise.all(promises);
        };
        Evaporate.prototype._cancelOne = function(id) {
            var promise = [];
            if (this.pendingFiles[id]) {
                promise.push(this.pendingFiles[id].stop());
            } else {
                promise.push(Promise.reject('File does not exist'));
            }
            return Promise.all(promise);
        };
        Evaporate.prototype.pause = function(id, options) {
            options = options || {};
            var force = typeof options.force === 'undefined' ? false : options.force;
            return typeof id === 'undefined' ? this._pauseAll(force) : this._pauseOne(id, force);
        };
        Evaporate.prototype._pauseAll = function(force) {
            l.d('Pausing all file uploads');
            var promises = [];
            for (var key in this.pendingFiles) {
                if (this.pendingFiles.hasOwnProperty(key)) {
                    var file = this.pendingFiles[key];
                    if (ACTIVE_STATUSES.indexOf(file.status) > -1) {
                        this._pause(file, force, promises);
                    }
                }
            }
            return Promise.all(promises);
        };
        Evaporate.prototype._pauseOne = function(id, force) {
            var promises = [],
                file = this.pendingFiles[id];
            if (typeof file === 'undefined') {
                promises.push(Promise.reject('Cannot pause a file that has not been added.'));
            } else if (file.status === PAUSED) {
                promises.push(Promise.reject('Cannot pause a file that is already paused.'));
            }
            if (!promises.length) {
                this._pause(file, force, promises);
            }
            return Promise.all(promises);
        };
        Evaporate.prototype._pause = function(fileUpload, force, promises) {
            promises.push(fileUpload.pause(force));
            removeAtIndex(this.filesInProcess, fileUpload);
            removeAtIndex(this.queuedFiles, fileUpload);
        };
        Evaporate.prototype.resume = function(id) {
            return typeof id === 'undefined' ? this._resumeAll() : this._resumeOne(id);
        };
        Evaporate.prototype._resumeAll = function() {
            l.d('Resuming all file uploads');
            for (var key in this.pendingFiles) {
                if (this.pendingFiles.hasOwnProperty(key)) {
                    var file = this.pendingFiles[key];
                    if (PAUSED_STATUSES.indexOf(file.status) > -1) {
                        this.resumeFile(file);
                    }
                }
            }
            return Promise.resolve();
        };
        Evaporate.prototype._resumeOne = function(id) {
            var file = this.pendingFiles[id],
                promises = [];
            if (typeof file === 'undefined') {
                promises.push(Promise.reject('Cannot pause a file that does not exist.'));
            } else if (PAUSED_STATUSES.indexOf(file.status) === -1) {
                promises.push(Promise.reject('Cannot resume a file that has not been paused.'));
            } else {
                this.resumeFile(file);
            }
            return Promise.all(promises);
        };
        Evaporate.prototype.resumeFile = function(fileUpload) {
            fileUpload.resume();
            this.queueFile(fileUpload);
        };
        Evaporate.prototype.forceRetry = function() {};
        Evaporate.prototype.consumeRemainingSlots = function() {
            var avail = this.config.maxConcurrentParts - this.evaporatingCount;
            if (!avail) { return; }
            for (var i = 0; i < this.filesInProcess.length; i++) {
                var file = this.filesInProcess[i];
                var consumed = file.consumeSlots();
                if (consumed < 0) { continue; }
                avail -= consumed;
                if (!avail) { return; }
            }
        };
        Evaporate.prototype.validateEvaporateOptions = function() {
            this.supported = !(
                typeof File === 'undefined' ||
                typeof Promise === 'undefined');

            if (!this.supported) {
                return 'S3 uploader requires support for File and Promise';
            }

            if (this.config.readableStreams) {
                if (typeof this.config.readableStreamPartMethod !== 'function') {
                    return "Option readableStreamPartMethod is required when readableStreams is set."
                }
            } else {
                if (typeof Blob === 'undefined' || typeof(
                        Blob.prototype.webkitSlice ||
                        Blob.prototype.mozSlice ||
                        Blob.prototype.slice) === 'undefined') {
                    return 'S3 uploader requires support for Blob [webkitSlice || mozSlice || slice]';
                }
            }

            if (!this.config.signerUrl && typeof this.config.customAuthMethod !== 'function') {
                return "Option signerUrl is required unless customAuthMethod is present.";
            }

            if (!this.config.bucket) {
                return "The AWS 'bucket' option must be present.";
            }

            if (this.config.computeContentMd5) {
                this.supported = typeof FileReader.prototype.readAsArrayBuffer !== 'undefined';
                if (!this.supported) {
                    return 'The browser\'s FileReader object does not support readAsArrayBuffer';
                }

                if (typeof this.config.cryptoMd5Method !== 'function') {
                    return 'Option computeContentMd5 has been set but cryptoMd5Method is not defined.'
                }

                if (this.config.awsSignatureVersion === '4') {
                    if (typeof this.config.cryptoHexEncodedHash256 !== 'function') {
                        return 'Option awsSignatureVersion is 4 but cryptoHexEncodedHash256 is not defined.';
                    }
                }
            } else if (this.config.awsSignatureVersion === '4') {
                return 'Option awsSignatureVersion is 4 but computeContentMd5 is not enabled.';
            }
            return true;
        };
        Evaporate.prototype.evaporatingCnt = function(incr) {
            this.evaporatingCount = Math.max(0, this.evaporatingCount + incr);
            this.config.evaporateChanged(this, this.evaporatingCount);
        };


        function FileUpload(file, con, evaporate) {
            this.fileTotalBytesUploaded = 0;
            this.s3Parts = [];
            this.partsOnS3 = [];
            this.partsInProcess = [];
            this.partsToUpload = [];
            this.numParts = -1;
            this.con = extend({}, con);
            this.evaporate = evaporate;
            this.localTimeOffset = evaporate.localTimeOffset;
            this.deferredCompletion = defer();

            extend(this, file);

            this.id = decodeURIComponent(this.con.bucket + '/' + this.name);

            this.signParams = con.signParams;
        }
        FileUpload.prototype.con = undefined;
        FileUpload.prototype.evaporate = undefined;
        FileUpload.prototype.localTimeOffset = 0;
        FileUpload.prototype.id = undefined;
        FileUpload.prototype.status = PENDING;
        FileUpload.prototype.numParts = -1;
        FileUpload.prototype.fileTotalBytesUploaded = 0;
        FileUpload.prototype.partsInProcess = [];
        FileUpload.prototype.partsToUpload = [];
        FileUpload.prototype.s3Parts = [];
        FileUpload.prototype.partsOnS3 = [];
        FileUpload.prototype.deferredCompletion = undefined;
        FileUpload.prototype.abortedByUser = false;

        // Progress and Stats
        FileUpload.prototype.progressInterval = undefined;
        FileUpload.prototype.startTime = undefined;
        FileUpload.prototype.loaded = 0;
        FileUpload.prototype.totalUploaded = 0;
        FileUpload.prototype.updateLoaded = function(loadedNow) {
            this.loaded += loadedNow;
            this.fileTotalBytesUploaded += loadedNow;
        };
        FileUpload.prototype.progessStats = function() {
            // Adapted from https://github.com/fkjaekel
            // https://github.com/TTLabs/EvaporateJS/issues/13
            if (this.fileTotalBytesUploaded === 0) {
                return {
                    speed: 0,
                    readableSpeed: "",
                    loaded: 0,
                    totalUploaded: 0,
                    remainingSize: this.sizeBytes,
                    secondsLeft: -1,
                    fileSize: this.sizeBytes,
                };
            }

            this.totalUploaded += this.loaded;
            var delta = (new Date() - this.startTime) / 1000,
                avgSpeed = this.totalUploaded / delta,
                remainingSize = this.sizeBytes - this.fileTotalBytesUploaded,
                stats = {
                    speed: avgSpeed,
                    readableSpeed: readableFileSize(avgSpeed),
                    loaded: this.loaded,
                    totalUploaded: this.fileTotalBytesUploaded,
                    remainingSize: remainingSize,
                    secondsLeft: -1,
                    fileSize: this.sizeBytes,

                };

            if (avgSpeed > 0) {
                stats.secondsLeft = Math.round(remainingSize / avgSpeed);
            }

            return stats;
        };
        FileUpload.prototype.onProgress = function() {
            if ([ABORTED, PAUSED].indexOf(this.status) === -1) {
                this.progress(this.fileTotalBytesUploaded / this.sizeBytes, this.progessStats());
                this.loaded = 0;
            }
        };
        FileUpload.prototype.startMonitor = function() {
            clearInterval(this.progressInterval);
            this.startTime = new Date();
            this.loaded = 0;
            this.totalUploaded = 0;
            this.onProgress();
            this.progressInterval = setInterval(this.onProgress.bind(this), this.con.progressIntervalMS);
        };
        FileUpload.prototype.stopMonitor = function() {
            clearInterval(this.progressInterval);
        };

        // Evaporate proxies
        FileUpload.prototype.startNextFile = function(reason) {
            this.evaporate.startNextFile(reason);
        };
        FileUpload.prototype.evaporatingCnt = function(incr) {
            this.evaporate.evaporatingCnt(incr);
        };
        FileUpload.prototype.consumeRemainingSlots = function() {
            this.evaporate.consumeRemainingSlots();
        };
        FileUpload.prototype.getRemainingSlots = function() {
            var evapCount = this.evaporate.evaporatingCount;
            if (!this.partsInProcess.length && evapCount > 0) {
                // we can use our file slot
                evapCount -= 1;
            }
            return this.con.maxConcurrentParts - evapCount;
        };

        FileUpload.prototype.lastPartSatisfied = Promise.resolve('onStart');

        FileUpload.prototype.start = function() {
            this.status = EVAPORATING;
            this.startMonitor();
            this.started(this.id);

            if (this.uploadId) {
                l.d('resuming FileUpload ', this.id);
                return this.consumeSlots();
            }

            var awsKey = this.name;

            this.getUnfinishedFileUpload();

            var existenceOptimized = this.con.computeContentMd5 &&
                this.con.allowS3ExistenceOptimization &&
                typeof this.firstMd5Digest !== 'undefined' &&
                typeof this.eTag !== 'undefined';

            if (this.uploadId) {
                if (existenceOptimized) {
                    return this.reuseS3Object(awsKey)
                        .then(this.deferredCompletion.resolve)
                        .catch(this.uploadFileFromScratch.bind(this));
                }

                this.resumeInterruptedUpload()
                    .then(this._uploadComplete.bind(this))
                    .catch(this.uploadFileFromScratch.bind(this));
            } else {
                this.uploadFileFromScratch("");
            }
        };
        FileUpload.prototype.uploadFileFromScratch = function(reason) {
            if (ACTIVE_STATUSES.indexOf(this.status) === -1) { return; }
            l.d(reason);
            this.uploadId = undefined;
            return this.uploadFile(this.name)
                .then(this._uploadComplete.bind(this))
                .catch(this._abortUpload.bind(this));
        };
        FileUpload.prototype._uploadComplete = function() {
            this.completeUpload().then(this.deferredCompletion.resolve);
        };
        FileUpload.prototype.stop = function() {
            l.d('stopping FileUpload ', this.id);
            this.setStatus(CANCELED);
            this.info('Canceling uploads...');
            this.abortedByUser = true;
            var self = this;
            return this.abortUpload()
                .then(function() {
                    throw ("User aborted the upload");
                })
                .catch(function(reason) {
                    self.deferredCompletion.reject(reason);
                });
        };
        FileUpload.prototype.pause = function(force) {
            l.d('pausing FileUpload, force:', !!force, this.id);
            var promises = [];
            this.info('Pausing uploads...');
            this.status = PAUSING;
            if (force) {
                this.abortParts(true);
            } else {
                promises = this.partsInProcess.map(function(p) {
                    return this.s3Parts[p].awsRequest.awsDeferred.promise
                }, this);
                this.pausing();
            }
            return Promise.all(promises)
                .then(function() {
                    this.stopMonitor();
                    this.status = PAUSED;
                    this.startNextFile('pause');
                    this.paused();
                }.bind(this));
        };
        FileUpload.prototype.resume = function() {
            this.status = PENDING;
            this.resumed();
        };
        FileUpload.prototype.done = function() {
            clearInterval(this.progressInterval);
            this.startNextFile('file done');
            this.partsOnS3 = [];
            this.s3Parts = [];
        };
        FileUpload.prototype._startCompleteUpload = function(callComplete) {
            return function() {
                var promise = callComplete ? this.completeUpload() : Promise.resolve();
                promise.then(this.deferredCompletion.resolve.bind(this));
            }
        };
        FileUpload.prototype._abortUpload = function() {
            if (!this.abortedByUser) {
                var self = this;
                this.abortUpload()
                    .then(
                        function() { self.deferredCompletion.reject('File upload aborted due to a part failing to upload'); },
                        this.deferredCompletion.reject.bind(this));
            }
        };

        FileUpload.prototype.abortParts = function(pause) {
            var self = this;
            var toAbort = this.partsInProcess.slice(0);
            toAbort.forEach(function(i) {
                var s3Part = self.s3Parts[i];
                if (s3Part) {
                    s3Part.awsRequest.abort();
                    if (pause) { s3Part.status = PENDING; }
                    removeAtIndex(self.partsInProcess, s3Part.partNumber);
                    if (self.partsToUpload.length) { self.evaporatingCnt(-1); }
                }
            });
        };
        FileUpload.prototype.makeParts = function(firstPart) {
            this.numParts = Math.ceil(this.sizeBytes / this.con.partSize) || 1; // issue #58
            var partsDeferredPromises = [];

            var self = this;

            function cleanUpAfterPart(s3Part) {
                removeAtIndex(self.partsToUpload, s3Part.partNumber);
                removeAtIndex(self.partsInProcess, s3Part.partNumber);

                if (self.partsToUpload.length) { self.evaporatingCnt(-1); }
            }

            function resolve(s3Part) {
                return function() {
                    cleanUpAfterPart(s3Part);
                    if (self.partsToUpload.length) { self.consumeRemainingSlots(); }
                    if (self.partsToUpload.length < self.con.maxConcurrentParts) {
                        self.startNextFile('part resolve');
                    }
                };
            }

            function reject(s3Part) {
                return function() {
                    cleanUpAfterPart(s3Part);
                };
            }

            var limit = firstPart ? 1 : this.numParts;

            for (var part = 1; part <= limit; part++) {
                var s3Part = this.s3Parts[part];
                if (typeof s3Part !== "undefined") {
                    if (s3Part.status === COMPLETE) { continue; }
                } else {
                    s3Part = this.makePart(part, PENDING, this.sizeBytes);
                }
                s3Part.awsRequest = new PutPart(this, s3Part);
                s3Part.awsRequest.awsDeferred.promise
                    .then(resolve(s3Part), reject(s3Part));

                this.partsToUpload.push(part);
                partsDeferredPromises.push(this.s3Parts[part].awsRequest.awsDeferred.promise);
            }

            return partsDeferredPromises;
        };
        FileUpload.prototype.makePart = function(partNumber, status, size) {
            var s3Part = {
                status: status,
                loadedBytes: 0,
                loadedBytesPrevious: null,
                isEmpty: (size === 0), // issue #58
                md5_digest: null,
                partNumber: partNumber
            };

            this.s3Parts[partNumber] = s3Part;

            return s3Part;
        };
        FileUpload.prototype.setStatus = function(s) {
            this.status = s;
        };

        FileUpload.prototype.createUploadFile = function() {
            if (this.status === ABORTED) { return; }
            var fileKey = uploadKey(this),
                newUpload = {
                    awsKey: this.name,
                    bucket: this.con.bucket,
                    uploadId: this.uploadId,
                    fileSize: this.sizeBytes,
                    fileType: this.file.type,
                    lastModifiedDate: dateISOString(this.file.lastModified),
                    partSize: this.con.partSize,
                    signParams: this.con.signParams,
                    createdAt: new Date().toISOString()
                };
            saveUpload(fileKey, newUpload);
        };
        FileUpload.prototype.updateUploadFile = function(updates) {
            var fileKey = uploadKey(this),
                uploads = getSavedUploads(),
                upload = extend({}, uploads[fileKey], updates);
            saveUpload(fileKey, upload);
        };
        FileUpload.prototype.completeUploadFile = function(xhr) {
            var uploads = getSavedUploads(),
                upload = uploads[uploadKey(this)];

            if (typeof upload !== 'undefined') {
                upload.completedAt = new Date().toISOString();
                upload.eTag = this.eTag;
                upload.firstMd5Digest = this.firstMd5Digest;
                uploads[uploadKey(this)] = upload;
                historyCache.setItem('awsUploads', JSON.stringify(uploads));
            }

            this.complete(xhr, this.name, this.progessStats());
            this.setStatus(COMPLETE);
            this.onProgress();
        };
        FileUpload.prototype.removeUploadFile = function() {
            if (typeof this.file !== 'undefined') {
                removeUpload(uploadKey(this));
            }
        };
        FileUpload.prototype.getUnfinishedFileUpload = function() {
            var savedUploads = getSavedUploads(true),
                u = savedUploads[uploadKey(this)];

            if (this.canRetryUpload(u)) {
                this.uploadId = u.uploadId;
                this.name = u.awsKey;
                this.eTag = u.eTag;
                this.firstMd5Digest = u.firstMd5Digest;
                this.signParams = u.signParams;
            }
        };
        FileUpload.prototype.canRetryUpload = function(u) {
            // Must be the same file name, file size, last_modified, file type as previous upload
            if (typeof u === 'undefined') {
                return false;
            }
            var completedAt = new Date(u.completedAt || FAR_FUTURE);

            // check that the part sizes and bucket match, and if the file name of the upload
            // matches if onlyRetryForSameFileName is true
            return this.con.partSize === u.partSize &&
                completedAt > HOURS_AGO &&
                this.con.bucket === u.bucket &&
                (this.con.onlyRetryForSameFileName ? this.name === u.awsKey : true);
        };

        FileUpload.prototype.partSuccess = function(eTag, putRequest) {
            var part = putRequest.part;
            l.d(putRequest.request.step, 'ETag:', eTag);
            if (part.isEmpty || (eTag !== ETAG_OF_0_LENGTH_BLOB)) { // issue #58
                part.eTag = eTag;
                part.status = COMPLETE;
                this.partsOnS3.push(part);
                return true;
            } else {
                part.status = ERROR;
                putRequest.resetLoadedBytes();
                var msg = ['eTag matches MD5 of 0 length blob for part #', putRequest.partNumber, 'Retrying part.'].join(" ");
                l.w(msg);
                this.warn(msg);
            }
        };
        FileUpload.prototype.listPartsSuccess = function(listPartsRequest, partsXml) {
            this.info('uploadId', this.uploadId, 'is not complete. Fetching parts from part marker', listPartsRequest.partNumberMarker);
            partsXml = partsXml.replace(/(\r\n|\n|\r)/gm, ""); // strip line breaks to ease the regex requirements
            var partRegex = /<Part>(.+?)<\/Part\>/g;

            while (true) {
                var cp = (partRegex.exec(partsXml) || [])[1];
                if (!cp) { break; }

                var partSize = parseInt(elementText(cp, "Size"), 10);
                this.fileTotalBytesUploaded += partSize;
                this.partsOnS3.push({
                    eTag: elementText(cp, "ETag").replace(/&quot;/g, '"'),
                    partNumber: parseInt(elementText(cp, "PartNumber"), 10),
                    size: partSize,
                    LastModified: elementText(cp, "LastModified")
                });
            }
            return elementText(partsXml, "IsTruncated") === 'true' ? elementText(partsXml, "NextPartNumberMarker") : undefined;
        };
        FileUpload.prototype.makePartsfromPartsOnS3 = function() {
            if (ACTIVE_STATUSES.indexOf(this.status) === -1) { return; }
            this.nameChanged(this.name);
            this.partsOnS3.forEach(function(cp) {
                var uploadedPart = this.makePart(cp.partNumber, COMPLETE, cp.size);
                uploadedPart.eTag = cp.eTag;
                uploadedPart.loadedBytes = cp.size;
                uploadedPart.loadedBytesPrevious = cp.size;
                uploadedPart.finishedUploadingAt = cp.LastModified;
            }.bind(this));
        };
        FileUpload.prototype.completeUpload = function() {
            var self = this;
            return new CompleteMultipartUpload(this)
                .send()
                .then(
                    function(xhr) {
                        self.eTag = elementText(xhr.responseText, "ETag").replace(/&quot;/g, '"');
                        self.completeUploadFile(xhr);
                    });
        };
        FileUpload.prototype.getCompletedPayload = function() {
            var completeDoc = [];
            completeDoc.push('<CompleteMultipartUpload>');
            this.s3Parts.forEach(function(part, partNumber) {
                if (partNumber > 0) {
                    ['<Part><PartNumber>', partNumber, '</PartNumber><ETag>', part.eTag, '</ETag></Part>']
                    .forEach(function(a) { completeDoc.push(a); });
                }
            });
            completeDoc.push('</CompleteMultipartUpload>');

            return completeDoc.join("");
        };
        FileUpload.prototype.consumeSlots = function() {
            if (this.partsToUpload.length === 0) { return -1 }
            if (this.partsToUpload.length !== this.partsInProcess.length &&
                this.status === EVAPORATING) {

                var partsToUpload = Math.min(this.getRemainingSlots(), this.partsToUpload.length);

                if (!partsToUpload) { return -1; }

                var satisfied = 0;
                for (var i = 0; i < this.partsToUpload.length; i++) {
                    var s3Part = this.s3Parts[this.partsToUpload[i]];

                    if (s3Part.status === EVAPORATING) { continue; }

                    if (this.canStartPart(s3Part)) {
                        if (this.partsInProcess.length && this.partsToUpload.length > 1) {
                            this.evaporatingCnt(+1);
                        }
                        this.partsInProcess.push(s3Part.partNumber);
                        var awsRequest = s3Part.awsRequest;
                        this.lastPartSatisfied.then(awsRequest.delaySend.bind(awsRequest));
                        this.lastPartSatisfied = awsRequest.getStartedPromise();
                    } else { continue; }

                    satisfied += 1;

                    if (satisfied === partsToUpload) { break; }

                }
                var allInProcess = this.partsToUpload.length === this.partsInProcess.length,
                    remainingSlots = this.getRemainingSlots();
                if (allInProcess && remainingSlots > 0) {
                    // We don't need any more slots...
                    this.startNextFile('consume slots');
                }
                return remainingSlots;
            }
            return 0;
        };
        FileUpload.prototype.canStartPart = function(part) {
            return this.partsInProcess.indexOf(part.partNumber) === -1 && !part.awsRequest.errorExceptionStatus();
        };
        FileUpload.prototype.uploadFile = function(awsKey) {
            this.removeUploadFile();
            var self = this;
            return new InitiateMultipartUpload(self, awsKey)
                .send()
                .then(
                    function() {
                        self.uploadInitiated(self.uploadId);
                        self.partsToUpload = [];
                        return self.uploadParts()
                            .then(
                                function() {},
                                function(reason) {
                                    throw (reason);
                                })
                    });
        };
        FileUpload.prototype.uploadParts = function() {
            this.loaded = 0;
            this.totalUploaded = 0;
            if (ACTIVE_STATUSES.indexOf(this.status) === -1) {
                return Promise.reject('Part uploading stopped because the file was canceled');
            }
            var promises = this.makeParts();
            this.setStatus(EVAPORATING);
            this.startTime = new Date();
            this.consumeSlots();
            return Promise.all(promises);
        };
        FileUpload.prototype.abortUpload = function() {
            return new Promise(function(resolve, reject) {

                    if (typeof this.uploadId === 'undefined') {
                        resolve();
                        return;
                    }

                    new DeleteMultipartUpload(this)
                        .send()
                        .then(resolve, reject);
                }.bind(this))
                .then(
                    function() {
                        this.setStatus(ABORTED);
                        this.cancelled();
                        this.removeUploadFile();
                    }.bind(this),
                    this.deferredCompletion.reject.bind(this));
        };
        FileUpload.prototype.resumeInterruptedUpload = function() {
            return new ResumeInterruptedUpload(this)
                .send()
                .then(this.uploadParts.bind(this));
        };
        FileUpload.prototype.reuseS3Object = function(awsKey) {
            var self = this;
            // Attempt to reuse entire uploaded object on S3
            this.makeParts(1);
            this.partsToUpload = [];
            var firstS3Part = this.s3Parts[1];

            function reject(reason) {
                self.name = awsKey;
                throw (reason);
            }
            return firstS3Part.awsRequest.getPartMd5Digest()
                .then(function() {
                    if (self.firstMd5Digest === firstS3Part.md5_digest) {
                        return new ReuseS3Object(self, awsKey)
                            .send()
                            .then(
                                function(xhr) {
                                    l.d('headObject found matching object on S3.');
                                    self.completeUploadFile(xhr);
                                    self.nameChanged(self.name);
                                })
                            .catch(reject);

                    } else {
                        var msg = self.con.allowS3ExistenceOptimization ? 'File\'s first part MD5 digest does not match what was stored.' : 'allowS3ExistenceOptimization is not enabled.';
                        reject(msg);
                    }
                });
        };


        function SignedS3AWSRequest(fileUpload, request) {
            this.fileUpload = fileUpload;
            this.con = fileUpload.con;
            this.attempts = 1;
            this.localTimeOffset = this.fileUpload.localTimeOffset;
            this.awsDeferred = defer();
            this.started = defer();

            this.awsUrl = awsUrl(this.con);
            this.awsHost = uri(this.awsUrl).hostname;

            var r = extend({}, request);
            if (fileUpload.contentType) {
                r.contentType = fileUpload.contentType;
            }

            this.updateRequest(r);
        }
        SignedS3AWSRequest.prototype.fileUpload = undefined;
        SignedS3AWSRequest.prototype.con = undefined;
        SignedS3AWSRequest.prototype.awsUrl = undefined;
        SignedS3AWSRequest.prototype.awsHost = undefined;
        SignedS3AWSRequest.prototype.authorize = function() {};
        SignedS3AWSRequest.prototype.localTimeOffset = 0;
        SignedS3AWSRequest.prototype.awsDeferred = undefined;
        SignedS3AWSRequest.prototype.started = undefined;
        SignedS3AWSRequest.prototype.getPath = function() {
            var path = '/' + this.con.bucket + '/' + this.fileUpload.name;
            if (this.con.cloudfront || this.awsUrl.indexOf('cloudfront') > -1) {
                path = '/' + this.fileUpload.name;
            }
            return path;
        };

        SignedS3AWSRequest.prototype.updateRequest = function(request) {
            this.request = request;
            var SigningClass = signingVersion(this, l);
            this.signer = new SigningClass(request);
        };
        SignedS3AWSRequest.prototype.success = function() { this.awsDeferred.resolve(this.currentXhr); };
        SignedS3AWSRequest.prototype.backOffWait = function() {
            return (this.attempts === 1) ? 0 : 1000 * Math.min(
                this.con.maxRetryBackoffSecs,
                Math.pow(this.con.retryBackoffPower, this.attempts - 2)
            );
        };
        SignedS3AWSRequest.prototype.error = function(reason) {
            if (this.errorExceptionStatus()) {
                return;
            }

            this.signer.error();
            l.d(this.request.step, 'error:', this.fileUpload.id, reason);

            if (typeof this.errorHandler(reason) !== 'undefined') {
                return;
            }

            this.fileUpload.warn('Error in ', this.request.step, reason);
            this.fileUpload.setStatus(ERROR);

            var self = this,
                backOffWait = this.backOffWait();
            this.attempts += 1;

            setTimeout(function() {
                if (!self.errorExceptionStatus()) { self.trySend(); }
            }, backOffWait);
        };
        SignedS3AWSRequest.prototype.errorHandler = function() {};
        SignedS3AWSRequest.prototype.errorExceptionStatus = function() { return false; };
        SignedS3AWSRequest.prototype.getPayload = function() { return Promise.resolve(null); };
        SignedS3AWSRequest.prototype.success_status = function(xhr) {
            return (xhr.status >= 200 && xhr.status <= 299) ||
                this.request.success404 && xhr.status === 404;
        };
        SignedS3AWSRequest.prototype.stringToSign = function() {
            return encodeURIComponent(this.signer.stringToSign());
        };
        SignedS3AWSRequest.prototype.canonicalRequest = function() {
            return this.signer.canonicalRequest();
        }
        SignedS3AWSRequest.prototype.signResponse = function(payload, stringToSign, signatureDateTime) {
            var self = this;
            return new Promise(function(resolve) {
                if (typeof self.con.signResponseHandler === 'function') {
                    return self.con.signResponseHandler(payload, stringToSign, signatureDateTime)
                        .then(resolve);
                }
                resolve(payload);
            });
        };
        SignedS3AWSRequest.prototype.sendRequestToAWS = function() {
            var self = this;
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                self.currentXhr = xhr;

                var url = [self.awsUrl, self.getPath(), self.request.path].join(""),
                    all_headers = {};

                if (self.request.query_string) {
                    url += self.request.query_string;
                }
                extend(all_headers, self.request.not_signed_headers);
                extend(all_headers, self.request.x_amz_headers);

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {

                        if (self.success_status(xhr)) {
                            if (self.request.response_match &&
                                xhr.response.match(new RegExp(self.request.response_match)) === undefined) {
                                reject('AWS response does not match set pattern: ' + self.request.response_match);
                            } else {
                                resolve();
                            }
                        } else {
                            var reason = xhr.responseText ? getAwsResponse(xhr) : ' ';
                            reason += 'status:' + xhr.status;
                            reject(reason);
                        }
                    }
                };

                xhr.open(self.request.method, url);
                xhr.setRequestHeader('Authorization', self.signer.authorizationString());

                for (var key in all_headers) {
                    if (all_headers.hasOwnProperty(key)) {
                        xhr.setRequestHeader(key, all_headers[key]);
                    }
                }

                self.signer.setHeaders(xhr);

                if (self.request.contentType) {
                    xhr.setRequestHeader('Content-Type', self.request.contentType);
                }

                if (self.request.md5_digest) {
                    xhr.setRequestHeader('Content-MD5', self.request.md5_digest);
                }
                xhr.onerror = function(xhr) {
                    var reason = xhr.responseText ? getAwsResponse(xhr) : 'transport error';
                    reject(reason);
                };

                if (typeof self.request.onProgress === 'function') {
                    xhr.upload.onprogress = self.request.onProgress;
                }

                self.getPayload()
                    .then(xhr.send.bind(xhr), reject);

                setTimeout(function() { // We have to delay here or Safari will hang
                    self.started.resolve('request sent ' + self.request.step);
                }, 20);
                self.signer.payload = null;
                self.payloadPromise = undefined;
            });
        };
        //see: http://docs.amazonwebservices.com/AmazonS3/latest/dev/RESTAuthentication.html#ConstructingTheAuthenticationHeader
        SignedS3AWSRequest.prototype.authorize = function() {
            this.request.dateString = this.signer.dateString(this.localTimeOffset);
            this.request.x_amz_headers = extend(this.request.x_amz_headers, {
                'x-amz-date': this.request.dateString
            });
            return this.signer.getPayload()
                .then(function() {
                    return authorizationMethod(this).authorize();
                }.bind(this));
        };
        SignedS3AWSRequest.prototype.authorizationSuccess = function(authorization) {
            l.d(this.request.step, 'signature:', authorization);
            this.request.auth = authorization;
        };
        SignedS3AWSRequest.prototype.trySend = function() {
            var self = this;
            return this.authorize()
                .then(
                    function(value) {
                        self.authorizationSuccess(value);
                        if (self.fileUpload.status === ABORTED) { return; }
                        self.sendRequestToAWS().then(self.success.bind(self), self.error.bind(self));
                    },
                    self.error.bind(self));
        };
        SignedS3AWSRequest.prototype.send = function() {
            this.trySend();
            return this.awsDeferred.promise;
        };

        function CancelableS3AWSRequest(fileUpload, request) {
            SignedS3AWSRequest.call(this, fileUpload, request);
        }
        CancelableS3AWSRequest.prototype = Object.create(SignedS3AWSRequest.prototype);
        CancelableS3AWSRequest.prototype.constructor = CancelableS3AWSRequest;
        CancelableS3AWSRequest.prototype.errorExceptionStatus = function() {
            return [ABORTED, CANCELED].indexOf(this.fileUpload.status) > -1;
        };

        function SignedS3AWSRequestWithRetryLimit(fileUpload, request, maxRetries) {
            if (maxRetries > -1) {
                this.maxRetries = maxRetries;
            }
            SignedS3AWSRequest.call(this, fileUpload, request);
        }
        SignedS3AWSRequestWithRetryLimit.prototype = Object.create(CancelableS3AWSRequest.prototype);
        SignedS3AWSRequestWithRetryLimit.prototype.constructor = SignedS3AWSRequestWithRetryLimit;
        SignedS3AWSRequestWithRetryLimit.prototype.maxRetries = 1;
        SignedS3AWSRequestWithRetryLimit.prototype.errorHandler = function(reason) {
            if (this.attempts > this.maxRetries) {
                var msg = ['MaxRetries exceeded. Will re-upload file id ', this.fileUpload.id, ', ', reason].join("");
                l.w(msg);
                this.awsDeferred.reject(msg);
                return true;
            }
        };
        SignedS3AWSRequestWithRetryLimit.prototype.rejectedSuccess = function() {
            var reason = Array.prototype.slice.call(arguments, 1).join("");
            this.awsDeferred.reject(reason);
            return false;
        };

        // see: http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadInitiate.html
        function InitiateMultipartUpload(fileUpload, awsKey) {
            var request = {
                method: 'POST',
                path: '?uploads',
                step: 'initiate',
                x_amz_headers: fileUpload.xAmzHeadersAtInitiate,
                not_signed_headers: fileUpload.notSignedHeadersAtInitiate,
                response_match: '<UploadId>(.+)<\/UploadId>'
            };

            CancelableS3AWSRequest.call(this, fileUpload, request);
            this.awsKey = awsKey;
        }
        InitiateMultipartUpload.prototype = Object.create(CancelableS3AWSRequest.prototype);
        InitiateMultipartUpload.prototype.constructor = InitiateMultipartUpload;
        InitiateMultipartUpload.prototype.success = function() {
            var match = this.currentXhr.response.match(new RegExp(this.request.response_match));
            this.fileUpload.uploadId = match[1];
            this.fileUpload.awsKey = this.awsKey;
            l.d('InitiateMultipartUpload ID is', this.fileUpload.uploadId);
            this.fileUpload.createUploadFile();
            this.awsDeferred.resolve(this.currentXhr);
        };

        //http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadComplete.html
        function CompleteMultipartUpload(fileUpload) {
            fileUpload.info('will attempt to complete upload');
            var request = {
                method: 'POST',
                contentType: 'application/xml; charset=UTF-8',
                path: '?uploadId=' + fileUpload.uploadId,
                x_amz_headers: fileUpload.xAmzHeadersCommon || fileUpload.xAmzHeadersAtComplete,
                step: 'complete'
            };
            CancelableS3AWSRequest.call(this, fileUpload, request);
        }
        CompleteMultipartUpload.prototype = Object.create(CancelableS3AWSRequest.prototype);
        CompleteMultipartUpload.prototype.constructor = CompleteMultipartUpload;
        CompleteMultipartUpload.prototype.getPayload = function() {
            return Promise.resolve(this.fileUpload.getCompletedPayload());
        };

        //http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadComplete.html
        function ReuseS3Object(fileUpload, awsKey) {
            this.awsKey = awsKey;

            fileUpload.info('will attempt to verify existence of the file');

            var request = {
                method: 'HEAD',
                path: '',
                x_amz_headers: fileUpload.xAmzHeadersCommon,
                success404: true,
                step: 'head_object'
            };

            SignedS3AWSRequestWithRetryLimit.call(this, fileUpload, request);
        }
        ReuseS3Object.prototype = Object.create(SignedS3AWSRequestWithRetryLimit.prototype);
        ReuseS3Object.prototype.constructor = ReuseS3Object;
        ReuseS3Object.prototype.awsKey = undefined;
        ReuseS3Object.prototype.success = function() {
            var eTag = this.currentXhr.getResponseHeader('Etag');
            if (eTag !== this.fileUpload.eTag &&
                !this.rejectedSuccess('uploadId ', this.fileUpload.id, ' found on S3 but the Etag doesn\'t match.')) { return; }
            this.awsDeferred.resolve(this.currentXhr);
        };

        //http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadListParts.html
        function ResumeInterruptedUpload(fileUpload) {
            SignedS3AWSRequestWithRetryLimit.call(this, fileUpload);
            this.updateRequest(this.setupRequest(0));
        }
        ResumeInterruptedUpload.prototype = Object.create(SignedS3AWSRequestWithRetryLimit.prototype);
        ResumeInterruptedUpload.prototype.constructor = ResumeInterruptedUpload;
        ResumeInterruptedUpload.prototype.awsKey = undefined;
        ResumeInterruptedUpload.prototype.partNumberMarker = 0;
        ResumeInterruptedUpload.prototype.setupRequest = function(partNumberMarker) {
            var msg = ['setupRequest() for uploadId:', this.fileUpload.uploadId, 'for part marker:', partNumberMarker].join(" ");
            l.d(msg);

            this.fileUpload.info(msg);

            this.awsKey = this.fileUpload.name;
            this.partNumberMarker = partNumberMarker;

            var request = {
                method: 'GET',
                path: ['?uploadId=', this.fileUpload.uploadId].join(""),
                query_string: "&part-number-marker=" + partNumberMarker,
                x_amz_headers: this.fileUpload.xAmzHeadersCommon,
                step: 'get upload parts',
                success404: true
            };

            this.request = request;
            return request;
        };
        ResumeInterruptedUpload.prototype.success = function() {
            if (this.currentXhr.status === 404) {
                // Success! Upload is no longer recognized, so there is nothing to fetch
                if (this.rejectedSuccess('uploadId ', this.fileUpload.id, ' not found on S3.')) { this.awsDeferred.resolve(this.currentXhr); }
                return;
            }

            var nextPartNumber = this.fileUpload.listPartsSuccess(this, this.currentXhr.responseText);
            if (nextPartNumber) {
                var request = this.setupRequest(nextPartNumber); // let's fetch the next set of parts
                this.updateRequest(request);
                this.trySend();
            } else {
                this.fileUpload.makePartsfromPartsOnS3();
                this.awsDeferred.resolve(this.currentXhr);
            }
        };

        //http://docs.aws.amazon.com/AmazonS3/latest/API/mpUploadUploadPart.html
        function PutPart(fileUpload, part) {
            this.part = part;

            this.partNumber = part.partNumber;
            this.start = (this.partNumber - 1) * fileUpload.con.partSize;
            this.end = Math.min(this.partNumber * fileUpload.con.partSize, fileUpload.sizeBytes);

            var request = {
                method: 'PUT',
                path: '?partNumber=' + this.partNumber + '&uploadId=' + fileUpload.uploadId,
                step: 'upload #' + this.partNumber,
                x_amz_headers: fileUpload.xAmzHeadersCommon || fileUpload.xAmzHeadersAtUpload,
                contentSha256: "UNSIGNED-PAYLOAD",
                onProgress: this.onProgress.bind(this)
            };

            SignedS3AWSRequest.call(this, fileUpload, request);
        }
        PutPart.prototype = Object.create(SignedS3AWSRequest.prototype);
        PutPart.prototype.constructor = PutPart;
        PutPart.prototype.part = 1;
        PutPart.prototype.payloadPromise = undefined;
        PutPart.prototype.start = 0;
        PutPart.prototype.end = 0;
        PutPart.prototype.partNumber = undefined;
        PutPart.prototype.getPartMd5Digest = function() {
            var self = this,
                part = this.part;
            return new Promise(function(resolve, reject) {
                if (self.con.computeContentMd5 && !part.md5_digest) {
                    self.getPayload()
                        .then(function(data) {
                            var md5_digest = self.con.cryptoMd5Method(data);
                            if (self.partNumber === 1 && self.con.computeContentMd5 && typeof self.fileUpload.firstMd5Digest === "undefined") {
                                self.fileUpload.firstMd5Digest = md5_digest;
                                self.fileUpload.updateUploadFile({ firstMd5Digest: md5_digest })
                            }
                            resolve(md5_digest);
                        }, reject);
                } else {
                    resolve(part.md5_digest);
                }
            }).then(function(md5_digest) {
                if (md5_digest) {
                    l.d(self.request.step, 'MD5 digest:', md5_digest);
                    self.request.md5_digest = md5_digest;
                    self.part.md5_digest = md5_digest;
                }
            });
        };
        PutPart.prototype.sendRequestToAWS = function() {
            this.stalledInterval = setInterval(this.stalledPartMonitor(), PARTS_MONITOR_INTERVAL_MS);
            this.stalledPartMonitor();
            return SignedS3AWSRequest.prototype.sendRequestToAWS.call(this);
        };
        PutPart.prototype.send = function() {
            if (this.part.status !== COMPLETE && [ABORTED, PAUSED, CANCELED].indexOf(this.fileUpload.status) === -1) {
                l.d('uploadPart #', this.partNumber, this.attempts === 1 ? 'submitting' : 'retrying');

                this.part.status = EVAPORATING;
                this.attempts += 1;
                this.part.loadedBytesPrevious = null;

                var self = this;
                return this.getPartMd5Digest()
                    .then(function() {
                        l.d('Sending', self.request.step);
                        SignedS3AWSRequest.prototype.send.call(self);
                    });
            }
        };
        PutPart.prototype.success = function() {
            clearInterval(this.stalledInterval);
            var eTag = this.currentXhr.getResponseHeader('ETag');
            this.currentXhr = null;
            if (this.fileUpload.partSuccess(eTag, this)) { this.awsDeferred.resolve(this.currentXhr); }
        };
        PutPart.prototype.onProgress = function(evt) {
            if (evt.loaded > 0) {
                var loadedNow = evt.loaded - this.part.loadedBytes;
                if (loadedNow) {
                    this.part.loadedBytes = evt.loaded;
                    this.fileUpload.updateLoaded(loadedNow);
                }
            }
        };
        PutPart.prototype.stalledPartMonitor = function() {
            var lastLoaded = this.part.loadedBytes;
            var self = this;
            return function() {
                clearInterval(self.stalledInterval);
                if ([EVAPORATING, ERROR, PAUSING, PAUSED].indexOf(self.fileUpload.status) === -1 &&
                    self.part.status !== ABORTED &&
                    self.part.loadedBytes < this.size) {
                    if (lastLoaded === self.part.loadedBytes) {
                        l.w('Part stalled. Will abort and retry:', self.partNumber, decodeURIComponent(self.fileUpload.name));
                        self.abort();
                        if (!self.errorExceptionStatus()) {
                            self.delaySend();
                        }
                    } else {
                        self.stalledInterval = setInterval(self.stalledPartMonitor(), PARTS_MONITOR_INTERVAL_MS);
                    }
                }
            }
        };
        PutPart.prototype.resetLoadedBytes = function() {
            this.fileUpload.updateLoaded(-this.part.loadedBytes);
            this.part.loadedBytes = 0;
            this.fileUpload.onProgress();
        };
        PutPart.prototype.errorExceptionStatus = function() {
            return [CANCELED, ABORTED, PAUSED, PAUSING].indexOf(this.fileUpload.status) > -1;
        };
        PutPart.prototype.delaySend = function() {
            var backOffWait = this.backOffWait();
            this.attempts += 1;
            setTimeout(this.send.bind(this), backOffWait);
        };
        PutPart.prototype.errorHandler = function(reason) {
            clearInterval(this.stalledInterval);
            if (reason.match(/status:404/)) {
                var errMsg = '404 error on part PUT. The part and the file will abort. ' + reason;
                l.w(errMsg);
                this.fileUpload.error(errMsg);
                this.part.status = ABORTED;
                this.awsDeferred.reject(errMsg);
                return true;
            }
            this.resetLoadedBytes();
            this.part.status = ERROR;

            if (!this.errorExceptionStatus()) {
                this.delaySend();
            }
            return true;
        };
        PutPart.prototype.abort = function() {
            if (this.currentXhr) {
                this.currentXhr.abort();
            }
            this.resetLoadedBytes();
            this.attempts = 1;
        };
        PutPart.size = 0;
        PutPart.prototype.streamToArrayBuffer = function(stream) {
            return new Promise(function(resolve, reject) {
                // stream is empty or ended
                if (!stream.readable) { return resolve([]); }

                var arr = new Uint8Array(Math.min(this.con.partSize, this.end - this.start)),
                    i = 0;
                stream.on('data', onData);
                stream.on('end', onEnd);
                stream.on('error', onEnd);
                stream.on('close', onClose);

                function onData(data) {
                    if (data.byteLength === 1) { return; }
                    arr.set(data, i);
                    i += data.byteLength;
                }

                function onEnd(err) {
                    if (err) { reject(err); } else { resolve(arr); }
                    cleanup();
                }

                function onClose() {
                    resolve(arr);
                    cleanup();
                }

                function cleanup() {
                    arr = null;
                    stream.removeListener('data', onData);
                    stream.removeListener('end', onEnd);
                    stream.removeListener('error', onEnd);
                    stream.removeListener('close', onClose);
                }
            }.bind(this));
        };
        PutPart.prototype.getPayload = function() {
            if (typeof this.payloadPromise === 'undefined') {
                this.payloadPromise = this.con.readableStreams ? this.payloadFromStream() : this.payloadFromBlob();
            }
            return this.payloadPromise;
        };
        PutPart.prototype.payloadFromStream = function() {
            var stream = this.con.readableStreamPartMethod(this.fileUpload.file, this.start, this.end - 1);
            return new Promise(function(resolve, reject) {
                var streamPromise = this.streamToArrayBuffer(stream);
                streamPromise.then(function(data) {
                    resolve(data);
                }.bind(this), reject);
            }.bind(this));
        };
        PutPart.prototype.payloadFromBlob = function() {
            // browsers' implementation of the Blob.slice function has been renamed a couple of times, and the meaning of the
            // 2nd parameter changed. For example Gecko went from slice(start,length) -> mozSlice(start, end) -> slice(start, end).
            // As of 12/12/12, it seems that the unified 'slice' is the best bet, hence it being first in the list. See
            // https://developer.mozilla.org/en-US/docs/DOM/Blob for more info.
            var file = this.fileUpload.file,
                slicerFn = (file.slice ? 'slice' : (file.mozSlice ? 'mozSlice' : 'webkitSlice')),
                blob = file[slicerFn](this.start, this.end);
            if (this.con.computeContentMd5) {
                return new Promise(function(resolve) {
                    var reader = new FileReader();
                    reader.onloadend = function() {
                        var buffer = this.result && typeof this.result.buffer !== 'undefined',
                            result = buffer ? new Uint8Array(this.result.buffer) : this.result;
                        resolve(result);
                    };
                    reader.readAsArrayBuffer(blob);
                });
            }
            return Promise.resolve(blob);
        };
        PutPart.prototype.stalledInterval = -1;
        PutPart.prototype.getStartedPromise = function() {
            return this.started.promise;
        };


        //http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadAbort.html
        function DeleteMultipartUpload(fileUpload) {
            fileUpload.info('will attempt to abort the upload');

            fileUpload.abortParts();

            var request = {
                method: 'DELETE',
                path: '?uploadId=' + fileUpload.uploadId,
                x_amz_headers: fileUpload.xAmzHeadersCommon,
                success404: true,
                step: 'abort'
            };

            SignedS3AWSRequest.call(this, fileUpload, request);
        }
        DeleteMultipartUpload.prototype = Object.create(SignedS3AWSRequest.prototype);
        DeleteMultipartUpload.prototype.constructor = DeleteMultipartUpload;
        DeleteMultipartUpload.prototype.maxRetries = 1;
        DeleteMultipartUpload.prototype.success = function() {
            this.fileUpload.setStatus(ABORTED);
            this.awsDeferred.resolve(this.currentXhr);
        };
        DeleteMultipartUpload.prototype.errorHandler = function(reason) {
            if (this.attempts > this.maxRetries) {
                var msg = 'Error aborting upload, Exceeded retries deleting the file upload: ' + reason;
                l.w(msg);
                this.fileUpload.error(msg);
                this.awsDeferred.reject(msg);
                return true;
            }
        };

        function signingVersion(awsRequest, l) {
            var con = awsRequest.con;

            function AwsSignature(request) {
                this.request = request;
            }
            AwsSignature.prototype.request = {};
            AwsSignature.prototype.error = function() {};
            AwsSignature.prototype.authorizationString = function() {};
            AwsSignature.prototype.stringToSign = function() {};
            AwsSignature.prototype.canonicalRequest = function() {};
            AwsSignature.prototype.setHeaders = function() {};
            AwsSignature.prototype.datetime = function(timeOffset) {
                return new Date(new Date().getTime() + timeOffset);

            };
            AwsSignature.prototype.dateString = function(timeOffset) {
                return this.datetime(timeOffset).toISOString().slice(0, 19).replace(/-|:/g, '') + "Z";
            };

            function AwsSignatureV2(request) {
                AwsSignature.call(this, request);
            }
            AwsSignatureV2.prototype = Object.create(AwsSignature.prototype);
            AwsSignatureV2.prototype.constructor = AwsSignatureV2;
            AwsSignatureV2.prototype.authorizationString = function() {
                return ['AWS ', con.aws_key, ':', this.request.auth].join('');
            };
            AwsSignatureV2.prototype.stringToSign = function() {
                var x_amz_headers = '',
                    result, header_key_array = [];

                for (var key in this.request.x_amz_headers) {
                    if (this.request.x_amz_headers.hasOwnProperty(key)) {
                        header_key_array.push(key);
                    }
                }
                header_key_array.sort();

                header_key_array.forEach(function(header_key) {
                    x_amz_headers += (header_key + ':' + this.request.x_amz_headers[header_key] + '\n');
                }.bind(this));

                result = this.request.method + '\n' +
                    (this.request.md5_digest || '') + '\n' +
                    (this.request.contentType || '') + '\n' +
                    '\n' +
                    x_amz_headers +
                    (con.cloudfront ? '/' + con.bucket : '') +
                    awsRequest.getPath() + this.request.path;

                l.d('V2 stringToSign:', result);
                return result;

            };
            AwsSignatureV2.prototype.dateString = function(timeOffset) {
                return this.datetime(timeOffset).toUTCString();
            };
            AwsSignatureV2.prototype.getPayload = function() { return Promise.resolve(); };

            function AwsSignatureV4(request) {
                this._cr = undefined
                AwsSignature.call(this, request);
            }
            AwsSignatureV4.prototype = Object.create(AwsSignature.prototype);
            AwsSignatureV4.prototype.constructor = AwsSignatureV4;
            AwsSignatureV4.prototype._cr = undefined;
            AwsSignatureV4.prototype.payload = null;
            AwsSignatureV4.prototype.error = function() { this._cr = undefined; };
            AwsSignatureV4.prototype.getPayload = function() {
                return awsRequest.getPayload()
                    .then(function(data) {
                        this.payload = data;
                    }.bind(this));
            };
            AwsSignatureV4.prototype.authorizationString = function() {
                var authParts = [];

                var credentials = this.credentialString();
                var headers = this.canonicalHeaders();

                authParts.push(['AWS4-HMAC-SHA256 Credential=', con.aws_key, '/', credentials].join(''));
                authParts.push('SignedHeaders=' + headers.signedHeaders);
                authParts.push('Signature=' + this.request.auth);

                return authParts.join(', ');
            };
            AwsSignatureV4.prototype.stringToSign = function() {
                var signParts = [];
                signParts.push('AWS4-HMAC-SHA256');
                signParts.push(this.request.dateString);
                signParts.push(this.credentialString());
                signParts.push(con.cryptoHexEncodedHash256(this.canonicalRequest()));
                var result = signParts.join('\n');

                l.d('V4 stringToSign:', result);
                return result;
            };
            AwsSignatureV4.prototype.credentialString = function() {
                var credParts = [];

                credParts.push(this.request.dateString.slice(0, 8));
                credParts.push(con.awsRegion);
                credParts.push('s3');
                credParts.push('aws4_request');
                return credParts.join('/');
            };
            AwsSignatureV4.prototype.canonicalQueryString = function() {
                var qs = awsRequest.request.query_string || '',
                    search = uri([awsRequest.awsUrl, this.request.path, qs].join("")).search,
                    searchParts = search.length ? search.split('&') : [],
                    encoded = [],
                    nameValue,
                    i;

                for (i = 0; i < searchParts.length; i++) {
                    nameValue = searchParts[i].split("=");
                    encoded.push({
                        name: encodeURIComponent(nameValue[0]),
                        value: nameValue.length > 1 ? encodeURIComponent(nameValue[1]) : null
                    })
                }
                var sorted = encoded.sort(function(a, b) {
                    if (a.name < b.name) {
                        return -1;
                    } else if (a.name > b.name) {
                        return 1;
                    }
                    return 0;
                });

                var result = [];
                for (i = 0; i < sorted.length; i++) {
                    nameValue = sorted[i].value ? [sorted[i].name, sorted[i].value].join("=") : sorted[i].name + '=';
                    result.push(nameValue);
                }

                return result.join('&');
            };
            AwsSignatureV4.prototype.getPayloadSha256Content = function() {
                var result = this.request.contentSha256 || con.cryptoHexEncodedHash256(this.payload || '');
                l.d(this.request.step, 'getPayloadSha256Content:', result);
                return result;
            };
            AwsSignatureV4.prototype.canonicalHeaders = function() {
                var canonicalHeaders = [],
                    keys = [],
                    i;

                function addHeader(name, value) {
                    var key = name.toLowerCase();
                    keys.push(key);
                    canonicalHeaders[key] = value.replace(/\s+/g, ' ');
                }

                if (this.request.md5_digest) {
                    addHeader("Content-Md5", this.request.md5_digest);
                }

                addHeader('Host', awsRequest.awsHost);

                if (this.request.contentType) {
                    addHeader('Content-Type', this.request.contentType || '');
                }

                var amzHeaders = this.request.x_amz_headers || {};
                for (var key in amzHeaders) {
                    if (amzHeaders.hasOwnProperty(key)) {
                        addHeader(key, amzHeaders[key]);
                    }
                }

                var sortedKeys = keys.sort(function(a, b) {
                    if (a < b) {
                        return -1;
                    } else if (a > b) {
                        return 1;
                    }
                    return 0;
                });

                var result = [];

                var unsigned_headers = [],
                    not_signed = this.request.not_signed_headers || [],
                    signed_headers = [];
                for (i = 0; i < not_signed.length; i++) {
                    unsigned_headers.push(not_signed[i].toLowerCase());
                }

                for (i = 0; i < sortedKeys.length; i++) {
                    var k = sortedKeys[i];
                    result.push([k, canonicalHeaders[k]].join(":"));
                    if (unsigned_headers.indexOf(k) === -1) {
                        signed_headers.push(k);
                    }
                }

                return {
                    canonicalHeaders: result.join("\n"),
                    signedHeaders: signed_headers.join(";")
                };
            };
            AwsSignatureV4.prototype.canonicalRequest = function() {
                if (typeof this._cr !== 'undefined') { return this._cr; }
                var canonParts = [];

                canonParts.push(this.request.method);
                canonParts.push(uri([awsRequest.awsUrl, awsRequest.getPath(), this.request.path].join("")).pathname);
                canonParts.push(this.canonicalQueryString() || '');

                var headers = this.canonicalHeaders();
                canonParts.push(headers.canonicalHeaders + '\n');
                canonParts.push(headers.signedHeaders);
                canonParts.push(this.getPayloadSha256Content());

                this._cr = canonParts.join("\n");
                l.d(this.request.step, 'V4 CanonicalRequest:', this._cr);
                return this._cr;
            };
            AwsSignatureV4.prototype.setHeaders = function(xhr) {
                xhr.setRequestHeader("x-amz-content-sha256", this.getPayloadSha256Content());
            };

            return con.awsSignatureVersion === '4' ? AwsSignatureV4 : AwsSignatureV2;
        }

        function authorizationMethod(awsRequest) {
            var fileUpload = awsRequest.fileUpload,
                con = fileUpload.con,
                request = awsRequest.request;

            function AuthorizationMethod() {
                this.request = request;
            }
            AuthorizationMethod.prototype = Object.create(AuthorizationMethod.prototype);
            AuthorizationMethod.prototype.request = {};
            AuthorizationMethod.makeSignParamsObject = function(params) {
                var out = {};
                for (var param in params) {
                    if (!params.hasOwnProperty(param)) { continue; }
                    if (typeof params[param] === 'function') {
                        out[param] = params[param]();
                    } else {
                        out[param] = params[param];
                    }
                }
                return out;
            };
            AuthorizationMethod.prototype.authorize = function() {
                return new Promise(function(resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    awsRequest.currentXhr = xhr;

                    var stringToSign = awsRequest.stringToSign(),
                        url = [con.signerUrl, '?to_sign=', stringToSign, '&datetime=', request.dateString];
                    if (con.sendCanonicalRequestToSignerUrl) {
                        url.push('&canonical_request=');
                        url.push(encodeURIComponent(awsRequest.canonicalRequest()));
                    }
                    url = url.join("");

                    var signParams = AuthorizationMethod.makeSignParamsObject(fileUpload.signParams);
                    for (var param in signParams) {
                        if (!signParams.hasOwnProperty(param)) { continue; }
                        url += ('&' + encodeURIComponent(param) + '=' + encodeURIComponent(signParams[param]));
                    }

                    if (con.xhrWithCredentials) {
                        xhr.withCredentials = true;
                    }

                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                var res = xhr.response.replace(/['"]+/g, '');
                                awsRequest.signResponse(res, stringToSign, request.dateString)
                                    .then(resolve);
                            } else {
                                if ([401, 403].indexOf(xhr.status) > -1) {
                                    var reason = "status:" + xhr.status;
                                    fileUpload.deferredCompletion.reject('Permission denied ' + reason);
                                    return reject(reason);
                                }
                                reject("Signature fetch returned status: " + xhr.status);
                            }
                        }
                    };

                    xhr.onerror = function(xhr) {
                        reject('authorizedSend transport error: ' + xhr.responseText);
                    };

                    xhr.open('GET', url);
                    var signHeaders = AuthorizationMethod.makeSignParamsObject(con.signHeaders);
                    for (var header in signHeaders) {
                        if (!signHeaders.hasOwnProperty(header)) { continue; }
                        xhr.setRequestHeader(header, signHeaders[header])
                    }

                    if (typeof fileUpload.beforeSigner === 'function') {
                        fileUpload.beforeSigner(xhr, url);
                    }
                    xhr.send();
                });
            };

            function AuthorizationCustom() {
                AuthorizationMethod.call(this);
            }
            AuthorizationCustom.prototype = Object.create(AuthorizationMethod.prototype);
            AuthorizationCustom.prototype.authorize = function() {
                return con.customAuthMethod(
                        AuthorizationMethod.makeSignParamsObject(fileUpload.signParams),
                        AuthorizationMethod.makeSignParamsObject(con.signHeaders),
                        awsRequest.stringToSign(),
                        request.dateString,
                        awsRequest.canonicalRequest())
                    .catch(function(reason) {
                        fileUpload.deferredCompletion.reject(reason);
                        throw reason;
                    });
            };

            if (typeof con.customAuthMethod === 'function') {
                return new AuthorizationCustom()
            }

            return new AuthorizationMethod();
        }

        function awsUrl(con) {
            var url;
            if (con.aws_url) {
                url = [con.aws_url];
            } else {
                if (con.s3Acceleration) {
                    url = ["https://", con.bucket, ".s3-accelerate"];
                    con.cloudfront = true;
                } else {
                    url = ["https://", (con.cloudfront ? con.bucket + "." : ""), "s3"];
                    if (con.awsRegion !== "us-east-1") {
                        url.push("-", con.awsRegion);
                    }
                }
                url.push(".amazonaws.com");
            }
            return url.join("");
        }

        function s3EncodedObjectName(fileName) {
            var fileParts = fileName.split('/'),
                encodedParts = [];
            fileParts.forEach(function(p) {
                var buf = [],
                    enc = encodeURIComponent(p);
                for (var i = 0; i < enc.length; i++) {
                    buf.push(S3_EXTRA_ENCODED_CHARS[enc.charCodeAt(i)] || enc.charAt(i));
                }
                encodedParts.push(buf.join(""));
            });
            return encodedParts.join('/');
        }

        function uri(url) {
            var p,
                href = url || '/';

            try {
                p = new URL(href);
            } catch (e) {
                p = document.createElement('a');
                p.href = href;
            }

            return {
                protocol: p.protocol, // => "http:"
                hostname: p.hostname, // => "example.com"
                // IE omits the leading slash, so add it if it's missing
                pathname: p.pathname.replace(/(^\/?)/, "/"), // => "/pathname/"
                port: p.port, // => "3000"
                search: (p.search[0] === '?') ? p.search.substr(1) : p.search, // => "search=test"
                hash: p.hash, // => "#hash"
                host: p.host // => "example.com:3000"
            };
        }

        function dateISOString(date) {
            // Try to get the modified date as an ISO String, if the date exists
            return date ? new Date(date).toISOString() : '';
        }

        function getAwsResponse(xhr) {
            var code = elementText(xhr.responseText, "Code"),
                msg = elementText(xhr.responseText, "Message");
            return code.length ? ['AWS Code: ', code, ', Message:', msg].join("") : '';
        }

        function elementText(source, element) {
            var match = source.match(["<", element, ">(.+)</", element, ">"].join(""));
            return match ? match[1] : '';
        }

        function defer() {
            var deferred = {},
                promise;
            promise = new Promise(function(resolve, reject) {
                deferred = { resolve: resolve, reject: reject };
            });
            return {
                resolve: deferred.resolve,
                reject: deferred.reject,
                promise: promise
            }
        }

        function extend(obj1, obj2, obj3) {
            function ext(target, source) {
                if (typeof source !== 'object') { return; }
                for (var key in source) {
                    if (source.hasOwnProperty(key)) {
                        target[key] = source[key];
                    }
                }
            }

            obj1 = obj1 || {};
            obj2 = obj2 || {};
            obj3 = obj3 || {};
            ext(obj2, obj3);
            ext(obj1, obj2);

            return obj1;
        }

        function getSavedUploads(purge) {
            var uploads = JSON.parse(historyCache.getItem('awsUploads') || '{}');

            if (purge) {
                for (var key in uploads) {
                    if (uploads.hasOwnProperty(key)) {
                        var upload = uploads[key],
                            completedAt = new Date(upload.completedAt || FAR_FUTURE);

                        if (completedAt < HOURS_AGO) {
                            // The upload is recent, let's keep it
                            delete uploads[key];
                        }
                    }
                }

                historyCache.setItem('awsUploads', JSON.stringify(uploads));
            }

            return uploads;
        }

        function uploadKey(fileUpload) {
            // The key tries to give a signature to a file in the absence of its path.
            // "<filename>-<mimetype>-<modifieddate>-<filesize>"
            return [
                fileUpload.file.name,
                fileUpload.file.type,
                dateISOString(fileUpload.file.lastModified),
                fileUpload.sizeBytes
            ].join("-");
        }

        function saveUpload(uploadKey, upload) {
            var uploads = getSavedUploads();
            uploads[uploadKey] = upload;
            historyCache.setItem('awsUploads', JSON.stringify(uploads));
        }

        function removeUpload(uploadKey) {
            var uploads = getSavedUploads();
            delete uploads[uploadKey];
            historyCache.setItem('awsUploads', JSON.stringify(uploads));
        }

        function removeAtIndex(a, i) {
            var idx = a.indexOf(i);
            if (idx > -1) {
                a.splice(idx, 1);
                return true;
            }
        }

        function readableFileSize(size) {
            // Adapted from https://github.com/fkjaekel
            // https://github.com/TTLabs/EvaporateJS/issues/13
            var units = ['B', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'],
                i = 0;
            while (size >= 1024) {
                size /= 1024;
                ++i;
            }
            return [size.toFixed(2).replace('.00', ''), units[i]].join(" ");
        }

        var historyCache;

        function HistoryCache(mockLocalStorage) {
            var supported = HistoryCache.supported();
            this.cacheStore = mockLocalStorage ? {} : (supported ? localStorage : undefined);
        }
        HistoryCache.prototype.supported = false;
        HistoryCache.prototype.cacheStore = undefined;
        HistoryCache.prototype.getItem = function(key) { if (this.cacheStore) { return this.cacheStore[key]; } };
        HistoryCache.prototype.setItem = function(key, value) { if (this.cacheStore) { this.cacheStore[key] = value; } };
        HistoryCache.prototype.removeItem = function(key) { if (this.cacheStore) { return delete this.cacheStore[key] } };
        HistoryCache.supported = function() {
            var result = false;
            if (typeof window !== 'undefined') {
                if (!('localStorage' in window)) {
                    return result;
                }
            } else {
                return result;
            }

            // Try to use storage (it might be disabled, e.g. user is in private mode)
            try {
                var k = '___test';
                localStorage[k] = 'OK';
                var test = localStorage[k];
                delete localStorage[k];
                return test === 'OK';
            } catch (e) {
                return result;
            }
        };

        function noOpLogger() { return { d: function() {}, w: function() {}, e: function() {} }; }

        l = noOpLogger();

        if (typeof module !== 'undefined' && module.exports) {
            module.exports = Evaporate;
        } else if (typeof window !== 'undefined') {
            window.Evaporate = Evaporate;
        }

    }());
    Uploader.s3.UploaderMultipart = Evaporate;
})(window);

! function(t, e) { "object" == typeof exports && "object" == typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define([], e) : "object" == typeof exports ? exports.forge = e() : t.forge = e() }(this, function() {
    return function(t) {
        function e(n) { if (r[n]) return r[n].exports; var a = r[n] = { i: n, l: !1, exports: {} }; return t[n].call(a.exports, a, a.exports, e), a.l = !0, a.exports }
        var r = {};
        return e.m = t, e.c = r, e.i = function(t) { return t }, e.d = function(t, r, n) { e.o(t, r) || Object.defineProperty(t, r, { configurable: !1, enumerable: !0, get: n }) }, e.n = function(t) { var r = t && t.__esModule ? function() { return t.default } : function() { return t }; return e.d(r, "a", r), r }, e.o = function(t, e) { return Object.prototype.hasOwnProperty.call(t, e) }, e.p = "", e(e.s = 10)
    }([function(t, e) { t.exports = { options: { usePureJavaScript: !1 } } }, function(t, e, r) {
        var n = r(0);
        t.exports = n.md = n.md || {}, n.md.algorithms = n.md.algorithms || {}
    }, function(t, e, r) {
        function n(t) { if (8 !== t && 16 !== t && 24 !== t && 32 !== t) throw new Error("Only 8, 16, 24, or 32 bits supported: " + t) }

        function a(t) {
            if (this.data = "", this.read = 0, "string" == typeof t) this.data = t;
            else if (s.isArrayBuffer(t) || s.isArrayBufferView(t)) { var e = new Uint8Array(t); try { this.data = String.fromCharCode.apply(null, e) } catch (t) { for (var r = 0; r < e.length; ++r) this.putByte(e[r]) } } else(t instanceof a || "object" == typeof t && "string" == typeof t.data && "number" == typeof t.read) && (this.data = t.data, this.read = t.read);
            this._constructedStringLength = 0
        }

        function i(t, e) {
            e = e || {}, this.read = e.readOffset || 0, this.growSize = e.growSize || 1024;
            var r = s.isArrayBuffer(t),
                n = s.isArrayBufferView(t);
            if (r || n) return this.data = r ? new DataView(t) : new DataView(t.buffer, t.byteOffset, t.byteLength), void(this.write = "writeOffset" in e ? e.writeOffset : this.data.byteLength);
            this.data = new DataView(new ArrayBuffer(0)), this.write = 0, null !== t && void 0 !== t && this.putBytes(t), "writeOffset" in e && (this.write = e.writeOffset)
        }
        var o = r(0),
            s = t.exports = o.util = o.util || {};
        ! function() {
            function t(t) {
                if (t.source === window && t.data === e) {
                    t.stopPropagation();
                    var n = r.slice();
                    r.length = 0, n.forEach(function(t) { t() })
                }
            }
            if ("undefined" != typeof process && process.nextTick) return s.nextTick = process.nextTick, void("function" == typeof setImmediate ? s.setImmediate = setImmediate : s.setImmediate = s.nextTick);
            if ("function" == typeof setImmediate) return s.setImmediate = function() { return setImmediate.apply(void 0, arguments) }, void(s.nextTick = function(t) { return setImmediate(t) });
            if (s.setImmediate = function(t) { setTimeout(t, 0) }, "undefined" != typeof window && "function" == typeof window.postMessage) {
                var e = "forge.setImmediate",
                    r = [];
                s.setImmediate = function(t) { r.push(t), 1 === r.length && window.postMessage(e, "*") }, window.addEventListener("message", t, !0)
            }
            if ("undefined" != typeof MutationObserver) {
                var n = Date.now(),
                    a = !0,
                    i = document.createElement("div"),
                    r = [];
                new MutationObserver(function() {
                    var t = r.slice();
                    r.length = 0, t.forEach(function(t) { t() })
                }).observe(i, { attributes: !0 });
                var o = s.setImmediate;
                s.setImmediate = function(t) { Date.now() - n > 15 ? (n = Date.now(), o(t)) : (r.push(t), 1 === r.length && i.setAttribute("a", a = !a)) }
            }
            s.nextTick = s.setImmediate
        }(), s.isNodejs = "undefined" != typeof process && process.versions && process.versions.node, s.isArray = Array.isArray || function(t) { return "[object Array]" === Object.prototype.toString.call(t) }, s.isArrayBuffer = function(t) { return "undefined" != typeof ArrayBuffer && t instanceof ArrayBuffer }, s.isArrayBufferView = function(t) { return t && s.isArrayBuffer(t.buffer) && void 0 !== t.byteLength }, s.ByteBuffer = a, s.ByteStringBuffer = a;
        s.ByteStringBuffer.prototype._optimizeConstructedString = function(t) { this._constructedStringLength += t, this._constructedStringLength > 4096 && (this.data.substr(0, 1), this._constructedStringLength = 0) }, s.ByteStringBuffer.prototype.length = function() { return this.data.length - this.read }, s.ByteStringBuffer.prototype.isEmpty = function() { return this.length() <= 0 }, s.ByteStringBuffer.prototype.putByte = function(t) { return this.putBytes(String.fromCharCode(t)) }, s.ByteStringBuffer.prototype.fillWithByte = function(t, e) { t = String.fromCharCode(t); for (var r = this.data; e > 0;) 1 & e && (r += t), (e >>>= 1) > 0 && (t += t); return this.data = r, this._optimizeConstructedString(e), this }, s.ByteStringBuffer.prototype.putBytes = function(t) { return this.data += t, this._optimizeConstructedString(t.length), this }, s.ByteStringBuffer.prototype.putString = function(t) { return this.putBytes(s.encodeUtf8(t)) }, s.ByteStringBuffer.prototype.putInt16 = function(t) { return this.putBytes(String.fromCharCode(t >> 8 & 255) + String.fromCharCode(255 & t)) }, s.ByteStringBuffer.prototype.putInt24 = function(t) { return this.putBytes(String.fromCharCode(t >> 16 & 255) + String.fromCharCode(t >> 8 & 255) + String.fromCharCode(255 & t)) }, s.ByteStringBuffer.prototype.putInt32 = function(t) { return this.putBytes(String.fromCharCode(t >> 24 & 255) + String.fromCharCode(t >> 16 & 255) + String.fromCharCode(t >> 8 & 255) + String.fromCharCode(255 & t)) }, s.ByteStringBuffer.prototype.putInt16Le = function(t) { return this.putBytes(String.fromCharCode(255 & t) + String.fromCharCode(t >> 8 & 255)) }, s.ByteStringBuffer.prototype.putInt24Le = function(t) { return this.putBytes(String.fromCharCode(255 & t) + String.fromCharCode(t >> 8 & 255) + String.fromCharCode(t >> 16 & 255)) }, s.ByteStringBuffer.prototype.putInt32Le = function(t) { return this.putBytes(String.fromCharCode(255 & t) + String.fromCharCode(t >> 8 & 255) + String.fromCharCode(t >> 16 & 255) + String.fromCharCode(t >> 24 & 255)) }, s.ByteStringBuffer.prototype.putInt = function(t, e) {
            n(e);
            var r = "";
            do { e -= 8, r += String.fromCharCode(t >> e & 255) } while (e > 0);
            return this.putBytes(r)
        }, s.ByteStringBuffer.prototype.putSignedInt = function(t, e) { return t < 0 && (t += 2 << e - 1), this.putInt(t, e) }, s.ByteStringBuffer.prototype.putBuffer = function(t) { return this.putBytes(t.getBytes()) }, s.ByteStringBuffer.prototype.getByte = function() { return this.data.charCodeAt(this.read++) }, s.ByteStringBuffer.prototype.getInt16 = function() { var t = this.data.charCodeAt(this.read) << 8 ^ this.data.charCodeAt(this.read + 1); return this.read += 2, t }, s.ByteStringBuffer.prototype.getInt24 = function() { var t = this.data.charCodeAt(this.read) << 16 ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2); return this.read += 3, t }, s.ByteStringBuffer.prototype.getInt32 = function() { var t = this.data.charCodeAt(this.read) << 24 ^ this.data.charCodeAt(this.read + 1) << 16 ^ this.data.charCodeAt(this.read + 2) << 8 ^ this.data.charCodeAt(this.read + 3); return this.read += 4, t }, s.ByteStringBuffer.prototype.getInt16Le = function() { var t = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8; return this.read += 2, t }, s.ByteStringBuffer.prototype.getInt24Le = function() { var t = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2) << 16; return this.read += 3, t }, s.ByteStringBuffer.prototype.getInt32Le = function() { var t = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2) << 16 ^ this.data.charCodeAt(this.read + 3) << 24; return this.read += 4, t }, s.ByteStringBuffer.prototype.getInt = function(t) {
            n(t);
            var e = 0;
            do { e = (e << 8) + this.data.charCodeAt(this.read++), t -= 8 } while (t > 0);
            return e
        }, s.ByteStringBuffer.prototype.getSignedInt = function(t) {
            var e = this.getInt(t),
                r = 2 << t - 2;
            return e >= r && (e -= r << 1), e
        }, s.ByteStringBuffer.prototype.getBytes = function(t) { var e; return t ? (t = Math.min(this.length(), t), e = this.data.slice(this.read, this.read + t), this.read += t) : 0 === t ? e = "" : (e = 0 === this.read ? this.data : this.data.slice(this.read), this.clear()), e }, s.ByteStringBuffer.prototype.bytes = function(t) { return void 0 === t ? this.data.slice(this.read) : this.data.slice(this.read, this.read + t) }, s.ByteStringBuffer.prototype.at = function(t) { return this.data.charCodeAt(this.read + t) }, s.ByteStringBuffer.prototype.setAt = function(t, e) { return this.data = this.data.substr(0, this.read + t) + String.fromCharCode(e) + this.data.substr(this.read + t + 1), this }, s.ByteStringBuffer.prototype.last = function() { return this.data.charCodeAt(this.data.length - 1) }, s.ByteStringBuffer.prototype.copy = function() { var t = s.createBuffer(this.data); return t.read = this.read, t }, s.ByteStringBuffer.prototype.compact = function() { return this.read > 0 && (this.data = this.data.slice(this.read), this.read = 0), this }, s.ByteStringBuffer.prototype.clear = function() { return this.data = "", this.read = 0, this }, s.ByteStringBuffer.prototype.truncate = function(t) { var e = Math.max(0, this.length() - t); return this.data = this.data.substr(this.read, e), this.read = 0, this }, s.ByteStringBuffer.prototype.toHex = function() {
            for (var t = "", e = this.read; e < this.data.length; ++e) {
                var r = this.data.charCodeAt(e);
                r < 16 && (t += "0"), t += r.toString(16)
            }
            return t
        }, s.ByteStringBuffer.prototype.toString = function() { return s.decodeUtf8(this.bytes()) }, s.DataBuffer = i, s.DataBuffer.prototype.length = function() { return this.write - this.read }, s.DataBuffer.prototype.isEmpty = function() { return this.length() <= 0 }, s.DataBuffer.prototype.accommodate = function(t, e) {
            if (this.length() >= t) return this;
            e = Math.max(e || this.growSize, t);
            var r = new Uint8Array(this.data.buffer, this.data.byteOffset, this.data.byteLength),
                n = new Uint8Array(this.length() + e);
            return n.set(r), this.data = new DataView(n.buffer), this
        }, s.DataBuffer.prototype.putByte = function(t) { return this.accommodate(1), this.data.setUint8(this.write++, t), this }, s.DataBuffer.prototype.fillWithByte = function(t, e) { this.accommodate(e); for (var r = 0; r < e; ++r) this.data.setUint8(t); return this }, s.DataBuffer.prototype.putBytes = function(t, e) {
            if (s.isArrayBufferView(t)) {
                var r = new Uint8Array(t.buffer, t.byteOffset, t.byteLength),
                    n = r.byteLength - r.byteOffset;
                this.accommodate(n);
                var a = new Uint8Array(this.data.buffer, this.write);
                return a.set(r), this.write += n, this
            }
            if (s.isArrayBuffer(t)) {
                var r = new Uint8Array(t);
                this.accommodate(r.byteLength);
                var a = new Uint8Array(this.data.buffer);
                return a.set(r, this.write), this.write += r.byteLength, this
            }
            if (t instanceof s.DataBuffer || "object" == typeof t && "number" == typeof t.read && "number" == typeof t.write && s.isArrayBufferView(t.data)) {
                var r = new Uint8Array(t.data.byteLength, t.read, t.length());
                this.accommodate(r.byteLength);
                var a = new Uint8Array(t.data.byteLength, this.write);
                return a.set(r), this.write += r.byteLength, this
            }
            if (t instanceof s.ByteStringBuffer && (t = t.data, e = "binary"), e = e || "binary", "string" == typeof t) { var i; if ("hex" === e) return this.accommodate(Math.ceil(t.length / 2)), i = new Uint8Array(this.data.buffer, this.write), this.write += s.binary.hex.decode(t, i, this.write), this; if ("base64" === e) return this.accommodate(3 * Math.ceil(t.length / 4)), i = new Uint8Array(this.data.buffer, this.write), this.write += s.binary.base64.decode(t, i, this.write), this; if ("utf8" === e && (t = s.encodeUtf8(t), e = "binary"), "binary" === e || "raw" === e) return this.accommodate(t.length), i = new Uint8Array(this.data.buffer, this.write), this.write += s.binary.raw.decode(i), this; if ("utf16" === e) return this.accommodate(2 * t.length), i = new Uint16Array(this.data.buffer, this.write), this.write += s.text.utf16.encode(i), this; throw new Error("Invalid encoding: " + e) }
            throw Error("Invalid parameter: " + t)
        }, s.DataBuffer.prototype.putBuffer = function(t) { return this.putBytes(t), t.clear(), this }, s.DataBuffer.prototype.putString = function(t) { return this.putBytes(t, "utf16") }, s.DataBuffer.prototype.putInt16 = function(t) { return this.accommodate(2), this.data.setInt16(this.write, t), this.write += 2, this }, s.DataBuffer.prototype.putInt24 = function(t) { return this.accommodate(3), this.data.setInt16(this.write, t >> 8 & 65535), this.data.setInt8(this.write, t >> 16 & 255), this.write += 3, this }, s.DataBuffer.prototype.putInt32 = function(t) { return this.accommodate(4), this.data.setInt32(this.write, t), this.write += 4, this }, s.DataBuffer.prototype.putInt16Le = function(t) { return this.accommodate(2), this.data.setInt16(this.write, t, !0), this.write += 2, this }, s.DataBuffer.prototype.putInt24Le = function(t) { return this.accommodate(3), this.data.setInt8(this.write, t >> 16 & 255), this.data.setInt16(this.write, t >> 8 & 65535, !0), this.write += 3, this }, s.DataBuffer.prototype.putInt32Le = function(t) { return this.accommodate(4), this.data.setInt32(this.write, t, !0), this.write += 4, this }, s.DataBuffer.prototype.putInt = function(t, e) {
            n(e), this.accommodate(e / 8);
            do { e -= 8, this.data.setInt8(this.write++, t >> e & 255) } while (e > 0);
            return this
        }, s.DataBuffer.prototype.putSignedInt = function(t, e) { return n(e), this.accommodate(e / 8), t < 0 && (t += 2 << e - 1), this.putInt(t, e) }, s.DataBuffer.prototype.getByte = function() { return this.data.getInt8(this.read++) }, s.DataBuffer.prototype.getInt16 = function() { var t = this.data.getInt16(this.read); return this.read += 2, t }, s.DataBuffer.prototype.getInt24 = function() { var t = this.data.getInt16(this.read) << 8 ^ this.data.getInt8(this.read + 2); return this.read += 3, t }, s.DataBuffer.prototype.getInt32 = function() { var t = this.data.getInt32(this.read); return this.read += 4, t }, s.DataBuffer.prototype.getInt16Le = function() { var t = this.data.getInt16(this.read, !0); return this.read += 2, t }, s.DataBuffer.prototype.getInt24Le = function() { var t = this.data.getInt8(this.read) ^ this.data.getInt16(this.read + 1, !0) << 8; return this.read += 3, t }, s.DataBuffer.prototype.getInt32Le = function() { var t = this.data.getInt32(this.read, !0); return this.read += 4, t }, s.DataBuffer.prototype.getInt = function(t) {
            n(t);
            var e = 0;
            do { e = (e << 8) + this.data.getInt8(this.read++), t -= 8 } while (t > 0);
            return e
        }, s.DataBuffer.prototype.getSignedInt = function(t) {
            var e = this.getInt(t),
                r = 2 << t - 2;
            return e >= r && (e -= r << 1), e
        }, s.DataBuffer.prototype.getBytes = function(t) { var e; return t ? (t = Math.min(this.length(), t), e = this.data.slice(this.read, this.read + t), this.read += t) : 0 === t ? e = "" : (e = 0 === this.read ? this.data : this.data.slice(this.read), this.clear()), e }, s.DataBuffer.prototype.bytes = function(t) { return void 0 === t ? this.data.slice(this.read) : this.data.slice(this.read, this.read + t) }, s.DataBuffer.prototype.at = function(t) { return this.data.getUint8(this.read + t) }, s.DataBuffer.prototype.setAt = function(t, e) { return this.data.setUint8(t, e), this }, s.DataBuffer.prototype.last = function() { return this.data.getUint8(this.write - 1) }, s.DataBuffer.prototype.copy = function() { return new s.DataBuffer(this) }, s.DataBuffer.prototype.compact = function() {
            if (this.read > 0) {
                var t = new Uint8Array(this.data.buffer, this.read),
                    e = new Uint8Array(t.byteLength);
                e.set(t), this.data = new DataView(e), this.write -= this.read, this.read = 0
            }
            return this
        }, s.DataBuffer.prototype.clear = function() { return this.data = new DataView(new ArrayBuffer(0)), this.read = this.write = 0, this }, s.DataBuffer.prototype.truncate = function(t) { return this.write = Math.max(0, this.length() - t), this.read = Math.min(this.read, this.write), this }, s.DataBuffer.prototype.toHex = function() {
            for (var t = "", e = this.read; e < this.data.byteLength; ++e) {
                var r = this.data.getUint8(e);
                r < 16 && (t += "0"), t += r.toString(16)
            }
            return t
        }, s.DataBuffer.prototype.toString = function(t) { var e = new Uint8Array(this.data, this.read, this.length()); if ("binary" === (t = t || "utf8") || "raw" === t) return s.binary.raw.encode(e); if ("hex" === t) return s.binary.hex.encode(e); if ("base64" === t) return s.binary.base64.encode(e); if ("utf8" === t) return s.text.utf8.decode(e); if ("utf16" === t) return s.text.utf16.decode(e); throw new Error("Invalid encoding: " + t) }, s.createBuffer = function(t, e) { return e = e || "raw", void 0 !== t && "utf8" === e && (t = s.encodeUtf8(t)), new s.ByteBuffer(t) }, s.fillString = function(t, e) { for (var r = ""; e > 0;) 1 & e && (r += t), (e >>>= 1) > 0 && (t += t); return r }, s.xorBytes = function(t, e, r) { for (var n = "", a = "", i = "", o = 0, s = 0; r > 0; --r, ++o) a = t.charCodeAt(o) ^ e.charCodeAt(o), s >= 10 && (n += i, i = "", s = 0), i += String.fromCharCode(a), ++s; return n += i }, s.hexToBytes = function(t) {
            var e = "",
                r = 0;
            for (!0 & t.length && (r = 1, e += String.fromCharCode(parseInt(t[0], 16))); r < t.length; r += 2) e += String.fromCharCode(parseInt(t.substr(r, 2), 16));
            return e
        }, s.bytesToHex = function(t) { return s.createBuffer(t).toHex() }, s.int32ToBytes = function(t) { return String.fromCharCode(t >> 24 & 255) + String.fromCharCode(t >> 16 & 255) + String.fromCharCode(t >> 8 & 255) + String.fromCharCode(255 & t) };
        var h = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
            u = [62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, 64, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
        s.encode64 = function(t, e) { for (var r, n, a, i = "", o = "", s = 0; s < t.length;) r = t.charCodeAt(s++), n = t.charCodeAt(s++), a = t.charCodeAt(s++), i += h.charAt(r >> 2), i += h.charAt((3 & r) << 4 | n >> 4), isNaN(n) ? i += "==" : (i += h.charAt((15 & n) << 2 | a >> 6), i += isNaN(a) ? "=" : h.charAt(63 & a)), e && i.length > e && (o += i.substr(0, e) + "\r\n", i = i.substr(e)); return o += i }, s.decode64 = function(t) { t = t.replace(/[^A-Za-z0-9\+\/\=]/g, ""); for (var e, r, n, a, i = "", o = 0; o < t.length;) e = u[t.charCodeAt(o++) - 43], r = u[t.charCodeAt(o++) - 43], n = u[t.charCodeAt(o++) - 43], a = u[t.charCodeAt(o++) - 43], i += String.fromCharCode(e << 2 | r >> 4), 64 !== n && (i += String.fromCharCode((15 & r) << 4 | n >> 2), 64 !== a && (i += String.fromCharCode((3 & n) << 6 | a))); return i }, s.encodeUtf8 = function(t) { return unescape(encodeURIComponent(t)) }, s.decodeUtf8 = function(t) { return decodeURIComponent(escape(t)) }, s.binary = { raw: {}, hex: {}, base64: {} }, s.binary.raw.encode = function(t) { return String.fromCharCode.apply(null, t) }, s.binary.raw.decode = function(t, e, r) {
            var n = e;
            n || (n = new Uint8Array(t.length)), r = r || 0;
            for (var a = r, i = 0; i < t.length; ++i) n[a++] = t.charCodeAt(i);
            return e ? a - r : n
        }, s.binary.hex.encode = s.bytesToHex, s.binary.hex.decode = function(t, e, r) {
            var n = e;
            n || (n = new Uint8Array(Math.ceil(t.length / 2))), r = r || 0;
            var a = 0,
                i = r;
            for (1 & t.length && (a = 1, n[i++] = parseInt(t[0], 16)); a < t.length; a += 2) n[i++] = parseInt(t.substr(a, 2), 16);
            return e ? i - r : n
        }, s.binary.base64.encode = function(t, e) { for (var r, n, a, i = "", o = "", s = 0; s < t.byteLength;) r = t[s++], n = t[s++], a = t[s++], i += h.charAt(r >> 2), i += h.charAt((3 & r) << 4 | n >> 4), isNaN(n) ? i += "==" : (i += h.charAt((15 & n) << 2 | a >> 6), i += isNaN(a) ? "=" : h.charAt(63 & a)), e && i.length > e && (o += i.substr(0, e) + "\r\n", i = i.substr(e)); return o += i }, s.binary.base64.decode = function(t, e, r) {
            var n = e;
            n || (n = new Uint8Array(3 * Math.ceil(t.length / 4))), t = t.replace(/[^A-Za-z0-9\+\/\=]/g, ""), r = r || 0;
            for (var a, i, o, s, h = 0, f = r; h < t.length;) a = u[t.charCodeAt(h++) - 43], i = u[t.charCodeAt(h++) - 43], o = u[t.charCodeAt(h++) - 43], s = u[t.charCodeAt(h++) - 43], n[f++] = a << 2 | i >> 4, 64 !== o && (n[f++] = (15 & i) << 4 | o >> 2, 64 !== s && (n[f++] = (3 & o) << 6 | s));
            return e ? f - r : n.subarray(0, f)
        }, s.text = { utf8: {}, utf16: {} }, s.text.utf8.encode = function(t, e, r) {
            t = s.encodeUtf8(t);
            var n = e;
            n || (n = new Uint8Array(t.length)), r = r || 0;
            for (var a = r, i = 0; i < t.length; ++i) n[a++] = t.charCodeAt(i);
            return e ? a - r : n
        }, s.text.utf8.decode = function(t) { return s.decodeUtf8(String.fromCharCode.apply(null, t)) }, s.text.utf16.encode = function(t, e, r) {
            var n = e;
            n || (n = new Uint8Array(2 * t.length));
            var a = new Uint16Array(n.buffer);
            r = r || 0;
            for (var i = r, o = r, s = 0; s < t.length; ++s) a[o++] = t.charCodeAt(s), i += 2;
            return e ? i - r : n
        }, s.text.utf16.decode = function(t) { return String.fromCharCode.apply(null, new Uint16Array(t.buffer)) }, s.deflate = function(t, e, r) {
            if (e = s.decode64(t.deflate(s.encode64(e)).rval), r) {
                var n = 2;
                32 & e.charCodeAt(1) && (n = 6), e = e.substring(n, e.length - 4)
            }
            return e
        }, s.inflate = function(t, e, r) { var n = t.inflate(s.encode64(e)).rval; return null === n ? null : s.decode64(n) };
        var f = function(t, e, r) { if (!t) throw new Error("WebStorage not available."); var n; if (null === r ? n = t.removeItem(e) : (r = s.encode64(JSON.stringify(r)), n = t.setItem(e, r)), void 0 !== n && !0 !== n.rval) { var a = new Error(n.error.message); throw a.id = n.error.id, a.name = n.error.name, a } },
            l = function(t, e) {
                if (!t) throw new Error("WebStorage not available.");
                var r = t.getItem(e);
                if (t.init)
                    if (null === r.rval) {
                        if (r.error) { var n = new Error(r.error.message); throw n.id = r.error.id, n.name = r.error.name, n }
                        r = null
                    } else r = r.rval;
                return null !== r && (r = JSON.parse(s.decode64(r))), r
            },
            g = function(t, e, r, n) {
                var a = l(t, e);
                null === a && (a = {}), a[r] = n, f(t, e, a)
            },
            c = function(t, e, r) { var n = l(t, e); return null !== n && (n = r in n ? n[r] : null), n },
            d = function(t, e, r) {
                var n = l(t, e);
                if (null !== n && r in n) {
                    delete n[r];
                    var a = !0;
                    for (var i in n) { a = !1; break }
                    a && (n = null), f(t, e, n)
                }
            },
            p = function(t, e) { f(t, e, null) },
            y = function(t, e, r) {
                var n = null;
                void 0 === r && (r = ["web", "flash"]);
                var a, i = !1,
                    o = null;
                for (var s in r) {
                    a = r[s];
                    try {
                        if ("flash" === a || "both" === a) {
                            if (null === e[0]) throw new Error("Flash local storage not available.");
                            n = t.apply(this, e), i = "flash" === a
                        }
                        "web" !== a && "both" !== a || (e[0] = localStorage, n = t.apply(this, e), i = !0)
                    } catch (t) { o = t }
                    if (i) break
                }
                if (!i) throw o;
                return n
            };
        s.setItem = function(t, e, r, n, a) { y(g, arguments, a) }, s.getItem = function(t, e, r, n) { return y(c, arguments, n) }, s.removeItem = function(t, e, r, n) { y(d, arguments, n) }, s.clearItems = function(t, e, r) { y(p, arguments, r) }, s.parseUrl = function(t) {
            var e = /^(https?):\/\/([^:&^\/]*):?(\d*)(.*)$/g;
            e.lastIndex = 0;
            var r = e.exec(t),
                n = null === r ? null : { full: t, scheme: r[1], host: r[2], port: r[3], path: r[4] };
            return n && (n.fullHost = n.host, n.port ? 80 !== n.port && "http" === n.scheme ? n.fullHost += ":" + n.port : 443 !== n.port && "https" === n.scheme && (n.fullHost += ":" + n.port) : "http" === n.scheme ? n.port = 80 : "https" === n.scheme && (n.port = 443), n.full = n.scheme + "://" + n.fullHost), n
        };
        var m = null;
        s.getQueryVariables = function(t) {
            var e, r = function(t) {
                for (var e = {}, r = t.split("&"), n = 0; n < r.length; n++) {
                    var a, i, o = r[n].indexOf("=");
                    o > 0 ? (a = r[n].substring(0, o), i = r[n].substring(o + 1)) : (a = r[n], i = null), a in e || (e[a] = []), a in Object.prototype || null === i || e[a].push(unescape(i))
                }
                return e
            };
            return void 0 === t ? (null === m && (m = "undefined" != typeof window && window.location && window.location.search ? r(window.location.search.substring(1)) : {}), e = m) : e = r(t), e
        }, s.parseFragment = function(t) {
            var e = t,
                r = "",
                n = t.indexOf("?");
            n > 0 && (e = t.substring(0, n), r = t.substring(n + 1));
            var a = e.split("/");
            return a.length > 0 && "" === a[0] && a.shift(), { pathString: e, queryString: r, path: a, query: "" === r ? {} : s.getQueryVariables(r) }
        }, s.makeRequest = function(t) {
            var e = s.parseFragment(t),
                r = { path: e.pathString, query: e.queryString, getPath: function(t) { return void 0 === t ? e.path : e.path[t] }, getQuery: function(t, r) { var n; return void 0 === t ? n = e.query : (n = e.query[t]) && void 0 !== r && (n = n[r]), n }, getQueryLast: function(t, e) { var n = r.getQuery(t); return n ? n[n.length - 1] : e } };
            return r
        }, s.makeLink = function(t, e, r) { t = jQuery.isArray(t) ? t.join("/") : t; var n = jQuery.param(e || {}); return r = r || "", t + (n.length > 0 ? "?" + n : "") + (r.length > 0 ? "#" + r : "") }, s.setPath = function(t, e, r) {
            if ("object" == typeof t && null !== t)
                for (var n = 0, a = e.length; n < a;) {
                    var i = e[n++];
                    if (n == a) t[i] = r;
                    else {
                        var o = i in t;
                        (!o || o && "object" != typeof t[i] || o && null === t[i]) && (t[i] = {}), t = t[i]
                    }
                }
        }, s.getPath = function(t, e, r) {
            for (var n = 0, a = e.length, i = !0; i && n < a && "object" == typeof t && null !== t;) {
                var o = e[n++];
                i = o in t, i && (t = t[o])
            }
            return i ? t : r
        }, s.deletePath = function(t, e) {
            if ("object" == typeof t && null !== t)
                for (var r = 0, n = e.length; r < n;) {
                    var a = e[r++];
                    if (r == n) delete t[a];
                    else {
                        if (!(a in t) || "object" != typeof t[a] || null === t[a]) break;
                        t = t[a]
                    }
                }
        }, s.isEmpty = function(t) {
            for (var e in t)
                if (t.hasOwnProperty(e)) return !1;
            return !0
        }, s.format = function(t) {
            for (var e, r, n = /%./g, a = 0, i = [], o = 0; e = n.exec(t);) {
                r = t.substring(o, n.lastIndex - 2), r.length > 0 && i.push(r), o = n.lastIndex;
                var s = e[0][1];
                switch (s) {
                    case "s":
                    case "o":
                        a < arguments.length ? i.push(arguments[1 + a++]) : i.push("<?>");
                        break;
                    case "%":
                        i.push("%");
                        break;
                    default:
                        i.push("<%" + s + "?>")
                }
            }
            return i.push(t.substring(o)), i.join("")
        }, s.formatNumber = function(t, e, r, n) {
            var a = t,
                i = isNaN(e = Math.abs(e)) ? 2 : e,
                o = void 0 === r ? "," : r,
                s = void 0 === n ? "." : n,
                h = a < 0 ? "-" : "",
                u = parseInt(a = Math.abs(+a || 0).toFixed(i), 10) + "",
                f = u.length > 3 ? u.length % 3 : 0;
            return h + (f ? u.substr(0, f) + s : "") + u.substr(f).replace(/(\d{3})(?=\d)/g, "$1" + s) + (i ? o + Math.abs(a - u).toFixed(i).slice(2) : "")
        }, s.formatSize = function(t) { return t = t >= 1073741824 ? s.formatNumber(t / 1073741824, 2, ".", "") + " GiB" : t >= 1048576 ? s.formatNumber(t / 1048576, 2, ".", "") + " MiB" : t >= 1024 ? s.formatNumber(t / 1024, 0) + " KiB" : s.formatNumber(t, 0) + " bytes" }, s.bytesFromIP = function(t) { return -1 !== t.indexOf(".") ? s.bytesFromIPv4(t) : -1 !== t.indexOf(":") ? s.bytesFromIPv6(t) : null }, s.bytesFromIPv4 = function(t) {
            if (t = t.split("."), 4 !== t.length) return null;
            for (var e = s.createBuffer(), r = 0; r < t.length; ++r) {
                var n = parseInt(t[r], 10);
                if (isNaN(n)) return null;
                e.putByte(n)
            }
            return e.getBytes()
        }, s.bytesFromIPv6 = function(t) {
            var e = 0;
            t = t.split(":").filter(function(t) { return 0 === t.length && ++e, !0 });
            for (var r = 2 * (8 - t.length + e), n = s.createBuffer(), a = 0; a < 8; ++a)
                if (t[a] && 0 !== t[a].length) {
                    var i = s.hexToBytes(t[a]);
                    i.length < 2 && n.putByte(0), n.putBytes(i)
                } else n.fillWithByte(0, r), r = 0;
            return n.getBytes()
        }, s.bytesToIP = function(t) { return 4 === t.length ? s.bytesToIPv4(t) : 16 === t.length ? s.bytesToIPv6(t) : null }, s.bytesToIPv4 = function(t) { if (4 !== t.length) return null; for (var e = [], r = 0; r < t.length; ++r) e.push(t.charCodeAt(r)); return e.join(".") }, s.bytesToIPv6 = function(t) {
            if (16 !== t.length) return null;
            for (var e = [], r = [], n = 0, a = 0; a < t.length; a += 2) {
                for (var i = s.bytesToHex(t[a] + t[a + 1]);
                    "0" === i[0] && "0" !== i;) i = i.substr(1);
                if ("0" === i) {
                    var o = r[r.length - 1],
                        h = e.length;
                    o && h === o.end + 1 ? (o.end = h, o.end - o.start > r[n].end - r[n].start && (n = r.length - 1)) : r.push({ start: h, end: h })
                }
                e.push(i)
            }
            if (r.length > 0) {
                var u = r[n];
                u.end - u.start > 0 && (e.splice(u.start, u.end - u.start + 1, ""), 0 === u.start && e.unshift(""), 7 === u.end && e.push(""))
            }
            return e.join(":")
        }, s.estimateCores = function(t, e) {
            function r(t, o, h) {
                if (0 === o) { var u = Math.floor(t.reduce(function(t, e) { return t + e }, 0) / t.length); return s.cores = Math.max(1, u), URL.revokeObjectURL(i), e(null, s.cores) }
                n(h, function(e, n) { t.push(a(h, n)), r(t, o - 1, h) })
            }

            function n(t, e) {
                for (var r = [], n = [], a = 0; a < t; ++a) {
                    var o = new Worker(i);
                    o.addEventListener("message", function(a) {
                        if (n.push(a.data), n.length === t) {
                            for (var i = 0; i < t; ++i) r[i].terminate();
                            e(null, n)
                        }
                    }), r.push(o)
                }
                for (var a = 0; a < t; ++a) r[a].postMessage(a)
            }

            function a(t, e) {
                for (var r = [], n = 0; n < t; ++n)
                    for (var a = e[n], i = r[n] = [], o = 0; o < t; ++o)
                        if (n !== o) {
                            var s = e[o];
                            (a.st > s.st && a.st < s.et || s.st > a.st && s.st < a.et) && i.push(o)
                        }
                return r.reduce(function(t, e) { return Math.max(t, e.length) }, 0)
            }
            if ("function" == typeof t && (e = t, t = {}), t = t || {}, "cores" in s && !t.update) return e(null, s.cores);
            if ("undefined" != typeof navigator && "hardwareConcurrency" in navigator && navigator.hardwareConcurrency > 0) return s.cores = navigator.hardwareConcurrency, e(null, s.cores);
            if ("undefined" == typeof Worker) return s.cores = 1, e(null, s.cores);
            if ("undefined" == typeof Blob) return s.cores = 2, e(null, s.cores);
            var i = URL.createObjectURL(new Blob(["(", function() {
                self.addEventListener("message", function(t) {
                    for (var e = Date.now(), r = e + 4; Date.now() < r;);
                    self.postMessage({ st: e, et: r })
                })
            }.toString(), ")()"], { type: "application/javascript" }));
            r([], 5, 16)
        }
    }, function(t, e, r) { t.exports = r(0), r(4), r(5), r(2) }, function(t, e, r) {
        var n = r(0);
        r(1), r(2), (t.exports = n.hmac = n.hmac || {}).create = function() {
            var t = null,
                e = null,
                r = null,
                a = null,
                i = {};
            return i.start = function(i, o) {
                if (null !== i)
                    if ("string" == typeof i) {
                        if (!((i = i.toLowerCase()) in n.md.algorithms)) throw new Error('Unknown hash algorithm "' + i + '"');
                        e = n.md.algorithms[i].create()
                    } else e = i;
                if (null === o) o = t;
                else {
                    if ("string" == typeof o) o = n.util.createBuffer(o);
                    else if (n.util.isArray(o)) {
                        var s = o;
                        o = n.util.createBuffer();
                        for (var h = 0; h < s.length; ++h) o.putByte(s[h])
                    }
                    var u = o.length();
                    u > e.blockLength && (e.start(), e.update(o.bytes()), o = e.digest()), r = n.util.createBuffer(), a = n.util.createBuffer(), u = o.length();
                    for (var h = 0; h < u; ++h) {
                        var s = o.at(h);
                        r.putByte(54 ^ s), a.putByte(92 ^ s)
                    }
                    if (u < e.blockLength)
                        for (var s = e.blockLength - u, h = 0; h < s; ++h) r.putByte(54), a.putByte(92);
                    t = o, r = r.bytes(), a = a.bytes()
                }
                e.start(), e.update(r)
            }, i.update = function(t) { e.update(t) }, i.getMac = function() { var t = e.digest().bytes(); return e.start(), e.update(a), e.update(t), e.digest() }, i.digest = i.getMac, i
        }
    }, function(t, e, r) { t.exports = r(1), r(6), r(7), r(8), r(9) }, function(t, e, r) {
        function n() {
            s = String.fromCharCode(128), s += i.util.fillString(String.fromCharCode(0), 64), h = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 1, 6, 11, 0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12, 5, 8, 11, 14, 1, 4, 7, 10, 13, 0, 3, 6, 9, 12, 15, 2, 0, 7, 14, 5, 12, 3, 10, 1, 8, 15, 6, 13, 4, 11, 2, 9], u = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21], f = new Array(64);
            for (var t = 0; t < 64; ++t) f[t] = Math.floor(4294967296 * Math.abs(Math.sin(t + 1)));
            l = !0
        }

        function a(t, e, r) {
            for (var n, a, i, o, s, l, g, c, d = r.length(); d >= 64;) {
                for (a = t.h0, i = t.h1, o = t.h2, s = t.h3, c = 0; c < 16; ++c) e[c] = r.getInt32Le(), l = s ^ i & (o ^ s), n = a + l + f[c] + e[c], g = u[c], a = s, s = o, o = i, i += n << g | n >>> 32 - g;
                for (; c < 32; ++c) l = o ^ s & (i ^ o), n = a + l + f[c] + e[h[c]], g = u[c], a = s, s = o, o = i, i += n << g | n >>> 32 - g;
                for (; c < 48; ++c) l = i ^ o ^ s, n = a + l + f[c] + e[h[c]], g = u[c], a = s, s = o, o = i, i += n << g | n >>> 32 - g;
                for (; c < 64; ++c) l = o ^ (i | ~s), n = a + l + f[c] + e[h[c]], g = u[c], a = s, s = o, o = i, i += n << g | n >>> 32 - g;
                t.h0 = t.h0 + a | 0, t.h1 = t.h1 + i | 0, t.h2 = t.h2 + o | 0, t.h3 = t.h3 + s | 0, d -= 64
            }
        }
        var i = r(0);
        r(1), r(2);
        var o = t.exports = i.md5 = i.md5 || {};
        i.md.md5 = i.md.algorithms.md5 = o, o.create = function() {
            l || n();
            var t = null,
                e = i.util.createBuffer(),
                r = new Array(16),
                o = { algorithm: "md5", blockLength: 64, digestLength: 16, messageLength: 0, fullMessageLength: null, messageLengthSize: 8 };
            return o.start = function() { o.messageLength = 0, o.fullMessageLength = o.messageLength64 = []; for (var r = o.messageLengthSize / 4, n = 0; n < r; ++n) o.fullMessageLength.push(0); return e = i.util.createBuffer(), t = { h0: 1732584193, h1: 4023233417, h2: 2562383102, h3: 271733878 }, o }, o.start(), o.update = function(n, s) {
                "utf8" === s && (n = i.util.encodeUtf8(n));
                var h = n.length;
                o.messageLength += h, h = [h / 4294967296 >>> 0, h >>> 0];
                for (var u = o.fullMessageLength.length - 1; u >= 0; --u) o.fullMessageLength[u] += h[1], h[1] = h[0] + (o.fullMessageLength[u] / 4294967296 >>> 0), o.fullMessageLength[u] = o.fullMessageLength[u] >>> 0, h[0] = h[1] / 4294967296 >>> 0;
                return e.putBytes(n), a(t, r, e), (e.read > 2048 || 0 === e.length()) && e.compact(), o
            }, o.digest = function() {
                var n = i.util.createBuffer();
                n.putBytes(e.bytes());
                var h = o.fullMessageLength[o.fullMessageLength.length - 1] + o.messageLengthSize,
                    u = h & o.blockLength - 1;
                n.putBytes(s.substr(0, o.blockLength - u));
                for (var f, l = 0, g = o.fullMessageLength.length - 1; g >= 0; --g) f = 8 * o.fullMessageLength[g] + l, l = f / 4294967296 >>> 0, n.putInt32Le(f >>> 0);
                var c = { h0: t.h0, h1: t.h1, h2: t.h2, h3: t.h3 };
                a(c, r, n);
                var d = i.util.createBuffer();
                return d.putInt32Le(c.h0), d.putInt32Le(c.h1), d.putInt32Le(c.h2), d.putInt32Le(c.h3), d
            }, o
        };
        var s = null,
            h = null,
            u = null,
            f = null,
            l = !1
    }, function(t, e, r) {
        function n() { s = String.fromCharCode(128), s += i.util.fillString(String.fromCharCode(0), 64), h = !0 }

        function a(t, e, r) {
            for (var n, a, i, o, s, h, u, f, l = r.length(); l >= 64;) {
                for (a = t.h0, i = t.h1, o = t.h2, s = t.h3, h = t.h4, f = 0; f < 16; ++f) n = r.getInt32(), e[f] = n, u = s ^ i & (o ^ s), n = (a << 5 | a >>> 27) + u + h + 1518500249 + n, h = s, s = o, o = (i << 30 | i >>> 2) >>> 0, i = a, a = n;
                for (; f < 20; ++f) n = e[f - 3] ^ e[f - 8] ^ e[f - 14] ^ e[f - 16], n = n << 1 | n >>> 31, e[f] = n, u = s ^ i & (o ^ s), n = (a << 5 | a >>> 27) + u + h + 1518500249 + n, h = s, s = o, o = (i << 30 | i >>> 2) >>> 0, i = a, a = n;
                for (; f < 32; ++f) n = e[f - 3] ^ e[f - 8] ^ e[f - 14] ^ e[f - 16], n = n << 1 | n >>> 31, e[f] = n, u = i ^ o ^ s, n = (a << 5 | a >>> 27) + u + h + 1859775393 + n, h = s, s = o, o = (i << 30 | i >>> 2) >>> 0, i = a, a = n;
                for (; f < 40; ++f) n = e[f - 6] ^ e[f - 16] ^ e[f - 28] ^ e[f - 32], n = n << 2 | n >>> 30, e[f] = n, u = i ^ o ^ s, n = (a << 5 | a >>> 27) + u + h + 1859775393 + n, h = s, s = o, o = (i << 30 | i >>> 2) >>> 0, i = a, a = n;
                for (; f < 60; ++f) n = e[f - 6] ^ e[f - 16] ^ e[f - 28] ^ e[f - 32], n = n << 2 | n >>> 30, e[f] = n, u = i & o | s & (i ^ o), n = (a << 5 | a >>> 27) + u + h + 2400959708 + n, h = s, s = o, o = (i << 30 | i >>> 2) >>> 0, i = a, a = n;
                for (; f < 80; ++f) n = e[f - 6] ^ e[f - 16] ^ e[f - 28] ^ e[f - 32], n = n << 2 | n >>> 30, e[f] = n, u = i ^ o ^ s, n = (a << 5 | a >>> 27) + u + h + 3395469782 + n, h = s, s = o, o = (i << 30 | i >>> 2) >>> 0, i = a, a = n;
                t.h0 = t.h0 + a | 0, t.h1 = t.h1 + i | 0, t.h2 = t.h2 + o | 0, t.h3 = t.h3 + s | 0, t.h4 = t.h4 + h | 0, l -= 64
            }
        }
        var i = r(0);
        r(1), r(2);
        var o = t.exports = i.sha1 = i.sha1 || {};
        i.md.sha1 = i.md.algorithms.sha1 = o, o.create = function() {
            h || n();
            var t = null,
                e = i.util.createBuffer(),
                r = new Array(80),
                o = { algorithm: "sha1", blockLength: 64, digestLength: 20, messageLength: 0, fullMessageLength: null, messageLengthSize: 8 };
            return o.start = function() { o.messageLength = 0, o.fullMessageLength = o.messageLength64 = []; for (var r = o.messageLengthSize / 4, n = 0; n < r; ++n) o.fullMessageLength.push(0); return e = i.util.createBuffer(), t = { h0: 1732584193, h1: 4023233417, h2: 2562383102, h3: 271733878, h4: 3285377520 }, o }, o.start(), o.update = function(n, s) {
                "utf8" === s && (n = i.util.encodeUtf8(n));
                var h = n.length;
                o.messageLength += h, h = [h / 4294967296 >>> 0, h >>> 0];
                for (var u = o.fullMessageLength.length - 1; u >= 0; --u) o.fullMessageLength[u] += h[1], h[1] = h[0] + (o.fullMessageLength[u] / 4294967296 >>> 0), o.fullMessageLength[u] = o.fullMessageLength[u] >>> 0, h[0] = h[1] / 4294967296 >>> 0;
                return e.putBytes(n), a(t, r, e), (e.read > 2048 || 0 === e.length()) && e.compact(), o
            }, o.digest = function() {
                var n = i.util.createBuffer();
                n.putBytes(e.bytes());
                var h = o.fullMessageLength[o.fullMessageLength.length - 1] + o.messageLengthSize,
                    u = h & o.blockLength - 1;
                n.putBytes(s.substr(0, o.blockLength - u));
                for (var f, l, g = 8 * o.fullMessageLength[0], c = 0; c < o.fullMessageLength.length - 1; ++c) f = 8 * o.fullMessageLength[c + 1], l = f / 4294967296 >>> 0, g += l, n.putInt32(g >>> 0), g = f >>> 0;
                n.putInt32(g);
                var d = { h0: t.h0, h1: t.h1, h2: t.h2, h3: t.h3, h4: t.h4 };
                a(d, r, n);
                var p = i.util.createBuffer();
                return p.putInt32(d.h0), p.putInt32(d.h1), p.putInt32(d.h2), p.putInt32(d.h3), p.putInt32(d.h4), p
            }, o
        };
        var s = null,
            h = !1
    }, function(t, e, r) {
        function n() { s = String.fromCharCode(128), s += i.util.fillString(String.fromCharCode(0), 64), u = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298], h = !0 }

        function a(t, e, r) {
            for (var n, a, i, o, s, h, f, l, g, c, d, p, y, m, v, B = r.length(); B >= 64;) {
                for (f = 0; f < 16; ++f) e[f] = r.getInt32();
                for (; f < 64; ++f) n = e[f - 2], n = (n >>> 17 | n << 15) ^ (n >>> 19 | n << 13) ^ n >>> 10, a = e[f - 15], a = (a >>> 7 | a << 25) ^ (a >>> 18 | a << 14) ^ a >>> 3, e[f] = n + e[f - 7] + a + e[f - 16] | 0;
                for (l = t.h0, g = t.h1, c = t.h2, d = t.h3, p = t.h4, y = t.h5, m = t.h6, v = t.h7, f = 0; f < 64; ++f) o = (p >>> 6 | p << 26) ^ (p >>> 11 | p << 21) ^ (p >>> 25 | p << 7), s = m ^ p & (y ^ m), i = (l >>> 2 | l << 30) ^ (l >>> 13 | l << 19) ^ (l >>> 22 | l << 10), h = l & g | c & (l ^ g), n = v + o + s + u[f] + e[f], a = i + h, v = m, m = y, y = p, p = d + n >>> 0, d = c, c = g, g = l, l = n + a >>> 0;
                t.h0 = t.h0 + l | 0, t.h1 = t.h1 + g | 0, t.h2 = t.h2 + c | 0, t.h3 = t.h3 + d | 0, t.h4 = t.h4 + p | 0, t.h5 = t.h5 + y | 0, t.h6 = t.h6 + m | 0, t.h7 = t.h7 + v | 0, B -= 64
            }
        }
        var i = r(0);
        r(1), r(2);
        var o = t.exports = i.sha256 = i.sha256 || {};
        i.md.sha256 = i.md.algorithms.sha256 = o, o.create = function() {
            h || n();
            var t = null,
                e = i.util.createBuffer(),
                r = new Array(64),
                o = { algorithm: "sha256", blockLength: 64, digestLength: 32, messageLength: 0, fullMessageLength: null, messageLengthSize: 8 };
            return o.start = function() { o.messageLength = 0, o.fullMessageLength = o.messageLength64 = []; for (var r = o.messageLengthSize / 4, n = 0; n < r; ++n) o.fullMessageLength.push(0); return e = i.util.createBuffer(), t = { h0: 1779033703, h1: 3144134277, h2: 1013904242, h3: 2773480762, h4: 1359893119, h5: 2600822924, h6: 528734635, h7: 1541459225 }, o }, o.start(), o.update = function(n, s) {
                "utf8" === s && (n = i.util.encodeUtf8(n));
                var h = n.length;
                o.messageLength += h, h = [h / 4294967296 >>> 0, h >>> 0];
                for (var u = o.fullMessageLength.length - 1; u >= 0; --u) o.fullMessageLength[u] += h[1], h[1] = h[0] + (o.fullMessageLength[u] / 4294967296 >>> 0), o.fullMessageLength[u] = o.fullMessageLength[u] >>> 0, h[0] = h[1] / 4294967296 >>> 0;
                return e.putBytes(n), a(t, r, e), (e.read > 2048 || 0 === e.length()) && e.compact(), o
            }, o.digest = function() {
                var n = i.util.createBuffer();
                n.putBytes(e.bytes());
                var h = o.fullMessageLength[o.fullMessageLength.length - 1] + o.messageLengthSize,
                    u = h & o.blockLength - 1;
                n.putBytes(s.substr(0, o.blockLength - u));
                for (var f, l, g = 8 * o.fullMessageLength[0], c = 0; c < o.fullMessageLength.length - 1; ++c) f = 8 * o.fullMessageLength[c + 1], l = f / 4294967296 >>> 0, g += l, n.putInt32(g >>> 0), g = f >>> 0;
                n.putInt32(g);
                var d = { h0: t.h0, h1: t.h1, h2: t.h2, h3: t.h3, h4: t.h4, h5: t.h5, h6: t.h6, h7: t.h7 };
                a(d, r, n);
                var p = i.util.createBuffer();
                return p.putInt32(d.h0), p.putInt32(d.h1), p.putInt32(d.h2), p.putInt32(d.h3), p.putInt32(d.h4), p.putInt32(d.h5), p.putInt32(d.h6), p.putInt32(d.h7), p
            }, o
        };
        var s = null,
            h = !1,
            u = null
    }, function(t, e, r) {
        function n() {
            h = String.fromCharCode(128), h += i.util.fillString(String.fromCharCode(0), 128), f = [
                [1116352408, 3609767458],
                [1899447441, 602891725],
                [3049323471, 3964484399],
                [3921009573, 2173295548],
                [961987163, 4081628472],
                [1508970993, 3053834265],
                [2453635748, 2937671579],
                [2870763221, 3664609560],
                [3624381080, 2734883394],
                [310598401, 1164996542],
                [607225278, 1323610764],
                [1426881987, 3590304994],
                [1925078388, 4068182383],
                [2162078206, 991336113],
                [2614888103, 633803317],
                [3248222580, 3479774868],
                [3835390401, 2666613458],
                [4022224774, 944711139],
                [264347078, 2341262773],
                [604807628, 2007800933],
                [770255983, 1495990901],
                [1249150122, 1856431235],
                [1555081692, 3175218132],
                [1996064986, 2198950837],
                [2554220882, 3999719339],
                [2821834349, 766784016],
                [2952996808, 2566594879],
                [3210313671, 3203337956],
                [3336571891, 1034457026],
                [3584528711, 2466948901],
                [113926993, 3758326383],
                [338241895, 168717936],
                [666307205, 1188179964],
                [773529912, 1546045734],
                [1294757372, 1522805485],
                [1396182291, 2643833823],
                [1695183700, 2343527390],
                [1986661051, 1014477480],
                [2177026350, 1206759142],
                [2456956037, 344077627],
                [2730485921, 1290863460],
                [2820302411, 3158454273],
                [3259730800, 3505952657],
                [3345764771, 106217008],
                [3516065817, 3606008344],
                [3600352804, 1432725776],
                [4094571909, 1467031594],
                [275423344, 851169720],
                [430227734, 3100823752],
                [506948616, 1363258195],
                [659060556, 3750685593],
                [883997877, 3785050280],
                [958139571, 3318307427],
                [1322822218, 3812723403],
                [1537002063, 2003034995],
                [1747873779, 3602036899],
                [1955562222, 1575990012],
                [2024104815, 1125592928],
                [2227730452, 2716904306],
                [2361852424, 442776044],
                [2428436474, 593698344],
                [2756734187, 3733110249],
                [3204031479, 2999351573],
                [3329325298, 3815920427],
                [3391569614, 3928383900],
                [3515267271, 566280711],
                [3940187606, 3454069534],
                [4118630271, 4000239992],
                [116418474, 1914138554],
                [174292421, 2731055270],
                [289380356, 3203993006],
                [460393269, 320620315],
                [685471733, 587496836],
                [852142971, 1086792851],
                [1017036298, 365543100],
                [1126000580, 2618297676],
                [1288033470, 3409855158],
                [1501505948, 4234509866],
                [1607167915, 987167468],
                [1816402316, 1246189591]
            ], l = {}, l["SHA-512"] = [
                [1779033703, 4089235720],
                [3144134277, 2227873595],
                [1013904242, 4271175723],
                [2773480762, 1595750129],
                [1359893119, 2917565137],
                [2600822924, 725511199],
                [528734635, 4215389547],
                [1541459225, 327033209]
            ], l["SHA-384"] = [
                [3418070365, 3238371032],
                [1654270250, 914150663],
                [2438529370, 812702999],
                [355462360, 4144912697],
                [1731405415, 4290775857],
                [2394180231, 1750603025],
                [3675008525, 1694076839],
                [1203062813, 3204075428]
            ], l["SHA-512/256"] = [
                [573645204, 4230739756],
                [2673172387, 3360449730],
                [596883563, 1867755857],
                [2520282905, 1497426621],
                [2519219938, 2827943907],
                [3193839141, 1401305490],
                [721525244, 746961066],
                [246885852, 2177182882]
            ], l["SHA-512/224"] = [
                [2352822216, 424955298],
                [1944164710, 2312950998],
                [502970286, 855612546],
                [1738396948, 1479516111],
                [258812777, 2077511080],
                [2011393907, 79989058],
                [1067287976, 1780299464],
                [286451373, 2446758561]
            ], u = !0
        }

        function a(t, e, r) {
            for (var n, a, i, o, s, h, u, l, g, c, d, p, y, m, v, B, b, w, S, L, C, I, A, M, x, D, U, k, O, j, H, z, E, N, P, T = r.length(); T >= 128;) {
                for (O = 0; O < 16; ++O) e[O][0] = r.getInt32() >>> 0, e[O][1] = r.getInt32() >>> 0;
                for (; O < 80; ++O) z = e[O - 2], j = z[0], H = z[1], n = ((j >>> 19 | H << 13) ^ (H >>> 29 | j << 3) ^ j >>> 6) >>> 0, a = ((j << 13 | H >>> 19) ^ (H << 3 | j >>> 29) ^ (j << 26 | H >>> 6)) >>> 0, N = e[O - 15], j = N[0], H = N[1], i = ((j >>> 1 | H << 31) ^ (j >>> 8 | H << 24) ^ j >>> 7) >>> 0, o = ((j << 31 | H >>> 1) ^ (j << 24 | H >>> 8) ^ (j << 25 | H >>> 7)) >>> 0, E = e[O - 7], P = e[O - 16], H = a + E[1] + o + P[1], e[O][0] = n + E[0] + i + P[0] + (H / 4294967296 >>> 0) >>> 0, e[O][1] = H >>> 0;
                for (y = t[0][0], m = t[0][1], v = t[1][0], B = t[1][1], b = t[2][0], w = t[2][1], S = t[3][0], L = t[3][1], C = t[4][0], I = t[4][1], A = t[5][0], M = t[5][1], x = t[6][0], D = t[6][1], U = t[7][0], k = t[7][1], O = 0; O < 80; ++O) u = ((C >>> 14 | I << 18) ^ (C >>> 18 | I << 14) ^ (I >>> 9 | C << 23)) >>> 0, l = ((C << 18 | I >>> 14) ^ (C << 14 | I >>> 18) ^ (I << 23 | C >>> 9)) >>> 0, g = (x ^ C & (A ^ x)) >>> 0, c = (D ^ I & (M ^ D)) >>> 0, s = ((y >>> 28 | m << 4) ^ (m >>> 2 | y << 30) ^ (m >>> 7 | y << 25)) >>> 0, h = ((y << 4 | m >>> 28) ^ (m << 30 | y >>> 2) ^ (m << 25 | y >>> 7)) >>> 0, d = (y & v | b & (y ^ v)) >>> 0, p = (m & B | w & (m ^ B)) >>> 0, H = k + l + c + f[O][1] + e[O][1], n = U + u + g + f[O][0] + e[O][0] + (H / 4294967296 >>> 0) >>> 0, a = H >>> 0, H = h + p, i = s + d + (H / 4294967296 >>> 0) >>> 0, o = H >>> 0, U = x, k = D, x = A, D = M, A = C, M = I, H = L + a, C = S + n + (H / 4294967296 >>> 0) >>> 0, I = H >>> 0, S = b, L = w, b = v, w = B, v = y, B = m, H = a + o, y = n + i + (H / 4294967296 >>> 0) >>> 0, m = H >>> 0;
                H = t[0][1] + m, t[0][0] = t[0][0] + y + (H / 4294967296 >>> 0) >>> 0, t[0][1] = H >>> 0, H = t[1][1] + B, t[1][0] = t[1][0] + v + (H / 4294967296 >>> 0) >>> 0, t[1][1] = H >>> 0, H = t[2][1] + w, t[2][0] = t[2][0] + b + (H / 4294967296 >>> 0) >>> 0, t[2][1] = H >>> 0, H = t[3][1] + L, t[3][0] = t[3][0] + S + (H / 4294967296 >>> 0) >>> 0, t[3][1] = H >>> 0, H = t[4][1] + I, t[4][0] = t[4][0] + C + (H / 4294967296 >>> 0) >>> 0, t[4][1] = H >>> 0, H = t[5][1] + M, t[5][0] = t[5][0] + A + (H / 4294967296 >>> 0) >>> 0, t[5][1] = H >>> 0, H = t[6][1] + D, t[6][0] = t[6][0] + x + (H / 4294967296 >>> 0) >>> 0, t[6][1] = H >>> 0, H = t[7][1] + k, t[7][0] = t[7][0] + U + (H / 4294967296 >>> 0) >>> 0, t[7][1] = H >>> 0, T -= 128
            }
        }
        var i = r(0);
        r(1), r(2);
        var o = t.exports = i.sha512 = i.sha512 || {};
        i.md.sha512 = i.md.algorithms.sha512 = o;
        var s = i.sha384 = i.sha512.sha384 = i.sha512.sha384 || {};
        s.create = function() { return o.create("SHA-384") }, i.md.sha384 = i.md.algorithms.sha384 = s, i.sha512.sha256 = i.sha512.sha256 || { create: function() { return o.create("SHA-512/256") } }, i.md["sha512/256"] = i.md.algorithms["sha512/256"] = i.sha512.sha256, i.sha512.sha224 = i.sha512.sha224 || { create: function() { return o.create("SHA-512/224") } }, i.md["sha512/224"] = i.md.algorithms["sha512/224"] = i.sha512.sha224, o.create = function(t) {
            if (u || n(), void 0 === t && (t = "SHA-512"), !(t in l)) throw new Error("Invalid SHA-512 algorithm: " + t);
            for (var e = l[t], r = null, o = i.util.createBuffer(), s = new Array(80), f = 0; f < 80; ++f) s[f] = new Array(2);
            var g = 64;
            switch (t) {
                case "SHA-384":
                    g = 48;
                    break;
                case "SHA-512/256":
                    g = 32;
                    break;
                case "SHA-512/224":
                    g = 28
            }
            var c = { algorithm: t.replace("-", "").toLowerCase(), blockLength: 128, digestLength: g, messageLength: 0, fullMessageLength: null, messageLengthSize: 16 };
            return c.start = function() {
                c.messageLength = 0, c.fullMessageLength = c.messageLength128 = [];
                for (var t = c.messageLengthSize / 4, n = 0; n < t; ++n) c.fullMessageLength.push(0);
                o = i.util.createBuffer(), r = new Array(e.length);
                for (var n = 0; n < e.length; ++n) r[n] = e[n].slice(0);
                return c
            }, c.start(), c.update = function(t, e) {
                "utf8" === e && (t = i.util.encodeUtf8(t));
                var n = t.length;
                c.messageLength += n, n = [n / 4294967296 >>> 0, n >>> 0];
                for (var h = c.fullMessageLength.length - 1; h >= 0; --h) c.fullMessageLength[h] += n[1], n[1] = n[0] + (c.fullMessageLength[h] / 4294967296 >>> 0), c.fullMessageLength[h] = c.fullMessageLength[h] >>> 0, n[0] = n[1] / 4294967296 >>> 0;
                return o.putBytes(t), a(r, s, o), (o.read > 2048 || 0 === o.length()) && o.compact(), c
            }, c.digest = function() {
                var e = i.util.createBuffer();
                e.putBytes(o.bytes());
                var n = c.fullMessageLength[c.fullMessageLength.length - 1] + c.messageLengthSize,
                    u = n & c.blockLength - 1;
                e.putBytes(h.substr(0, c.blockLength - u));
                for (var f, l, g = 8 * c.fullMessageLength[0], d = 0; d < c.fullMessageLength.length - 1; ++d) f = 8 * c.fullMessageLength[d + 1], l = f / 4294967296 >>> 0, g += l, e.putInt32(g >>> 0), g = f >>> 0;
                e.putInt32(g);
                for (var p = new Array(r.length), d = 0; d < r.length; ++d) p[d] = r[d].slice(0);
                a(p, s, e);
                var y, m = i.util.createBuffer();
                y = "SHA-512" === t ? p.length : "SHA-384" === t ? p.length - 2 : p.length - 4;
                for (var d = 0; d < y; ++d) m.putInt32(p[d][0]), d === y - 1 && "SHA-512/224" === t || m.putInt32(p[d][1]);
                return m
            }, c
        };
        var h = null,
            u = !1,
            f = null,
            l = null
    }, function(t, e, r) { t.exports = r(3) }])
});