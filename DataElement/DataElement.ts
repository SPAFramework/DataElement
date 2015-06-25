/*!
 * DataElement Class
 * This class facilitates binding data to HTML elements. 
 * http://spaframework.com/
 * Copyright 2015, Don Oktrova
 */

//DataElement DataChangeEvent Object contains event information of the underlying DataElement
class DataChangedEvent {
    constructor(source?: DataElement, changedProperties?: string[], currentData?: any, originalData?: any) {
        this.source = source;
        this.changedProperties = changedProperties;
        this.currentData = currentData;
        this.originalData = originalData;
    }
    public source: DataElement; //The DataElement that triggered the event
    public changedProperties: string[]; //Properties that have changed
    public currentData: any; //The current data that the DataElement has (the changed data)
    public originalData: any; //The data the DataElement held before the change
}

//This class Combines a HTML element with a Data Object  
class DataElement {
    constructor(element?: HTMLElement) {
        if (element == null) return;
        this._htmlElement = element;
        this._elements = this.getElementArray(this._htmlElement);
        this.wireObservableElements(this._elements);
        this._elements.forEach((elem) => this.compileElement(elem));
        this._template = <HTMLElement>this._htmlElement.cloneNode(true);
        this._data = this.extractModel(element);
    }
    //Returns the underlying HTMLElement
    public get htmlElement(): HTMLElement {
        return this._htmlElement;
    }

    //Returns a clone of the underlying HTMLElement as a Template
    public get template(): HTMLElement {
        return <HTMLElement>this._template.cloneNode(true);
    }

    //Reruns an Empty DataModel object
    public get dataModel(): any {
        var dm = new Object();
        for (var p in this._data)
            if (this._data.hasOwnProperty(p))
                dm[p] = null;
        return dm;
    }

    //Returns an object holding the Data currently bound to the Element
    public get data(): any {
        return this._data;
    }

    //Sets the data to bind to the underlying HTMLElement
    public set data(dataset: any) {
        var changedProperties = new Array<string>();
        for (var p in this._data)
            if (dataset.hasOwnProperty(p) && dataset[p] !== this._data[p]) {
                changedProperties.push(p);
                this._data[p] = dataset[p];
            }
        this._elements.forEach((elem) => this.dataBind(elem, this._data));
        if (changedProperties.length > 0) {
            this._hasDataChanged = true;

            this.ondatachanged(new DataChangedEvent(this, changedProperties, this._data));
        }
    }

    //Updates a single property on the Data bound to the element using a key and a value as an argument
    public updateDataProperty(key: string, value: any) {
        this._data[key] = value;
        this.hasDataChanged = true;
        var changedProperties = [key];
        this.ondatachanged(new DataChangedEvent(this, changedProperties, this._data));
    }

    //Returns a boolean indicating if the data has been changed since the element was last bound
    public get hasDataChanged(): boolean {
        return this._hasDataChanged;
    }

    //Creates a clone of the DataElement (It is faster than creating a new DataElement)
    public clone(): DataElement {
        var de = new DataElement();
        de._htmlElement = this.template;
        de._elements = this.getElementArray(de._htmlElement);
        de.wireObservableElements(de._elements);
        de._data = this.dataModel;
        return de;
    }

    //Called when a change occurs to the underlaying data
    public ondatachanged(ev: DataChangedEvent): void { }

    private _htmlElement: HTMLElement; //The underlaying HTMLElement 
    private _elements: HTMLElement[]; //All HTMLElements contained inside the _htmlElement
    private _data: any; //The underlying Data Object
    private _template: HTMLElement; 
    private _hasDataChanged: boolean;

    private _dataAttrPrefix = "data-"; //The prefix the class uses to compile HTML templates
    private _reDataMarkup = /({[^}]*})/g; //Reg-ex pattern to find markup that indicates data tag in the HTML string
    private _reDataKey = /[^{]+(?=})/g; //Reg-ex pattern to find markup that indicates data key in the HTML string
    
    //Creates an array containing all HTMLElements of the template    
    private getElementArray(element: HTMLElement): HTMLElement[] {
        var elemArray = [element];
        return elemArray.concat(<HTMLElement[]>Array.prototype.slice.call(element.getElementsByTagName("*")));
    }

    //Wires events to User input fields to detect user data changes
    private wireObservableElements(elemArray: HTMLElement[]): void {
        elemArray.forEach((elem) => {
            if (elem.tagName === "INPUT" || elem.tagName === "SELECT" || elem.tagName === "TEXTAREA")
                elem.onchange = (ev: Event) => this.dataChangedFromClient(<HTMLInputElement>ev.srcElement);
        });
    }

    //Handles data changed by user through user inputs and updates the underlaying data object
    private dataChangedFromClient(element: HTMLInputElement): void {
        var newValue;
        var changeableAttributes = ["checked", "value"];

        if (element.type === "checkbox" || element.type === "radio")
            newValue = <boolean>element.checked;
        else newValue = element.value;

        Array.prototype.slice.call(element.attributes).forEach((attr) => {
            if (attr.name.indexOf(this._dataAttrPrefix) !== -1 &&
                changeableAttributes.indexOf(attr.name.replace(this._dataAttrPrefix, "")) !== -1) {
                attr.value.match(this._reDataKey).forEach((key) => {
                    if (newValue != this._data[key]) 
                        this.updateDataProperty(key, newValue);
                });
            }
        });
    }

    //Compiles an element by creating data attributes from data tags used in the template
    private compileElement(element: HTMLElement): void {
            //Add data attributes for data-bound attributes
            Array.prototype.slice.call(element.attributes).forEach((attr) => {
                var dataAttr = attr.value.match(this._reDataMarkup);
                if (dataAttr != null && attr.name.indexOf(this._dataAttrPrefix) === -1) 
                    element.setAttribute(this._dataAttrPrefix + attr.name, attr.value);
            });
            //Add data attributes for data-bound text
            if (element.children.length === 0) {
                var dataTxt = element.textContent.match(this._reDataMarkup);
                if (dataTxt != null) {
                    element.setAttribute(this._dataAttrPrefix + "text", element.textContent);
                    element.textContent = "";
                }
            }
    }

    //Extracts an empty model object from the underlying data
    private extractModel(element: HTMLElement): Object {
        var dataKeys = element.outerHTML.match(this._reDataKey);
        if (dataKeys == null) return null;
        var model = new Object();
        dataKeys.forEach((key) => model[key] = null);
        return model;
    }

    //Binds the HTMLElement and the DataObject
    private dataBind(element: HTMLElement, dataset: any): void {
        Array.prototype.slice.call(element.attributes).forEach((attr) => {
            if (attr.name.indexOf(this._dataAttrPrefix) !== -1) {
                var dataMarkUp = attr.value.match(this._reDataMarkup);
                if (dataMarkUp != null) {
                    var attrName = attr.name.replace(this._dataAttrPrefix, "");
                    var aggregateBoundValue = attr.value;
                    dataMarkUp.forEach((dm) => {
                        var dataValue = dataset[dm.match(this._reDataKey)[0]];
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
    }
}   