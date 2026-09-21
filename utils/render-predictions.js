const COLOR = "#00FFFF";
const FONT_SIZE = 16;

export const renderPredictions = (predictions, ctx) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.font = `${FONT_SIZE}px sans-serif`;
  ctx.textBaseline = "top";
  ctx.lineWidth = 4;

  predictions.forEach(({ bbox, class: label, score }) => {
    const [x, y, width, height] = bbox;
    const text = `${label} ${Math.round(score * 100)}%`;

    ctx.strokeStyle = COLOR;
    ctx.strokeRect(x, y, width, height);

    // Put the label above the box when there is room, otherwise inside it.
    const labelHeight = FONT_SIZE + 6;
    const labelY = y >= labelHeight ? y - labelHeight : y;
    const labelWidth = ctx.measureText(text).width + 8;

    ctx.fillStyle = COLOR;
    ctx.fillRect(x, labelY, labelWidth, labelHeight);
    ctx.fillStyle = "#000000";
    ctx.fillText(text, x + 4, labelY + 3);
  });
};
