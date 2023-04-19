/* eslint-disable @typescript-eslint/member-ordering */
import { isPlatformServer } from '@angular/common';
import { Directive, HostListener, Inject, Input, Optional, PLATFORM_ID, Self, } from '@angular/core';
import { InputMaskConfig, INPUT_MASK_CONFIG } from './config';
import { Subscription, from } from 'rxjs';
import { take } from 'rxjs/operators';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i2 from "./config";
// The initial issue: https://github.com/ngneat/input-mask/issues/40
// Webpack 5 has module resolution changes. Libraries should configure the `output.export`
// (https://webpack.js.org/configuration/output/#outputlibraryexport) property when published in
// a UMD format, to tell Webpack that there's a default export.
// The `_Inputmask` is an object with 2 properties: `{ __esModule: true, default: Inputmask }`.
// But we want to be backwards-compatible, so we try to read the `default` property first; otherwise, we fall back to `_Inputmask`.
export class InputMaskDirective {
    constructor(platformId, elementRef, renderer, ngControl, config, ngZone) {
        this.platformId = platformId;
        this.elementRef = elementRef;
        this.renderer = renderer;
        this.ngControl = ngControl;
        this.ngZone = ngZone;
        this.inputMaskPlugin = null;
        this.nativeInputElement = null;
        this.defaultInputMaskConfig = new InputMaskConfig();
        this.inputMaskOptions = null;
        /* The original `onChange` function coming from the `setUpControl`. */
        this.onChange = () => { };
        this.mutationObserver = null;
        this.subscription = new Subscription();
        this.onInput = (_) => { };
        this.onTouched = (_) => { };
        this.validate = (control) => !control.value || !this.inputMaskPlugin || this.inputMaskPlugin.isValid()
            ? null
            : { inputMask: true };
        if (this.ngControl != null) {
            this.ngControl.valueAccessor = this;
        }
        this.setNativeInputElement(config);
    }
    /**
     * Helps you to create input-mask based on https://github.com/RobinHerbots/Inputmask
     * Supports form-validation out-of-the box.
     * Visit https://github.com/ngneat/input-mask for more info.
     */
    set inputMask(inputMask) {
        if (inputMask) {
            this.inputMaskOptions = inputMask;
            this.updateInputMask();
        }
    }
    ngOnInit() {
        if (this.control) {
            this.control.setValidators(this.control.validator
                ? [this.control.validator, this.validate]
                : [this.validate]);
            this.control.updateValueAndValidity();
        }
    }
    ngOnDestroy() {
        this.removeInputMaskPlugin();
        this.mutationObserver?.disconnect();
        this.subscription.unsubscribe();
    }
    writeValue(value) {
        const formatter = this.inputMaskOptions?.formatter;
        if (this.nativeInputElement) {
            this.renderer.setProperty(this.nativeInputElement, 'value', formatter && value ? formatter(value) : value ?? '');
        }
    }
    registerOnChange(onChange) {
        this.onChange = onChange;
        const parser = this.inputMaskOptions?.parser;
        this.onInput = (value) => {
            this.onChange(parser && value ? parser(value) : value);
        };
    }
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    setDisabledState(disabled) {
        if (this.nativeInputElement) {
            this.renderer.setProperty(this.nativeInputElement, 'disabled', disabled);
        }
    }
    updateInputMask() {
        this.removeInputMaskPlugin();
        this.createInputMaskPlugin();
        // This re-creates the `onInput` function since `inputMaskOptions` might be changed and the `parser`
        // property now differs.
        this.registerOnChange(this.onChange);
    }
    createInputMaskPlugin() {
        const { nativeInputElement, inputMaskOptions } = this;
        if (isPlatformServer(this.platformId) ||
            !nativeInputElement ||
            inputMaskOptions === null ||
            Object.keys(inputMaskOptions).length === 0) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const sub = from(import('inputmask')).pipe(take(1)).subscribe(_Inputmask => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const InputmaskConstructor = _Inputmask.default ||
                _Inputmask;
            const { parser, formatter, ...options } = inputMaskOptions;
            this.inputMaskPlugin = this.ngZone.runOutsideAngular(() => new InputmaskConstructor(options).mask(nativeInputElement));
            if (this.control) {
                setTimeout(() => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.control.updateValueAndValidity();
                });
            }
        });
        this.subscription.add(sub);
    }
    get control() {
        return this.ngControl?.control;
    }
    setNativeInputElement(config) {
        if (this.elementRef.nativeElement.tagName === 'INPUT') {
            this.nativeInputElement = this.elementRef.nativeElement;
        }
        else {
            this.defaultInputMaskConfig = {
                ...this.defaultInputMaskConfig,
                ...config,
            };
            if (this.defaultInputMaskConfig.isAsync) {
                // Create an observer instance linked to the callback function
                this.mutationObserver = new MutationObserver((mutationsList) => {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'childList') {
                            const nativeInputElement = this.elementRef.nativeElement.querySelector(this.defaultInputMaskConfig.inputSelector);
                            if (nativeInputElement) {
                                this.nativeInputElement = nativeInputElement;
                                this.mutationObserver?.disconnect();
                                this.createInputMaskPlugin();
                            }
                        }
                    }
                });
                // Start observing the target node for configured mutations
                this.mutationObserver.observe(this.elementRef.nativeElement, {
                    childList: true,
                    subtree: true,
                });
            }
            else {
                this.nativeInputElement = this.elementRef.nativeElement.querySelector(this.defaultInputMaskConfig.inputSelector);
            }
        }
    }
    removeInputMaskPlugin() {
        this.inputMaskPlugin?.remove();
        this.inputMaskPlugin = null;
    }
}
InputMaskDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.8", ngImport: i0, type: InputMaskDirective, deps: [{ token: PLATFORM_ID }, { token: i0.ElementRef }, { token: i0.Renderer2 }, { token: i1.NgControl, optional: true, self: true }, { token: INPUT_MASK_CONFIG }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Directive });
InputMaskDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.8", type: InputMaskDirective, selector: "[inputMask]", inputs: { inputMask: "inputMask" }, host: { listeners: { "input": "onInput($event.target.value)", "blur": "onTouched($event.target.value)" } }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.8", ngImport: i0, type: InputMaskDirective, decorators: [{
            type: Directive,
            args: [{
                    // eslint-disable-next-line @angular-eslint/directive-selector
                    selector: '[inputMask]',
                }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: i0.ElementRef }, { type: i0.Renderer2 }, { type: i1.NgControl, decorators: [{
                    type: Optional
                }, {
                    type: Self
                }] }, { type: i2.InputMaskConfig, decorators: [{
                    type: Inject,
                    args: [INPUT_MASK_CONFIG]
                }] }, { type: i0.NgZone }]; }, propDecorators: { inputMask: [{
                type: Input
            }], onInput: [{
                type: HostListener,
                args: ['input', ['$event.target.value']]
            }], onTouched: [{
                type: HostListener,
                args: ['blur', ['$event.target.value']]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtbWFzay5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ25lYXQvaW5wdXQtbWFzay9zcmMvbGliL2lucHV0LW1hc2suZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHVEQUF1RDtBQUN2RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNuRCxPQUFPLEVBQ0wsU0FBUyxFQUVULFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUlMLFFBQVEsRUFDUixXQUFXLEVBRVgsSUFBSSxHQUNMLE1BQU0sZUFBZSxDQUFDO0FBV3ZCLE9BQU8sRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFDOUQsT0FBTyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDMUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdCQUFnQixDQUFDOzs7O0FBRXRDLG9FQUFvRTtBQUNwRSwwRkFBMEY7QUFDMUYsZ0dBQWdHO0FBQ2hHLCtEQUErRDtBQUMvRCwrRkFBK0Y7QUFDL0YsbUlBQW1JO0FBTW5JLE1BQU0sT0FBTyxrQkFBa0I7SUErQjdCLFlBQytCLFVBQWtCLEVBQ3ZDLFVBQThDLEVBQzlDLFFBQW1CLEVBQ0EsU0FBMkIsRUFDM0IsTUFBdUIsRUFDMUMsTUFBYztRQUxPLGVBQVUsR0FBVixVQUFVLENBQVE7UUFDdkMsZUFBVSxHQUFWLFVBQVUsQ0FBb0M7UUFDOUMsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQUNBLGNBQVMsR0FBVCxTQUFTLENBQWtCO1FBRTlDLFdBQU0sR0FBTixNQUFNLENBQVE7UUFsQnhCLG9CQUFlLEdBQThCLElBQUksQ0FBQztRQUNsRCx1QkFBa0IsR0FBNEIsSUFBSSxDQUFDO1FBQ25ELDJCQUFzQixHQUFHLElBQUksZUFBZSxFQUFFLENBQUM7UUFFdkMscUJBQWdCLEdB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OlsiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L21lbWJlci1vcmRlcmluZyAqL1xuaW1wb3J0IHsgaXNQbGF0Zm9ybVNlcnZlciB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEhvc3RMaXN0ZW5lcixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIFBMQVRGT1JNX0lELFxuICBSZW5kZXJlcjIsXG4gIFNlbGYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgQWJzdHJhY3RDb250cm9sLFxuICBDb250cm9sVmFsdWVBY2Nlc3NvcixcbiAgTmdDb250cm9sLFxuICBWYWxpZGF0aW9uRXJyb3JzLFxuICBWYWxpZGF0b3IsXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB0eXBlIElucHV0bWFzayBmcm9tICdpbnB1dG1hc2snO1xuXG5pbXBvcnQgeyBJbnB1dG1hc2tPcHRpb25zIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBJbnB1dE1hc2tDb25maWcsIElOUFVUX01BU0tfQ09ORklHIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uLCBmcm9tIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyB0YWtlIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vLyBUaGUgaW5pdGlhbCBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL25nbmVhdC9pbnB1dC1tYXNrL2lzc3Vlcy80MFxuLy8gV2VicGFjayA1IGhhcyBtb2R1bGUgcmVzb2x1dGlvbiBjaGFuZ2VzLiBMaWJyYXJpZXMgc2hvdWxkIGNvbmZpZ3VyZSB0aGUgYG91dHB1dC5leHBvcnRgXG4vLyAoaHR0cHM6Ly93ZWJwYWNrLmpzLm9yZy9jb25maWd1cmF0aW9uL291dHB1dC8jb3V0cHV0bGlicmFyeWV4cG9ydCkgcHJvcGVydHkgd2hlbiBwdWJsaXNoZWQgaW5cbi8vIGEgVU1EIGZvcm1hdCwgdG8gdGVsbCBXZWJwYWNrIHRoYXQgdGhlcmUncyBhIGRlZmF1bHQgZXhwb3J0LlxuLy8gVGhlIGBfSW5wdXRtYXNrYCBpcyBhbiBvYmplY3Qgd2l0aCAyIHByb3BlcnRpZXM6IGB7IF9fZXNNb2R1bGU6IHRydWUsIGRlZmF1bHQ6IElucHV0bWFzayB9YC5cbi8vIEJ1dCB3ZSB3YW50IHRvIGJlIGJhY2t3YXJkcy1jb21wYXRpYmxlLCBzbyB3ZSB0cnkgdG8gcmVhZCB0aGUgYGRlZmF1bHRgIHByb3BlcnR5IGZpcnN0OyBvdGhlcndpc2UsIHdlIGZhbGwgYmFjayB0byBgX0lucHV0bWFza2AuXG5cbkBEaXJlY3RpdmUoe1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQGFuZ3VsYXItZXNsaW50L2RpcmVjdGl2ZS1zZWxlY3RvclxuICBzZWxlY3RvcjogJ1tpbnB1dE1hc2tdJyxcbn0pXG5leHBvcnQgY2xhc3MgSW5wdXRNYXNrRGlyZWN0aXZlPFQgPSBhbnk+XG4gIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3ksIENvbnRyb2xWYWx1ZUFjY2Vzc29yLCBWYWxpZGF0b3JcbntcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfaW5wdXRNYXNrOiBJbnB1dG1hc2tPcHRpb25zPGFueT4gfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBIZWxwcyB5b3UgdG8gY3JlYXRlIGlucHV0LW1hc2sgYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL1JvYmluSGVyYm90cy9JbnB1dG1hc2tcbiAgICogU3VwcG9ydHMgZm9ybS12YWxpZGF0aW9uIG91dC1vZi10aGUgYm94LlxuICAgKiBWaXNpdCBodHRwczovL2dpdGh1Yi5jb20vbmduZWF0L2lucHV0LW1hc2sgZm9yIG1vcmUgaW5mby5cbiAgICovXG4gIEBJbnB1dCgpXG4gIHNldCBpbnB1dE1hc2soaW5wdXRNYXNrOiBJbnB1dG1hc2tPcHRpb25zPFQ+IHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIGlmIChpbnB1dE1hc2spIHtcbiAgICAgIHRoaXMuaW5wdXRNYXNrT3B0aW9ucyA9IGlucHV0TWFzaztcbiAgICAgIHRoaXMudXBkYXRlSW5wdXRNYXNrKCk7XG4gICAgfVxuICB9XG5cbiAgaW5wdXRNYXNrUGx1Z2luOiBJbnB1dG1hc2suSW5zdGFuY2UgfCBudWxsID0gbnVsbDtcbiAgbmF0aXZlSW5wdXRFbGVtZW50OiBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIGRlZmF1bHRJbnB1dE1hc2tDb25maWcgPSBuZXcgSW5wdXRNYXNrQ29uZmlnKCk7XG5cbiAgcHJpdmF0ZSBpbnB1dE1hc2tPcHRpb25zOiBJbnB1dG1hc2tPcHRpb25zPFQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgLyogVGhlIG9yaWdpbmFsIGBvbkNoYW5nZWAgZnVuY3Rpb24gY29taW5nIGZyb20gdGhlIGBzZXRVcENvbnRyb2xgLiAqL1xuICBwcml2YXRlIG9uQ2hhbmdlOiAodmFsdWU6IFQgfCBudWxsKSA9PiB2b2lkID0gKCkgPT4ge307XG5cbiAgcHJpdmF0ZSBtdXRhdGlvbk9ic2VydmVyOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc3Vic2NyaXB0aW9uID0gbmV3IFN1YnNjcmlwdGlvbigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHByaXZhdGUgcGxhdGZvcm1JZDogc3RyaW5nLFxuICAgIHByaXZhdGUgZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MSW5wdXRFbGVtZW50IHwgYW55PixcbiAgICBwcml2YXRlIHJlbmRlcmVyOiBSZW5kZXJlcjIsXG4gICAgQE9wdGlvbmFsKCkgQFNlbGYoKSBwdWJsaWMgbmdDb250cm9sOiBOZ0NvbnRyb2wgfCBudWxsLFxuICAgIEBJbmplY3QoSU5QVVRfTUFTS19DT05GSUcpIGNvbmZpZzogSW5wdXRNYXNrQ29uZmlnLFxuICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmVcbiAgKSB7XG4gICAgaWYgKHRoaXMubmdDb250cm9sICE9IG51bGwpIHtcbiAgICAgIHRoaXMubmdDb250cm9sLnZhbHVlQWNjZXNzb3IgPSB0aGlzO1xuICAgIH1cbiAgICB0aGlzLnNldE5hdGl2ZUlucHV0RWxlbWVudChjb25maWcpO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignaW5wdXQnLCBbJyRldmVudC50YXJnZXQudmFsdWUnXSlcbiAgb25JbnB1dCA9IChfOiBhbnkpID0+IHt9O1xuXG4gIEBIb3N0TGlzdGVuZXIoJ2JsdXInLCBbJyRldmVudC50YXJnZXQudmFsdWUnXSlcbiAgb25Ub3VjaGVkID0gKF86IGFueSkgPT4ge307XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY29udHJvbCkge1xuICAgICAgdGhpcy5jb250cm9sLnNldFZhbGlkYXRvcnMoXG4gICAgICAgIHRoaXMuY29udHJvbC52YWxpZGF0b3JcbiAgICAgICAgICA/IFt0aGlzLmNvbnRyb2wudmFsaWRhdG9yLCB0aGlzLnZhbGlkYXRlXVxuICAgICAgICAgIDogW3RoaXMudmFsaWRhdGVdXG4gICAgICApO1xuXG4gICAgICB0aGlzLmNvbnRyb2wudXBkYXRlVmFsdWVBbmRWYWxpZGl0eSgpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMucmVtb3ZlSW5wdXRNYXNrUGx1Z2luKCk7XG4gICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gICAgdGhpcy5zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIHdyaXRlVmFsdWUodmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGZvcm1hdHRlciA9IHRoaXMuaW5wdXRNYXNrT3B0aW9ucz8uZm9ybWF0dGVyO1xuICAgIGlmICh0aGlzLm5hdGl2ZUlucHV0RWxlbWVudCkge1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRQcm9wZXJ0eShcbiAgICAgICAgdGhpcy5uYXRpdmVJbnB1dEVsZW1lbnQsXG4gICAgICAgICd2YWx1ZScsXG4gICAgICAgIGZvcm1hdHRlciAmJiB2YWx1ZSA/IGZvcm1hdHRlcih2YWx1ZSkgOiB2YWx1ZSA/PyAnJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICByZWdpc3Rlck9uQ2hhbmdlKG9uQ2hhbmdlOiAodmFsdWU6IFQgfCBudWxsKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5vbkNoYW5nZSA9IG9uQ2hhbmdlO1xuICAgIGNvbnN0IHBhcnNlciA9IHRoaXMuaW5wdXRNYXNrT3B0aW9ucz8ucGFyc2VyO1xuICAgIHRoaXMub25JbnB1dCA9ICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy5vbkNoYW5nZShwYXJzZXIgJiYgdmFsdWUgPyBwYXJzZXIodmFsdWUpIDogdmFsdWUpO1xuICAgIH07XG4gIH1cblxuICByZWdpc3Rlck9uVG91Y2hlZChmbjogVm9pZEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5vblRvdWNoZWQgPSBmbjtcbiAgfVxuXG4gIHZhbGlkYXRlID0gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+XG4gICAgIWNvbnRyb2wudmFsdWUgfHwgIXRoaXMuaW5wdXRNYXNrUGx1Z2luIHx8IHRoaXMuaW5wdXRNYXNrUGx1Z2luLmlzVmFsaWQoKVxuICAgICAgPyBudWxsXG4gICAgICA6IHsgaW5wdXRNYXNrOiB0cnVlIH07XG5cbiAgc2V0RGlzYWJsZWRTdGF0ZShkaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLm5hdGl2ZUlucHV0RWxlbWVudCkge1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRQcm9wZXJ0eSh0aGlzLm5hdGl2ZUlucHV0RWxlbWVudCwgJ2Rpc2FibGVkJywgZGlzYWJsZWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlSW5wdXRNYXNrKCk6IHZvaWQge1xuICAgIHRoaXMucmVtb3ZlSW5wdXRNYXNrUGx1Z2luKCk7XG4gICAgdGhpcy5jcmVhdGVJbnB1dE1hc2tQbHVnaW4oKTtcbiAgICAvLyBUaGlzIHJlLWNyZWF0ZXMgdGhlIGBvbklucHV0YCBmdW5jdGlvbiBzaW5jZSBgaW5wdXRNYXNrT3B0aW9uc2AgbWlnaHQgYmUgY2hhbmdlZCBhbmQgdGhlIGBwYXJzZXJgXG4gICAgLy8gcHJvcGVydHkgbm93IGRpZmZlcnMuXG4gICAgdGhpcy5yZWdpc3Rlck9uQ2hhbmdlKHRoaXMub25DaGFuZ2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVJbnB1dE1hc2tQbHVnaW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBuYXRpdmVJbnB1dEVsZW1lbnQsIGlucHV0TWFza09wdGlvbnMgfSA9IHRoaXM7XG5cbiAgICBpZiAoXG4gICAgICBpc1BsYXRmb3JtU2VydmVyKHRoaXMucGxhdGZvcm1JZCkgfHxcbiAgICAgICFuYXRpdmVJbnB1dEVsZW1lbnQgfHxcbiAgICAgIGlucHV0TWFza09wdGlvbnMgPT09IG51bGwgfHxcbiAgICAgIE9iamVjdC5rZXlzKGlucHV0TWFza09wdGlvbnMpLmxlbmd0aCA9PT0gMFxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbmFtaW5nLWNvbnZlbnRpb25cbiAgICBjb25zdCBzdWIgPSBmcm9tKGltcG9ydCgnaW5wdXRtYXNrJykpLnBpcGUodGFrZSgxKSkuc3Vic2NyaWJlKF9JbnB1dG1hc2sgPT4ge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuICAgICAgY29uc3QgSW5wdXRtYXNrQ29uc3RydWN0b3I6IGFueSA9XG4gICAgICAgIChfSW5wdXRtYXNrIGFzIHVua25vd24gYXMgeyBkZWZhdWx0PzogSW5wdXRtYXNrLlN0YXRpYyB9KS5kZWZhdWx0IHx8XG4gICAgICAgIF9JbnB1dG1hc2s7XG5cbiAgICAgIGNvbnN0IHsgcGFyc2VyLCBmb3JtYXR0ZXIsIC4uLm9wdGlvbnMgfSA9IGlucHV0TWFza09wdGlvbnM7XG4gICAgICB0aGlzLmlucHV0TWFza1BsdWdpbiA9IHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+XG4gICAgICAgIG5ldyBJbnB1dG1hc2tDb25zdHJ1Y3RvcihvcHRpb25zKS5tYXNrKG5hdGl2ZUlucHV0RWxlbWVudClcbiAgICAgICk7XG5cbiAgICAgIGlmICh0aGlzLmNvbnRyb2wpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICB0aGlzLmNvbnRyb2whLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbi5hZGQoc3ViKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IGNvbnRyb2woKTogQWJzdHJhY3RDb250cm9sIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubmdDb250cm9sPy5jb250cm9sO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXROYXRpdmVJbnB1dEVsZW1lbnQoY29uZmlnOiBJbnB1dE1hc2tDb25maWcpIHtcbiAgICBpZiAodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudGFnTmFtZSA9PT0gJ0lOUFVUJykge1xuICAgICAgdGhpcy5uYXRpdmVJbnB1dEVsZW1lbnQgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZWZhdWx0SW5wdXRNYXNrQ29uZmlnID0ge1xuICAgICAgICAuLi50aGlzLmRlZmF1bHRJbnB1dE1hc2tDb25maWcsXG4gICAgICAgIC4uLmNvbmZpZyxcbiAgICAgIH07XG4gICAgICBpZiAodGhpcy5kZWZhdWx0SW5wdXRNYXNrQ29uZmlnLmlzQXN5bmMpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGFuIG9ic2VydmVyIGluc3RhbmNlIGxpbmtlZCB0byB0aGUgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9uc0xpc3QpID0+IHtcbiAgICAgICAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9uc0xpc3QpIHtcbiAgICAgICAgICAgIGlmIChtdXRhdGlvbi50eXBlID09PSAnY2hpbGRMaXN0Jykge1xuICAgICAgICAgICAgICBjb25zdCBuYXRpdmVJbnB1dEVsZW1lbnQgPVxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHRJbnB1dE1hc2tDb25maWcuaW5wdXRTZWxlY3RvclxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChuYXRpdmVJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5hdGl2ZUlucHV0RWxlbWVudCA9IG5hdGl2ZUlucHV0RWxlbWVudDtcbiAgICAgICAgICAgICAgICB0aGlzLm11dGF0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUlucHV0TWFza1BsdWdpbigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTdGFydCBvYnNlcnZpbmcgdGhlIHRhcmdldCBub2RlIGZvciBjb25maWd1cmVkIG11dGF0aW9uc1xuICAgICAgICB0aGlzLm11dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwge1xuICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubmF0aXZlSW5wdXRFbGVtZW50ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICB0aGlzLmRlZmF1bHRJbnB1dE1hc2tDb25maWcuaW5wdXRTZWxlY3RvclxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlSW5wdXRNYXNrUGx1Z2luKCk6IHZvaWQge1xuICAgIHRoaXMuaW5wdXRNYXNrUGx1Z2luPy5yZW1vdmUoKTtcbiAgICB0aGlzLmlucHV0TWFza1BsdWdpbiA9IG51bGw7XG4gIH1cbn1cblxuIl19