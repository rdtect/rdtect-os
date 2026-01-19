/**
 * Window Class - Composable Svelte 5 State for Windows
 */
import type { WindowState } from './types';

/**
 * Snap zone types for window snapping
 */
export type SnapZone =
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'maximize'
    | null;

/**
 * Edge detection threshold in pixels
 */
const SNAP_THRESHOLD = 20;

/**
 * Taskbar height for calculating snap positions
 */
const TASKBAR_HEIGHT = 56;

/**
 * Detect which snap zone the mouse is in based on screen position
 */
export function detectSnapZone(mouseX: number, mouseY: number): SnapZone {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - TASKBAR_HEIGHT;

    const nearLeft = mouseX <= SNAP_THRESHOLD;
    const nearRight = mouseX >= screenWidth - SNAP_THRESHOLD;
    const nearTop = mouseY <= SNAP_THRESHOLD;
    const nearBottom = mouseY >= screenHeight - SNAP_THRESHOLD && mouseY < screenHeight;

    // Corner detection (corners take priority)
    if (nearTop && nearLeft) return 'top-left';
    if (nearTop && nearRight) return 'top-right';
    if (nearBottom && nearLeft) return 'bottom-left';
    if (nearBottom && nearRight) return 'bottom-right';

    // Edge detection
    if (nearTop) return 'maximize';
    if (nearLeft) return 'left';
    if (nearRight) return 'right';

    return null;
}

/**
 * Get the dimensions and position for a snap zone
 */
export function getSnapZoneBounds(zone: SnapZone): { x: number; y: number; width: number; height: number } | null {
    if (!zone) return null;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - TASKBAR_HEIGHT;
    const halfWidth = Math.floor(screenWidth / 2);
    const halfHeight = Math.floor(screenHeight / 2);

    switch (zone) {
        case 'left':
            return { x: 0, y: 0, width: halfWidth, height: screenHeight };
        case 'right':
            return { x: halfWidth, y: 0, width: screenWidth - halfWidth, height: screenHeight };
        case 'top-left':
            return { x: 0, y: 0, width: halfWidth, height: halfHeight };
        case 'top-right':
            return { x: halfWidth, y: 0, width: screenWidth - halfWidth, height: halfHeight };
        case 'bottom-left':
            return { x: 0, y: halfHeight, width: halfWidth, height: screenHeight - halfHeight };
        case 'bottom-right':
            return { x: halfWidth, y: halfHeight, width: screenWidth - halfWidth, height: screenHeight - halfHeight };
        case 'maximize':
            return { x: 0, y: 0, width: screenWidth, height: screenHeight };
        default:
            return null;
    }
}

export class Window {
    // === STATE (Runes) ===
    id: string;
    appId: string;
    title = $state('');

    // Dimensions & Position
    x = $state(0);
    y = $state(0);
    width = $state(800);
    height = $state(600);
    zIndex = $state(100);

    // State flags
    isMinimized = $state(false);
    isMaximized = $state(false);
    isFocused = $state(false);
    isResizing = $state(false);
    isRinging = $state(false);
    isSnapped = $state(false);
    snapZone = $state<SnapZone>(null);

    // Constraints
    minWidth: number;
    minHeight: number;

    // Internal - stores state before maximize or snap
    private preMaximizeState?: { x: number; y: number; width: number; height: number };
    private preSnapState?: { x: number; y: number; width: number; height: number };

    constructor(initialState: WindowState) {
        this.id = initialState.id;
        this.appId = initialState.appId;
        this.title = initialState.title;
        this.x = initialState.x;
        this.y = initialState.y;
        this.width = initialState.width;
        this.height = initialState.height;
        this.zIndex = initialState.zIndex;
        this.minWidth = initialState.minWidth;
        this.minHeight = initialState.minHeight;

        // Initial flags
        this.isFocused = initialState.isFocused;
    }

    // === ACTIONS ===

    focus() {
        this.isFocused = true;
        this.isMinimized = false;
    }

    blur() {
        this.isFocused = false;
    }

    minimize() {
        this.isMinimized = true;
        this.isFocused = false;
    }

    maximize() {
        if (this.isMaximized) {
            this.restore();
        } else {
            // Save state before maximizing
            this.preMaximizeState = {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            };

            // Apply maximization using window dimensions minus taskbar
            this.x = 0;
            this.y = 0;
            this.width = window.innerWidth;
            this.height = window.innerHeight - 56; // Taskbar height
            this.isMaximized = true;
        }
    }

    restore() {
        if (this.preMaximizeState) {
            this.x = this.preMaximizeState.x;
            this.y = this.preMaximizeState.y;
            this.width = this.preMaximizeState.width;
            this.height = this.preMaximizeState.height;
            this.preMaximizeState = undefined;
        }
        this.isMaximized = false;
    }

    move(x: number, y: number) {
        if (this.isMaximized) return;
        this.x = Math.max(0, x);
        this.y = Math.max(0, y);
    }

    resize(width: number, height: number) {
        if (this.isMaximized) return;
        this.width = Math.max(this.minWidth, width);
        this.height = Math.max(this.minHeight, height);
    }

    setZIndex(z: number) {
        this.zIndex = z;
    }

    /**
     * Snap window to a specific zone
     */
    snap(zone: SnapZone) {
        if (!zone) {
            this.unsnap();
            return;
        }

        const bounds = getSnapZoneBounds(zone);
        if (!bounds) return;

        // Save current state before snapping (if not already snapped/maximized)
        if (!this.isSnapped && !this.isMaximized) {
            this.preSnapState = {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            };
        }

        // Apply snap dimensions
        this.x = bounds.x;
        this.y = bounds.y;
        this.width = bounds.width;
        this.height = bounds.height;
        this.isSnapped = true;
        this.snapZone = zone;
        this.isMaximized = zone === 'maximize';
    }

    /**
     * Unsnap window and restore to previous size
     */
    unsnap() {
        if (this.preSnapState) {
            this.x = this.preSnapState.x;
            this.y = this.preSnapState.y;
            this.width = this.preSnapState.width;
            this.height = this.preSnapState.height;
            this.preSnapState = undefined;
        }
        this.isSnapped = false;
        this.snapZone = null;
        this.isMaximized = false;
    }

    // === SERIALIZATION ===

    toJSON(): WindowState {
        return {
            id: this.id,
            appId: this.appId,
            title: this.title,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            minWidth: this.minWidth,
            minHeight: this.minHeight,
            zIndex: this.zIndex,
            isMinimized: this.isMinimized,
            isMaximized: this.isMaximized,
            isFocused: this.isFocused,
            isResizing: this.isResizing,
            isRinging: this.isRinging,
            isSnapped: this.isSnapped,
            snapZone: this.snapZone,
            preMaximize: this.preMaximizeState,
            preSnap: this.preSnapState
        };
    }
}
