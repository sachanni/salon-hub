export interface MakeupEffect {
  type: 'lipstick' | 'foundation' | 'blush' | 'eyeshadow' | 'eyeliner' | 'mascara' | 'hair' | 'highlighter' | 'bronzer' | 'concealer' | 'powder';
  color: string;
  intensity: number;
}

export async function applyMakeupEffects(
  imageUrl: string,
  effects: MakeupEffect[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);

      effects.forEach(effect => {
        switch (effect.type) {
          case 'foundation':
          case 'concealer':
            applyFoundation(ctx, canvas.width, canvas.height, effect.color, effect.intensity);
            break;
          case 'powder':
            applyPowder(ctx, canvas.width, canvas.height, effect.color, effect.intensity);
            break;
          case 'lipstick':
            applyLipstick(ctx, canvas.width, canvas.height, effect.color, effect.intensity);
            break;
          case 'blush':
            applyBlush(ctx, canvas.width, canvas.height, effect.color, effect.intensity);
            break;
          case 'bronzer':
            applyBronzer(ctx, canvas.width, canvas.height, effect.color, effect.intensity);
            break;
          case 'highlighter':
            applyHighlighter(ctx, canvas.width, canvas.height, effect.color, effect.intensity);
            break;
          case 'eyeshadow':
            applyEyeshadow(ctx, canvas.width, canvas.height, effect.color, effect.intensity);
            break;
          case 'eyeliner':
            applyEyeliner(ctx, canvas.width, canvas.height, effect.color, effect.intensity);
            break;
          case 'mascara':
            applyMascara(ctx, canvas.width, canvas.height, effect.color, effect.intensity);
            break;
          case 'hair':
            applyHairColor(ctx, canvas.width, canvas.height, effect.color, effect.intensity);
            break;
        }
      });

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

function applyFoundation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = intensity * 0.4; // Increased from 0.15 to 0.4 for visibility
  ctx.fillStyle = color;
  
  const centerX = width / 2;
  const centerY = height * 0.4;
  const radiusX = width * 0.35;
  const radiusY = height * 0.45;
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function applyLipstick(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = intensity * 0.7; // Increased from 0.3 to 0.7 for visibility
  ctx.fillStyle = color;
  
  const centerX = width / 2;
  const centerY = height * 0.7;
  const radiusX = width * 0.08;
  const radiusY = height * 0.03;
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function applyBlush(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = intensity * 0.5; // Increased from 0.2 to 0.5 for visibility
  ctx.fillStyle = color;
  
  const centerY = height * 0.5;
  const radiusX = width * 0.1;
  const radiusY = height * 0.08;
  
  [width * 0.25, width * 0.75].forEach(centerX => {
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

function applyHairColor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = intensity * 0.6; // Increased from 0.25 to 0.6 for visibility
  ctx.fillStyle = color;
  
  const centerX = width / 2;
  const centerY = height * 0.15;
  const radiusX = width * 0.4;
  const radiusY = height * 0.2;
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function applyPowder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = intensity * 0.3;
  ctx.fillStyle = color;
  
  const centerX = width / 2;
  const centerY = height * 0.4;
  const radiusX = width * 0.35;
  const radiusY = height * 0.45;
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function applyBronzer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = intensity * 0.6; // Dramatic bronzing effect
  ctx.fillStyle = color;
  
  // Apply to forehead, cheeks, and jawline
  const positions = [
    { x: width * 0.25, y: height * 0.55, radiusX: width * 0.12, radiusY: height * 0.1 }, // Left cheek
    { x: width * 0.75, y: height * 0.55, radiusX: width * 0.12, radiusY: height * 0.1 }, // Right cheek
    { x: width * 0.5, y: height * 0.25, radiusX: width * 0.25, radiusY: height * 0.08 },  // Forehead
  ];
  
  positions.forEach(pos => {
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, pos.radiusX, pos.radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

function applyHighlighter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = intensity * 0.8; // Dramatic shimmer effect
  
  // Create radial gradient for shimmer effect
  const positions = [
    { x: width * 0.25, y: height * 0.48 }, // Left cheekbone
    { x: width * 0.75, y: height * 0.48 }, // Right cheekbone
    { x: width * 0.5, y: height * 0.6 },   // Nose bridge
  ];
  
  positions.forEach(pos => {
    const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, width * 0.08);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

function applyEyeshadow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = Math.max(0.5, intensity * 0.85); // DRAMATIC eyeshadow (not subtle!)
  
  // Left and right eyes
  const eyePositions = [
    { x: width * 0.35, y: height * 0.42 }, // Left eye
    { x: width * 0.65, y: height * 0.42 }, // Right eye
  ];
  
  eyePositions.forEach(pos => {
    // Base eyeshadow color
    const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, width * 0.12);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, width * 0.09, height * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add shimmer highlight (lighter color on lid)
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = intensity * 0.5;
    const highlightGradient = ctx.createRadialGradient(pos.x, pos.y - height * 0.01, 0, pos.x, pos.y - height * 0.01, width * 0.06);
    highlightGradient.addColorStop(0, '#FFE4B5');
    highlightGradient.addColorStop(1, 'rgba(255,228,181,0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y - height * 0.01, width * 0.06, height * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

function applyEyeliner(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = Math.max(0.6, intensity * 0.95); // VERY DRAMATIC eyeliner
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, width * 0.008); // Thicker line for visibility
  ctx.lineCap = 'round';
  
  // Left and right eyes
  const eyePositions = [
    { x: width * 0.35, y: height * 0.45 }, // Left eye lash line
    { x: width * 0.65, y: height * 0.45 }, // Right eye lash line
  ];
  
  eyePositions.forEach((pos, index) => {
    ctx.beginPath();
    
    // Draw upper lash line with wing
    const startX = pos.x - width * 0.08;
    const endX = pos.x + width * 0.08;
    const wingX = endX + width * 0.02 * (index === 0 ? -1 : 1);
    const wingY = pos.y - height * 0.02;
    
    ctx.moveTo(startX, pos.y);
    ctx.quadraticCurveTo(pos.x, pos.y - height * 0.005, endX, pos.y);
    ctx.lineTo(wingX, wingY); // Wing
    ctx.stroke();
    
    // Fill to create thicker liner
    ctx.globalAlpha = Math.max(0.5, intensity * 0.8);
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, width * 0.09, height * 0.012, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

function applyMascara(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  intensity: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = Math.max(0.6, intensity * 0.9); // DRAMATIC lashes
  ctx.fillStyle = color;
  
  // Left and right eyes
  const eyePositions = [
    { x: width * 0.35, y: height * 0.43 }, // Left eye
    { x: width * 0.65, y: height * 0.43 }, // Right eye
  ];
  
  eyePositions.forEach(pos => {
    // Upper lashes - create volume effect
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y - height * 0.02, width * 0.095, height * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Lower lashes - subtle
    ctx.globalAlpha = Math.max(0.3, intensity * 0.5);
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + height * 0.02, width * 0.08, height * 0.015, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function getProductColor(category: string, shade?: string): string {
  const colorMap: Record<string, string> = {
    foundation: '#F5D5C3',
    concealer: '#F5D5C3',
    lipstick: '#DC143C',
    'lip gloss': '#FF69B4',
    blush: '#FFB6C1',
    bronzer: '#CD853F',
    highlighter: '#FFE4B5',
    eyeshadow: '#9370DB',
    eyeliner: '#000000',
    mascara: '#000000',
    'hair color': '#8B4513',
  };

  return colorMap[category.toLowerCase()] || '#FFB6C1';
}
