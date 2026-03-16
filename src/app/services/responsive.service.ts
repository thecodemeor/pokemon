import { Injectable, signal } from '@angular/core';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

@Injectable({ providedIn: 'root' })
export class ResponsiveService {
    private readonly MOBILE_MAX = 768;
    private readonly TABLET_MAX = 1024;

    private readonly _width = signal<number>(0);
    private readonly _breakpoint = signal<Breakpoint>('desktop');

    constructor() {
        if (typeof window === 'undefined') {
            this._width.set(0);
            this._breakpoint.set('desktop');
            return;
        }
        this.update();
        window.addEventListener('resize', this.onResize, { passive: true });
    }

    width(): number { return this._width();}
    breakpoint(): Breakpoint { return this._breakpoint();}
    mobile(): boolean { return this._breakpoint() === 'mobile';}
    tablet(): boolean { return this._breakpoint() === 'tablet';}
    desktop(): boolean { return this._breakpoint() === 'desktop';}

    when<T>(handlers: {
        mobile: () => T;
        tablet: () => T;
        desktop: () => T;
    }): T {
        const bp = this._breakpoint();
        return handlers[bp]();
    }

    // --- Internal ---
    private readonly onResize = () => this.update();

    private update(): void {
        const w = window.innerWidth;
        this._width.set(w);

        const bp: Breakpoint =
        w <= this.MOBILE_MAX ? 'mobile' : w <= this.TABLET_MAX ? 'tablet' : 'desktop';

        this._breakpoint.set(bp);
    }
}