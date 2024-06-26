class Tool {
  constructor(editor) {
    this.editor = editor;
  }

  mouseDown(e) {}
  mouseMove(e) {}
  mouseUp(e) {}
  keyDown(e) {}
}

class PanTool extends Tool {
  constructor(editor) {
    super(editor);
    this.element = document.getElementById("pan");
  }

  mouseDown(e) {
    this.editor.container.style.cursor = "grabbing";
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
    this.editor.container.style.cursor = "grab";
  }
}

class PenTool extends Tool {
  constructor(editor) {
    super(editor);
    this.element = document.getElementById("pen");
  }

  mouseDown(e) {
    this.editor.container.style.cursor = "url(assets/pen.png)";
    
    const pos = this.editor.getTransformedPosition(e.clientX, e.clientY);

    if (this.editor.state.currentObject === null) {
      const element = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.editor.state.penPath = [`M ${pos.x} ${pos.y}`];

      element.setAttribute("d", this.editor.state.penPath.join(" "));
      element.setAttribute("stroke", "black");
      element.setAttribute("stroke-width", "2");
      element.setAttribute("fill", `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`);

      this.editor.svg.appendChild(element);
      this.editor.state.currentObject = this.editor.objects.length;

      this.editor.objects.push({ element: element, path: this.editor.state.penPath, pathPositions: [pos] });
    } else {
      const pathPoints = this.editor.objects[this.editor.state.currentObject].pathPositions;

      let dist = Infinity;
      let closestPoint = null;

      for (let i = 0; i < pathPoints.length; i++) {
        let pathDist = Math.sqrt((pathPoints[i].x - pos.x) ** 2 + (pathPoints[i].y - pos.y) ** 2);
        if (pathDist < dist) {
          dist = pathDist;
          closestPoint = pathPoints[i];
        }
      }

      if (dist <= this.editor.closeDistance) {
        this.editor.state.penPath.push(`L ${closestPoint.x} ${closestPoint.y}`);
        this.editor.objects[this.editor.state.currentObject].element.setAttribute("d", this.editor.state.penPath.join(" "));
        this.editor.objects[this.editor.state.currentObject].path = this.editor.state.penPath;

        this.editor.state.currentObject = null;
        this.editor.state.penPath = [];
      } else {
        this.editor.state.penPath.push(`L ${pos.x} ${pos.y}`);
        this.editor.objects[this.editor.state.currentObject].element.setAttribute("d", this.editor.state.penPath.join(" "));
        this.editor.objects[this.editor.state.currentObject].path = this.editor.state.penPath;
        this.editor.objects[this.editor.state.currentObject].pathPositions.push(pos);
      }
    }
  }

  mouseMove(e) {
    if (this.editor.state.currentObject !== null && this.editor.objects[this.editor.state.currentObject]) {
      const pos = this.editor.getTransformedPosition(e.clientX, e.clientY);
      const currentPath = [...this.editor.state.penPath];
      currentPath.push(`L ${pos.x} ${pos.y}`);
  
      this.editor.objects[this.editor.state.currentObject].element.setAttribute("d", currentPath.join(" "));
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
        this.editor.state.penPath = [];
      }
    }
  }
}
