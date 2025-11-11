import { FaceMesh } from '@mediapipe/face_mesh';

// MediaPipe Face Mesh provides 468 3D facial landmarks
// Landmark indices for key facial features
const LIPS_UPPER_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LIPS_UPPER_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
const LIPS_LOWER_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const LIPS_LOWER_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];
const LEFT_EYE_EYELID = [33, 160, 159, 158, 157, 173, 133]; // Tight upper eyelid loop
const RIGHT_EYE_EYELID = [263, 387, 386, 385, 384, 398, 362]; // Tight upper eyelid loop
// Eyebrow region landmarks - full brow area
const LEFT_EYEBROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const RIGHT_EYEBROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
const LEFT_EYE_LOWER = [33, 7, 163, 144, 145, 153, 154, 155, 133];
const RIGHT_EYE_LOWER = [263, 249, 390, 373, 374, 380, 381, 382, 362];
// Upper eyelid area - CORRECT landmarks for eyeshadow on the mobile eyelid
// Start at outer corner upper lid, trace along crease UP toward brow, then back down inner corner
const LEFT_EYELID_AREA = [173, 157, 158, 159, 160, 161, 246, 33, 130, 247, 30, 29, 27, 28, 56, 190, 243, 173];
const RIGHT_EYELID_AREA = [398, 384, 385, 386, 387, 388, 466, 263, 359, 467, 260, 259, 257, 258, 286, 414, 463, 398];
const LEFT_CHEEK = [205, 50, 187];
const RIGHT_CHEEK = [425, 280, 411];
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const FOREHEAD_EXTENDED = [10, 338, 297, 332, 284, 251, 389, 356, 454]; // Top arc for extension

export interface MediaPipeRenderResult {
  imageData: string;
  faceDetected: boolean;
}

export interface MakeupProduct {
  applicationArea: string;
  attributes: {
    shade?: string;
    finish?: string;
    type?: string;
    style?: string; // For eyeliner styles (basic, winged, cat-eye, etc.)
  };
  product?: {
    name: string;
    brand: string;
    imageUrl?: string;
    color?: string;
  };
  reason: string;
}

export interface EffectOverride {
  category: string;
  enabled: boolean;
  intensity: number;
  color?: string;
  style?: string; // For eyeliner style customization
}

export type EyelinerStyle = 'basic' | 'winged' | 'cat-eye' | 'classic' | 'smokey';

let faceMesh: FaceMesh | null = null;

/**
 * Initialize MediaPipe Face Mesh detector
 */
export async function initializeMediaPipe(): Promise<void> {
  console.log('[MediaPipeRenderer] Initializing Face Mesh...');
  
  faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  console.log('[MediaPipeRenderer] ✅ Face Mesh initialized');
}

/**
 * Detect face landmarks from image
 */
async function detectFaceLandmarks(imageElement: HTMLImageElement): Promise<any> {
  if (!faceMesh) {
    await initializeMediaPipe();
  }

  return new Promise((resolve, reject) => {
    if (!faceMesh) {
      reject(new Error('Face Mesh not initialized'));
      return;
    }

    faceMesh.onResults((results) => {
      resolve(results);
    });

    faceMesh.send({ image: imageElement }).catch(reject);
  });
}

/**
 * Convert hex color to RGBA with opacity
 */
function hexToRGBA(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(200, 100, 100, ${alpha})`;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Extract color from product attributes (honors Gemini-provided colors)
 */
function getProductColor(product: MakeupProduct): string {
  // Try to extract hex color from product attributes
  const productColor = product.product?.color;
  if (productColor && /^#[0-9A-Fa-f]{6}$/.test(productColor)) {
    return productColor;
  }
  
  // Try shade attribute if it contains a hex color
  const shade = product.attributes.shade;
  if (shade && /^#[0-9A-Fa-f]{6}$/.test(shade)) {
    return shade;
  }
  
  // Default colors based on product type
  const defaults: Record<string, string> = {
    lipstick: '#c83264',
    blush: '#ff9eb3',
    eyeliner: '#2c1810',
    eyeshadow: '#8b6f47',
    bronzer: '#cd9575',
    foundation: '#f5d5c2',
    primer: '#ffe8dc',
    kajal: '#1a1a1a',
    'eyebrow pencil': '#3d2817',
  };
  
  const area = product.applicationArea.toLowerCase();
  return defaults[area] || '#c83264';
}

/**
 * Render lipstick on lips with natural blending (excludes teeth/inner lip)
 */
function renderLipstick(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number,
  withLiner: boolean = false
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = hexToRGBA(color, opacity);
  
  // Draw upper lip separately
  ctx.beginPath();
  LIPS_UPPER_OUTER.forEach((idx, i) => {
    const landmark = landmarks[idx];
    const x = landmark.x * width;
    const y = landmark.y * height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  // Close path back along inner contour (reversed)
  for (let i = LIPS_UPPER_INNER.length - 1; i >= 0; i--) {
    const landmark = landmarks[LIPS_UPPER_INNER[i]];
    const x = landmark.x * width;
    const y = landmark.y * height;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  
  // Draw lower lip separately
  ctx.beginPath();
  LIPS_LOWER_OUTER.forEach((idx, i) => {
    const landmark = landmarks[idx];
    const x = landmark.x * width;
    const y = landmark.y * height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  // Close path back along inner contour (reversed)
  for (let i = LIPS_LOWER_INNER.length - 1; i >= 0; i--) {
    const landmark = landmarks[LIPS_LOWER_INNER[i]];
    const x = landmark.x * width;
    const y = landmark.y * height;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  
  // Add lip liner if requested
  if (withLiner) {
    renderLipLiner(ctx, landmarks, color, opacity, width, height);
  }
  
  ctx.restore();
}

/**
 * Render lip liner around lips - professional contour with dimension
 */
function renderLipLiner(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  
  // Calculate lip dimensions for proportional sizing
  const lipLeft = landmarks[61];
  const lipRight = landmarks[291];
  const lipWidth = Math.abs((lipRight.x - lipLeft.x) * width);
  const baseLineWidth = Math.max(1.0, lipWidth * 0.006); // Proportional to lip size
  
  // Darker color for liner (adaptive based on color brightness)
  const darkerColor = adjustColorBrightness(color, -40);
  const evenDarkerColor = adjustColorBrightness(color, -55); // For emphasis areas
  
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // LAYER 1: Main outer contour with variable thickness
  const upperOuterPoints = LIPS_UPPER_OUTER.map(idx => landmarks[idx]);
  const lowerOuterPoints = LIPS_LOWER_OUTER.map(idx => landmarks[idx]);
  const allOuterPoints = [...upperOuterPoints, ...lowerOuterPoints.reverse()];
  
  // Draw with varying thickness - emphasize cupid's bow and corners
  for (let i = 0; i < allOuterPoints.length - 1; i++) {
    const p1 = allOuterPoints[i];
    const p2 = allOuterPoints[i + 1];
    
    // Calculate position ratio (0 = start, 0.5 = middle/cupid's bow, 1 = end)
    const ratio = i / (allOuterPoints.length - 1);
    
    // Variable thickness: thicker at cupid's bow (center) and corners
    let thickness = baseLineWidth;
    let colorIntensity = opacity * 1.2;
    
    if (ratio < 0.3) {
      // Upper lip left side - gradually thicken toward cupid's bow
      thickness = baseLineWidth * (0.8 + ratio * 0.8);
      colorIntensity = opacity * (1.1 + ratio * 0.3);
    } else if (ratio >= 0.3 && ratio <= 0.5) {
      // Cupid's bow area - maximum thickness and definition
      thickness = baseLineWidth * 1.5;
      colorIntensity = opacity * 1.4;
    } else if (ratio > 0.5 && ratio < 0.7) {
      // Upper lip right side - thin again
      thickness = baseLineWidth * (1.5 - (ratio - 0.5) * 2);
      colorIntensity = opacity * (1.4 - (ratio - 0.5) * 0.6);
    } else {
      // Lower lip and corners - moderate thickness
      thickness = baseLineWidth * 1.0;
      colorIntensity = opacity * 1.2;
    }
    
    // Draw segment with calculated thickness
    ctx.strokeStyle = hexToRGBA(darkerColor, Math.min(colorIntensity, 1.0));
    ctx.lineWidth = thickness;
    
    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  }
  
  // LAYER 2: Inner shadow line for lip plumping effect
  // Draw a subtle darker line just inside the outer contour
  const upperInnerPoints = LIPS_UPPER_INNER.map(idx => landmarks[idx]);
  const lowerInnerPoints = LIPS_LOWER_INNER.map(idx => landmarks[idx]);
  
  ctx.strokeStyle = hexToRGBA(evenDarkerColor, opacity * 0.3); // Very subtle
  ctx.lineWidth = baseLineWidth * 0.4;
  
  // Upper inner lip shadow
  ctx.beginPath();
  upperInnerPoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  ctx.stroke();
  
  // Lower inner lip shadow
  ctx.beginPath();
  lowerInnerPoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  ctx.stroke();
  
  // LAYER 3: Cupid's bow emphasis (V-shape highlight)
  const cupidsBowCenter = landmarks[0]; // Center top of upper lip
  const cupidsBowLeft = landmarks[37];
  const cupidsBowRight = landmarks[267];
  
  ctx.strokeStyle = hexToRGBA(evenDarkerColor, opacity * 1.3);
  ctx.lineWidth = baseLineWidth * 1.8;
  
  // Draw subtle V-shape
  ctx.beginPath();
  ctx.moveTo(cupidsBowLeft.x * width, cupidsBowLeft.y * height);
  ctx.lineTo(cupidsBowCenter.x * width, cupidsBowCenter.y * height);
  ctx.lineTo(cupidsBowRight.x * width, cupidsBowRight.y * height);
  ctx.stroke();
  
  // LAYER 4: Corner definition (subtle emphasis at mouth corners)
  const leftCorner = landmarks[61];
  const rightCorner = landmarks[291];
  
  ctx.fillStyle = hexToRGBA(evenDarkerColor, opacity * 0.4);
  
  // Left corner dot
  ctx.beginPath();
  ctx.arc(leftCorner.x * width, leftCorner.y * height, baseLineWidth * 0.8, 0, Math.PI * 2);
  ctx.fill();
  
  // Right corner dot
  ctx.beginPath();
  ctx.arc(rightCorner.x * width, rightCorner.y * height, baseLineWidth * 0.8, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/**
 * Darken or lighten a hex color
 */
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + (R * 0x10000) + (G * 0x100) + B).toString(16).slice(1);
}

/**
 * Render blush on cheekbones with gradient
 */
function renderBlush(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  
  // Left cheek
  const leftCheek = landmarks[LEFT_CHEEK[0]];
  const leftX = leftCheek.x * width;
  const leftY = leftCheek.y * height;
  const leftGradient = ctx.createRadialGradient(leftX, leftY, 0, leftX, leftY, 40);
  leftGradient.addColorStop(0, hexToRGBA(color, opacity));
  leftGradient.addColorStop(1, hexToRGBA(color, 0));
  ctx.fillStyle = leftGradient;
  ctx.fillRect(leftX - 40, leftY - 40, 80, 80);
  
  // Right cheek
  const rightCheek = landmarks[RIGHT_CHEEK[0]];
  const rightX = rightCheek.x * width;
  const rightY = rightCheek.y * height;
  const rightGradient = ctx.createRadialGradient(rightX, rightY, 0, rightX, rightY, 40);
  rightGradient.addColorStop(0, hexToRGBA(color, opacity));
  rightGradient.addColorStop(1, hexToRGBA(color, 0));
  ctx.fillStyle = rightGradient;
  ctx.fillRect(rightX - 40, rightY - 40, 80, 80);
  
  ctx.restore();
}

/**
 * Render eyeliner with different styles
 */
function renderEyeliner(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number,
  style: EyelinerStyle = 'basic'
) {
  switch (style) {
    case 'winged':
      renderWingedEyeliner(ctx, landmarks, color, opacity, width, height);
      break;
    case 'cat-eye':
      renderCatEyeEyeliner(ctx, landmarks, color, opacity, width, height);
      break;
    case 'classic':
      renderClassicEyeliner(ctx, landmarks, color, opacity, width, height);
      break;
    case 'smokey':
      renderSmokeyEyeliner(ctx, landmarks, color, opacity, width, height);
      break;
    case 'basic':
    default:
      renderBasicEyeliner(ctx, landmarks, color, opacity, width, height);
      break;
  }
}

/**
 * Calculate normal (perpendicular) vector at each point along a curve
 * Normals are oriented to point toward the eyeball (inward) for consistent eyeliner thickness
 */
function calculateNormals(
  points: Array<{x: number, y: number}>, 
  width: number, 
  height: number,
  irisCenter: {x: number, y: number}
) {
  const normals: Array<{x: number, y: number}> = [];
  
  for (let i = 0; i < points.length; i++) {
    let tangentX, tangentY;
    
    if (i === 0) {
      // First point: use forward difference
      tangentX = (points[i + 1].x - points[i].x) * width;
      tangentY = (points[i + 1].y - points[i].y) * height;
    } else if (i === points.length - 1) {
      // Last point: use backward difference
      tangentX = (points[i].x - points[i - 1].x) * width;
      tangentY = (points[i].y - points[i - 1].y) * height;
    } else {
      // Middle points: use central difference for smoother normals
      tangentX = (points[i + 1].x - points[i - 1].x) * width * 0.5;
      tangentY = (points[i + 1].y - points[i - 1].y) * height * 0.5;
    }
    
    // Normalize tangent
    const length = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    if (length > 0) {
      tangentX /= length;
      tangentY /= length;
    }
    
    // Normal is perpendicular to tangent (rotate 90° clockwise)
    let normalX = tangentY;
    let normalY = -tangentX;
    
    // Check if normal points toward iris - if so, flip it to point outward
    const pointX = points[i].x * width;
    const pointY = points[i].y * height;
    const toIrisX = irisCenter.x - pointX;
    const toIrisY = irisCenter.y - pointY;
    
    // Dot product: if positive, normal points toward iris, so flip it outward
    const dotProduct = normalX * toIrisX + normalY * toIrisY;
    if (dotProduct > 0) {
      normalX = -normalX;
      normalY = -normalY;
    }
    
    normals.push({ x: normalX, y: normalY });
  }
  
  return normals;
}

/**
 * Calculate normals for EYELINER specifically
 * For upper eyelid: normals point UPWARD (will be subtracted to offset downward)
 * This matches the working Smokey eyeliner implementation
 */
function calculateEyelinerNormals(
  points: Array<{x: number, y: number}>, 
  width: number, 
  height: number,
  irisCenter: {x: number, y: number}
) {
  const normals: Array<{x: number, y: number}> = [];
  
  for (let i = 0; i < points.length; i++) {
    // Normals point UPWARD (negative Y) - will be SUBTRACTED to render downward
    let normalX = 0;
    let normalY = -1;  // Point UPWARD (will be subtracted)
    
    // Add slight outward angle at the outer corners for natural taper
    const ratio = i / (points.length - 1);
    if (ratio > 0.7) {  // Outer 30% of eye
      const pointX = points[i].x * width;
      const isRightEye = pointX < irisCenter.x;
      normalX = isRightEye ? -0.3 : 0.3;  // Slight outward (will be subtracted)
    }
    
    // Normalize
    const len = Math.sqrt(normalX * normalX + normalY * normalY);
    normalX /= len;
    normalY /= len;
    
    normals.push({ x: normalX, y: normalY });
  }
  
  return normals;
}

/**
 * Basic eyeliner - minimal natural upper lash line only
 * Professional subtle look for everyday wear
 */
function renderBasicEyeliner(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = hexToRGBA(color, 0.75);
  
  // LEFT EYE - Upper lash line only (very minimal)
  const leftEyeIndices = LEFT_EYE_EYELID;
  const leftEyePoints = leftEyeIndices.map(idx => landmarks[idx]);
  const leftEyeWidth = Math.abs(landmarks[33].x - landmarks[133].x) * width;
  const thickness = leftEyeWidth * 0.020;
  
  // Calculate iris center for left eye (average of eye region)
  const leftIrisX = leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length * width;
  const leftIrisY = leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length * height;
  
  const leftNormals = calculateEyelinerNormals(leftEyePoints, width, height, { x: leftIrisX, y: leftIrisY });
  
  ctx.beginPath();
  leftEyePoints.forEach((lm, i) => {
    if (i === 0) {
      ctx.moveTo(lm.x * width, lm.y * height);
    } else {
      ctx.lineTo(lm.x * width, lm.y * height);
    }
  });
  
  for (let i = leftEyePoints.length - 1; i >= 0; i--) {
    const lm = leftEyePoints[i];
    const normal = leftNormals[i];
    const ratio = i / (leftEyePoints.length - 1);
    const currentThickness = thickness * (0.5 + ratio * 0.5);
    
    ctx.lineTo(
      lm.x * width - normal.x * currentThickness,
      lm.y * height - normal.y * currentThickness
    );
  }
  
  ctx.closePath();
  ctx.fill();
  
  // RIGHT EYE - Upper lash line only (very minimal)
  const rightEyeIndices = RIGHT_EYE_EYELID;
  const rightEyePoints = rightEyeIndices.map(idx => landmarks[idx]);
  const rightEyeWidth = Math.abs(landmarks[263].x - landmarks[362].x) * width;
  const rightThickness = rightEyeWidth * 0.020;
  
  const rightIrisX = rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length * width;
  const rightIrisY = rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length * height;
  
  const rightNormals = calculateEyelinerNormals(rightEyePoints, width, height, { x: rightIrisX, y: rightIrisY });
  
  ctx.beginPath();
  rightEyePoints.forEach((lm, i) => {
    if (i === 0) {
      ctx.moveTo(lm.x * width, lm.y * height);
    } else {
      ctx.lineTo(lm.x * width, lm.y * height);
    }
  });
  
  for (let i = rightEyePoints.length - 1; i >= 0; i--) {
    const lm = rightEyePoints[i];
    const normal = rightNormals[i];
    const ratio = i / (rightEyePoints.length - 1);
    const currentThickness = rightThickness * (0.5 + ratio * 0.5);
    
    ctx.lineTo(
      lm.x * width - normal.x * currentThickness,
      lm.y * height - normal.y * currentThickness
    );
  }
  
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Winged eyeliner - classic wing with filled triangle shape following eye contour
 * Professional medium flick for versatile everyday-to-evening look
 */
function renderWingedEyeliner(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = hexToRGBA(color, 0.95);
  
  // LEFT EYE
  const leftEyeIndices = LEFT_EYE_EYELID;
  const leftEyePoints = leftEyeIndices.map(idx => landmarks[idx]);
  const leftOuter = landmarks[33];
  const leftEyeWidth = Math.abs(landmarks[33].x - landmarks[133].x) * width;
  const wingLength = leftEyeWidth * 0.20;
  const wingHeight = wingLength * 0.50;
  const thickness = leftEyeWidth * 0.038;
  
  const leftIrisX = leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length * width;
  const leftIrisY = leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length * height;
  const leftNormals = calculateEyelinerNormals(leftEyePoints, width, height, { x: leftIrisX, y: leftIrisY });
  
  // Wing tip position
  const leftWingTipX = leftOuter.x * width + wingLength;
  const leftWingTipY = leftOuter.y * height - wingHeight;
  
  ctx.beginPath();
  // Upper lash line
  leftEyePoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  
  // Wing flick
  ctx.lineTo(leftWingTipX, leftWingTipY);
  
  // Wing base (filled triangle)
  const outerNormal = leftNormals[leftNormals.length - 1];
  ctx.lineTo(
    leftOuter.x * width - outerNormal.x * thickness + (wingLength * 0.7) * Math.cos(Math.atan2(-wingHeight, wingLength)),
    leftOuter.y * height - outerNormal.y * thickness + (wingLength * 0.7) * Math.sin(Math.atan2(-wingHeight, wingLength))
  );
  ctx.lineTo(
    leftOuter.x * width - outerNormal.x * thickness,
    leftOuter.y * height - outerNormal.y * thickness
  );
  
  // Bottom edge following contour
  for (let i = leftEyePoints.length - 1; i >= 0; i--) {
    const lm = leftEyePoints[i];
    const normal = leftNormals[i];
    const ratio = i / (leftEyePoints.length - 1);
    const currentThickness = thickness * (0.3 + ratio * 0.7);
    
    ctx.lineTo(
      lm.x * width - normal.x * currentThickness,
      lm.y * height - normal.y * currentThickness
    );
  }
  
  ctx.closePath();
  ctx.fill();
  
  // RIGHT EYE (mirrored)
  const rightEyeIndices = RIGHT_EYE_EYELID;
  const rightEyePoints = rightEyeIndices.map(idx => landmarks[idx]);
  const rightOuter = landmarks[263];
  const rightEyeWidth = Math.abs(landmarks[263].x - landmarks[362].x) * width;
  const rightWingLength = rightEyeWidth * 0.20;
  const rightWingHeight = rightWingLength * 0.50;
  const rightThickness = rightEyeWidth * 0.038;
  
  const rightIrisX = rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length * width;
  const rightIrisY = rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length * height;
  const rightNormals = calculateEyelinerNormals(rightEyePoints, width, height, { x: rightIrisX, y: rightIrisY });
  
  const rightWingTipX = rightOuter.x * width - rightWingLength;
  const rightWingTipY = rightOuter.y * height - rightWingHeight;
  
  ctx.beginPath();
  rightEyePoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  
  ctx.lineTo(rightWingTipX, rightWingTipY);
  
  const rightOuterNormal = rightNormals[rightNormals.length - 1];
  ctx.lineTo(
    rightOuter.x * width - rightOuterNormal.x * rightThickness - (rightWingLength * 0.7) * Math.cos(Math.atan2(-rightWingHeight, rightWingLength)),
    rightOuter.y * height - rightOuterNormal.y * rightThickness + (rightWingLength * 0.7) * Math.sin(Math.atan2(-rightWingHeight, rightWingLength))
  );
  ctx.lineTo(
    rightOuter.x * width - rightOuterNormal.x * rightThickness,
    rightOuter.y * height - rightOuterNormal.y * rightThickness
  );
  
  for (let i = rightEyePoints.length - 1; i >= 0; i--) {
    const lm = rightEyePoints[i];
    const normal = rightNormals[i];
    const ratio = i / (rightEyePoints.length - 1);
    const currentThickness = rightThickness * (0.3 + ratio * 0.7);
    
    ctx.lineTo(
      lm.x * width - normal.x * currentThickness,
      lm.y * height - normal.y * currentThickness
    );
  }
  
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Cat-eye eyeliner - bold dramatic wing with sharp angle following eye contour
 * Professional bold look matching reference makeup artistry
 */
function renderCatEyeEyeliner(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = hexToRGBA(color, 1.0);
  
  // LEFT EYE - UPPER LASH LINE
  const leftEyeIndices = LEFT_EYE_EYELID;
  const leftEyePoints = leftEyeIndices.map(idx => landmarks[idx]);
  const leftOuter = landmarks[33];
  const leftEyeWidth = Math.abs(landmarks[33].x - landmarks[133].x) * width;
  const wingLength = leftEyeWidth * 0.38;
  const wingHeight = wingLength * 0.70;
  const baseThickness = leftEyeWidth * 0.09;
  
  const leftIrisX = leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length * width;
  const leftIrisY = leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length * height;
  const leftNormals = calculateEyelinerNormals(leftEyePoints, width, height, { x: leftIrisX, y: leftIrisY });
  
  const leftWingTipX = leftOuter.x * width + wingLength;
  const leftWingTipY = leftOuter.y * height - wingHeight;
  
  ctx.beginPath();
  leftEyePoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  
  ctx.lineTo(leftWingTipX, leftWingTipY);
  
  // Wing base with contour-aware positioning
  const outerNormal = leftNormals[leftNormals.length - 1];
  ctx.lineTo(
    leftOuter.x * width - outerNormal.x * baseThickness * 0.6 + wingLength * 0.6 * Math.cos(Math.atan2(-wingHeight, wingLength)),
    leftOuter.y * height - outerNormal.y * baseThickness * 0.6 + wingLength * 0.6 * Math.sin(Math.atan2(-wingHeight, wingLength))
  );
  ctx.lineTo(
    leftOuter.x * width - outerNormal.x * baseThickness,
    leftOuter.y * height - outerNormal.y * baseThickness
  );
  
  for (let i = leftEyePoints.length - 1; i >= 0; i--) {
    const lm = leftEyePoints[i];
    const normal = leftNormals[i];
    const ratio = i / (leftEyePoints.length - 1);
    const currentThickness = baseThickness * (0.2 + ratio * 0.8);
    
    ctx.lineTo(
      lm.x * width - normal.x * currentThickness,
      lm.y * height - normal.y * currentThickness
    );
  }
  
  ctx.closePath();
  ctx.fill();
  
  // RIGHT EYE - UPPER LASH LINE
  const rightEyeIndices = RIGHT_EYE_EYELID;
  const rightEyePoints = rightEyeIndices.map(idx => landmarks[idx]);
  const rightOuter = landmarks[263];
  const rightEyeWidth = Math.abs(landmarks[263].x - landmarks[362].x) * width;
  const rightWingLength = rightEyeWidth * 0.38;
  const rightWingHeight = rightWingLength * 0.70;
  const rightBaseThickness = rightEyeWidth * 0.09;
  
  const rightIrisX = rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length * width;
  const rightIrisY = rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length * height;
  const rightNormals = calculateEyelinerNormals(rightEyePoints, width, height, { x: rightIrisX, y: rightIrisY });
  
  const rightWingTipX = rightOuter.x * width - rightWingLength;
  const rightWingTipY = rightOuter.y * height - rightWingHeight;
  
  ctx.beginPath();
  rightEyePoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  
  ctx.lineTo(rightWingTipX, rightWingTipY);
  
  const rightOuterNormal = rightNormals[rightNormals.length - 1];
  ctx.lineTo(
    rightOuter.x * width - rightOuterNormal.x * rightBaseThickness * 0.6 - rightWingLength * 0.6 * Math.cos(Math.atan2(-rightWingHeight, rightWingLength)),
    rightOuter.y * height - rightOuterNormal.y * rightBaseThickness * 0.6 + rightWingLength * 0.6 * Math.sin(Math.atan2(-rightWingHeight, rightWingLength))
  );
  ctx.lineTo(
    rightOuter.x * width - rightOuterNormal.x * rightBaseThickness,
    rightOuter.y * height - rightOuterNormal.y * rightBaseThickness
  );
  
  for (let i = rightEyePoints.length - 1; i >= 0; i--) {
    const lm = rightEyePoints[i];
    const normal = rightNormals[i];
    const ratio = i / (rightEyePoints.length - 1);
    const currentThickness = rightBaseThickness * (0.2 + ratio * 0.8);
    
    ctx.lineTo(
      lm.x * width - normal.x * currentThickness,
      lm.y * height - normal.y * currentThickness
    );
  }
  
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Classic eyeliner - professional medium thickness with subtle lower lash definition
 * Industry standard look (Sephora/MAC style) balanced for all occasions
 */
function renderClassicEyeliner(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = hexToRGBA(color, 0.90);
  
  // LEFT EYE - Upper lash line (professional medium)
  const leftEyeIndices = LEFT_EYE_EYELID;
  const leftEyePoints = leftEyeIndices.map(idx => landmarks[idx]);
  const leftEyeWidth = Math.abs(landmarks[33].x - landmarks[133].x) * width;
  const thickness = leftEyeWidth * 0.042;
  
  const leftIrisX = leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length * width;
  const leftIrisY = leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length * height;
  const leftNormals = calculateEyelinerNormals(leftEyePoints, width, height, { x: leftIrisX, y: leftIrisY });
  
  ctx.beginPath();
  leftEyePoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  
  for (let i = leftEyePoints.length - 1; i >= 0; i--) {
    const lm = leftEyePoints[i];
    const normal = leftNormals[i];
    const ratio = i / (leftEyePoints.length - 1);
    const currentThickness = thickness * (0.4 + ratio * 0.6);
    ctx.lineTo(
      lm.x * width - normal.x * currentThickness,
      lm.y * height - normal.y * currentThickness
    );
  }
  
  ctx.closePath();
  ctx.fill();
  
  // RIGHT EYE (mirrored) - Upper lash line (professional medium)
  const rightEyeIndices = RIGHT_EYE_EYELID;
  const rightEyePoints = rightEyeIndices.map(idx => landmarks[idx]);
  const rightEyeWidth = Math.abs(landmarks[263].x - landmarks[362].x) * width;
  const rightThickness = rightEyeWidth * 0.042;
  
  const rightIrisX = rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length * width;
  const rightIrisY = rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length * height;
  const rightNormals = calculateEyelinerNormals(rightEyePoints, width, height, { x: rightIrisX, y: rightIrisY });
  
  ctx.beginPath();
  rightEyePoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  
  for (let i = rightEyePoints.length - 1; i >= 0; i--) {
    const lm = rightEyePoints[i];
    const normal = rightNormals[i];
    const ratio = i / (rightEyePoints.length - 1);
    const currentThickness = rightThickness * (0.4 + ratio * 0.6);
    ctx.lineTo(
      lm.x * width - normal.x * currentThickness,
      lm.y * height - normal.y * currentThickness
    );
  }
  
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Smokey eyeliner - professional multi-layer kajal effect with smudged dramatic appearance
 * Bold evening/party look with intense definition and soft blending
 * Technique: Multiple passes with decreasing opacity (ModiFace/Banuba approach)
 */
function renderSmokeyEyeliner(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = hexToRGBA(color, 0.85);
  
  // LEFT EYE - Layered smokey effect (bold and dramatic)
  const leftEyeIndices = LEFT_EYE_EYELID;
  const leftEyePoints = leftEyeIndices.map(idx => landmarks[idx]);
  const leftEyeWidth = Math.abs(landmarks[33].x - landmarks[133].x) * width;
  const baseThickness = leftEyeWidth * 0.070;
  
  const leftIrisX = leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length * width;
  const leftIrisY = leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length * height;
  const leftNormals = calculateEyelinerNormals(leftEyePoints, width, height, { x: leftIrisX, y: leftIrisY });
  
  // Layer 1: Base thick line
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  leftEyePoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  for (let i = leftEyePoints.length - 1; i >= 0; i--) {
    const lm = leftEyePoints[i];
    const normal = leftNormals[i];
    ctx.lineTo(
      lm.x * width - normal.x * baseThickness,
      lm.y * height - normal.y * baseThickness
    );
  }
  ctx.closePath();
  ctx.fill();
  
  // Layer 2: Smudged halo (upward blend for smokey effect)
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  leftEyePoints.forEach((lm, i) => {
    const normal = leftNormals[i];
    if (i === 0) {
      ctx.moveTo(
        lm.x * width - normal.x * baseThickness * 0.3,
        lm.y * height - normal.y * baseThickness * 0.3
      );
    } else {
      ctx.lineTo(
        lm.x * width - normal.x * baseThickness * 0.3,
        lm.y * height - normal.y * baseThickness * 0.3
      );
    }
  });
  for (let i = leftEyePoints.length - 1; i >= 0; i--) {
    const lm = leftEyePoints[i];
    const normal = leftNormals[i];
    ctx.lineTo(
      lm.x * width - normal.x * baseThickness * 0.7,
      lm.y * height - normal.y * baseThickness * 0.7
    );
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.globalAlpha = 1;
  
  // RIGHT EYE (mirrored) - Layered smokey effect (bold and dramatic)
  const rightEyeIndices = RIGHT_EYE_EYELID;
  const rightEyePoints = rightEyeIndices.map(idx => landmarks[idx]);
  const rightEyeWidth = Math.abs(landmarks[263].x - landmarks[362].x) * width;
  const rightBaseThickness = rightEyeWidth * 0.070;
  
  const rightIrisX = rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length * width;
  const rightIrisY = rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length * height;
  const rightNormals = calculateEyelinerNormals(rightEyePoints, width, height, { x: rightIrisX, y: rightIrisY });
  
  // Layer 1: Base
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  rightEyePoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  for (let i = rightEyePoints.length - 1; i >= 0; i--) {
    const lm = rightEyePoints[i];
    const normal = rightNormals[i];
    ctx.lineTo(
      lm.x * width - normal.x * rightBaseThickness,
      lm.y * height - normal.y * rightBaseThickness
    );
  }
  ctx.closePath();
  ctx.fill();
  
  // Layer 2: Smudged halo
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  rightEyePoints.forEach((lm, i) => {
    const normal = rightNormals[i];
    if (i === 0) {
      ctx.moveTo(
        lm.x * width - normal.x * rightBaseThickness * 0.3,
        lm.y * height - normal.y * rightBaseThickness * 0.3
      );
    } else {
      ctx.lineTo(
        lm.x * width - normal.x * rightBaseThickness * 0.3,
        lm.y * height - normal.y * rightBaseThickness * 0.3
      );
    }
  });
  for (let i = rightEyePoints.length - 1; i >= 0; i--) {
    const lm = rightEyePoints[i];
    const normal = rightNormals[i];
    ctx.lineTo(
      lm.x * width - normal.x * rightBaseThickness * 0.7,
      lm.y * height - normal.y * rightBaseThickness * 0.7
    );
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Render foundation with soft-light blend and gradient fade at hairline
 */
function renderFoundation(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  
  // Calculate face dimensions
  const noseTip = landmarks[1];
  const chin = landmarks[152];
  const foreheadTop = landmarks[10];
  const faceHeight = Math.abs((chin.y - foreheadTop.y) * height);
  const faceCenterX = noseTip.x * width;
  const faceCenterY = noseTip.y * height;
  
  // LAYER 1: Base foundation with edge feathering (radial gradient)
  // Create clipping path for face oval
  ctx.beginPath();
  FACE_OVAL.forEach((idx, i) => {
    const landmark = landmarks[idx];
    const x = landmark.x * width;
    const y = landmark.y * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  
  // Save the clip region
  ctx.save();
  ctx.clip();
  
  // Apply radial gradient from center to edges for natural falloff
  const gradientRadius = faceHeight * 0.65;
  const radialGradient = ctx.createRadialGradient(
    faceCenterX, faceCenterY, 0,
    faceCenterX, faceCenterY, gradientRadius
  );
  radialGradient.addColorStop(0, hexToRGBA(color, opacity * 0.95)); // Full coverage at center
  radialGradient.addColorStop(0.6, hexToRGBA(color, opacity * 0.85)); // Maintain coverage
  radialGradient.addColorStop(0.85, hexToRGBA(color, opacity * 0.6)); // Start fading at edges
  radialGradient.addColorStop(1, hexToRGBA(color, opacity * 0.3)); // Soft edge
  
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, width, height);
  
  ctx.restore(); // Restore from clip
  
  // LAYER 2: Brightening under-eye zone (professional concealer technique)
  // Left under-eye triangle
  const leftEyeInner = landmarks[133];
  const leftEyeOuter = landmarks[33];
  const leftCheekTop = landmarks[50];
  
  ctx.globalCompositeOperation = 'screen'; // Brightening mode
  ctx.fillStyle = hexToRGBA('#FFFFFF', opacity * 0.12); // Subtle brightening
  
  ctx.beginPath();
  ctx.moveTo(leftEyeInner.x * width, leftEyeInner.y * height);
  ctx.lineTo(leftEyeOuter.x * width, leftEyeOuter.y * height);
  ctx.lineTo(leftCheekTop.x * width, leftCheekTop.y * height);
  ctx.closePath();
  
  // Create gradient within triangle for natural fade
  const leftUnderEyeGradient = ctx.createLinearGradient(
    leftEyeInner.x * width, leftEyeInner.y * height,
    leftCheekTop.x * width, leftCheekTop.y * height
  );
  leftUnderEyeGradient.addColorStop(0, hexToRGBA('#FFFFFF', opacity * 0.15));
  leftUnderEyeGradient.addColorStop(0.7, hexToRGBA('#FFFFFF', opacity * 0.08));
  leftUnderEyeGradient.addColorStop(1, hexToRGBA('#FFFFFF', 0));
  ctx.fillStyle = leftUnderEyeGradient;
  ctx.fill();
  
  // Right under-eye triangle
  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];
  const rightCheekTop = landmarks[280];
  
  ctx.beginPath();
  ctx.moveTo(rightEyeInner.x * width, rightEyeInner.y * height);
  ctx.lineTo(rightEyeOuter.x * width, rightEyeOuter.y * height);
  ctx.lineTo(rightCheekTop.x * width, rightCheekTop.y * height);
  ctx.closePath();
  
  const rightUnderEyeGradient = ctx.createLinearGradient(
    rightEyeInner.x * width, rightEyeInner.y * height,
    rightCheekTop.x * width, rightCheekTop.y * height
  );
  rightUnderEyeGradient.addColorStop(0, hexToRGBA('#FFFFFF', opacity * 0.15));
  rightUnderEyeGradient.addColorStop(0.7, hexToRGBA('#FFFFFF', opacity * 0.08));
  rightUnderEyeGradient.addColorStop(1, hexToRGBA('#FFFFFF', 0));
  ctx.fillStyle = rightUnderEyeGradient;
  ctx.fill();
  
  // LAYER 3: T-zone brightening (forehead, nose bridge)
  const noseBridge = landmarks[6];
  const foreheadCenter = landmarks[10];
  
  const tZoneGradient = ctx.createLinearGradient(
    foreheadCenter.x * width, foreheadCenter.y * height,
    noseBridge.x * width, noseBridge.y * height
  );
  tZoneGradient.addColorStop(0, hexToRGBA('#FFFFFF', opacity * 0.08));
  tZoneGradient.addColorStop(0.5, hexToRGBA('#FFFFFF', opacity * 0.12));
  tZoneGradient.addColorStop(1, hexToRGBA('#FFFFFF', opacity * 0.08));
  
  // Draw T-zone highlight stripe
  const tZoneWidth = faceHeight * 0.08;
  ctx.fillStyle = tZoneGradient;
  ctx.fillRect(
    foreheadCenter.x * width - tZoneWidth / 2,
    foreheadCenter.y * height,
    tZoneWidth,
    (noseBridge.y - foreheadCenter.y) * height
  );
  
  // LAYER 4: Forehead extension with soft fade (hairline blending)
  const foreheadTopX = foreheadTop.x * width;
  const foreheadTopY = foreheadTop.y * height;
  
  const foreheadGradient = ctx.createLinearGradient(
    foreheadTopX, 
    foreheadTopY, 
    foreheadTopX, 
    foreheadTopY - (faceHeight * 0.10)
  );
  foreheadGradient.addColorStop(0, hexToRGBA(color, opacity * 0.7));
  foreheadGradient.addColorStop(0.4, hexToRGBA(color, opacity * 0.35));
  foreheadGradient.addColorStop(0.7, hexToRGBA(color, opacity * 0.15));
  foreheadGradient.addColorStop(1, hexToRGBA(color, 0));
  
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = foreheadGradient;
  ctx.fillRect(
    foreheadTopX - (faceHeight * 0.35),
    foreheadTopY - (faceHeight * 0.10),
    faceHeight * 0.70,
    faceHeight * 0.10
  );
  
  // LAYER 5: Jawline softening (blend with neck)
  const chinY = chin.y * height;
  const jawlineGradient = ctx.createLinearGradient(
    faceCenterX, chinY,
    faceCenterX, chinY + (faceHeight * 0.06)
  );
  jawlineGradient.addColorStop(0, hexToRGBA(color, opacity * 0.6));
  jawlineGradient.addColorStop(0.5, hexToRGBA(color, opacity * 0.25));
  jawlineGradient.addColorStop(1, hexToRGBA(color, 0));
  
  ctx.fillStyle = jawlineGradient;
  ctx.fillRect(
    faceCenterX - (faceHeight * 0.35),
    chinY,
    faceHeight * 0.70,
    faceHeight * 0.06
  );
  
  ctx.restore();
}

/**
 * Render kajal on lower waterline
 */
function renderKajal(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  
  // Calculate proportional line width
  const leftEyeWidth = Math.abs(landmarks[33].x - landmarks[133].x) * width;
  const lineWidth = Math.max(2, Math.min(4, leftEyeWidth * 0.05));
  
  ctx.strokeStyle = hexToRGBA(color, opacity);
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'multiply';
  
  // Left eye lower waterline
  ctx.beginPath();
  LEFT_EYE_LOWER.forEach((idx, i) => {
    const landmark = landmarks[idx];
    const x = landmark.x * width;
    const y = landmark.y * height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  
  // Right eye lower waterline
  ctx.beginPath();
  RIGHT_EYE_LOWER.forEach((idx, i) => {
    const landmark = landmarks[idx];
    const x = landmark.x * width;
    const y = landmark.y * height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Render eyeshadow on eyelid area
 */
function renderEyeshadow(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  
  // Left eyelid
  ctx.beginPath();
  LEFT_EYELID_AREA.forEach((idx, i) => {
    const landmark = landmarks[idx];
    const x = landmark.x * width;
    const y = landmark.y * height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  
  // Create gradient from lash line to crease
  const leftEyeCenter = landmarks[LEFT_EYELID_AREA[0]];
  const leftX = leftEyeCenter.x * width;
  const leftY = leftEyeCenter.y * height;
  const leftGradient = ctx.createLinearGradient(leftX, leftY, leftX, leftY - 30);
  leftGradient.addColorStop(0, hexToRGBA(color, opacity));
  leftGradient.addColorStop(1, hexToRGBA(color, opacity * 0.3));
  ctx.fillStyle = leftGradient;
  ctx.fill();
  
  // Right eyelid
  ctx.beginPath();
  RIGHT_EYELID_AREA.forEach((idx, i) => {
    const landmark = landmarks[idx];
    const x = landmark.x * width;
    const y = landmark.y * height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  
  const rightEyeCenter = landmarks[RIGHT_EYELID_AREA[0]];
  const rightX = rightEyeCenter.x * width;
  const rightY = rightEyeCenter.y * height;
  const rightGradient = ctx.createLinearGradient(rightX, rightY, rightX, rightY - 30);
  rightGradient.addColorStop(0, hexToRGBA(color, opacity));
  rightGradient.addColorStop(1, hexToRGBA(color, opacity * 0.3));
  ctx.fillStyle = rightGradient;
  ctx.fill();
  
  ctx.restore();
}

/**
 * Render eyebrow pencil to subtly fill/define brows
 */
function renderEyebrowPencil(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  color: string,
  opacity: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  
  // LEFT EYEBROW - Enhanced with hair-like strokes
  const leftBrowPoints = LEFT_EYEBROW.map(idx => landmarks[idx]);
  
  // Base fill layer (very subtle)
  ctx.beginPath();
  leftBrowPoints.forEach((lm, i) => {
    const x = lm.x * width;
    const y = lm.y * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = hexToRGBA(color, opacity * 0.15); // Very subtle base
  ctx.fill();
  
  // Hair-like strokes for natural texture (left eyebrow)
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  for (let i = 0; i < leftBrowPoints.length - 1; i++) {
    const ratio = i / (leftBrowPoints.length - 1);
    
    // Gradient opacity: lighter at inner corner (0), darker at arch/tail (1)
    const strokeOpacity = opacity * (0.4 + ratio * 0.3); // 0.4 to 0.7 range
    
    // Calculate direction from current point to next
    const p1 = leftBrowPoints[i];
    const p2 = leftBrowPoints[i + 1];
    const dx = (p2.x - p1.x) * width;
    const dy = (p2.y - p1.y) * height;
    const angle = Math.atan2(dy, dx);
    
    // Draw multiple fine hair strokes perpendicular to brow direction
    const numHairs = 3; // Number of hair strokes per segment
    for (let h = 0; h < numHairs; h++) {
      const t = (h + 0.5) / numHairs;
      const x = (p1.x + (p2.x - p1.x) * t) * width;
      const y = (p1.y + (p2.y - p1.y) * t) * height;
      
      // Hair grows perpendicular to brow curve (upward angle)
      const hairAngle = angle - Math.PI / 2 + (Math.random() - 0.5) * 0.3; // Add slight randomness
      const hairLength = (2 + Math.random() * 2) * (ratio * 0.5 + 0.5); // Longer at arch
      
      ctx.strokeStyle = hexToRGBA(color, strokeOpacity * (0.8 + Math.random() * 0.2));
      ctx.lineWidth = 0.5 + ratio * 0.5; // Thicker toward tail
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(hairAngle) * hairLength,
        y + Math.sin(hairAngle) * hairLength
      );
      ctx.stroke();
    }
  }
  
  // Define outer edge with subtle stroke
  ctx.strokeStyle = hexToRGBA(color, opacity * 0.5);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  leftBrowPoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  ctx.stroke();
  
  // RIGHT EYEBROW - Enhanced with hair-like strokes
  const rightBrowPoints = RIGHT_EYEBROW.map(idx => landmarks[idx]);
  
  // Base fill layer (very subtle)
  ctx.beginPath();
  rightBrowPoints.forEach((lm, i) => {
    const x = lm.x * width;
    const y = lm.y * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = hexToRGBA(color, opacity * 0.15);
  ctx.fill();
  
  // Hair-like strokes for natural texture (right eyebrow)
  for (let i = 0; i < rightBrowPoints.length - 1; i++) {
    const ratio = i / (rightBrowPoints.length - 1);
    const strokeOpacity = opacity * (0.4 + ratio * 0.3);
    
    const p1 = rightBrowPoints[i];
    const p2 = rightBrowPoints[i + 1];
    const dx = (p2.x - p1.x) * width;
    const dy = (p2.y - p1.y) * height;
    const angle = Math.atan2(dy, dx);
    
    const numHairs = 3;
    for (let h = 0; h < numHairs; h++) {
      const t = (h + 0.5) / numHairs;
      const x = (p1.x + (p2.x - p1.x) * t) * width;
      const y = (p1.y + (p2.y - p1.y) * t) * height;
      
      const hairAngle = angle - Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      const hairLength = (2 + Math.random() * 2) * (ratio * 0.5 + 0.5);
      
      ctx.strokeStyle = hexToRGBA(color, strokeOpacity * (0.8 + Math.random() * 0.2));
      ctx.lineWidth = 0.5 + ratio * 0.5;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(hairAngle) * hairLength,
        y + Math.sin(hairAngle) * hairLength
      );
      ctx.stroke();
    }
  }
  
  // Define outer edge with subtle stroke
  ctx.strokeStyle = hexToRGBA(color, opacity * 0.5);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  rightBrowPoints.forEach((lm, i) => {
    if (i === 0) ctx.moveTo(lm.x * width, lm.y * height);
    else ctx.lineTo(lm.x * width, lm.y * height);
  });
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Calculate smart crop bounds to show face prominently
 */
function calculateFaceCrop(landmarks: any[], width: number, height: number) {
  // Find bounding box of face
  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
  
  landmarks.forEach((landmark) => {
    const x = landmark.x * width;
    const y = landmark.y * height;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  
  // Add 15% padding on each side (face fills 70% of viewport)
  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;
  const paddingX = faceWidth * 0.15;
  const paddingY = faceHeight * 0.15;
  
  return {
    x: Math.max(0, minX - paddingX),
    y: Math.max(0, minY - paddingY),
    width: Math.min(width, faceWidth + paddingX * 2),
    height: Math.min(height, faceHeight + paddingY * 2),
  };
}

/**
 * Apply makeup to image using MediaPipe landmarks and 2D canvas rendering
 */
export async function applyMakeupWithMediaPipe(
  imageDataUrl: string,
  products: MakeupProduct[],
  effectOverrides?: EffectOverride[]
): Promise<MediaPipeRenderResult> {
  console.log('[MediaPipeRenderer] Starting makeup application...');
  console.log('[MediaPipeRenderer] Products:', products.length);
  
  // Load image
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = imageDataUrl;
  });
  
  console.log('[MediaPipeRenderer] Image loaded:', img.width, 'x', img.height);
  
  // Detect face landmarks
  const results = await detectFaceLandmarks(img);
  
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    console.warn('[MediaPipeRenderer] No face detected');
    return {
      imageData: imageDataUrl,
      faceDetected: false,
    };
  }
  
  const landmarks = results.multiFaceLandmarks[0];
  console.log('[MediaPipeRenderer] ✅ Face detected with', landmarks.length, 'landmarks');
  
  // Create canvas for rendering
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Draw original image
  ctx.drawImage(img, 0, 0);
  
  // Apply makeup effects based on products and honor effect overrides
  products.forEach((product) => {
    const area = product.applicationArea.toLowerCase();
    const defaultColor = getProductColor(product);
    
    // Check for effect overrides
    const override = effectOverrides?.find(o => o.category.toLowerCase() === area);
    
    // Skip if override disables this effect
    if (override && !override.enabled) {
      console.log('[MediaPipeRenderer] Skipping disabled effect:', area);
      return;
    }
    
    // Use override color if provided, otherwise use product color
    const color = override?.color || defaultColor;
    
    // Use override intensity if provided, otherwise use defaults
    const baseOpacity = {
      lipstick: 0.7,
      lips: 0.7,
      blush: 0.4,
      eyeliner: 0.9,
      foundation: 0.2,
      primer: 0.2,
      bronzer: 0.3,
      contour: 0.3,
      kajal: 0.8,
      eyeshadow: 0.5,
      'eyebrow pencil': 0.6,
    }[area] || 0.5;
    
    const opacity = override ? baseOpacity * override.intensity : baseOpacity;
    
    console.log('[MediaPipeRenderer] Applying', area, 'with color', color, 'opacity', opacity);
    
    // Get style and liner options from override or product attributes
    const eyelinerStyle = (override?.style || product.attributes.style || 'basic') as EyelinerStyle;
    const withLipLiner = override?.style === 'with-liner' || product.attributes.style === 'with-liner';
    
    if (area === 'lipstick' || area === 'lips') {
      renderLipstick(ctx, landmarks, color, opacity, canvas.width, canvas.height, withLipLiner);
    } else if (area === 'blush') {
      renderBlush(ctx, landmarks, color, opacity, canvas.width, canvas.height);
    } else if (area === 'eyeliner') {
      renderEyeliner(ctx, landmarks, color, opacity, canvas.width, canvas.height, eyelinerStyle);
    } else if (area === 'foundation' || area === 'primer') {
      renderFoundation(ctx, landmarks, color, opacity, canvas.width, canvas.height);
    } else if (area === 'bronzer' || area === 'contour') {
      renderBlush(ctx, landmarks, color, opacity, canvas.width, canvas.height);
    } else if (area === 'kajal') {
      renderKajal(ctx, landmarks, color, opacity, canvas.width, canvas.height);
    } else if (area === 'eyeshadow') {
      renderEyeshadow(ctx, landmarks, color, opacity, canvas.width, canvas.height);
    } else if (area === 'eyebrow pencil') {
      renderEyebrowPencil(ctx, landmarks, color, opacity, canvas.width, canvas.height);
    }
  });
  
  console.log('[MediaPipeRenderer] ✅ Makeup rendering complete');
  
  // Return rendered image
  return {
    imageData: canvas.toDataURL('image/jpeg', 0.95),
    faceDetected: true,
  };
}
