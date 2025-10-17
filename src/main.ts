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

// Clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
document.body.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
