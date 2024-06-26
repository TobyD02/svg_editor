// TODO: turn into class

/** @type{SVGSVGElement} */
const svgDocument = document.getElementById("svg_document");
const svgContainer = document.getElementById("svg_container");

class Editor {
  constructor() {
    this.svg = document.getElementById("svg_document");
    this.container = document.getElementById("svg_container");

    this.closeDistance = 20; // distance to close a path when clicking on it

    this.tools = {
      pan: new PanTool(this),
      pen: new PenTool(this),
    };

    this.state = {
      isPanning: false,
      startX: 0,
      startY: 0,
      scale: 1,
      panX: 0,
      panY: 0,
      penPath: [""],
      currentObject: null, // index of the current object inside this.objects
    };

    this.history = new History(this);

    this.objects = [];
    this.createPage(1920, 1080);

    this.selectedTool = null;

    this.container.addEventListener("mousedown", (e) => {
      this.history.captureState();
      if (Object.keys(this.tools).includes(this.selectedTool)) {
        this.tools[this.selectedTool].mouseDown(e);
      }
    });

    this.container.addEventListener("mousemove", (e) => {

      if (Object.keys(this.tools).includes(this.selectedTool)) {
        this.tools[this.selectedTool].mouseMove(e);
      }
    });

    this.container.addEventListener("mouseup", (e) => {
      if (Object.keys(this.tools).includes(this.selectedTool)) {
        this.tools[this.selectedTool].mouseUp(e);
      }

    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) {
          this.history.redo(); // Redo on Ctrl+Shift+Z / Cmd+Shift+Z
        } else {
          this.history.undo(); // Undo on Ctrl+Z / Cmd+Z
        }
      } else if (Object.keys(this.tools).includes(this.selectedTool)) {
        this.tools[this.selectedTool].keyDown(e);
      }
    });

    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();

      const { clientX, clientY, deltaY } = e;
      const zoomFactor = -deltaY * 0.001;
      const newScale = Math.max(0.1, this.state.scale * (1 + zoomFactor));

      const rect = this.svg.getBoundingClientRect();
      const svgPoint = {
        x: (clientX - rect.left) / this.state.scale,
        y: (clientY - rect.top) / this.state.scale,
      };

      // Calculate the new pan positions
      this.state.panX -= svgPoint.x * (newScale - this.state.scale);
      this.state.panY -= svgPoint.y * (newScale - this.state.scale);

      // Update the scale
      this.state.scale = newScale;
      this.updateTransform();
    });

    this.setInitialCenter();
  }

  setInitialCenter() {
    const containerRect = this.container.getBoundingClientRect();
    const svgRect = this.svg.getBoundingClientRect();

    const initialPanX = (containerRect.width - svgRect.width) / 2;
    const initialPanY = (containerRect.height - svgRect.height) / 2;

    this.state.scale = Math.min(containerRect.width / svgRect.width, containerRect.height / svgRect.height) * 0.9;

    this.state.panX = initialPanX;
    this.state.panY = initialPanY;

    this.updateTransform();
  }

  updateTransform() {
    this.svg.style.transform = `translate(${this.state.panX}px, ${this.state.panY}px) scale(${this.state.scale})`;
  }

  updateSVG() {
    this.svg.innerHTML = "";
    this.objects.forEach((obj) => this.svg.appendChild(obj.element));
  }

  setTool(tool) {
    this.history.captureState();

    if (Object.keys(this.tools).includes(tool)) {
      Object.values(this.tools).forEach((t) => t.element.classList.remove("active"));
      this.tools[tool].element.classList.add("active");

      this.selectedTool = tool;
    }
  }

  getTransformedPosition(clientX, clientY) {
    const svgRect = this.svg.getBoundingClientRect();

    // Calculate the position relative to the SVG element itself
    const x = (clientX - svgRect.left) / this.state.scale;
    const y = (clientY - svgRect.top) / this.state.scale;

    return { x, y };
  }

  createPage(width, height) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", "path");

    const positions = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];
    const path = `M ${positions[0].x} ${positions[0].y} L ${positions[1].x} ${positions[1].y} L ${positions[2].x} ${positions[2].y} L ${positions[3].x} ${positions[3].y} Z`;

    element.setAttribute("d", path);
    element.setAttribute("stroke", "none");
    element.setAttribute("stroke-width", "2");
    element.setAttribute("fill", "white");

    this.objects.push({ element: element, path: path, pathPositions: positions });

    this.svg.appendChild(element);
  }
}

class History {
  constructor(editor) {
    this.editor = editor;
    this.stack = [];
    this.pointer = -1;
  }

  captureState() {
    const state = this.editor.state;

    const objects = this.editor.objects.map((obj) => ({
      element: obj.element.cloneNode(true), // Clone SVG element to capture current state
      path: [...obj.path],
      pathPositions: [...obj.pathPositions],
    }));

    this.stack.splice(this.pointer + 1); // Clear redo stack
    this.stack.push({ state: state, objects: objects });
    this.pointer = this.stack.length - 1;

  }

  undo() {
    if (this.pointer > 0) {
      this.pointer--;
      const prevState = this.stack[this.pointer];
      this.restoreState(prevState);
    }
  }

  redo() {
    if (this.pointer < this.stack.length - 1) {
      this.pointer++;
      const nextState = this.stack[this.pointer];
      this.restoreState(nextState);
    }
  }

  restoreState(state) {
    this.editor.objects = state.objects.map((obj) => ({
      element: obj.element.cloneNode(true), // Clone SVG element
      path: [...obj.path],
      pathPositions: [...obj.pathPositions],
    }));
    this.editor.state = state.state;

    this.editor.state.penPath = this.editor.objects[this.editor.state.currentObject].path



    this.editor.updateTransform();
    this.editor.updateSVG();
  }
}

let editor = new Editor();
