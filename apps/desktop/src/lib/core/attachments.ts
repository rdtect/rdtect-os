/**
 * Svelte 5 Attachments
 *
 * Reusable DOM behavior attachments using Svelte 5's new attachment system.
 * Attachments run when an element mounts and can return a cleanup function.
 *
 * @see https://svelte.dev/docs/svelte/svelte-attachments
 * @since Svelte 5.29
 */

// ============================================================================
// Types
// ============================================================================

/**
 * An attachment is a function that receives a DOM element and optionally
 * returns a cleanup function.
 */
export type Attachment<T extends Element = Element> = (element: T) => void | (() => void);

/**
 * Options for the draggable attachment
 */
export interface DraggableOptions {
	/** Called when drag starts */
	onStart?: (event: MouseEvent, position: { x: number; y: number }) => void;
	/** Called during drag with delta from start position */
	onMove?: (event: MouseEvent, delta: { x: number; y: number }) => void;
	/** Called when drag ends */
	onEnd?: (event: MouseEvent) => void;
	/** Whether dragging is currently disabled */
	disabled?: boolean;
	/** CSS cursor to use while dragging */
	cursor?: string;
}

/**
 * Resize direction type
 */
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Options for the resizable attachment
 */
export interface ResizableOptions {
	/** The direction(s) to allow resizing */
	direction: ResizeDirection;
	/** Called when resize starts */
	onStart?: (event: MouseEvent, rect: DOMRect) => void;
	/** Called during resize with size and position deltas */
	onMove?: (
		event: MouseEvent,
		delta: { width: number; height: number; x: number; y: number }
	) => void;
	/** Called when resize ends */
	onEnd?: (event: MouseEvent) => void;
	/** Whether resizing is currently disabled */
	disabled?: boolean;
}

/**
 * Options for the clickOutside attachment
 */
export interface ClickOutsideOptions {
	/** Callback when click occurs outside the element */
	onClickOutside: (event: MouseEvent) => void;
	/** Elements to exclude from triggering the callback */
	exclude?: Element[];
	/** Whether the attachment is disabled */
	disabled?: boolean;
}

/**
 * Options for the tooltip attachment
 */
export interface TooltipOptions {
	/** The tooltip text content */
	text: string;
	/** Tooltip position relative to element */
	position?: 'top' | 'bottom' | 'left' | 'right';
	/** Delay before showing tooltip (ms) */
	delay?: number;
	/** Custom CSS class for the tooltip */
	className?: string;
}

/**
 * Options for the doubleClick attachment
 */
export interface DoubleClickOptions {
	/** Callback when double-click is detected */
	onDoubleClick: (event: MouseEvent) => void;
	/** Maximum time between clicks (ms) */
	threshold?: number;
	/** Whether the attachment is disabled */
	disabled?: boolean;
}

/**
 * Options for the escapeKey attachment
 */
export interface EscapeKeyOptions {
	/** Callback when Escape key is pressed */
	onEscape: (event: KeyboardEvent) => void;
	/** Whether the attachment is disabled */
	disabled?: boolean;
}

// ============================================================================
// Draggable Attachment
// ============================================================================

/**
 * Makes an element draggable via mouse interaction.
 *
 * @example
 * ```svelte
 * <div {@attach draggable({
 *   onMove: (e, delta) => {
 *     x += delta.x;
 *     y += delta.y;
 *   }
 * })}>
 *   Drag me
 * </div>
 * ```
 */
export function draggable(options: DraggableOptions = {}): Attachment<HTMLElement> {
	return (element: HTMLElement) => {
		const { onStart, onMove, onEnd, disabled = false, cursor = 'grabbing' } = options;

		if (disabled) return;

		let isDragging = false;
		let startX = 0;
		let startY = 0;
		const originalCursor = element.style.cursor;

		function handleMouseDown(e: MouseEvent) {
			// Only respond to left mouse button
			if (e.button !== 0) return;

			isDragging = true;
			startX = e.clientX;
			startY = e.clientY;

			element.style.cursor = cursor;
			document.body.style.cursor = cursor;
			document.body.style.userSelect = 'none';

			onStart?.(e, { x: e.clientX, y: e.clientY });

			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
		}

		function handleMouseMove(e: MouseEvent) {
			if (!isDragging) return;

			const deltaX = e.clientX - startX;
			const deltaY = e.clientY - startY;

			onMove?.(e, { x: deltaX, y: deltaY });

			// Update start position for continuous delta
			startX = e.clientX;
			startY = e.clientY;
		}

		function handleMouseUp(e: MouseEvent) {
			if (!isDragging) return;

			isDragging = false;
			element.style.cursor = originalCursor;
			document.body.style.cursor = '';
			document.body.style.userSelect = '';

			onEnd?.(e);

			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		}

		element.addEventListener('mousedown', handleMouseDown);

		// Cleanup function
		return () => {
			element.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	};
}

// ============================================================================
// Resizable Attachment
// ============================================================================

/**
 * Makes an element a resize handle for resizing operations.
 *
 * @example
 * ```svelte
 * <div {@attach resizable({
 *   direction: 'se',
 *   onMove: (e, delta) => {
 *     width += delta.width;
 *     height += delta.height;
 *   }
 * })}>
 *   Resize handle
 * </div>
 * ```
 */
export function resizable(options: ResizableOptions): Attachment<HTMLElement> {
	return (element: HTMLElement) => {
		const { direction, onStart, onMove, onEnd, disabled = false } = options;

		if (disabled) return;

		let isResizing = false;
		let startX = 0;
		let startY = 0;

		// Set appropriate cursor based on direction
		const cursorMap: Record<ResizeDirection, string> = {
			n: 'n-resize',
			s: 's-resize',
			e: 'e-resize',
			w: 'w-resize',
			ne: 'ne-resize',
			nw: 'nw-resize',
			se: 'se-resize',
			sw: 'sw-resize'
		};

		element.style.cursor = cursorMap[direction];

		function handleMouseDown(e: MouseEvent) {
			if (e.button !== 0) return;

			e.preventDefault();
			e.stopPropagation();

			isResizing = true;
			startX = e.clientX;
			startY = e.clientY;

			document.body.style.cursor = cursorMap[direction];
			document.body.style.userSelect = 'none';

			onStart?.(e, element.getBoundingClientRect());

			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
		}

		function handleMouseMove(e: MouseEvent) {
			if (!isResizing) return;

			const deltaX = e.clientX - startX;
			const deltaY = e.clientY - startY;

			let widthDelta = 0;
			let heightDelta = 0;
			let xDelta = 0;
			let yDelta = 0;

			// Calculate deltas based on direction
			if (direction.includes('e')) widthDelta = deltaX;
			if (direction.includes('w')) {
				widthDelta = -deltaX;
				xDelta = deltaX;
			}
			if (direction.includes('s')) heightDelta = deltaY;
			if (direction.includes('n')) {
				heightDelta = -deltaY;
				yDelta = deltaY;
			}

			onMove?.(e, { width: widthDelta, height: heightDelta, x: xDelta, y: yDelta });

			// Update start position for continuous delta
			startX = e.clientX;
			startY = e.clientY;
		}

		function handleMouseUp(e: MouseEvent) {
			if (!isResizing) return;

			isResizing = false;
			document.body.style.cursor = '';
			document.body.style.userSelect = '';

			onEnd?.(e);

			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		}

		element.addEventListener('mousedown', handleMouseDown);

		return () => {
			element.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	};
}

// ============================================================================
// Click Outside Attachment
// ============================================================================

/**
 * Detects clicks outside the attached element.
 *
 * @example
 * ```svelte
 * <div {@attach clickOutside({
 *   onClickOutside: () => isOpen = false
 * })}>
 *   Click outside to close
 * </div>
 * ```
 */
export function clickOutside(options: ClickOutsideOptions): Attachment<HTMLElement> {
	return (element: HTMLElement) => {
		const { onClickOutside, exclude = [], disabled = false } = options;

		if (disabled) return;

		function handleClick(e: MouseEvent) {
			const target = e.target as Node;

			// Check if click is inside the element
			if (element.contains(target)) return;

			// Check if click is inside any excluded element
			for (const excludedEl of exclude) {
				if (excludedEl.contains(target)) return;
			}

			onClickOutside(e);
		}

		// Use setTimeout to avoid immediate trigger on the same click that opened
		const timeoutId = setTimeout(() => {
			window.addEventListener('click', handleClick);
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener('click', handleClick);
		};
	};
}

// ============================================================================
// Tooltip Attachment
// ============================================================================

/**
 * Adds a tooltip to an element.
 *
 * @example
 * ```svelte
 * <button {@attach tooltip({ text: 'Save changes', position: 'top' })}>
 *   Save
 * </button>
 * ```
 */
export function tooltip(options: TooltipOptions): Attachment<HTMLElement> {
	return (element: HTMLElement) => {
		const { text, position = 'top', delay = 300, className = '' } = options;

		let tooltipEl: HTMLDivElement | null = null;
		let showTimeout: ReturnType<typeof setTimeout> | null = null;

		function createTooltip() {
			tooltipEl = document.createElement('div');
			tooltipEl.textContent = text;
			tooltipEl.className = `
        fixed z-[10001] px-2 py-1 text-xs text-white bg-slate-800 rounded shadow-lg
        pointer-events-none transition-opacity duration-150
        ${className}
      `.trim();
			tooltipEl.style.opacity = '0';
			document.body.appendChild(tooltipEl);

			// Position the tooltip
			const rect = element.getBoundingClientRect();
			const tooltipRect = tooltipEl.getBoundingClientRect();

			let top: number;
			let left: number;

			switch (position) {
				case 'top':
					top = rect.top - tooltipRect.height - 8;
					left = rect.left + (rect.width - tooltipRect.width) / 2;
					break;
				case 'bottom':
					top = rect.bottom + 8;
					left = rect.left + (rect.width - tooltipRect.width) / 2;
					break;
				case 'left':
					top = rect.top + (rect.height - tooltipRect.height) / 2;
					left = rect.left - tooltipRect.width - 8;
					break;
				case 'right':
					top = rect.top + (rect.height - tooltipRect.height) / 2;
					left = rect.right + 8;
					break;
			}

			// Keep tooltip within viewport
			left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
			top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));

			tooltipEl.style.top = `${top}px`;
			tooltipEl.style.left = `${left}px`;

			// Fade in
			requestAnimationFrame(() => {
				if (tooltipEl) tooltipEl.style.opacity = '1';
			});
		}

		function removeTooltip() {
			if (showTimeout) {
				clearTimeout(showTimeout);
				showTimeout = null;
			}
			if (tooltipEl) {
				tooltipEl.remove();
				tooltipEl = null;
			}
		}

		function handleMouseEnter() {
			showTimeout = setTimeout(createTooltip, delay);
		}

		function handleMouseLeave() {
			removeTooltip();
		}

		element.addEventListener('mouseenter', handleMouseEnter);
		element.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			removeTooltip();
			element.removeEventListener('mouseenter', handleMouseEnter);
			element.removeEventListener('mouseleave', handleMouseLeave);
		};
	};
}

// ============================================================================
// Double Click Attachment
// ============================================================================

/**
 * Detects double-click events with configurable threshold.
 *
 * @example
 * ```svelte
 * <div {@attach doubleClick({
 *   onDoubleClick: () => toggleMaximize()
 * })}>
 *   Double-click to maximize
 * </div>
 * ```
 */
export function doubleClick(options: DoubleClickOptions): Attachment<HTMLElement> {
	return (element: HTMLElement) => {
		const { onDoubleClick, threshold = 300, disabled = false } = options;

		if (disabled) return;

		let lastClickTime = 0;
		let lastClickX = 0;
		let lastClickY = 0;

		function handleClick(e: MouseEvent) {
			const now = Date.now();
			const timeDiff = now - lastClickTime;

			// Check if within threshold and approximately same location
			const distX = Math.abs(e.clientX - lastClickX);
			const distY = Math.abs(e.clientY - lastClickY);
			const withinDistance = distX < 10 && distY < 10;

			if (timeDiff < threshold && withinDistance) {
				onDoubleClick(e);
				lastClickTime = 0; // Reset to prevent triple-click triggering
			} else {
				lastClickTime = now;
				lastClickX = e.clientX;
				lastClickY = e.clientY;
			}
		}

		element.addEventListener('click', handleClick);

		return () => {
			element.removeEventListener('click', handleClick);
		};
	};
}

// ============================================================================
// Escape Key Attachment
// ============================================================================

/**
 * Listens for Escape key presses while element is in the DOM.
 *
 * @example
 * ```svelte
 * <div {@attach escapeKey({
 *   onEscape: () => closeModal()
 * })}>
 *   Press Escape to close
 * </div>
 * ```
 */
export function escapeKey(options: EscapeKeyOptions): Attachment<HTMLElement> {
	return () => {
		const { onEscape, disabled = false } = options;

		if (disabled) return;

		function handleKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				onEscape(e);
			}
		}

		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	};
}

// ============================================================================
// Focus Trap Attachment
// ============================================================================

export interface FocusTrapOptions {
	/** Whether the focus trap is currently active */
	active?: boolean;
	/** Element to focus when trap activates (defaults to first focusable) */
	initialFocus?: HTMLElement | null;
}

/**
 * Traps focus within an element (useful for modals/dialogs).
 *
 * @example
 * ```svelte
 * <div {@attach focusTrap({ active: isOpen })}>
 *   <button>First</button>
 *   <button>Last</button>
 * </div>
 * ```
 */
export function focusTrap(options: FocusTrapOptions = {}): Attachment<HTMLElement> {
	return (element: HTMLElement) => {
		const { active = true, initialFocus } = options;

		if (!active) return;

		const focusableSelectors = [
			'a[href]',
			'button:not([disabled])',
			'textarea:not([disabled])',
			'input:not([disabled])',
			'select:not([disabled])',
			'[tabindex]:not([tabindex="-1"])'
		].join(', ');

		function getFocusableElements(): HTMLElement[] {
			return Array.from(element.querySelectorAll<HTMLElement>(focusableSelectors));
		}

		function handleKeydown(e: KeyboardEvent) {
			if (e.key !== 'Tab') return;

			const focusable = getFocusableElements();
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}

		// Focus initial element
		if (initialFocus) {
			initialFocus.focus();
		} else {
			const focusable = getFocusableElements();
			if (focusable.length > 0) {
				focusable[0].focus();
			}
		}

		element.addEventListener('keydown', handleKeydown);

		return () => {
			element.removeEventListener('keydown', handleKeydown);
		};
	};
}

// ============================================================================
// Longpress Attachment
// ============================================================================

export interface LongpressOptions {
	/** Callback when longpress is detected */
	onLongpress: (event: MouseEvent | TouchEvent) => void;
	/** Duration to hold before triggering (ms) */
	duration?: number;
	/** Whether the attachment is disabled */
	disabled?: boolean;
}

/**
 * Detects long press (touch or mouse hold) events.
 *
 * @example
 * ```svelte
 * <div {@attach longpress({
 *   onLongpress: () => showContextMenu()
 * })}>
 *   Hold to show menu
 * </div>
 * ```
 */
export function longpress(options: LongpressOptions): Attachment<HTMLElement> {
	return (element: HTMLElement) => {
		const { onLongpress, duration = 500, disabled = false } = options;

		if (disabled) return;

		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		function start(e: MouseEvent | TouchEvent) {
			timeoutId = setTimeout(() => {
				onLongpress(e);
			}, duration);
		}

		function cancel() {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		}

		function handleMouseDown(e: MouseEvent) {
			if (e.button === 0) start(e);
		}

		function handleTouchStart(e: TouchEvent) {
			if (e.touches.length === 1) start(e);
		}

		element.addEventListener('mousedown', handleMouseDown);
		element.addEventListener('mouseup', cancel);
		element.addEventListener('mouseleave', cancel);
		element.addEventListener('touchstart', handleTouchStart);
		element.addEventListener('touchend', cancel);
		element.addEventListener('touchcancel', cancel);

		return () => {
			cancel();
			element.removeEventListener('mousedown', handleMouseDown);
			element.removeEventListener('mouseup', cancel);
			element.removeEventListener('mouseleave', cancel);
			element.removeEventListener('touchstart', handleTouchStart);
			element.removeEventListener('touchend', cancel);
			element.removeEventListener('touchcancel', cancel);
		};
	};
}
