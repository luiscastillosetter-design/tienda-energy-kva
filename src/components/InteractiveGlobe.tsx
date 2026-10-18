'use client';

import { useRef, useEffect, useCallback } from "react";

interface GlobeProps {
  className?: string;
  size?: number | string;
  dotColor?: string;
  arcColor?: string;
  markerColor?: string;
  autoRotateSpeed?: number;
}

const DEFAULT_MARKERS = [
  { lat: 9.0418, lng: -69.7501, label: "Guanare (Sede ENERGY KVA)" },
  { lat: 25.7617, lng: -80.1918, label: "Miami (Logística)" },
  { lat: 22.5431, lng: 114.0579, label: "Shenzhen (Fábrica)" },
  { lat: 8.9824, lng: -79.5199, label: "Panamá (Puerto)" },
  { lat: 10.4806, lng: -66.9036, label: "Caracas (Despacho Nacional)" },
];

const DEFAULT_CONNECTIONS = [
  { from: [22.5431, 114.0579], to: [9.0418, -69.7501] }, 
  { from: [25.7617, -80.1918], to: [9.0418, -69.7501] }, 
  { from: [8.9824, -79.5199], to: [9.0418, -69.7501] },  
  { from: [9.0418, -69.7501], to: [10.4806, -66.9036] }, 
];

function latLngToXYZ(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [-(radius * Math.sin(phi) * Math.cos(theta)), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)];
}

function rotateY(x: number, y: number, z: number, angle: number): [number, number, number] {
  const cos = Math.cos(angle); const sin = Math.sin(angle);
  return [x * cos + z * sin, y, -x * sin + z * cos];
}

function rotateX(x: number, y: number, z: number, angle: number): [number, number, number] {
  const cos = Math.cos(angle); const sin = Math.sin(angle);
  return [x, y * cos - z * sin, y * sin + z * cos];
}

function project(x: number, y: number, z: number, cx: number, cy: number, fov: number): [number, number, number] {
  const scale = fov / (fov + z);
  return [x * scale + cx, y * scale + cy, z];
}

export default function InteractiveGlobe({
  className, size = "100%", dotColor = "rgba(0, 229, 255, ALPHA)", arcColor = "rgba(0, 229, 255, 0.5)", markerColor = "rgba(0, 229, 255, 1)", autoRotateSpeed = 0.002,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotYRef = useRef(0.4);
  const rotXRef = useRef(0.3);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const dotsRef = useRef<[number, number, number][]>([]);

  useEffect(() => {
    const dots: [number, number, number][] = [];
    const numDots = 1200;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < numDots; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / numDots);
      const x = Math.cos(theta) * Math.sin(phi);
      const y = Math.cos(phi);
      const z = Math.sin(theta) * Math.sin(phi);
      dots.push([x, y, z]);
    }
    dotsRef.current = dots;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2; const cy = h / 2;
    const radius = Math.min(w, h) * 0.38;
    const fov = 600;

    rotYRef.current += autoRotateSpeed;
    timeRef.current += 0.015;
    const time = timeRef.current;

    ctx.clearRect(0, 0, w, h);

    const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.5);
    glowGrad.addColorStop(0, "rgba(0, 229, 255, 0.05)");
    glowGrad.addColorStop(1, "rgba(0, 229, 255, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    const ry = rotYRef.current;
    const rx = rotXRef.current;

    for (const [ox, oy, oz] of dotsRef.current) {
      let x = ox * radius; let y = oy * radius; let z = oz * radius;
      [x, y, z] = rotateX(x, y, z, rx); [x, y, z] = rotateY(x, y, z, ry);
      if (z > 0) continue; 
      const [sx, sy] = project(x, y, z, cx, cy, fov);
      const depthAlpha = Math.max(0.1, 1 - (z + radius) / (2 * radius));
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + depthAlpha * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = dotColor.replace("ALPHA", depthAlpha.toFixed(2));
      ctx.fill();
    }

    for (const conn of DEFAULT_CONNECTIONS) {
      const [lat1, lng1] = conn.from; const [lat2, lng2] = conn.to;
      let [x1, y1, z1] = latLngToXYZ(lat1, lng1, radius); let [x2, y2, z2] = latLngToXYZ(lat2, lng2, radius);
      [x1, y1, z1] = rotateX(x1, y1, z1, rx); [x1, y1, z1] = rotateY(x1, y1, z1, ry);
      [x2, y2, z2] = rotateX(x2, y2, z2, rx); [x2, y2, z2] = rotateY(x2, y2, z2, ry);
      if (z1 > radius * 0.3 && z2 > radius * 0.3) continue;
      const [sx1, sy1] = project(x1, y1, z1, cx, cy, fov); const [sx2, sy2] = project(x2, y2, z2, cx, cy, fov);
      const midX = (x1 + x2) / 2; const midY = (y1 + y2) / 2; const midZ = (z1 + z2) / 2;
      const midLen = Math.sqrt(midX * midX + midY * midY + midZ * midZ);
      const arcHeight = radius * 1.25;
      const [scx, scy] = project((midX / midLen) * arcHeight, (midY / midLen) * arcHeight, (midZ / midLen) * arcHeight, cx, cy, fov);
      ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.quadraticCurveTo(scx, scy, sx2, sy2);
      ctx.strokeStyle = arcColor; ctx.lineWidth = 1.2; ctx.stroke();
      const t = (Math.sin(time * 1.2 + lat1 * 0.1) + 1) / 2;
      const tx = (1 - t) * (1 - t) * sx1 + 2 * (1 - t) * t * scx + t * t * sx2;
      const ty = (1 - t) * (1 - t) * sy1 + 2 * (1 - t) * t * scy + t * t * sy2;
      ctx.beginPath(); ctx.arc(tx, ty, 2, 0, Math.PI * 2); ctx.fillStyle = markerColor; ctx.fill();
    }

    for (const marker of DEFAULT_MARKERS) {
      let [x, y, z] = latLngToXYZ(marker.lat, marker.lng, radius);
      [x, y, z] = rotateX(x, y, z, rx); [x, y, z] = rotateY(x, y, z, ry);
      if (z > radius * 0.1) continue;
      const [sx, sy] = project(x, y, z, cx, cy, fov);
      const pulse = Math.sin(time * 2 + marker.lat) * 0.5 + 0.5;
      ctx.beginPath(); ctx.arc(sx, sy, 4 + pulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = markerColor.replace("1)", `${0.2 + pulse * 0.15})`); ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fillStyle = markerColor; ctx.fill();
      if (marker.label) {
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.fillStyle = markerColor.replace("1)", "0.8)");
        ctx.fillText(marker.label, sx + 8, sy + 3);
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, [dotColor, arcColor, markerColor, autoRotateSpeed]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} className={`pointer-events-none ${className || ""}`} style={{ width: size, height: size, maxWidth: '100%', aspectRatio: '1/1' }} />;
}