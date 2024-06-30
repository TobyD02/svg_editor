/* TODO: Each tool needs a set of options that are displayed in the menu bar

Maybe, tool has an array named options, that contains a subset of all possible options available.
Only options in that array are shown (so i dont have to make new functionality for each one, i can just reuse and choose)

*/


class Tool {
  constructor(editor) {
    this.editor = editor;
    this.options = []
  }

  mouseDown(e) {}
  mouseMove(e) {}
  mouseUp(e) {}
  mouseWheel(e) {}
  keyDown(e) {}
  activate() {}
  setFillColor(e){}
  setStrokeColor(){}
  deactivate(){}
  getOptions() {return this.options}
}

class PanTool extends Tool {
  constructor(editor) {
    super(editor);
    this.element = document.getElementById("pan");
  }

  activate() {
    this.editor.container.classList.add("cursor-move");
  }

  mouseDown(e) {
    this.editor.state.isPanning = true;
    this.editor.state.startX = e.clientX - this.editor.state.panX;
    this.editor.state.startY = e.clientY - this.editor.state.panY;
  }

  mouseMove(e) {
    if (this.editor.state.isPanning) {
      this.editor.state.panX = e.clientX - this.editor.state.startX;
      this.editor.state.panY = e.clientY - this.editor.state.startY;
      this.editor.updateTransform();
    }
  }

  mouseUp(e) {
    this.editor.state.isPanning = false;
  }
}

class PenTool extends Tool {
  constructor(editor) {
    super(editor);
    this.element = document.getElementById("pen");

    this.fillColor = '#000000'
    this.strokeColor = '#000000'
    this.strokeWidth = 2
  }

  activate() {
    this.editor.container.classList.add("cursor-pen");
  }

  setStrokeColor(color){
    this.strokeColor = color

    let object = this.editor.objects[this.editor.state.currentObject]
    if (object)
      object.setStrokeColor(color)
  }

  setFillColor(color){
    this.fillColor = color

    let object = this.editor.objects[this.editor.state.currentObject]

    if (object)
      object.setFillColor(color)
  }

  setStrokeWidth(width) {
    this.strokeWidth = width

    let object = this.editor.objects[this.editor.state.currentObject]

    if (object)
      object.setStrokeWidth(width)
  }

  mouseDown(e) {
    const pos = this.editor.getTransformedPosition(e.clientX, e.clientY);

    if (this.editor.state.currentObject === null) {
      const object = new Path(pos)
      object.setFillColor(this.fillColor)
      object.setStrokeColor(this.strokeColor)
      object.setStrokeWidth(this.strokeWidth)
      
      
      this.editor.state.currentObject = this.editor.objects.length;
      this.editor.svg.appendChild(object.element);
      this.editor.objects.push(object);

    } else {

      let object = this.editor.objects[this.editor.state.currentObject];
      let {dist, closestPoint} = object.getClosestPoint(pos)

      if (dist <= this.editor.closeDistance) {

        object.pushPoint(closestPoint)
        this.editor.state.currentObject = null;

      } else {
        object.pushPoint(pos)
      }
    }

    // Capture history at end of action
    this.editor.history.captureState()
  }

  mouseMove(e) {

    if (this.editor.state.currentObject !== null && this.editor.objects[this.editor.state.currentObject]) {

      let object = this.editor.objects[this.editor.state.currentObject];
      const pos = this.editor.getTransformedPosition(e.clientX, e.clientY);

      object.showTempPosition(pos)
    }
  }

  mouseUp(e) {
    // console.log(this.editor.objects);
  }

  keyDown(e) {
    if (e.key === "Escape") {
      if (this.editor.state.currentObject !== null) {
        const object = this.editor.objects[this.editor.state.currentObject];

        // Append the starting point to close the path
        if (object.pathPointsCount >= 2) 
          object.closePath();
        else {
          this.editor.svg.removeChild(object.element);
          this.editor.objects.splice(this.editor.state.currentObject, 1);
        }

        this.editor.state.currentObject = null;
      }
    }
  }


  // If tool interrupted and replaced
  deactivate() {
    const object = this.editor.objects[this.editor.state.currentObject]
    object.cancelTempPosition()
    this.editor.state.currentObject = null;
  }
}

class RectTool extends Tool {
  constructor(editor) {
    super(editor);
    this.element = document.getElementById("rect");
    this.fillColor = '#000000'
    this.strokeColor = '#000000'
    this.strokeWeight = 2

    // Only allow creation if mouse is moved during path creation
    this.moved = false
  }

  activate() {
    this.editor.container.classList.add("cursor-rect");
  }

  deactivate() {

    const object = this.editor.objects[this.editor.state.currentObject]

    if (object) {
      this.editor.svg.removeChild(object.element);
      this.editor.objects.splice(this.editor.state.currentObject, 1);
      this.editor.state.currentObject = null
    }
  }

  setStrokeColor(color){
    this.strokeColor = color

    let object = this.editor.objects[this.editor.state.currentObject]
    if (object)
      object.setStrokeColor(color)
  }

  setFillColor(color){
    this.fillColor = color

    let object = this.editor.objects[this.editor.state.currentObject]

    if (object)
      object.setFillColor(color)
  }

  setStrokeWidth(width) {
    this.strokeWidth = width

    let object = this.editor.objects[this.editor.state.currentObject]

    if (object)
      object.setStrokeWidth(width)
  }

  mouseDown(e) {

    const pos = this.editor.getTransformedPosition(e.clientX, e.clientY);

    if (this.editor.state.currentObject === null) {
      const object = new Rect(pos)

      object.setFillColor(this.fillColor)
      object.setStrokeColor(this.strokeColor)
      object.setStrokeWidth(this.strokeWidth)

      this.moved = false

      this.editor.svg.appendChild(object.element);
      this.editor.state.currentObject = this.editor.objects.length;

      this.editor.objects.push(object);
    }
  }

  mouseMove(e) {
    if (this.editor.state.currentObject !== null && this.editor.objects[this.editor.state.currentObject]) {
      const pos = this.editor.getTransformedPosition(e.clientX, e.clientY);
      
      const object = this.editor.objects[this.editor.state.currentObject]

      object.showTempPosition(pos)
      this.moved = true
    }
  }

  mouseUp(e) {
    
    const object = this.editor.objects[this.editor.state.currentObject]

    if (this.moved) {
      object.pushPoint(this.editor.getTransformedPosition(e.clientX, e.clientY))
      
      this.editor.history.captureState()
    } else {
      this.editor.svg.removeChild(object.element);
      this.editor.objects.splice(this.editor.state.currentObject, 1);
    }

    this.editor.state.currentObject = null;

  }
}

class TextTool extends Tool {
  constructor(editor) {
    super(editor);
    this.element = document.getElementById("text");
    this.fillColor = '#000000'
    this.strokeColor = '#000000'
    this.fontSize = 100

    this.validCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-={}[]|\\:;\'"<>,.?/`~ '
  }

  activate() {
    this.editor.container.classList.add("cursor-text");
  }

  deactivate() {
    this.editor.state.currentObject = null
    this.editor.history.captureState()
  }

  setStrokeColor(color){
    this.strokeColor = color

    let object = this.editor.objects[this.editor.state.currentObject]
    if (object)
      object.setStrokeColor(color)
  }

  setFillColor(color){
    this.fillColor = color

    let object = this.editor.objects[this.editor.state.currentObject]

    if (object)
      object.setFillColor(color)
  }

  setStrokeWidth(width) {
    this.strokeWidth = width

    let object = this.editor.objects[this.editor.state.currentObject]

    if (object)
      object.setStrokeWidth(width)
  }

  mouseDown(e) {
    if (this.editor.state.currentObject === null) {

      const pos = this.editor.getTransformedPosition(e.clientX, e.clientY);
      const object = new Text(pos)

      object.setFillColor(this.fillColor)
      object.setStrokeColor(this.strokeColor)
      object.setFontSize(this.fontSize)

      this.editor.svg.appendChild(object.element);
      
      this.editor.state.currentObject = this.editor.objects.length;
      this.editor.objects.push(object);


    } else {
      if (this.editor.state.currentObject !== null) {
        this.editor.state.currentObject = null
        this.editor.history.captureState()
      }
    }
  }

  keyDown(e) {
    // e.preventDefault();

    if (e.key === "Escape") {
      if (this.editor.state.currentObject !== null) {
        this.editor.state.currentObject = null;
        this.editor.history.captureState()
        
      }
    } else if (e.key === "Backspace") {
      if (this.editor.state.currentObject !== null) {
        const object = this.editor.objects[this.editor.state.currentObject];
        if (object.popText())
          this.editor.state.currentObject = null;
      }
    } else if(e.key === "Enter") {
      if (this.editor.state.currentObject !== null) {
        const object = this.editor.objects[this.editor.state.currentObject];
        object.newLine()
      }
    } else {
      if (this.editor.state.currentObject !== null && this.validCharacters.includes(e.key)) {
        const object = this.editor.objects[this.editor.state.currentObject];
        object.pushText(e.key)
        
      }
    }
  }
}

class SelectTool extends Tool {
  constructor(editor) {
    super(editor);
    this.element = document.getElementById("select");

    this.selectionBox = document.getElementById("selection-box");
    this.selectionBounds = {
      fullContent: this.selectionBox.children[0],
      topLeft: this.selectionBox.children[1],
      topRight: this.selectionBox.children[2],
      bottomLeft: this.selectionBox.children[3],
      bottomRight: this.selectionBox.children[4],
    }
  }

  activate() {
    this.editor.container.classList.add("cursor-select");
  }

  mouseDown(e) {
    if (this.editor.state.currentObject === null) {
      const objects = document.elementsFromPoint(e.clientX, e.clientY)
      
      for (let i = 0; i < objects.length; i ++) {
        if (objects[i].parentElement.id === 'svg_document') {
          const index = this.editor.objects.findIndex(obj => obj.element === objects[i]);
          if (index !== -1){
            this.editor.state.currentObject = index
            break
          }
        }
      }  


      console.log(this.editor.state.currentObject !== null)
      if (this.editor.state.currentObject !== null) {
        this.setSelectionBox()
      }



    } else {
      if (this.editor.state.currentObject !== null) {
        this.editor.state.currentObject = null
        this.editor.history.captureState()
      }
    }
  }

  mouseWheel(e) {
    if (this.editor.state.currentObject !== null) {
      this.setSelectionBox()
    }
  }

  setSelectionBox() {

    const object = this.editor.objects[this.editor.state.currentObject].element
    const bounds = object.getBoundingClientRect()

    console.log(bounds)

    this.selectionBounds.fullContent.setAttribute('x', bounds.left)
    this.selectionBounds.fullContent.setAttribute('y', bounds.top)
    this.selectionBounds.fullContent.setAttribute('width', bounds.width)
    this.selectionBounds.fullContent.setAttribute('height', bounds.height)

    this.selectionBounds.topLeft.setAttribute('x', bounds.left - 5)
    this.selectionBounds.topLeft.setAttribute('y', bounds.top - 5)
    
    this.selectionBounds.topRight.setAttribute('x', bounds.left + bounds.width - 5)
    this.selectionBounds.topRight.setAttribute('y', bounds.top - 5)

    this.selectionBounds.bottomLeft.setAttribute('x', bounds.left - 5)
    this.selectionBounds.bottomLeft.setAttribute('y', bounds.top + bounds.height - 5)
    
    this.selectionBounds.bottomRight.setAttribute('x', bounds.left + bounds.width - 5)
    this.selectionBounds.bottomRight.setAttribute('y', bounds.top + bounds.height - 5)
    
    this.selectionBox.style.visibility = 'visible'
  }

}