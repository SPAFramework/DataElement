# DataElement
This package can be used to bind and retreive data to and from HTML elements and observe changes.

Getting Started:
(For an example please see DataElementTest folder)

Step 1 - Defining a template.
  The syntax for defining a template is {DataKey} where DataKey is a property of the data object.
  The {DataKey} tag can be included anywhere in your template including attributes mixed with 
  with other text or by itself.

  //Template Example
    <article id="Contact{Id}"  
     style="border: 2px dashed silver; display: inline-block; margin: 10px; padding: 10px; background-color: {AccessColor};"> 
      <h2>{LastName}, {FirstName}</h2> 
      <div>Position: {Position}</div> 
      <div>E-mail: <a href="mailto:{Email}">{Email}</a></div> 
      <div> 
        <textarea>{Comment}</textarea> 
      </div> 
    </article> 

