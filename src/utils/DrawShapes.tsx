// src/utils/DrawShapes.tsx
import { type ReactNode } from "react";

// ============ ROTATION ============

export function rotate(x: number, y: number, xr: number, yr: number, rotationDeg = 0): [number, number] {
  const rad = (rotationDeg * Math.PI) / 180;
  return [
    x + (xr - x) * Math.cos(rad) - (yr - y) * Math.sin(rad),
    y + (xr - x) * Math.sin(rad) + (yr - y) * Math.cos(rad),
  ];
}

// Rounding to 2 decimals avoids sub-pixel coordinates that make SVG edges look soft/blurry.
function pointsToString(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

function centroid(pts: [number, number][]): [number, number] {
  const n = pts.length;
  const sumX = pts.reduce((a, [x]) => a + x, 0);
  const sumY = pts.reduce((a, [, y]) => a + y, 0);
  return [sumX / n, sumY / n];
}

function rotateAll(pts: [number, number][], rotationDeg: number): [number, number][] {
  const [cx, cy] = centroid(pts);
  return pts.map(([x, y]) => rotate(cx, cy, x, y, rotationDeg));
}

// ============ FLAT SHAPES ============

export function squareVertices(size: number): [number, number][] {
  return [[0, 0], [size, 0], [size, size], [0, size]];
}

export function rectVertices(width: number, height: number): [number, number][] {
  return [[0, 0], [width, 0], [width, height], [0, height]];
}

export function equilateralTriangleVertices(height: number): [number, number][] {
  const length = height / (Math.sqrt(3) / 2);
  return [
    [length / 2, 0],
    [0, height],
    [length, height],
  ];
}

export function isocelesTriangleVertices(height: number, baseWidth: number): [number, number][] {
  return [
    [baseWidth / 2, 0],
    [0, height],
    [baseWidth, height],
  ];
}

export function rightTriangleVertices(height: number, baseWidth: number): [number, number][] {
  return [
    [0, 0],
    [0, height],
    [baseWidth, height],
  ];
}

export type ShapeType = "square" | "rect" | "isoceles_triangle" | "eq_triangle" | "right_triangle";

export function shapeVertices(type: ShapeType, size: number): [number, number][] {
  switch (type) {
    case "square": return squareVertices(size);
    case "rect": return rectVertices(size * 2, size);
    case "isoceles_triangle": return isocelesTriangleVertices(size, size);
    case "eq_triangle": return equilateralTriangleVertices(size);
    case "right_triangle": return rightTriangleVertices(size, size);
  }
}

export function Shape({
  type, size = 25, rotationDeg = 0, fill = "none", stroke = "black",
}: { type: ShapeType; size?: number; rotationDeg?: number; fill?: string; stroke?: string }) {
  const verts = rotateAll(shapeVertices(type, size), rotationDeg);
  return (
    <polygon
      points={pointsToString(verts)}
      fill={fill}
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinejoin="round"
      shapeRendering="geometricPrecision"
    />
  );
}

// ============ CUBE (isometric) ============

export interface CubeFaces {
  front: [number, number][];
  top: [number, number][];
  side: [number, number][];
}

export function computeCubeFaces(
  x: number,
  y: number,
  length: number,
  depth = 15,
  rotationDeg = 0,
  foreshorten = 0.65
): CubeFaces {
  const angle = (40 * Math.PI) / 180;
  const dx = depth * foreshorten * Math.cos(angle);
  const dy = depth * foreshorten * Math.sin(angle);

  const allVertices: [number, number][] = [
    [x, y], [x, y - length], [x + length, y - length], [x + length, y],
    [x + dx, y + dy], [x + length + dx, y + dy],
  ];
  const [ccx, ccy] = centroid(allVertices);

  const front: [number, number][] = [
    [x, y], [x, y - length], [x + length, y - length], [x + length, y],
  ].map(([px, py]) => rotate(ccx, ccy, px, py, rotationDeg));

  const top: [number, number][] = [
    [x, y], [x + length, y], [x + length + dx, y + dy], [x + dx, y + dy],
  ].map(([px, py]) => rotate(ccx, ccy, px, py, rotationDeg));

  const side: [number, number][] = [
    [x + length, y], [x + length + dx, y + dy], [x + length + dx, y - length + dy], [x + length, y - length],
  ].map(([px, py]) => rotate(ccx, ccy, px, py, rotationDeg));

  return { front, top, side };
}

export function Cube({
  x, y, length, depth = 15, rotationDeg = 0, foreshorten = 0.65,
  drawSides = [true, true, true],
}: {
  x: number; y: number; length: number; depth?: number; rotationDeg?: number;
  foreshorten?: number; drawSides?: [boolean, boolean, boolean];
}) {
  const { front, top, side } = computeCubeFaces(x, y, length, depth, rotationDeg, foreshorten);
  return (
    <>
      {drawSides[1] && (
        <polygon points={pointsToString(top)} fill="lightgrey" stroke="black" strokeWidth={1.2}
          strokeLinejoin="round" shapeRendering="geometricPrecision" />
      )}
      {drawSides[0] && (
        <polygon points={pointsToString(front)} fill="white" stroke="black" strokeWidth={1.2}
          strokeLinejoin="round" shapeRendering="geometricPrecision" />
      )}
      {drawSides[2] && (
        <polygon points={pointsToString(side)} fill="dimgrey" stroke="black" strokeWidth={1.2}
          strokeLinejoin="round" shapeRendering="geometricPrecision" />
      )}
    </>
  );
}

// ============ CUBE GRID (one 2D layer of cubes) ============

export function CubeGrid({
  x, y, length, depth = 15, rotationDeg = 0, foreshorten = 0.65,
  grid, centerOverride,
}: {
  x: number; y: number; length: number; depth?: number; rotationDeg?: number;
  foreshorten?: number; grid: number[][]; centerOverride?: [number, number];
}) {
  const rot = ((rotationDeg % 360) + 360) % 360;
  const nRows = grid.length;
  const nCols = grid[0].length;

  const gcx = x + (nCols * length) / 2;
  const gcy = y - (nRows * length) / 2;
  const [ccx, ccy] = centerOverride ?? [gcx, gcy];

  const cubes: ReactNode[] = [];

  for (let i = nRows - 1; i >= 0; i--) {
    for (let j = 0; j < nCols; j++) {
      const cur = grid[i][j];
      if (cur === 0) continue;

      const rawX = x + j * length;
      const rawY = y - i * length;
      const [cx, cy] = rotate(ccx, ccy, rawX, rawY, rot);

      const above = i - 1 >= 0 ? grid[i - 1][j] : 0;
      const next = j + 1 < nCols ? grid[i][j + 1] : 0;
      const drawTop = above === 1 ? false : true;
      const drawSide = next === 1 ? false : true;

      cubes.push(
        <Cube
          key={`${i}-${j}`}
          x={cx} y={cy} length={length} depth={depth} rotationDeg={rot} foreshorten={foreshorten}
          drawSides={[true, drawTop, drawSide]}
        />
      );
    }
  }

  return <>{cubes}</>;
}

// ============ CUBE CUBE (stacked layers) ============

export function CubeCube({
  x, y, length, depth = 15, rotationDeg = 0, foreshorten = 0.65, grid,
}: {
  x: number; y: number; length: number; depth?: number; rotationDeg?: number;
  foreshorten?: number; grid: number[][][];
}) {
  const rot = rotationDeg % 180;
  const nLayers = grid.length;
  const nRows = grid[0].length;
  const nCols = grid[0][0].length;

  const angle = (40 * Math.PI) / 180;
  const dx = foreshorten * depth * Math.cos(angle);
  const dy = foreshorten * depth * Math.sin(angle);

  const ccx = x + (nCols * length) / 2 + (nLayers * -dx) / 2;
  const ccy = y - (nRows * length) / 2 - (nLayers * dy) / 2;

  let curX = x + nLayers * dx;
  let curY = y - nLayers * dy;

  const layers: ReactNode[] = [];
  const reversedLayers = [...grid].reverse();

  reversedLayers.forEach((layer, idx) => {
    curX -= dx;
    curY -= dy;
    layers.push(
      <CubeGrid
        key={idx}
        x={curX} y={curY} length={length} depth={depth} rotationDeg={rot} foreshorten={foreshorten}
        grid={layer} centerOverride={[ccx, ccy]}
      />
    );
  });

  return <>{layers}</>;
}

// ============ RECT 3D ============

export interface Rect3DFaces {
  front: [number, number][];
  top: [number, number][];
  side: [number, number][];
}

export function computeRect3DFaces(
  x: number, y: number, width: number, height: number,
  depth = 15, rotationDeg = 0, foreshorten = 0.65
): Rect3DFaces {
  const angle = (40 * Math.PI) / 180;
  const dx = depth * foreshorten * Math.cos(angle);
  const dy = depth * foreshorten * Math.sin(angle);

  const front: [number, number][] = [
    [x, y], [x, y - height], [x + width, y - height], [x + width, y],
  ];
  const [fcx, fcy] = [x + width / 2, y - height / 2];
  const rotatedFront = front.map(([px, py]) => rotate(fcx, fcy, px, py, rotationDeg));

  const top: [number, number][] = [
    [x, y], [x + width, y], [x + width + dx, y + dy], [x + dx, y + dy],
  ];
  const [tcx, tcy] = [x + width / 2 + dx / 2, y + dy / 2];
  const rotatedTop = top.map(([px, py]) => rotate(tcx, tcy, px, py, rotationDeg));

  const side: [number, number][] = [
    [x + width, y], [x + width + dx, y + dy], [x + width + dx, y - height + dy], [x + width, y - height],
  ];
  const [scx, scy] = [x + width + dx / 2, y - height / 2 + dy / 2];
  const rotatedSide = side.map(([px, py]) => rotate(scx, scy, px, py, rotationDeg));

  return { front: rotatedFront, top: rotatedTop, side: rotatedSide };
}

export function Rect3D({
  x, y, width, height, depth = 15, rotationDeg = 0, foreshorten = 0.65,
  drawSides = [true, true, true],
}: {
  x: number; y: number; width: number; height: number; depth?: number;
  rotationDeg?: number; foreshorten?: number; drawSides?: [boolean, boolean, boolean];
}) {
  const { front, top, side } = computeRect3DFaces(x, y, width, height, depth, rotationDeg, foreshorten);
  return (
    <>
      {drawSides[1] && (
        <polygon points={pointsToString(top)} fill="lightgrey" stroke="black" strokeWidth={1.2}
          strokeLinejoin="round" shapeRendering="geometricPrecision" />
      )}
      {drawSides[0] && (
        <polygon points={pointsToString(front)} fill="none" stroke="black" strokeWidth={1.2}
          strokeLinejoin="round" shapeRendering="geometricPrecision" />
      )}
      {drawSides[2] && (
        <polygon points={pointsToString(side)} fill="dimgrey" stroke="black" strokeWidth={1.2}
          strokeLinejoin="round" shapeRendering="geometricPrecision" />
      )}
    </>
  );
}