import "./style.css";

interface Displayable {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Draggable {
  drag(x: number, y: number): void;
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
let currentLine: Displayable & Draggable | null = null;
let toolPreview: Displayable | null = null;

// Sticker buttons
const stickers = ["😀", "🌟", "❤️"];

// Remove direct drawing from mouse events, replace with:
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  redoStack.length = 0;
  if (currentTool === "marker") {
    currentLine = new MarkerLine(
      e.offsetX,
      e.offsetY,
      currentThickness,
      currentColor,
    );
  } else {
    currentLine = new Sticker(e.offsetX, e.offsetY, currentEmoji);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !currentLine) return;
  currentLine.drag(e.offsetX, e.offsetY);
  toolPreview = null;
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

// Preview
canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) {
    if (currentTool === "marker") {
      toolPreview = new ToolPreview(
        e.offsetX,
        e.offsetY,
        currentThickness,
        currentColor,
      );
    } else {
      toolPreview = new StickerPreview(e.offsetX, e.offsetY, currentEmoji);
    }
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

// Clear preview
canvas.addEventListener("mouseout", () => {
  toolPreview = null;
  canvas.dispatchEvent(new Event("tool-moved"));
});

// Tool moved observer
canvas.addEventListener("tool-moved", () => {
  // Redraw everything
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw all commands
  for (const command of displayList) {
    command.display(ctx);
  }

  // Draw current line if exists
  if (currentLine) {
    currentLine.display(ctx);
  }

  // Draw tool preview if exists
  if (toolPreview) {
    toolPreview.display(ctx);
  }
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

  if (toolPreview) {
    toolPreview.display(ctx);
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

// Thin marker button
const thinButton = document.createElement("button");
thinButton.textContent = "Thin";
document.body.appendChild(thinButton);

thinButton.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = 3;
  currentColor = getRandomColor();
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
  document.querySelectorAll("button").forEach((btn) => {
    if (stickers.includes(btn.textContent || "")) {
      btn.classList.remove("selectedTool");
    }
  });
  canvas.dispatchEvent(new Event("tool-moved"));
});

// Thick marker button
const thickButton = document.createElement("button");
thickButton.textContent = "Thick";
document.body.appendChild(thickButton);

thickButton.addEventListener("click", () => {
  currentTool = "marker";
  currentThickness = 8;
  currentColor = getRandomColor();
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
  document.querySelectorAll("button").forEach((btn) => {
    if (stickers.includes(btn.textContent || "")) {
      btn.classList.remove("selectedTool");
    }
  });
  canvas.dispatchEvent(new Event("tool-moved"));
});

// Thin marker initially selected
thinButton.classList.add("selectedTool");

// Create a sticker button
function createStickerButton(emoji: string) {
  const stickerButton = document.createElement("button");
  stickerButton.textContent = emoji;
  document.body.appendChild(stickerButton);

  stickerButton.addEventListener("click", () => {
    currentTool = "sticker";
    currentEmoji = emoji;

    // Remove selected class from all buttons
    thinButton.classList.remove("selectedTool");
    thickButton.classList.remove("selectedTool");
    document.querySelectorAll("button").forEach((btn) => {
      if (stickers.includes(btn.textContent || "")) {
        btn.classList.remove("selectedTool");
      }
    });

    // Add selected class to this button
    stickerButton.classList.add("selectedTool");

    canvas.dispatchEvent(new Event("tool-moved"));
  });

  return stickerButton;
}

// Create initial sticker buttons
stickers.forEach((emoji) => {
  createStickerButton(emoji);
});

// Custom sticker button
const customStickerButton = document.createElement("button");
customStickerButton.textContent = "Custom Sticker";
document.body.appendChild(customStickerButton);

customStickerButton.addEventListener("click", () => {
  const customText = prompt("Custom sticker text", "🧽");
  if (customText) {
    stickers.push(customText);
    createStickerButton(customText);
  }
});
/*
stickers.forEach((emoji) => {
  const stickerButton = document.createElement("button");
  stickerButton.textContent = emoji;
  document.body.appendChild(stickerButton);

  stickerButton.addEventListener("click", () => {
    currentTool = "sticker";
    currentEmoji = emoji;

    // Remove selected class from all buttons
    thinButton.classList.remove("selectedTool");
    thickButton.classList.remove("selectedTool");
    document.querySelectorAll("button").forEach((btn) => {
      if (stickers.includes(btn.textContent || "")) {
        btn.classList.remove("selectedTool");
      }
    });

    // Add selected class to this button
    stickerButton.classList.add("selectedTool");

    canvas.dispatchEvent(new Event("tool-moved"));
  });
});
*/

let currentColor = "#000000";

function getRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
}

class MarkerLine implements Displayable, Draggable {
  private points: Array<{ x: number; y: number }> = [];
  private thickness: number;
  private color: string;

  constructor(x: number, y: number, thickness: number, color: string) {
    this.points.push({ x, y });
    this.thickness = thickness;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 1) return;

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
  }
}

let currentTool: "marker" | "sticker" = "marker";
let currentThickness = 3;
let currentEmoji = "😀";

class ToolPreview implements Displayable {
  private x: number;
  private y: number;
  private thickness: number;
  private color: string;

  constructor(x: number, y: number, thickness: number, color: string) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
    this.color = color;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

class StickerPreview implements Displayable {
  private x: number;
  private y: number;
  private emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "40px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

class Sticker implements Displayable, Draggable {
  private x: number;
  private y: number;
  private emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "40px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

// Export button
const exportButton = document.createElement("button");
exportButton.textContent = "Export";
document.body.appendChild(exportButton);

exportButton.addEventListener("click", () => {
  // Create high-res canvas
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;

  const exportCtx = exportCanvas.getContext("2d");
  if (!exportCtx) return;

  // Scale up 4x (1024/256 = 4)
  exportCtx.scale(4, 4);

  // Draw all commands from display list
  for (const command of displayList) {
    command.display(exportCtx);
  }

  // Trigger download
  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});
