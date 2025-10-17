import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
`;

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

/*
// Mouse event handlers
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});
*/

// Data structures
const displayList: Array<Array<{ x: number; y: number }>> = [];
let currentLine: Array<{ x: number; y: number }> | null = null;

// Remove direct drawing from mouse events, replace with:
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentLine = [{ x: e.offsetX, y: e.offsetY }];
  redoStack.length = 0;
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !currentLine) return;
  currentLine.push({ x: e.offsetX, y: e.offsetY });
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
  for (const line of displayList) {
    if (line.length > 0) {
      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length; i++) {
        ctx.lineTo(line[i].x, line[i].y);
      }
      ctx.stroke();
    }
  }

  // Draw current line if exists
  if (currentLine && currentLine.length > 0) {
    ctx.beginPath();
    ctx.moveTo(currentLine[0].x, currentLine[0].y);
    for (let i = 1; i < currentLine.length; i++) {
      ctx.lineTo(currentLine[i].x, currentLine[i].y);
    }
    ctx.stroke();
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
const redoStack: Array<Array<{ x: number; y: number }>> = [];

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
