/// <reference path="dataelement.ts" />


//Binding the data (Verbose)

//Step 1: Create a DataElement Object
var contactTemplate =  document.getElementById("Contact{Id}");
var deContact = new DataElement(contactTemplate);

//Step 2: Bind Data to the object
deContact.data = contacts[0]; 

//Step 3 (Optional): Attach event 
deContact.ondatachanged = (evt: DataChangedEvent) => {
    alert("The " + evt.changedProperties[0]
        + " field was updated from " + evt.originalData.Comment
        + " to " + evt.currentData.Comment);
}

//Example of clone feature: Adding more elements
var contactContainer = document.getElementById("Contacts");
contacts.forEach((contact) => {
    var otherContact = deContact.clone()
    otherContact.data = contact;
    otherContact.ondatachanged = (evt: DataChangedEvent) => {
        alert("The " + evt.changedProperties[0]
            + " field was updated from " + evt.originalData.Comment
            + " to " + evt.currentData.Comment);
    }
    contactContainer.appendChild(otherContact.htmlElement);
    });
