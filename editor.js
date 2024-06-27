// TODO: Figure out how to add text. Currently objects are stored with path etc... but text isnt a path
// This only matters for history, so each class (object) should be stored in its own way (path, text, etc...)

/** @type{SVGSVGElement} */
const svgDocument = document.getElementById("svg_document");
const svgContainer = document.getElementById("svg_container");

class Editor {
  constructor() {
    this.svg = document.getElementById("svg_document");
    this.container = document.getElementById("svg_container");

    this.closeDistance = 20; // distance to close a path when clicking on it
    this.zoomSpeed = 0.01;

    this.tools = {
      pan: new PanTool(this),
      pen: new PenTool(this),
      rect: new RectTool(this),
      text: new TextTool(this),
    };

    this.fillColor = "#000000";
    this.strokeColor = "#000000";

    this.fillPicker = document.getElementById("fill-picker");

    this.fillPicker.addEventListener("input", (e) => {
      this.fillColor = e.target.value;
      this.assignColors();
    });

    this.strokePicker = document.getElementById("stroke-picker");

    this.strokePicker.addEventListener("input", (e) => {
      this.strokeColor = e.target.value;
      this.assignColors();
    });

    this.state = {
      isPanning: false,
      startX: 0,
      startY: 0,
      scale: 1,
      panX: 0,
      panY: 0,
      currentObject: null, // index of the current object inside this.objects
    };

    this.history = new History(this);

    this.objects = [];
    this.createPage(1920, 1080);

    this.selectedTool = null;

    this.container.addEventListener("mousedown", (e) => {
      if (Object.keys(this.tools).includes(this.selectedTool)) {
        this.tools[this.selectedTool].mouseDown(e);
      }
      // this.history.captureState();
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
      // this.history.captureState();
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
      const zoomFactor = -deltaY * this.zoomSpeed;
      const newScale = Math.max(0.1, this.state.scale * (1 + zoomFactor));
      
      this.state.scale = newScale;
      this.updateTransform();
    });

    this.setInitialCenter();

    this.history.captureState(); // Capture document initial state
  }

  assignColors() {
    this.tools[this.selectedTool].setFillColor(this.fillColor);
    this.tools[this.selectedTool].setStrokeColor(this.strokeColor);
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
    if (Object.keys(this.tools).includes(tool)) {

      if (this.selectedTool !== null) {
        this.tools[this.selectedTool].deactivate()
        this.history.captureState();
      }

      Object.values(this.tools).forEach((t) => t.element.classList.remove("active"));
      this.tools[tool].element.classList.add("active");

      this.selectedTool = tool;
      this.container.classList = [];
      this.tools[this.selectedTool].activate();
      this.assignColors();
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
    const object = new Rect({ x: 0, y: 0 });
    object.setFillColor("#ffffff");

    object.pushPoint({ x: width, y: height });

    this.svg.appendChild(object.element);
    this.objects.push(object);
  }

  setFillColor(color) {
    this.fillColor = color;
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
    const objects = this.editor.objects.map((obj) => obj.clone());

    console.log(objects);

    // Dont capture state if states are equal
    if (this.stack.length > 0) {
      const lastState = this.stack[this.stack.length - 1];
      if (this.areObjectsEqual(objects, lastState.objects)) {
        return;
      }
    }

    this.stack.splice(this.pointer + 1); // Clear redo stack
    this.stack.push({ state: state, objects: objects });
    this.pointer = this.stack.length - 1;

    console.log("captured", this.stack);
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
    this.editor.objects = state.objects.map((obj) => obj.clone());
    this.editor.state = state.state;

    if (this.editor.state.currentObject > this.editor.objects.length - 1) this.editor.state.currentObject = null;

    this.editor.updateTransform();
    this.editor.updateSVG();
  }

  areStatesEqual(state1, state2) {
    return JSON > stringify(state1) === JSON.stringify(state2);
  }

  areObjectsEqual(objects1, objects2) {
    if (objects1.length !== objects2.length) return false;
    for (let i = 0; i < objects1.length; i++) {
      console.log(objects1[i], objects2[i]);
      if (!objects1[i].equals(objects2[i])) return false;
    }
    return true;
  }
}

let editor = new Editor();
