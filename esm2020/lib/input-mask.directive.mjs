/* eslint-disable @typescript-eslint/member-ordering */
import { isPlatformServer } from '@angular/common';
import { Directive, HostListener, Inject, Input, Optional, PLATFORM_ID, Self, } from '@angular/core';
import { InputMaskConfig, INPUT_MASK_CONFIG } from './config';
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
    async createInputMaskPlugin() {
        const { nativeInputElement, inputMaskOptions } = this;
        if (isPlatformServer(this.platformId) ||
            !nativeInputElement ||
            inputMaskOptions === null ||
            Object.keys(inputMaskOptions).length === 0) {
            return;
        }
        // @ts-ignore
        const { default: _Inputmask } = await import('node_modules/inputmask/lib/bindings/inputmask.es6.js');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtbWFzay5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ25lYXQvaW5wdXQtbWFzay9zcmMvbGliL2lucHV0LW1hc2suZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHVEQUF1RDtBQUN2RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNuRCxPQUFPLEVBQ0wsU0FBUyxFQUVULFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUlMLFFBQVEsRUFDUixXQUFXLEVBRVgsSUFBSSxHQUNMLE1BQU0sZUFBZSxDQUFDO0FBV3ZCLE9BQU8sRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxVQUFVLENBQUM7Ozs7QUFFOUQsb0VBQW9FO0FBQ3BFLDBGQUEwRjtBQUMxRixnR0FBZ0c7QUFDaEcsK0RBQStEO0FBQy9ELCtGQUErRjtBQUMvRixtSUFBbUk7QUFNbkksTUFBTSxPQUFPLGtCQUFrQjtJQThCN0IsWUFDK0IsVUFBa0IsRUFDdkMsVUFBOEMsRUFDOUMsUUFBbUIsRUFDQSxTQUEyQixFQUMzQixNQUF1QixFQUMxQyxNQUFjO1FBTE8sZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUN2QyxlQUFVLEdBQVYsVUFBVSxDQUFvQztRQUM5QyxhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ0EsY0FBUyxHQUFULFNBQVMsQ0FBa0I7UUFFOUMsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQWpCeEIsb0JBQWUsR0FBOEIsSUFBSSxDQUFDO1FBQ2xELHVCQUFrQixHQUE0QixJQUFJLENBQUM7UUFDbkQsMkJBQXNCLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUV2QyxxQkFBZ0IsR0FBK0IsSUFBSSxDQUFDO1FBRTVELHNFQUFzRTtRQUM5RCxhQUFRLEdBQThCLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQztRQUUvQyxxQkFBZ0IsR0FBNEIsSUFBSSxD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ZCxDQUFDLENBQUM7YUFDSjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUNuRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsYUFBYSxDQUMxQyxDQUFDO2FBQ0g7U0FDRjtJQUNILENBQUM7SUFFTyxxQkFBcUI7UUFDM0IsSUFBSSxDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztJQUM5QixDQUFDOzsrR0E1TFUsa0JBQWtCLGtCQStCbkIsV0FBVyxxSEFJWCxpQkFBaUI7bUdBbkNoQixrQkFBa0I7MkZBQWxCLGtCQUFrQjtrQkFKOUIsU0FBUzttQkFBQztvQkFDVCw4REFBOEQ7b0JBQzlELFFBQVEsRUFBRSxhQUFhO2lCQUN4Qjs7MEJBZ0NJLE1BQU07MkJBQUMsV0FBVzs7MEJBR2xCLFFBQVE7OzBCQUFJLElBQUk7OzBCQUNoQixNQUFNOzJCQUFDLGlCQUFpQjtpRUF2QnZCLFNBQVM7c0JBRFosS0FBSztnQkFrQ04sT0FBTztzQkFETixZQUFZO3VCQUFDLE9BQU8sRUFBRSxDQUFDLHFCQUFxQixDQUFDO2dCQUk5QyxTQUFTO3NCQURSLFlBQVk7dUJBQUMsTUFBTSxFQUFFLENBQUMscUJBQXFCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbWVtYmVyLW9yZGVyaW5nICovXG5pbXBvcnQgeyBpc1BsYXRmb3JtU2VydmVyIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSG9zdExpc3RlbmVyLFxuICBJbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPcHRpb25hbCxcbiAgUExBVEZPUk1fSUQsXG4gIFJlbmRlcmVyMixcbiAgU2VsZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBBYnN0cmFjdENvbnRyb2wsXG4gIENvbnRyb2xWYWx1ZUFjY2Vzc29yLFxuICBOZ0NvbnRyb2wsXG4gIFZhbGlkYXRpb25FcnJvcnMsXG4gIFZhbGlkYXRvcixcbn0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHR5cGUgSW5wdXRtYXNrIGZyb20gJ2lucHV0bWFzayc7XG5cbmltcG9ydCB7IElucHV0bWFza09wdGlvbnMgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IElucHV0TWFza0NvbmZpZywgSU5QVVRfTUFTS19DT05GSUcgfSBmcm9tICcuL2NvbmZpZyc7XG5cbi8vIFRoZSBpbml0aWFsIGlzc3VlOiBodHRwczovL2dpdGh1Yi5jb20vbmduZWF0L2lucHV0LW1hc2svaXNzdWVzLzQwXG4vLyBXZWJwYWNrIDUgaGFzIG1vZHVsZSByZXNvbHV0aW9uIGNoYW5nZXMuIExpYnJhcmllcyBzaG91bGQgY29uZmlndXJlIHRoZSBgb3V0cHV0LmV4cG9ydGBcbi8vIChodHRwczovL3dlYnBhY2suanMub3JnL2NvbmZpZ3VyYXRpb24vb3V0cHV0LyNvdXRwdXRsaWJyYXJ5ZXhwb3J0KSBwcm9wZXJ0eSB3aGVuIHB1Ymxpc2hlZCBpblxuLy8gYSBVTUQgZm9ybWF0LCB0byB0ZWxsIFdlYnBhY2sgdGhhdCB0aGVyZSdzIGEgZGVmYXVsdCBleHBvcnQuXG4vLyBUaGUgYF9JbnB1dG1hc2tgIGlzIGFuIG9iamVjdCB3aXRoIDIgcHJvcGVydGllczogYHsgX19lc01vZHVsZTogdHJ1ZSwgZGVmYXVsdDogSW5wdXRtYXNrIH1gLlxuLy8gQnV0IHdlIHdhbnQgdG8gYmUgYmFja3dhcmRzLWNvbXBhdGlibGUsIHNvIHdlIHRyeSB0byByZWFkIHRoZSBgZGVmYXVsdGAgcHJvcGVydHkgZmlyc3Q7IG90aGVyd2lzZSwgd2UgZmFsbCBiYWNrIHRvIGBfSW5wdXRtYXNrYC5cblxuQERpcmVjdGl2ZSh7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAYW5ndWxhci1lc2xpbnQvZGlyZWN0aXZlLXNlbGVjdG9yXG4gIHNlbGVjdG9yOiAnW2lucHV0TWFza10nLFxufSlcbmV4cG9ydCBjbGFzcyBJbnB1dE1hc2tEaXJlY3RpdmU8VCA9IGFueT5cbiAgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSwgQ29udHJvbFZhbHVlQWNjZXNzb3IsIFZhbGlkYXRvclxue1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9pbnB1dE1hc2s6IElucHV0bWFza09wdGlvbnM8YW55PiB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIEhlbHBzIHlvdSB0byBjcmVhdGUgaW5wdXQtbWFzayBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vUm9iaW5IZXJib3RzL0lucHV0bWFza1xuICAgKiBTdXBwb3J0cyBmb3JtLXZhbGlkYXRpb24gb3V0LW9mLXRoZSBib3guXG4gICAqIFZpc2l0IGh0dHBzOi8vZ2l0aHViLmNvbS9uZ25lYXQvaW5wdXQtbWFzayBmb3IgbW9yZSBpbmZvLlxuICAgKi9cbiAgQElucHV0KClcbiAgc2V0IGlucHV0TWFzayhpbnB1dE1hc2s6IElucHV0bWFza09wdGlvbnM8VD4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgaWYgKGlucHV0TWFzaykge1xuICAgICAgdGhpcy5pbnB1dE1hc2tPcHRpb25zID0gaW5wdXRNYXNrO1xuICAgICAgdGhpcy51cGRhdGVJbnB1dE1hc2soKTtcbiAgICB9XG4gIH1cblxuICBpbnB1dE1hc2tQbHVnaW46IElucHV0bWFzay5JbnN0YW5jZSB8IG51bGwgPSBudWxsO1xuICBuYXRpdmVJbnB1dEVsZW1lbnQ6IEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgZGVmYXVsdElucHV0TWFza0NvbmZpZyA9IG5ldyBJbnB1dE1hc2tDb25maWcoKTtcblxuICBwcml2YXRlIGlucHV0TWFza09wdGlvbnM6IElucHV0bWFza09wdGlvbnM8VD4gfCBudWxsID0gbnVsbDtcblxuICAvKiBUaGUgb3JpZ2luYWwgYG9uQ2hhbmdlYCBmdW5jdGlvbiBjb21pbmcgZnJvbSB0aGUgYHNldFVwQ29udHJvbGAuICovXG4gIHByaXZhdGUgb25DaGFuZ2U6ICh2YWx1ZTogVCB8IG51bGwpID0+IHZvaWQgPSAoKSA9PiB7fTtcblxuICBwcml2YXRlIG11dGF0aW9uT2JzZXJ2ZXI6IE11dGF0aW9uT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBASW5qZWN0KFBMQVRGT1JNX0lEKSBwcml2YXRlIHBsYXRmb3JtSWQ6IHN0cmluZyxcbiAgICBwcml2YXRlIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTElucHV0RWxlbWVudCB8IGFueT4sXG4gICAgcHJpdmF0ZSByZW5kZXJlcjogUmVuZGVyZXIyLFxuICAgIEBPcHRpb25hbCgpIEBTZWxmKCkgcHVibGljIG5nQ29udHJvbDogTmdDb250cm9sIHwgbnVsbCxcbiAgICBASW5qZWN0KElOUFVUX01BU0tfQ09ORklHKSBjb25maWc6IElucHV0TWFza0NvbmZpZyxcbiAgICBwcml2YXRlIG5nWm9uZTogTmdab25lXG4gICkge1xuICAgIGlmICh0aGlzLm5nQ29udHJvbCAhPSBudWxsKSB7XG4gICAgICB0aGlzLm5nQ29udHJvbC52YWx1ZUFjY2Vzc29yID0gdGhpcztcbiAgICB9XG4gICAgdGhpcy5zZXROYXRpdmVJbnB1dEVsZW1lbnQoY29uZmlnKTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2lucHV0JywgWyckZXZlbnQudGFyZ2V0LnZhbHVlJ10pXG4gIG9uSW5wdXQgPSAoXzogYW55KSA9PiB7fTtcblxuICBASG9zdExpc3RlbmVyKCdibHVyJywgWyckZXZlbnQudGFyZ2V0LnZhbHVlJ10pXG4gIG9uVG91Y2hlZCA9IChfOiBhbnkpID0+IHt9O1xuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmNvbnRyb2wpIHtcbiAgICAgIHRoaXMuY29udHJvbC5zZXRWYWxpZGF0b3JzKFxuICAgICAgICB0aGlzLmNvbnRyb2wudmFsaWRhdG9yXG4gICAgICAgICAgPyBbdGhpcy5jb250cm9sLnZhbGlkYXRvciwgdGhpcy52YWxpZGF0ZV1cbiAgICAgICAgICA6IFt0aGlzLnZhbGlkYXRlXVxuICAgICAgKTtcblxuICAgICAgdGhpcy5jb250cm9sLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnJlbW92ZUlucHV0TWFza1BsdWdpbigpO1xuICAgIHRoaXMubXV0YXRpb25PYnNlcnZlcj8uZGlzY29ubmVjdCgpO1xuICB9XG5cbiAgd3JpdGVWYWx1ZSh2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZm9ybWF0dGVyID0gdGhpcy5pbnB1dE1hc2tPcHRpb25zPy5mb3JtYXR0ZXI7XG4gICAgaWYgKHRoaXMubmF0aXZlSW5wdXRFbGVtZW50KSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLnNldFByb3BlcnR5KFxuICAgICAgICB0aGlzLm5hdGl2ZUlucHV0RWxlbWVudCxcbiAgICAgICAgJ3ZhbHVlJyxcbiAgICAgICAgZm9ybWF0dGVyICYmIHZhbHVlID8gZm9ybWF0dGVyKHZhbHVlKSA6IHZhbHVlID8/ICcnXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdGVyT25DaGFuZ2Uob25DaGFuZ2U6ICh2YWx1ZTogVCB8IG51bGwpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLm9uQ2hhbmdlID0gb25DaGFuZ2U7XG4gICAgY29uc3QgcGFyc2VyID0gdGhpcy5pbnB1dE1hc2tPcHRpb25zPy5wYXJzZXI7XG4gICAgdGhpcy5vbklucHV0ID0gKHZhbHVlKSA9PiB7XG4gICAgICB0aGlzLm9uQ2hhbmdlKHBhcnNlciAmJiB2YWx1ZSA/IHBhcnNlcih2YWx1ZSkgOiB2YWx1ZSk7XG4gICAgfTtcbiAgfVxuXG4gIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiBWb2lkRnVuY3Rpb24pOiB2b2lkIHtcbiAgICB0aGlzLm9uVG91Y2hlZCA9IGZuO1xuICB9XG5cbiAgdmFsaWRhdGUgPSAoY29udHJvbDogQWJzdHJhY3RDb250cm9sKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwgPT5cbiAgICAhY29udHJvbC52YWx1ZSB8fCAhdGhpcy5pbnB1dE1hc2tQbHVnaW4gfHwgdGhpcy5pbnB1dE1hc2tQbHVnaW4uaXNWYWxpZCgpXG4gICAgICA/IG51bGxcbiAgICAgIDogeyBpbnB1dE1hc2s6IHRydWUgfTtcblxuICBzZXREaXNhYmxlZFN0YXRlKGRpc2FibGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubmF0aXZlSW5wdXRFbGVtZW50KSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLnNldFByb3BlcnR5KHRoaXMubmF0aXZlSW5wdXRFbGVtZW50LCAnZGlzYWJsZWQnLCBkaXNhYmxlZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVJbnB1dE1hc2soKTogdm9pZCB7XG4gICAgdGhpcy5yZW1vdmVJbnB1dE1hc2tQbHVnaW4oKTtcbiAgICB0aGlzLmNyZWF0ZUlucHV0TWFza1BsdWdpbigpO1xuICAgIC8vIFRoaXMgcmUtY3JlYXRlcyB0aGUgYG9uSW5wdXRgIGZ1bmN0aW9uIHNpbmNlIGBpbnB1dE1hc2tPcHRpb25zYCBtaWdodCBiZSBjaGFuZ2VkIGFuZCB0aGUgYHBhcnNlcmBcbiAgICAvLyBwcm9wZXJ0eSBub3cgZGlmZmVycy5cbiAgICB0aGlzLnJlZ2lzdGVyT25DaGFuZ2UodGhpcy5vbkNoYW5nZSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUlucHV0TWFza1BsdWdpbigpIHtcbiAgICBjb25zdCB7IG5hdGl2ZUlucHV0RWxlbWVudCwgaW5wdXRNYXNrT3B0aW9ucyB9ID0gdGhpcztcblxuICAgIGlmIChcbiAgICAgIGlzUGxhdGZvcm1TZXJ2ZXIodGhpcy5wbGF0Zm9ybUlkKSB8fFxuICAgICAgIW5hdGl2ZUlucHV0RWxlbWVudCB8fFxuICAgICAgaW5wdXRNYXNrT3B0aW9ucyA9PT0gbnVsbCB8fFxuICAgICAgT2JqZWN0LmtleXMoaW5wdXRNYXNrT3B0aW9ucykubGVuZ3RoID09PSAwXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IHtkZWZhdWx0OiBfSW5wdXRtYXNrfSA9IGF3YWl0IGltcG9ydCgnbm9kZV9tb2R1bGVzL2lucHV0bWFzay9saWIvYmluZGluZ3MvaW5wdXRtYXNrLmVzNi5qcycpO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuICAgIGNvbnN0IElucHV0bWFza0NvbnN0cnVjdG9yID1cbiAgICAgIChfSW5wdXRtYXNrIGFzIHVua25vd24gYXMgeyBkZWZhdWx0PzogSW5wdXRtYXNrLlN0YXRpYyB9KS5kZWZhdWx0IHx8XG4gICAgICBfSW5wdXRtYXNrO1xuXG4gICAgY29uc3QgeyBwYXJzZXIsIGZvcm1hdHRlciwgLi4ub3B0aW9ucyB9ID0gaW5wdXRNYXNrT3B0aW9ucztcbiAgICB0aGlzLmlucHV0TWFza1BsdWdpbiA9IHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+XG4gICAgICBuZXcgSW5wdXRtYXNrQ29uc3RydWN0b3Iob3B0aW9ucykubWFzayhuYXRpdmVJbnB1dEVsZW1lbnQpXG4gICAgKTtcblxuICAgIGlmICh0aGlzLmNvbnRyb2wpIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICB0aGlzLmNvbnRyb2whLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0IGNvbnRyb2woKTogQWJzdHJhY3RDb250cm9sIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubmdDb250cm9sPy5jb250cm9sO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXROYXRpdmVJbnB1dEVsZW1lbnQoY29uZmlnOiBJbnB1dE1hc2tDb25maWcpIHtcbiAgICBpZiAodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudGFnTmFtZSA9PT0gJ0lOUFVUJykge1xuICAgICAgdGhpcy5uYXRpdmVJbnB1dEVsZW1lbnQgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZWZhdWx0SW5wdXRNYXNrQ29uZmlnID0ge1xuICAgICAgICAuLi50aGlzLmRlZmF1bHRJbnB1dE1hc2tDb25maWcsXG4gICAgICAgIC4uLmNvbmZpZyxcbiAgICAgIH07XG4gICAgICBpZiAodGhpcy5kZWZhdWx0SW5wdXRNYXNrQ29uZmlnLmlzQXN5bmMpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGFuIG9ic2VydmVyIGluc3RhbmNlIGxpbmtlZCB0byB0aGUgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9uc0xpc3QpID0+IHtcbiAgICAgICAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9uc0xpc3QpIHtcbiAgICAgICAgICAgIGlmIChtdXRhdGlvbi50eXBlID09PSAnY2hpbGRMaXN0Jykge1xuICAgICAgICAgICAgICBjb25zdCBuYXRpdmVJbnB1dEVsZW1lbnQgPVxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHRJbnB1dE1hc2tDb25maWcuaW5wdXRTZWxlY3RvclxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmIChuYXRpdmVJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5hdGl2ZUlucHV0RWxlbWVudCA9IG5hdGl2ZUlucHV0RWxlbWVudDtcbiAgICAgICAgICAgICAgICB0aGlzLm11dGF0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUlucHV0TWFza1BsdWdpbigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTdGFydCBvYnNlcnZpbmcgdGhlIHRhcmdldCBub2RlIGZvciBjb25maWd1cmVkIG11dGF0aW9uc1xuICAgICAgICB0aGlzLm11dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwge1xuICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubmF0aXZlSW5wdXRFbGVtZW50ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICB0aGlzLmRlZmF1bHRJbnB1dE1hc2tDb25maWcuaW5wdXRTZWxlY3RvclxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlSW5wdXRNYXNrUGx1Z2luKCk6IHZvaWQge1xuICAgIHRoaXMuaW5wdXRNYXNrUGx1Z2luPy5yZW1vdmUoKTtcbiAgICB0aGlzLmlucHV0TWFza1BsdWdpbiA9IG51bGw7XG4gIH1cbn1cbiJdfQ==