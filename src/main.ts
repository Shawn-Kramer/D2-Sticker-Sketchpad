import "./style.css";

interface Displayable {
  display(ctx: CanvasRenderingContext2D): void;
}

// App title
const appTitle = document.createElement("h1");
appTitle.textContent = "Sticker Sketchpad";
document.body.appendChild(appTitle);

// Canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.appendChild(canvas);

// Get canvas context
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Could not get canvas context");

// Track drawing state
let isDrawing = false;

// Data structures
const displayList: Displayable[] = [];
let currentLine: MarkerLine | null = null;

// Remove direct drawing from mouse events, replace with:
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentLine = new MarkerLine(e.offsetX, e.offsetY);
  redoStack.length = 0;
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !currentLine) return;
  currentLine.drag(e.offsetX, e.offsetY);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseup", () => {
  if (currentLine) {
    displayList.push(currentLine);
    currentLine = null;
  }
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  if (currentLine) {
    displayList.push(currentLine);
    currentLine = null;
  }
  isDrawing = false;
});

// Observer for drawing-changed event
canvas.addEventListener("drawing-changed", () => {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw all lines from display list
  for (const command of displayList) {
    command.display(ctx);
  }

  // Draw current line if exists
  if (currentLine) {
    currentLine.display(ctx);
  }
});

// Clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  displayList.length = 0;
  currentLine = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// Redo stack
const redoStack: Displayable[] = [];

// Undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
document.body.appendChild(undoButton);

undoButton.addEventListener("click", () => {
  if (displayList.length > 0) {
    const lastLine = displayList.pop();
    if (lastLine) {
      redoStack.push(lastLine);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
document.body.appendChild(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const line = redoStack.pop();
    if (line) {
      displayList.push(line);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

class MarkerLine implements Displayable {
  private points: Array<{ x: number; y: number }> = [];

  constructor(x: number, y: number) {
    this.points.push({ x, y });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 1) return;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
  }
}
