class Tool {
  constructor(editor) {
    this.editor = editor;
  }

  mouseDown(e) {}
  mouseMove(e) {}
  mouseUp(e) {}
  keyDown(e) {}
  activate() {}
  setFillColor(e){}
  setStrokeColor(){}
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

  keyDown(e) {
    if (e.key === "Escape") {
      if (this.editor.state.currentObject !== null) {
        const object = this.editor.objects[this.editor.state.currentObject];

        // Append the starting point to close the path
        if (object.pathPositions.length >= 2) {
          const startPos = object.pathPositions[0];
          this.editor.state.penPath.push(`L ${startPos.x} ${startPos.y}`);
        }

        // Update the SVG path element with the complete path
        object.element.setAttribute("d", this.editor.state.penPath.join(" "));

        // Remove the object if the path is not valid (optional)
        if (this.editor.state.penPath.length <= 1) {
          this.editor.svg.removeChild(object.element);
          this.editor.objects.splice(this.editor.state.currentObject, 1);
        }

        this.editor.state.currentObject = null;
      }
    }
  }
}

class TextTool extends Tool {
  constructor(editor) {
    super(editor);
    this.element = document.getElementById("text");
    this.fillColor = '#000000'
    this.strokeColor = '#000000'
    this.fontSize = 20

    this.validCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-={}[]|\\:;\'"<>,.?/`~ '
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
      this.editor.state.currentObject = null
      this.editor.history.captureState()
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
