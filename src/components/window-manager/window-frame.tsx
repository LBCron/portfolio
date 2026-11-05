'use client';

import { Maximize2, Minimize2, Minus, X } from 'lucide-react';
import {
  type KeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/cn';
import {
  clampRect,
  maximizedRect,
  type Rect,
  type ResizeEdge,
  resizeRect,
  SHEET_BREAKPOINT,
  snapRect,
  type SnapSide,
  snapSideAt,
  type Viewport,
} from '@/lib/window-manager/geometry';
import { useWindowStore } from '@/stores/window-store';

export interface WindowLabels {
  close: string;
  controls: string;
  hint: string;
  maximize: string;
  minimize: string;
  resizeSheet: string;
  restore: string;
  window: string;
}

const EDGE_CLASS: Record<ResizeEdge, string> = {
  n: 'inset-x-3 top-0 h-1.5 cursor-ns-resize pointer-coarse:h-3',
  s: 'inset-x-3 bottom-0 h-1.5 cursor-ns-resize pointer-coarse:h-3',
  e: 'inset-y-3 right-0 w-1.5 cursor-ew-resize pointer-coarse:w-3',
  w: 'inset-y-3 left-0 w-1.5 cursor-ew-resize pointer-coarse:w-3',
  ne: 'top-0 right-0 size-3 cursor-nesw-resize',
  nw: 'top-0 left-0 size-3 cursor-nwse-resize',
  se: 'right-0 bottom-0 size-3 cursor-nwse-resize',
  sw: 'bottom-0 left-0 size-3 cursor-nesw-resize',
};

const KEY_DIRECTION: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

function applyRect(el: HTMLElement, rect: Rect) {
  el.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

/**
 * Drives the snap preview straight on the DOM (no React state during a drag).
 * Arming grows it out of the window's current rect into the snap area while it
 * fades in; switching sides glides between areas; disarming shrinks it back
 * onto the window and fades it out. Releasing a snap only fades it, while the
 * window itself grows into the area. CSS transitions do the motion, so reduced
 * motion and Pause animations make it instant.
 */
function setSnapPreview(
  el: HTMLElement | null,
  side: null | SnapSide,
  from: Rect,
  viewport: Viewport,
) {
  if (!el) return;

  const armed = el.dataset['snapPreview'] ?? null;

  if (side === armed) return;

  if (!side) {
    delete el.dataset['snapPreview'];
    applyRect(el, from);

    return;
  }

  if (!armed) {
    el.style.transition = 'none';
    applyRect(el, from);
    // Commit the start rect before transitioning out of it.
    el.getBoundingClientRect();
    el.style.transition = '';
  }

  el.dataset['snapPreview'] = side;
  applyRect(el, snapRect(side, viewport));
}

function Control({
  label,
  onClick,
  color,
  children,
}: {
  children: ReactNode;
  color: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-6 items-center justify-center rounded-full pointer-coarse:size-9"
    >
      <span
        aria-hidden="true"
        className={cn('flex size-3 items-center justify-center rounded-full text-bg-0', color)}
      >
        <span className="opacity-0 group-focus-within/controls:opacity-100 group-hover/controls:opacity-100">
          {children}
        </span>
      </span>
    </button>
  );
}

/**
 * A generic OS-style window: drag, resize, snap, maximize, minimize, close and
 * a bottom-sheet layout below 640px. Gestures write straight to the DOM (no
 * React state per frame) and commit to the store on release.
 */
export function WindowFrame({
  id,
  title,
  labels,
  badge,
  children,
}: {
  /**
   * Optional chip at the right end of the title bar.
   */
  badge?: ReactNode;
  children: ReactNode;
  id: string;
  labels: WindowLabels;
  title: string;
}) {
  const win = useWindowStore((state) => state.windows[id]);
  const viewport = useWindowStore((state) => state.viewport);
  const outerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [tall, setTall] = useState(false);

  const sheet = viewport.width < SHEET_BREAKPOINT;
  const status = win?.status;
  const focused = win?.focused;

  useEffect(() => {
    const el = outerRef.current;

    if (status === 'open' && focused && el && !el.contains(document.activeElement)) {
      el.focus({ preventScroll: true });
    }
  }, [status, focused]);

  useEffect(() => {
    const el = outerRef.current;
    const vv = window.visualViewport;

    if (!sheet || !el || !vv) return;

    const update = () =>
      el.style.setProperty(
        '--kb',
        `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`,
      );

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [sheet, status]);

  if (!win) return null;

  const store = useWindowStore.getState();
  const rect = win.maximized ? maximizedRect(viewport) : win.rect;

  function track(
    event: ReactPointerEvent<HTMLElement>,
    compute: (dx: number, dy: number, pointer: PointerEvent) => Rect,
    commit: (rect: Rect) => void,
  ) {
    const outer = outerRef.current;

    if (!outer) return;

    const target = event.currentTarget;
    const startX = event.clientX;
    const startY = event.clientY;
    let latest: null | Rect = null;
    let frame = 0;

    target.setPointerCapture(event.pointerId);
    outer.dataset['gesture'] = 'true';

    const onMove = (move: PointerEvent) => {
      latest = compute(move.clientX - startX, move.clientY - startY, move);

      if (frame) return;

      frame = requestAnimationFrame(() => {
        frame = 0;

        if (latest) applyRect(outer, latest);
      });
    };
    const finish = (commitGesture: boolean) => {
      cancelAnimationFrame(frame);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
      delete outer.dataset['gesture'];
      const preview = previewRef.current;

      if (preview) delete preview.dataset['snapPreview'];

      const current = useWindowStore.getState().windows[id];

      if (commitGesture && latest) commit(latest);
      else if (current) applyRect(outer, current.rect);
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key === 'Escape') finish(false);
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!win || sheet || win.maximized || event.button !== 0) return;

    if ((event.target as Element).closest('button')) return;

    const start = win.rect;
    const { viewport: bounds } = useWindowStore.getState();
    let side: null | SnapSide = null;

    track(
      event,
      (dx, dy, pointer) => {
        const next = clampRect({ ...start, x: start.x + dx, y: start.y + dy }, bounds);

        side = snapSideAt({ x: pointer.clientX, y: pointer.clientY }, bounds, side);
        setSnapPreview(previewRef.current, side, next, bounds);

        return next;
      },
      (next) => {
        if (side) store.snap(id, side);
        else store.moveTo(id, next.x, next.y);
      },
    );
  }

  function startResize(edge: ResizeEdge) {
    return (event: ReactPointerEvent<HTMLElement>) => {
      if (!win || event.button !== 0) return;

      const start = win.rect;
      const { viewport: bounds } = useWindowStore.getState();

      track(
        event,
        (dx, dy) => resizeRect(start, edge, dx, dy, bounds),
        (next) => store.resizeTo(id, next),
      );
    };
  }

  function onTitleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const direction = KEY_DIRECTION[event.key];

    if (event.target !== event.currentTarget || !direction) return;

    if (sheet || win?.maximized) return;

    event.preventDefault();

    const [dx, dy] = direction;

    if (event.altKey) store.resizeBy(id, 'se', dx * 16, dy * 16);
    else {
      const step = event.shiftKey ? 64 : 16;

      store.moveTo(id, rect.x + dx * step, rect.y + dy * step);
    }
  }

  const dockX = viewport.width - 24 - 40 - (rect.x + rect.width / 2);
  const dockY = viewport.height - 24 - 20 - (rect.y + rect.height / 2);
  const shellTransform =
    win.status === 'minimized'
      ? sheet
        ? 'translate3d(0, 100%, 0) scale(0.9)'
        : `translate3d(${dockX}px, ${dockY}px, 0) scale(0.1)`
      : win.status === 'closed'
        ? 'scale(0.96)'
        : 'none';

  return (
    <>
      {sheet ? null : (
        <div
          ref={previewRef}
          aria-hidden="true"
          data-snap-overlay={id}
          className={cn(
            'decorative pointer-events-none invisible fixed top-0 left-0 rounded-[14px] border border-accent-2/60 bg-accent-2/10 opacity-0 shadow-[inset_0_0_0_1px_rgb(76_201_240/0.15),0_0_32px_rgb(76_201_240/0.12)]',
            'transition-[transform,width,height,opacity,visibility] duration-200 ease-out-expo',
            'data-snap-preview:visible data-snap-preview:opacity-100',
          )}
          style={{ zIndex: 'calc(var(--z-window) - 1)' }}
        />
      )}
      <div
        ref={outerRef}
        role="dialog"
        aria-label={labels.window}
        tabIndex={-1}
        data-window={id}
        data-status={win.status}
        data-sheet={sheet}
        data-tall={tall}
        onPointerDownCapture={() => store.focus(id)}
        className={cn(
          'invisible fixed top-0 left-0 outline-none',
          'transition-[width,height,transform,visibility] duration-300 ease-out-expo',
          'data-[gesture=true]:transition-none data-[status=open]:visible',
          sheet
            && 'h-[45vh] data-[tall=true]:h-[85vh] supports-[height:1dvh]:h-[45dvh] data-[tall=true]:supports-[height:1dvh]:h-[85dvh]',
        )}
        style={{
          zIndex: `calc(var(--z-window) + ${win.zIndex})`,
          ...(sheet
            ? { top: 'auto', bottom: 'var(--kb, 0px)', width: '100%' }
            : {
                transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
                width: rect.width,
                height: rect.height,
              }),
        }}
      >
        <div
          data-focused={win.focused}
          className={cn(
            'relative flex size-full flex-col overflow-hidden border border-line-strong bg-bg-0/88 shadow-(--shadow-window) backdrop-blur-[20px]',
            'transition-[transform,opacity] duration-[280ms] ease-out-expo',
            'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-accent before:opacity-0 data-[focused=true]:before:opacity-100',
            '[@media(prefers-reduced-transparency:reduce)]:bg-bg-0 [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none',
            sheet ? 'rounded-t-[14px] border-b-0 safe-bottom' : 'rounded-[14px]',
            win.status !== 'open' && 'opacity-0',
          )}
          style={{ transform: shellTransform }}
        >
          {sheet ? (
            <button
              type="button"
              aria-label={labels.resizeSheet}
              aria-expanded={tall}
              onClick={() => setTall((value) => !value)}
              className="flex h-6 w-full shrink-0 items-center justify-center"
            >
              <span aria-hidden="true" className="h-1 w-9 rounded-full bg-line-strong" />
            </button>
          ) : null}

          <div
            role="toolbar"
            aria-label={labels.controls}
            aria-describedby={hintId}
            tabIndex={0}
            onPointerDown={startDrag}
            onDoubleClick={(event) => {
              if (sheet || (event.target as Element).closest('button')) return;

              store.toggleMaximize(id);
            }}
            onKeyDown={onTitleKeyDown}
            className="group/controls grid h-10 shrink-0 touch-none grid-cols-[1fr_auto_1fr] items-center border-b border-line px-3 select-none"
          >
            <div className="flex items-center">
              <Control label={labels.close} onClick={() => store.close(id)} color="bg-danger">
                <X className="size-2" strokeWidth={3} />
              </Control>
              <Control label={labels.minimize} onClick={() => store.minimize(id)} color="bg-warn">
                <Minus className="size-2" strokeWidth={3} />
              </Control>
              {sheet ? null : (
                <Control
                  label={win.maximized ? labels.restore : labels.maximize}
                  onClick={() => store.toggleMaximize(id)}
                  color="bg-term-green"
                >
                  {win.maximized ? (
                    <Minimize2 className="size-2" strokeWidth={3} />
                  ) : (
                    <Maximize2 className="size-2" strokeWidth={3} />
                  )}
                </Control>
              )}
            </div>
            <span
              className={cn(
                'max-w-[50vw] truncate font-mono text-xs',
                win.focused ? 'text-text-2' : 'text-text-3',
              )}
            >
              {title}
            </span>
            <div className="flex justify-end">{badge}</div>
            <span id={hintId} className="sr-only">
              {labels.hint}
            </span>
          </div>

          <div className="min-h-0 flex-1">{children}</div>

          {sheet || win.maximized
            ? null
            : (Object.keys(EDGE_CLASS) as ResizeEdge[]).map((edge) => (
                <div
                  key={edge}
                  aria-hidden="true"
                  data-resize={edge}
                  onPointerDown={startResize(edge)}
                  className={cn('absolute touch-none', EDGE_CLASS[edge])}
                />
              ))}
        </div>
      </div>
    </>
  );
}
