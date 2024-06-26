  // TODO: turn into class

  /** @type{SVGSVGElement} */
  const svgDocument = document.getElementById("svg_document");
  const svgContainer = document.getElementById("svg_container");

  class Editor {
    constructor() {
      this.svg = document.getElementById("svg_document");
      this.container = document.getElementById("svg_container");

      this.closeDistance = 50; // distance to close a path when clicking on it

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

    setTool(tool) {
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
  }

  let editor = new Editor();
