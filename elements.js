class Path {
  constructor(startPosition) {
    this.element = document.createElementNS("http://www.w3.org/2000/svg", "path");

    this.pathPositions = [startPosition];
    this.path = [`M ${startPosition.x} ${startPosition.y}`];

    this.pathPointsCount = this.pathPositions.length;

    this.fillColor = "#000000";
    this.strokeColor = "#000000";
    this.strokeWidth = 2;

    this.tempPosition = null;

    this.element.setAttribute("d", this.path);
    this.element.setAttribute("stroke", this.strokeColor);
    this.element.setAttribute("stroke-width", this.strokeWidth);
    this.element.setAttribute("fill", this.fillColor);
  }

  getClosestPoint(position) {
    let dist = Infinity;
    let closestPoint = null;

    for (let i = 0; i < this.pathPositions.length; i++) {
      let pathDist = Math.sqrt((this.pathPositions[i].x - position.x) ** 2 + (this.pathPositions[i].y - position.y) ** 2);
      if (pathDist < dist) {
        dist = pathDist;
        closestPoint = this.pathPositions[i];
      }
    }

    return {dist, closestPoint};
  }

  pushPoint(point) {
    this.pathPositions.push(point);
    this.path.push(`L ${point.x} ${point.y}`);
    this.element.setAttribute("d", this.path.join(" "));

    this.pathPointsCount = this.pathPositions.length;
  }

  changePoint(newPoint, index) {
    this.pathPositions[index] = newPoint;
    this.path[index] = `L ${newPoint.x} ${newPoint.y}`;
    this.element.setAttribute("d", this.path.join(" "));
  }

  showTempPosition(point) {
    this.tempPosition = point;
    this.element.setAttribute("d", this.path.join(" ") + `L ${point.x} ${point.y}`);
  }

  cancelTempPosition() {
    this.element.setAttribute("d", this.path.join(" "));
    this.tempPosition = null;
  } 

  removePoints(index) {
    this.pathPositions.splice(index, 1);
    this.path.splice(index, 1);
    this.element.setAttribute("d", this.path.join(" "));

    this.pathPointsCount = this.pathPositions.length;
  }

  closePath() {
    this.pathPositions.push(this.pathPositions[0]);
    this.path.push(`L ${this.pathPositions[0].x} ${this.pathPositions[0].y}`);
    this.element.setAttribute("d", this.path.join(" "));

    this.pathPointsCount = this.pathPositions.length;
  }

  setFillColor(color) {
    this.fillColor = color;
    this.element.setAttribute("fill", this.fillColor);
  }

  setStrokeColor(color) {
    this.strokeColor = color;
    this.element.setAttribute("stroke", this.strokeColor);
  }

  setStrokeWidth(width) {
    this.strokeWidth = width;
    this.element.setAttribute("stroke-width", this.strokeWidth);
  }

  clone() {
    const clonedPath = new Path({ ...this.pathPositions[0] });
    clonedPath.pathPositions = this.pathPositions.map((pos) => ({ ...pos }));
    clonedPath.path = [...this.path];
    clonedPath.pathPointsCount = this.pathPointsCount;
    clonedPath.fillColor = this.fillColor;
    clonedPath.strokeColor = this.strokeColor;
    clonedPath.strokeWidth = this.strokeWidth;
    clonedPath.tempPosition = this.tempPosition ? { ...this.tempPosition } : null;

    clonedPath.element = this.element.cloneNode(true); // Deep clone the SVG element

    return clonedPath;
  }

  equals(otherPath) {
    if (!(otherPath instanceof Path)) return false;

    return (
      JSON.stringify(this.path) === JSON.stringify(otherPath.path) &&
      JSON.stringify(this.pathPositions) === JSON.stringify(otherPath.pathPositions) &&
      this.fillColor === otherPath.fillColor &&
      this.strokeColor === otherPath.strokeColor &&
      this.strokeWidth === otherPath.strokeWidth &&
      JSON.stringify(this.tempPosition) === JSON.stringify(otherPath.tempPosition)
    );
  }
}

class Rect {
  constructor(startPosition) {
    this.pathPositions = [startPosition];
    this.path = [];
    this.path.push(`M ${startPosition.x} ${startPosition.y}`)

    this.fillColor = "#000000";
    this.strokeColor = "#000000";
    this.strokeWidth = 2;

    this.element = document.createElementNS("http://www.w3.org/2000/svg", "path");

    this.element.setAttribute("d", this.path[0]);
    this.element.setAttribute("stroke", this.strokeColor);
    this.element.setAttribute("stroke-width", "2");
    this.element.setAttribute("fill", this.fillColor);
  }

  showTempPosition(point) {
    const origin = this.pathPositions[0];
    let path = [this.path[0], `L ${point.x} ${origin.y}`, `L ${point.x} ${point.y}`, `L ${origin.x} ${point.y}`, `L ${origin.x} ${origin.y}`];

    this.element.setAttribute("d", path.join(" "));
  }

  pushPoint(point) {
    const origin = this.pathPositions[0];

    this.pathPosition = [
      origin,
      { x: point.x, y: origin.y },
      { x: point.x, y: point.y },
      { x: origin.x, y: point.y },
      { x: origin.x, y: origin.y },
    ];

    this.path = [
      `M ${origin.x} ${origin.y}`,
      `L ${point.x} ${origin.y}`,
      `L ${point.x} ${point.y}`,
      `L ${origin.x} ${point.y}`,
      `L ${origin.x} ${origin.y}`,
    ]

    this.element.setAttribute("d", this.path.join(" "));
  }

  setFillColor(color) {
    this.fillColor = color;
    this.element.setAttribute("fill", this.fillColor);
  }

  setStrokeColor(color) {
    this.strokeColor = color;
    this.element.setAttribute("stroke", this.strokeColor);
  }

  setStrokeWidth(width) {
    this.strokeWidth = width;
    this.element.setAttribute("stroke-width", this.strokeWidth);
  }

  clone() {
    const clonedRect = new Rect({ ...this.pathPositions[0] });
    clonedRect.pathPositions = this.pathPositions.map((pos) => ({ ...pos }));
    clonedRect.path = [...this.path];
    clonedRect.fillColor = this.fillColor;
    clonedRect.strokeColor = this.strokeColor;
    clonedRect.strokeWidth = this.strokeWidth;

    clonedRect.element = this.element.cloneNode(true); // Deep clone the SVG element

    return clonedRect;
  }

  equals(otherRect) {
    if (!(otherRect instanceof Rect)) return false;

    return (
      JSON.stringify(this.pathPositions) === JSON.stringify(otherRect.pathPositions) &&
      JSON.stringify(this.path) === JSON.stringify(otherRect.path) &&
      this.fillColor === otherRect.fillColor &&
      this.strokeColor === otherRect.strokeColor &&
      this.strokeWidth === otherRect.strokeWidth
    );
  }
}

class Text {
  constructor(startPosition) {
    
    this.fontSize = 20
    this.text = ''
    this.fillColor = '#000000' 
    this.strokeColor = '#000000'
    this.startPosition = startPosition
    
    this.element = document.createElementNS("http://www.w3.org/2000/svg", "text");

    this.lines = [document.createElementNS("http://www.w3.org/2000/svg", "tspan")];
    this.currentLine = 0

    this.element.setAttribute("x", this.startPosition.x);
    this.element.setAttribute("y", this.startPosition.y);
    this.element.setAttribute("font-size", this.fontSize);
    this.element.setAttribute("stroke", this.strokeColor);
    this.element.setAttribute("fill", this.fillColor);


    this.lines[0].textContent = this.text
    this.element.appendChild(this.lines[0])
  }

  pushText(text) {
    this.text += text
    this.lines[this.currentLine].textContent = this.text

  }

  popText() {

    if (this.text.length === 0) {
      if (this.currentLine > 0) {
        this.currentLine--
        this.text = this.lines[this.currentLine].textContent
      } else {
        // Tell parent to delete this object
        return true
      }
    }

    this.text = this.text.slice(0, -1)
    // this.element.textContent = this.text
    this.lines[this.currentLine].textContent = this.text
  }

  newLine() {

    const newLine = document.createElementNS("http://www.w3.org/2000/svg", "tspan")
    newLine.setAttribute('dy', '1.2em')
    newLine.setAttribute('x', this.startPosition.x)

    this.element.appendChild(newLine)
    
    this.lines.push(newLine)

    this.currentLine++
    this.text = ''
  }

  setFontSize(size) {
    this.fontSize = size
    this.element.setAttribute("font-size", this.fontSize);
  }

  setFillColor(color) {
    this.fillColor = color
    this.element.setAttribute("fill", this.fillColor);
  }

  setStrokeColor(color) {
    this.strokeColor = color
    this.element.setAttribute("stroke", this.strokeColor);
  }

  clone() {
    const clonedText = new Text(this.startPosition);
    clonedText.fontSize = this.fontSize
    clonedText.text = this.text
    clonedText.fillColor = this.fillColor
    clonedText.strokeColor = this.strokeColor
    clonedText.element = this.element.cloneNode(true); // Deep clone the SVG element

    return clonedText
  }

  equals(otherText) {
    if (!(otherText instanceof Text)) return false;

    return (
      this.fontSize === otherText.fontSize &&
      this.text === otherText.text &&
      this.fillColor === otherText.fillColor &&
      this.strokeColor === otherText.strokeColor
    );
  }
}