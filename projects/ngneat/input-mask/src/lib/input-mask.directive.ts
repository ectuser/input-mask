/* eslint-disable @typescript-eslint/member-ordering */
import { isPlatformServer } from '@angular/common';
import {
  Directive,
  ElementRef,
  HostListener,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  PLATFORM_ID,
  Renderer2,
  Self,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NgControl,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import type Inputmask from 'inputmask';

import { InputmaskOptions } from './types';
import { InputMaskConfig, INPUT_MASK_CONFIG } from './config';

// The initial issue: https://github.com/ngneat/input-mask/issues/40
// Webpack 5 has module resolution changes. Libraries should configure the `output.export`
// (https://webpack.js.org/configuration/output/#outputlibraryexport) property when published in
// a UMD format, to tell Webpack that there's a default export.
// The `_Inputmask` is an object with 2 properties: `{ __esModule: true, default: Inputmask }`.
// But we want to be backwards-compatible, so we try to read the `default` property first; otherwise, we fall back to `_Inputmask`.

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[inputMask]',
})
export class InputMaskDirective<T = any>
  implements OnInit, OnDestroy, ControlValueAccessor, Validator
{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static ngAcceptInputType_inputMask: InputmaskOptions<any> | null | undefined;

  /**
   * Helps you to create input-mask based on https://github.com/RobinHerbots/Inputmask
   * Supports form-validation out-of-the box.
   * Visit https://github.com/ngneat/input-mask for more info.
   */
  @Input()
  set inputMask(inputMask: InputmaskOptions<T> | null | undefined) {
    if (inputMask) {
      this.inputMaskOptions = inputMask;
      this.updateInputMask();
    }
  }

  inputMaskPlugin: Inputmask.Instance | null = null;
  nativeInputElement: HTMLInputElement | null = null;
  defaultInputMaskConfig = new InputMaskConfig();

  private inputMaskOptions: InputmaskOptions<T> | null = null;

  /* The original `onChange` function coming from the `setUpControl`. */
  private onChange: (value: T | null) => void = () => {};

  private mutationObserver: MutationObserver | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    private elementRef: ElementRef<HTMLInputElement | any>,
    private renderer: Renderer2,
    @Optional() @Self() public ngControl: NgControl | null,
    @Inject(INPUT_MASK_CONFIG) config: InputMaskConfig,
    private ngZone: NgZone
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
    this.setNativeInputElement(config);
  }

  @HostListener('input', ['$event.target.value'])
  onInput = (_: any) => {};

  @HostListener('blur', ['$event.target.value'])
  onTouched = (_: any) => {};

  ngOnInit(): void {
    if (this.control) {
      this.control.setValidators(
        this.control.validator
          ? [this.control.validator, this.validate]
          : [this.validate]
      );

      this.control.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.removeInputMaskPlugin();
    this.mutationObserver?.disconnect();
  }

  writeValue(value: string): void {
    const formatter = this.inputMaskOptions?.formatter;
    if (this.nativeInputElement) {
      this.renderer.setProperty(
        this.nativeInputElement,
        'value',
        formatter && value ? formatter(value) : value ?? ''
      );
    }
  }

  registerOnChange(onChange: (value: T | null) => void): void {
    this.onChange = onChange;
    const parser = this.inputMaskOptions?.parser;
    this.onInput = (value) => {
      this.onChange(parser && value ? parser(value) : value);
    };
  }

  registerOnTouched(fn: VoidFunction): void {
    this.onTouched = fn;
  }

  validate = (control: AbstractControl): ValidationErrors | null =>
    !control.value || !this.inputMaskPlugin || this.inputMaskPlugin.isValid()
      ? null
      : { inputMask: true };

  setDisabledState(disabled: boolean): void {
    if (this.nativeInputElement) {
      this.renderer.setProperty(this.nativeInputElement, 'disabled', disabled);
    }
  }

  private updateInputMask(): void {
    this.removeInputMaskPlugin();
    this.createInputMaskPlugin();
    // This re-creates the `onInput` function since `inputMaskOptions` might be changed and the `parser`
    // property now differs.
    this.registerOnChange(this.onChange);
  }

  private async createInputMaskPlugin() {
    const { nativeInputElement, inputMaskOptions } = this;

    if (
      isPlatformServer(this.platformId) ||
      !nativeInputElement ||
      inputMaskOptions === null ||
      Object.keys(inputMaskOptions).length === 0
    ) {
      return;
    }

    /* eslint-disable @typescript-eslint/naming-convention */
    const { default: _Inputmask } = await import(
      // @ts-ignore
      'inputmask/dist/inputmask.es6'
    );

    const InputmaskConstructor =
      (_Inputmask as unknown as { default?: Inputmask.Static }).default ||
      _Inputmask;
    /* eslint-enable @typescript-eslint/naming-convention */

    const { parser, formatter, ...options } = inputMaskOptions;
    this.inputMaskPlugin = this.ngZone.runOutsideAngular(() =>
      new InputmaskConstructor(options).mask(nativeInputElement)
    );

    if (this.control) {
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.control!.updateValueAndValidity();
      });
    }
  }

  private get control(): AbstractControl | null | undefined {
    return this.ngControl?.control;
  }

  private setNativeInputElement(config: InputMaskConfig) {
    if (this.elementRef.nativeElement.tagName === 'INPUT') {
      this.nativeInputElement = this.elementRef.nativeElement;
    } else {
      this.defaultInputMaskConfig = {
        ...this.defaultInputMaskConfig,
        ...config,
      };
      if (this.defaultInputMaskConfig.isAsync) {
        // Create an observer instance linked to the callback function
        this.mutationObserver = new MutationObserver((mutationsList) => {
          for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
              const nativeInputElement =
                this.elementRef.nativeElement.querySelector(
                  this.defaultInputMaskConfig.inputSelector
                );
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
      } else {
        this.nativeInputElement = this.elementRef.nativeElement.querySelector(
          this.defaultInputMaskConfig.inputSelector
        );
      }
    }
  }

  private removeInputMaskPlugin(): void {
    this.inputMaskPlugin?.remove();
    this.inputMaskPlugin = null;
  }
}
