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
    createInputMaskPlugin() {
        const { nativeInputElement, inputMaskOptions } = this;
        if (isPlatformServer(this.platformId) ||
            !nativeInputElement ||
            inputMaskOptions === null ||
            Object.keys(inputMaskOptions).length === 0) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        import('inputmask').then(({ default: MyClass }) => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            // const InputmaskConstructor: any =
            //     (MyClass as unknown as { default?: Inputmask.Static }).default ||
            //     MyClass;
            const { parser, formatter, ...options } = inputMaskOptions;
            this.inputMaskPlugin = this.ngZone.runOutsideAngular(() => new MyClass(options).mask(nativeInputElement));
            if (this.control) {
                setTimeout(() => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.control.updateValueAndValidity();
                });
            }
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtbWFzay5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ25lYXQvaW5wdXQtbWFzay9zcmMvbGliL2lucHV0LW1hc2suZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHVEQUF1RDtBQUN2RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNuRCxPQUFPLEVBQ0wsU0FBUyxFQUVULFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUlMLFFBQVEsRUFDUixXQUFXLEVBRVgsSUFBSSxHQUNMLE1BQU0sZUFBZSxDQUFDO0FBV3ZCLE9BQU8sRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxVQUFVLENBQUM7Ozs7QUFFOUQsb0VBQW9FO0FBQ3BFLDBGQUEwRjtBQUMxRixnR0FBZ0c7QUFDaEcsK0RBQStEO0FBQy9ELCtGQUErRjtBQUMvRixtSUFBbUk7QUFNbkksTUFBTSxPQUFPLGtCQUFrQjtJQThCN0IsWUFDK0IsVUFBa0IsRUFDdkMsVUFBOEMsRUFDOUMsUUFBbUIsRUFDQSxTQUEyQixFQUMzQixNQUF1QixFQUMxQyxNQUFjO1FBTE8sZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUN2QyxlQUFVLEdBQVYsVUFBVSxDQUFvQztRQUM5QyxhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ0EsY0FBUyxHQUFULFNBQVMsQ0FBa0I7UUFFOUMsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQWpCeEIsb0JBQWUsR0FBOEIsSUFBSSxDQUFDO1FBQ2xELHVCQUFrQixHQUE0QixJQUFJLENBQUM7UUFDbkQsMkJBQXNCLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUV2QyxxQkFBZ0IsR0FBK0IsSUFBSSxDQUFDO1FBRTVELHNFQUFzRTtRQUM5RCxhQUFRLEdBQThCLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQztRQUUvQyxxQkFBZ0IsR0FBNEIsSUFBSSxDQUFDO1FBaUJ6RCxZQUFPLEdBQUcsQ0FBQyxDQUFNLEVBQUUsRUFBRSxHQUFFLENBQUMsQ0FBQztRQUd6QixjQUFTLEdBQUcsQ0FBQyxDQUFNLEVBQUUsRUFBRSxHQUFFLENBQUMsQ0FBQztRQTBDM0IsYUFBUSxHQUFHLENBQUMsT0FBd0IsRUFBMkIsRUFBRSxDQUMvRCxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFO1lBQ3ZFLENBQUMsQ0FBQyxJQUFJO1lBQ04sQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDO1FBdkR4QixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFO1lBQzFCLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztTQUNyQztRQUNELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBcENEOzs7O09BSUc7SUFDSCxJQUNJLFNBQVMsQ0FBQyxTQUFpRDtRQUM3RCxJQUFJLFNBQVMsRUFBRTtZQUNiLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7WUFDbEMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1NBQ3hCO0lBQ0gsQ0FBQztJQWlDRCxRQUFRO1FBQ04sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUN4QixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVM7Z0JBQ3BCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ3pDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FDcEIsQ0FBQztZQUVGLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztTQUN2QztJQUNILENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxDQUFDO0lBQ3RDLENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYTtRQUN0QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDO1FBQ25ELElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUN2QixJQUFJLENBQUMsa0JBQWtCLEVBQ3ZCLE9BQU8sRUFDUCxTQUFTLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQ3BELENBQUM7U0FDSDtJQUNILENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxRQUFtQztRQUNsRCxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDO1FBQzdDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekQsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELGlCQUFpQixDQUFDLEVBQWdCO1FBQ2hDLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFPRCxnQkFBZ0IsQ0FBQyxRQUFpQjtRQUNoQyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtZQUMzQixJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQzFFO0lBQ0gsQ0FBQztJQUVPLGVBQWU7UUFDckIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDN0Isb0dBQW9HO1FBQ3BHLHdCQUF3QjtRQUN4QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFTyxxQkFBcUI7UUFDM0IsTUFBTSxFQUFFLGtCQUFrQixFQUFFLGdCQUFnQixFQUFFLEdBQUcsSUFBSSxDQUFDO1FBRXRELElBQ0UsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNqQyxDQUFDLGtCQUFrQjtZQUNuQixnQkFBZ0IsS0FBSyxJQUFJO1lBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUMxQztZQUNBLE9BQU87U0FDUjtRQUVELGdFQUFnRTtRQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFDLEVBQUUsRUFBRTtZQUM5QyxnRUFBZ0U7WUFDaEUsb0NBQW9DO1lBQ3BDLHdFQUF3RTtZQUN4RSxlQUFlO1lBRWYsTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLEVBQUUsR0FBRyxnQkFBZ0IsQ0FBQztZQUMzRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLENBQ3RELElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUNoRCxDQUFDO1lBRUYsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNkLFVBQVUsQ0FBQyxHQUFHLEVBQUU7b0JBQ1osb0VBQW9FO29CQUNwRSxJQUFJLENBQUMsT0FBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQzNDLENBQUMsQ0FBQyxDQUFDO2FBQ047UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNILENBQUM7SUFFRCxJQUFZLE9BQU87UUFDakIsT0FBTyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQztJQUNqQyxDQUFDO0lBRU8scUJBQXFCLENBQUMsTUFBdUI7UUFDbkQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEtBQUssT0FBTyxFQUFFO1lBQ3JELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQztTQUN6RDthQUFNO1lBQ0wsSUFBSSxDQUFDLHNCQUFzQixHQUFHO2dCQUM1QixHQUFHLElBQUksQ0FBQyxzQkFBc0I7Z0JBQzlCLEdBQUcsTUFBTTthQUNWLENBQUM7WUFDRixJQUFJLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLEVBQUU7Z0JBQ3ZDLDhEQUE4RDtnQkFDOUQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUMsQ0FBQyxhQUFhLEVBQUUsRUFBRTtvQkFDN0QsS0FBSyxNQUFNLFFBQVEsSUFBSSxhQUFhLEVBQUU7d0JBQ3BDLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7NEJBQ2pDLE1BQU0sa0JBQWtCLEdBQ3RCLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FDekMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGFBQWEsQ0FDMUMsQ0FBQzs0QkFDSixJQUFJLGtCQUFrQixFQUFFO2dDQUN0QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUM7Z0NBQzdDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsQ0FBQztnQ0FDcEMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7NkJBQzlCO3lCQUNGO3FCQUNGO2dCQUNILENBQUMsQ0FBQyxDQUFDO2dCQUVILDJEQUEyRDtnQkFDM0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRTtvQkFDM0QsU0FBUyxFQUFFLElBQUk7b0JBQ2YsT0FBTyxFQUFFLElBQUk7aUJBQ2QsQ0FBQyxDQUFDO2FBQ0o7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FDbkUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGFBQWEsQ0FDMUMsQ0FBQzthQUNIO1NBQ0Y7SUFDSCxDQUFDO0lBRU8scUJBQXFCO1FBQzNCLElBQUksQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7SUFDOUIsQ0FBQzs7K0dBNUxVLGtCQUFrQixrQkErQm5CLFdBQVcscUhBSVgsaUJBQWlCO21HQW5DaEIsa0JBQWtCOzJGQUFsQixrQkFBa0I7a0JBSjlCLFNBQVM7bUJBQUM7b0JBQ1QsOERBQThEO29CQUM5RCxRQUFRLEVBQUUsYUFBYTtpQkFDeEI7OzBCQWdDSSxNQUFNOzJCQUFDLFdBQVc7OzBCQUdsQixRQUFROzswQkFBSSxJQUFJOzswQkFDaEIsTUFBTTsyQkFBQyxpQkFBaUI7aUVBdkJ2QixTQUFTO3NCQURaLEtBQUs7Z0JBa0NOLE9BQU87c0JBRE4sWUFBWTt1QkFBQyxPQUFPLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQztnQkFJOUMsU0FBUztzQkFEUixZQUFZO3VCQUFDLE1BQU0sRUFBRSxDQUFDLHFCQUFxQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L21lbWJlci1vcmRlcmluZyAqL1xuaW1wb3J0IHsgaXNQbGF0Zm9ybVNlcnZlciB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEhvc3RMaXN0ZW5lcixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3B0aW9uYWwsXG4gIFBMQVRGT1JNX0lELFxuICBSZW5kZXJlcjIsXG4gIFNlbGYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgQWJzdHJhY3RDb250cm9sLFxuICBDb250cm9sVmFsdWVBY2Nlc3NvcixcbiAgTmdDb250cm9sLFxuICBWYWxpZGF0aW9uRXJyb3JzLFxuICBWYWxpZGF0b3IsXG59IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB0eXBlIElucHV0bWFzayBmcm9tICdpbnB1dG1hc2snO1xuXG5pbXBvcnQgeyBJbnB1dG1hc2tPcHRpb25zIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBJbnB1dE1hc2tDb25maWcsIElOUFVUX01BU0tfQ09ORklHIH0gZnJvbSAnLi9jb25maWcnO1xuXG4vLyBUaGUgaW5pdGlhbCBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL25nbmVhdC9pbnB1dC1tYXNrL2lzc3Vlcy80MFxuLy8gV2VicGFjayA1IGhhcyBtb2R1bGUgcmVzb2x1dGlvbiBjaGFuZ2VzLiBMaWJyYXJpZXMgc2hvdWxkIGNvbmZpZ3VyZSB0aGUgYG91dHB1dC5leHBvcnRgXG4vLyAoaHR0cHM6Ly93ZWJwYWNrLmpzLm9yZy9jb25maWd1cmF0aW9uL291dHB1dC8jb3V0cHV0bGlicmFyeWV4cG9ydCkgcHJvcGVydHkgd2hlbiBwdWJsaXNoZWQgaW5cbi8vIGEgVU1EIGZvcm1hdCwgdG8gdGVsbCBXZWJwYWNrIHRoYXQgdGhlcmUncyBhIGRlZmF1bHQgZXhwb3J0LlxuLy8gVGhlIGBfSW5wdXRtYXNrYCBpcyBhbiBvYmplY3Qgd2l0aCAyIHByb3BlcnRpZXM6IGB7IF9fZXNNb2R1bGU6IHRydWUsIGRlZmF1bHQ6IElucHV0bWFzayB9YC5cbi8vIEJ1dCB3ZSB3YW50IHRvIGJlIGJhY2t3YXJkcy1jb21wYXRpYmxlLCBzbyB3ZSB0cnkgdG8gcmVhZCB0aGUgYGRlZmF1bHRgIHByb3BlcnR5IGZpcnN0OyBvdGhlcndpc2UsIHdlIGZhbGwgYmFjayB0byBgX0lucHV0bWFza2AuXG5cbkBEaXJlY3RpdmUoe1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQGFuZ3VsYXItZXNsaW50L2RpcmVjdGl2ZS1zZWxlY3RvclxuICBzZWxlY3RvcjogJ1tpbnB1dE1hc2tdJyxcbn0pXG5leHBvcnQgY2xhc3MgSW5wdXRNYXNrRGlyZWN0aXZlPFQgPSBhbnk+XG4gIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3ksIENvbnRyb2xWYWx1ZUFjY2Vzc29yLCBWYWxpZGF0b3JcbntcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfaW5wdXRNYXNrOiBJbnB1dG1hc2tPcHRpb25zPGFueT4gfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBIZWxwcyB5b3UgdG8gY3JlYXRlIGlucHV0LW1hc2sgYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL1JvYmluSGVyYm90cy9JbnB1dG1hc2tcbiAgICogU3VwcG9ydHMgZm9ybS12YWxpZGF0aW9uIG91dC1vZi10aGUgYm94LlxuICAgKiBWaXNpdCBodHRwczovL2dpdGh1Yi5jb20vbmduZWF0L2lucHV0LW1hc2sgZm9yIG1vcmUgaW5mby5cbiAgICovXG4gIEBJbnB1dCgpXG4gIHNldCBpbnB1dE1hc2soaW5wdXRNYXNrOiBJbnB1dG1hc2tPcHRpb25zPFQ+IHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIGlmIChpbnB1dE1hc2spIHtcbiAgICAgIHRoaXMuaW5wdXRNYXNrT3B0aW9ucyA9IGlucHV0TWFzaztcbiAgICAgIHRoaXMudXBkYXRlSW5wdXRNYXNrKCk7XG4gICAgfVxuICB9XG5cbiAgaW5wdXRNYXNrUGx1Z2luOiBJbnB1dG1hc2suSW5zdGFuY2UgfCBudWxsID0gbnVsbDtcbiAgbmF0aXZlSW5wdXRFbGVtZW50OiBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIGRlZmF1bHRJbnB1dE1hc2tDb25maWcgPSBuZXcgSW5wdXRNYXNrQ29uZmlnKCk7XG5cbiAgcHJpdmF0ZSBpbnB1dE1hc2tPcHRpb25zOiBJbnB1dG1hc2tPcHRpb25zPFQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgLyogVGhlIG9yaWdpbmFsIGBvbkNoYW5nZWAgZnVuY3Rpb24gY29taW5nIGZyb20gdGhlIGBzZXRVcENvbnRyb2xgLiAqL1xuICBwcml2YXRlIG9uQ2hhbmdlOiAodmFsdWU6IFQgfCBudWxsKSA9PiB2b2lkID0gKCkgPT4ge307XG5cbiAgcHJpdmF0ZSBtdXRhdGlvbk9ic2VydmVyOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChQTEFURk9STV9JRCkgcHJpdmF0ZSBwbGF0Zm9ybUlkOiBzdHJpbmcsXG4gICAgcHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxJbnB1dEVsZW1lbnQgfCBhbnk+LFxuICAgIHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICBAT3B0aW9uYWwoKSBAU2VsZigpIHB1YmxpYyBuZ0NvbnRyb2w6IE5nQ29udHJvbCB8IG51bGwsXG4gICAgQEluamVjdChJTlBVVF9NQVNLX0NPTkZJRykgY29uZmlnOiBJbnB1dE1hc2tDb25maWcsXG4gICAgcHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZVxuICApIHtcbiAgICBpZiAodGhpcy5uZ0NvbnRyb2wgIT0gbnVsbCkge1xuICAgICAgdGhpcy5uZ0NvbnRyb2wudmFsdWVBY2Nlc3NvciA9IHRoaXM7XG4gICAgfVxuICAgIHRoaXMuc2V0TmF0aXZlSW5wdXRFbGVtZW50KGNvbmZpZyk7XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdpbnB1dCcsIFsnJGV2ZW50LnRhcmdldC52YWx1ZSddKVxuICBvbklucHV0ID0gKF86IGFueSkgPT4ge307XG5cbiAgQEhvc3RMaXN0ZW5lcignYmx1cicsIFsnJGV2ZW50LnRhcmdldC52YWx1ZSddKVxuICBvblRvdWNoZWQgPSAoXzogYW55KSA9PiB7fTtcblxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jb250cm9sKSB7XG4gICAgICB0aGlzLmNvbnRyb2wuc2V0VmFsaWRhdG9ycyhcbiAgICAgICAgdGhpcy5jb250cm9sLnZhbGlkYXRvclxuICAgICAgICAgID8gW3RoaXMuY29udHJvbC52YWxpZGF0b3IsIHRoaXMudmFsaWRhdGVdXG4gICAgICAgICAgOiBbdGhpcy52YWxpZGF0ZV1cbiAgICAgICk7XG5cbiAgICAgIHRoaXMuY29udHJvbC51cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5yZW1vdmVJbnB1dE1hc2tQbHVnaW4oKTtcbiAgICB0aGlzLm11dGF0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgfVxuXG4gIHdyaXRlVmFsdWUodmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGZvcm1hdHRlciA9IHRoaXMuaW5wdXRNYXNrT3B0aW9ucz8uZm9ybWF0dGVyO1xuICAgIGlmICh0aGlzLm5hdGl2ZUlucHV0RWxlbWVudCkge1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRQcm9wZXJ0eShcbiAgICAgICAgdGhpcy5uYXRpdmVJbnB1dEVsZW1lbnQsXG4gICAgICAgICd2YWx1ZScsXG4gICAgICAgIGZvcm1hdHRlciAmJiB2YWx1ZSA/IGZvcm1hdHRlcih2YWx1ZSkgOiB2YWx1ZSA/PyAnJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICByZWdpc3Rlck9uQ2hhbmdlKG9uQ2hhbmdlOiAodmFsdWU6IFQgfCBudWxsKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5vbkNoYW5nZSA9IG9uQ2hhbmdlO1xuICAgIGNvbnN0IHBhcnNlciA9IHRoaXMuaW5wdXRNYXNrT3B0aW9ucz8ucGFyc2VyO1xuICAgIHRoaXMub25JbnB1dCA9ICh2YWx1ZSkgPT4ge1xuICAgICAgdGhpcy5vbkNoYW5nZShwYXJzZXIgJiYgdmFsdWUgPyBwYXJzZXIodmFsdWUpIDogdmFsdWUpO1xuICAgIH07XG4gIH1cblxuICByZWdpc3Rlck9uVG91Y2hlZChmbjogVm9pZEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5vblRvdWNoZWQgPSBmbjtcbiAgfVxuXG4gIHZhbGlkYXRlID0gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsID0+XG4gICAgIWNvbnRyb2wudmFsdWUgfHwgIXRoaXMuaW5wdXRNYXNrUGx1Z2luIHx8IHRoaXMuaW5wdXRNYXNrUGx1Z2luLmlzVmFsaWQoKVxuICAgICAgPyBudWxsXG4gICAgICA6IHsgaW5wdXRNYXNrOiB0cnVlIH07XG5cbiAgc2V0RGlzYWJsZWRTdGF0ZShkaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLm5hdGl2ZUlucHV0RWxlbWVudCkge1xuICAgICAgdGhpcy5yZW5kZXJlci5zZXRQcm9wZXJ0eSh0aGlzLm5hdGl2ZUlucHV0RWxlbWVudCwgJ2Rpc2FibGVkJywgZGlzYWJsZWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlSW5wdXRNYXNrKCk6IHZvaWQge1xuICAgIHRoaXMucmVtb3ZlSW5wdXRNYXNrUGx1Z2luKCk7XG4gICAgdGhpcy5jcmVhdGVJbnB1dE1hc2tQbHVnaW4oKTtcbiAgICAvLyBUaGlzIHJlLWNyZWF0ZXMgdGhlIGBvbklucHV0YCBmdW5jdGlvbiBzaW5jZSBgaW5wdXRNYXNrT3B0aW9uc2AgbWlnaHQgYmUgY2hhbmdlZCBhbmQgdGhlIGBwYXJzZXJgXG4gICAgLy8gcHJvcGVydHkgbm93IGRpZmZlcnMuXG4gICAgdGhpcy5yZWdpc3Rlck9uQ2hhbmdlKHRoaXMub25DaGFuZ2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVJbnB1dE1hc2tQbHVnaW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBuYXRpdmVJbnB1dEVsZW1lbnQsIGlucHV0TWFza09wdGlvbnMgfSA9IHRoaXM7XG5cbiAgICBpZiAoXG4gICAgICBpc1BsYXRmb3JtU2VydmVyKHRoaXMucGxhdGZvcm1JZCkgfHxcbiAgICAgICFuYXRpdmVJbnB1dEVsZW1lbnQgfHxcbiAgICAgIGlucHV0TWFza09wdGlvbnMgPT09IG51bGwgfHxcbiAgICAgIE9iamVjdC5rZXlzKGlucHV0TWFza09wdGlvbnMpLmxlbmd0aCA9PT0gMFxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbmFtaW5nLWNvbnZlbnRpb25cbiAgICBpbXBvcnQoJ2lucHV0bWFzaycpLnRoZW4oKHtkZWZhdWx0OiBNeUNsYXNzfSkgPT4ge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuICAgICAgLy8gY29uc3QgSW5wdXRtYXNrQ29uc3RydWN0b3I6IGFueSA9XG4gICAgICAvLyAgICAgKE15Q2xhc3MgYXMgdW5rbm93biBhcyB7IGRlZmF1bHQ/OiBJbnB1dG1hc2suU3RhdGljIH0pLmRlZmF1bHQgfHxcbiAgICAgIC8vICAgICBNeUNsYXNzO1xuXG4gICAgICBjb25zdCB7IHBhcnNlciwgZm9ybWF0dGVyLCAuLi5vcHRpb25zIH0gPSBpbnB1dE1hc2tPcHRpb25zO1xuICAgICAgdGhpcy5pbnB1dE1hc2tQbHVnaW4gPSB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PlxuICAgICAgICAgIG5ldyBNeUNsYXNzKG9wdGlvbnMpLm1hc2sobmF0aXZlSW5wdXRFbGVtZW50KVxuICAgICAgKTtcblxuICAgICAgaWYgKHRoaXMuY29udHJvbCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgICB0aGlzLmNvbnRyb2whLnVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgfSk7XG4gIH1cblxuICBwcml2YXRlIGdldCBjb250cm9sKCk6IEFic3RyYWN0Q29udHJvbCB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm5nQ29udHJvbD8uY29udHJvbDtcbiAgfVxuXG4gIHByaXZhdGUgc2V0TmF0aXZlSW5wdXRFbGVtZW50KGNvbmZpZzogSW5wdXRNYXNrQ29uZmlnKSB7XG4gICAgaWYgKHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcpIHtcbiAgICAgIHRoaXMubmF0aXZlSW5wdXRFbGVtZW50ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVmYXVsdElucHV0TWFza0NvbmZpZyA9IHtcbiAgICAgICAgLi4udGhpcy5kZWZhdWx0SW5wdXRNYXNrQ29uZmlnLFxuICAgICAgICAuLi5jb25maWcsXG4gICAgICB9O1xuICAgICAgaWYgKHRoaXMuZGVmYXVsdElucHV0TWFza0NvbmZpZy5pc0FzeW5jKSB7XG4gICAgICAgIC8vIENyZWF0ZSBhbiBvYnNlcnZlciBpbnN0YW5jZSBsaW5rZWQgdG8gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICAgIHRoaXMubXV0YXRpb25PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnNMaXN0KSA9PiB7XG4gICAgICAgICAgZm9yIChjb25zdCBtdXRhdGlvbiBvZiBtdXRhdGlvbnNMaXN0KSB7XG4gICAgICAgICAgICBpZiAobXV0YXRpb24udHlwZSA9PT0gJ2NoaWxkTGlzdCcpIHtcbiAgICAgICAgICAgICAgY29uc3QgbmF0aXZlSW5wdXRFbGVtZW50ID1cbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0SW5wdXRNYXNrQ29uZmlnLmlucHV0U2VsZWN0b3JcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBpZiAobmF0aXZlSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5uYXRpdmVJbnB1dEVsZW1lbnQgPSBuYXRpdmVJbnB1dEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVJbnB1dE1hc2tQbHVnaW4oKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU3RhcnQgb2JzZXJ2aW5nIHRoZSB0YXJnZXQgbm9kZSBmb3IgY29uZmlndXJlZCBtdXRhdGlvbnNcbiAgICAgICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyLm9ic2VydmUodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsIHtcbiAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm5hdGl2ZUlucHV0RWxlbWVudCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgdGhpcy5kZWZhdWx0SW5wdXRNYXNrQ29uZmlnLmlucHV0U2VsZWN0b3JcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbW92ZUlucHV0TWFza1BsdWdpbigpOiB2b2lkIHtcbiAgICB0aGlzLmlucHV0TWFza1BsdWdpbj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5pbnB1dE1hc2tQbHVnaW4gPSBudWxsO1xuICB9XG59XG4iXX0=