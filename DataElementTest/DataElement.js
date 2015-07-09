/*!
* DataElement Class
* This class facilitates binding data to HTML elements.
* http://spaframework.com/
* Copyright 2015, Don Oktrova
*/
//DataElement DataChangeEvent Object contains event information of the underlying DataElement
var DataChangedEvent = (function () {
    function DataChangedEvent(source, changedProperties, currentData, originalData) {
        this.source = source;
        this.changedProperties = changedProperties;
        this.currentData = currentData;
        this.originalData = originalData;
    }
    return DataChangedEvent;
})();

//This class Combines a HTML element with a Data Object
var DataElement = (function () {
    function DataElement(element) {
        var _this = this;
        this._dataAttrPrefix = "data-";
        this._reDataMarkup = /({[^}]*})/g;
        this._reDataKey = /[^{]+(?=})/g;
        if (element == null)
            return;
        this._htmlElement = element;
        this._elements = this.getElementArray(this._htmlElement);
        this.wireObservableElements(this._elements);
        this._elements.forEach(function (elem) {
            return _this.compileElement(elem);
        });
        this._template = this._htmlElement.cloneNode(true);
        this._data = this.extractModel(element);
    }
    Object.defineProperty(DataElement.prototype, "htmlElement", {
        //Returns the underlying HTMLElement
        get: function () {
            return this._htmlElement;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(DataElement.prototype, "template", {
        //Returns a clone of the underlying HTMLElement as a Template
        get: function () {
            return this._template.cloneNode(true);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(DataElement.prototype, "dataModel", {
        //Reruns an Empty DataModel object
        get: function () {
            var dm = new Object();
            for (var p in this._data)
                if (this._data.hasOwnProperty(p))
                    dm[p] = null;
            return dm;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(DataElement.prototype, "data", {
        //Returns an object holding the Data currently bound to the Element
        get: function () {
            return this._data;
        },
        //Sets the data to bind to the underlying HTMLElement
        set: function (dataset) {
            var _this = this;
            var changedProperties = new Array();
            var originalData = this.cloneObject(this._data);
            for (var p in this._data)
                if (dataset.hasOwnProperty(p) && dataset[p] !== this._data[p]) {
                    changedProperties.push(p);
                    this._data[p] = dataset[p];
                }
            this._elements.forEach(function (elem) {
                return _this.dataBind(elem, _this._data);
            });
            if (changedProperties.length > 0) {
                this._hasDataChanged = true;

                this.ondatachanged(new DataChangedEvent(this, changedProperties, this._data, originalData));
            }
        },
        enumerable: true,
        configurable: true
    });


    //Updates a single property on the Data bound to the element using a key and a value as an argument
    DataElement.prototype.updateDataProperty = function (key, value) {
        var originalData = this.cloneObject(this.data);
        this._data[key] = value;
        this.hasDataChanged = true;
        var changedProperties = [key];
        this.ondatachanged(new DataChangedEvent(this, changedProperties, this._data, originalData));
    };

    Object.defineProperty(DataElement.prototype, "hasDataChanged", {
        //Returns a boolean indicating if the data has been changed since the element was last bound
        get: function () {
            return this._hasDataChanged;
        },
        enumerable: true,
        configurable: true
    });

    //Creates a clone of the DataElement (It is faster than creating a new DataElement)
    DataElement.prototype.clone = function () {
        var de = new DataElement();
        de._htmlElement = this.template;
        de._elements = this.getElementArray(de._htmlElement);
        de.wireObservableElements(de._elements);
        de._data = this.dataModel;
        return de;
    };

    //Helper function
    DataElement.prototype.cloneObject = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    //Called when a change occurs to the underlaying data
    DataElement.prototype.ondatachanged = function (ev) {
    };

    //Creates an array containing all HTMLElements of the template
    DataElement.prototype.getElementArray = function (element) {
        var elemArray = [element];
        return elemArray.concat(Array.prototype.slice.call(element.getElementsByTagName("*")));
    };

    //Wires events to User input fields to detect user data changes
    DataElement.prototype.wireObservableElements = function (elemArray) {
        var _this = this;
        elemArray.forEach(function (elem) {
            if (elem.tagName === "INPUT" || elem.tagName === "SELECT" || elem.tagName === "TEXTAREA")
                elem.onchange = function (ev) {
                    return _this.dataChangedFromClient(ev.srcElement);
                };
        });
    };

    //Handles data changed by user through user inputs and updates the underlaying data object
    DataElement.prototype.dataChangedFromClient = function (element) {
        var _this = this;
        var newValue;
        var changeableAttributes = ["checked", "value", "text"];

        if (element.type === "checkbox" || element.type === "radio")
            newValue = element.checked;
        else
            newValue = element.value;

        Array.prototype.slice.call(element.attributes).forEach(function (attr) {
            if (attr.name.indexOf(_this._dataAttrPrefix) !== -1 && changeableAttributes.indexOf(attr.name.replace(_this._dataAttrPrefix, "")) !== -1) {
                attr.value.match(_this._reDataKey).forEach(function (key) {
                    if (newValue != _this._data[key])
                        _this.updateDataProperty(key, newValue);
                });
            }
        });
    };

    //Compiles an element by creating data attributes from data tags used in the template
    DataElement.prototype.compileElement = function (element) {
        var _this = this;
        //Add data attributes for data-bound attributes
        Array.prototype.slice.call(element.attributes).forEach(function (attr) {
            var dataAttr = attr.value.match(_this._reDataMarkup);
            if (dataAttr != null && attr.name.indexOf(_this._dataAttrPrefix) === -1)
                element.setAttribute(_this._dataAttrPrefix + attr.name, attr.value);
        });

        //Add data attributes for data-bound text
        if (element.children.length === 0) {
            var dataTxt = element.textContent.match(this._reDataMarkup);
            if (dataTxt != null) {
                element.setAttribute(this._dataAttrPrefix + "text", element.textContent);
                element.textContent = "";
            }
        }
    };

    //Extracts an empty model object from the underlying data
    DataElement.prototype.extractModel = function (element) {
        var dataKeys = element.outerHTML.match(this._reDataKey);
        if (dataKeys == null)
            return null;
        var model = new Object();
        dataKeys.forEach(function (key) {
            return model[key] = null;
        });
        return model;
    };

    //Binds the HTMLElement and the DataObject
    DataElement.prototype.dataBind = function (element, dataset) {
        var _this = this;
        Array.prototype.slice.call(element.attributes).forEach(function (attr) {
            if (attr.name.indexOf(_this._dataAttrPrefix) !== -1) {
                var dataMarkUp = attr.value.match(_this._reDataMarkup);
                if (dataMarkUp != null) {
                    var attrName = attr.name.replace(_this._dataAttrPrefix, "");
                    var aggregateBoundValue = attr.value;
                    dataMarkUp.forEach(function (dm) {
                        var dataValue = dataset[dm.match(_this._reDataKey)[0]];
                        if (dataValue != null)
                            aggregateBoundValue = aggregateBoundValue.replace(dm, dataValue);
                    });
                    if (aggregateBoundValue !== attr.value)
                        switch (attrName) {
                            case "text":
                                element.textContent = aggregateBoundValue;
                                break;
                            case "checked":
                                if (aggregateBoundValue.toUpperCase() === "TRUE")
                                    element.setAttribute(attrName, aggregateBoundValue);
                                else
                                    element.removeAttribute(attrName);
                                break;
                            default:
                                element.setAttribute(attrName, aggregateBoundValue);
                        }
                }
            }
        });
    };
    return DataElement;
})();
//# sourceMappingURL=DataElement.js.map
