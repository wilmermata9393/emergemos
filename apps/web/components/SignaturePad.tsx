'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export interface SignaturePadHandle {
  toDataURL: () => string;
  isEmpty: () => boolean;
  clear: () => void;
}

/// Área para firmar con el dedo o el mouse (canvas).
const SignaturePad = forwardRef<SignaturePadHandle>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL('image/png') ?? '',
    isEmpty: () => !dirty.current,
    clear: () => {
      const c = canvasRef.current;
      if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
      dirty.current = false;
      setHasDrawn(false);
    },
  }));

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }
  function start(e: React.PointerEvent) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    dirty.current = true;
    if (!hasDrawn) setHasDrawn(true);
  }
  function end() { drawing.current = false; }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className="w-full touch-none rounded-lg border-2 border-dashed border-slate-300 bg-white"
        style={{ maxWidth: '100%' }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="mt-1 flex items-center justify-between text-sm text-slate-500">
        <span>{hasDrawn ? 'Firma capturada' : 'Firma aquí con el dedo o el mouse'}</span>
        <button type="button" className="text-brand-600" onClick={() => ref && (ref as any).current?.clear()}>Borrar</button>
      </div>
    </div>
  );
});
SignaturePad.displayName = 'SignaturePad';
export default SignaturePad;
