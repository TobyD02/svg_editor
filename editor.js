// TODO: turn into class

/** @type{SVGSVGElement} */
const svgDocument = document.getElementById("svg_document");
const svgContainer = document.getElementById("svg_container");

class Editor {
  constructor() {
    this.svg = document.getElementById("svg_document");
    this.container = document.getElementById("svg_container");

    this.closeDistance = 10;

    this.tools = {
      pan: {
        element: document.getElementById("pan"),
        mouseDown: (e) => {
          this.container.style.cursor = "grabbing";
          this.state.isPanning = true;
          this.state.startX = e.clientX - this.state.panX;
          this.state.startY = e.clientY - this.state.panY;
        },

        mouseMove: (e) => {
          if (this.state.isPanning) {
            this.state.panX = e.clientX - this.state.startX;
            this.state.panY = e.clientY - this.state.startY;
            this.updateTransform();
          }
        },

        mouseUp: (e) => {
          this.state.isPanning = false;
          this.container.style.cursor = "grab";
        },
      },
      pen: {
        element: document.getElementById("pen"),
        mouseDown: (e) => {
          this.container.style.cursor = "url(./assets/pen.png), auto";
          const pos = this.getTransformedPosition(e.clientX, e.clientY);


          // Check if we are starting a new path
          if (this.state.currentObject === null) {
            const element = document.createElementNS("http://www.w3.org/2000/svg", "path");
            this.state.penPath = [`M ${pos.x} ${pos.y}`];

            element.setAttribute("d", this.state.penPath.join(" "));
            element.setAttribute("stroke", "black");
            element.setAttribute("stroke-width", "2");
            element.setAttribute("fill", "none");


            this.svg.appendChild(element);
            this.state.currentObject = this.objects.length;
            this.state.penStartPosition = pos;

            this.objects.push({element: element, path: this.state.penPath, startPosition: pos});

          } else {
            const dist = Math.sqrt((pos.x - this.state.penStartPosition.x) ** 2 + (pos.y - this.state.penStartPosition.y) ** 2);

            console.log("distance, " + dist);

            if (dist <= this.closeDistance) {
              this.state.penPath.push(`L ${this.state.penStartPosition.x} ${this.state.penStartPosition.y}`);
              this.objects[this.state.currentObject].element.setAttribute("d", this.state.penPath.join(" "));
              this.objects[this.state.currentObject].path = this.state.penPath;

              this.state.currentObject = null;
              this.state.penPath = []
            } else {
              // Continue adding points
              this.state.penPath.push(`L ${pos.x} ${pos.y}`);
              this.objects[this.state.currentObject].element.setAttribute("d", this.state.penPath.join(" "));
              this.objects[this.state.currentObject].path = this.state.penPath;
            }
          }
        },

        mouseMove: (e) => {
          if (this.state.currentObject !== null) {
            const pos = this.getTransformedPosition(e.clientX, e.clientY);
            const currentPath = [...this.state.penPath];
            currentPath.push(`L ${pos.x} ${pos.y}`);
            this.objects[this.state.currentObject].element.setAttribute("d", currentPath.join(" "));
          }
        },
        mouseUp: (e) => {
          // console.log("pen mouse up");
          console.log(this.objects)
        },
      },
    };

    this.state = {
      isPanning: false,
      startX: 0,
      startY: 0,
      scale: 1,
      panX: 0,
      panY: 0,
      penPath: [""],
      penStartPosition: { x: null, y: null },
      currentObject: null, // index of the current object inside this.objects
    };

    this.objects = [];

    this.selectedTool = null;

    this.container.addEventListener("mousedown", (e) => {
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

    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const { offsetX, offsetY, deltaY } = e;
      const zoomFactor = -deltaY * 0.001;
      const newScale = Math.max(0.1, this.state.scale * (1 + zoomFactor));

      const rect = this.svg.getBoundingClientRect();
      const dx = (offsetX - rect.left) / this.state.scale;
      const dy = (offsetY - rect.top) / this.state.scale;

      this.state.panX -= dx * (newScale - this.state.scale);
      this.state.panY -= dy * (newScale - this.state.scale);

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

  setTool(tool) {
    if (Object.keys(this.tools).includes(tool)) {
      Object.values(this.tools).forEach((t) => t.element.classList.remove("active"));
      this.tools[tool].element.classList.add("active");

      this.selectedTool = tool;
    }
  }

  getTransformedPosition(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    const svgRect = this.svg.getBoundingClientRect();

    // Calculate the position relative to the SVG element itself
    const x = (clientX - svgRect.left) / this.state.scale;
    const y = (clientY - svgRect.top) / this.state.scale;

    return { x, y };
  }
}

let editor = new Editor();
