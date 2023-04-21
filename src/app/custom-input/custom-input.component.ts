import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { InputmaskOptions } from '@ectuser/input-mask-test';

@Component({
  selector: 'app-custom-input',
  templateUrl: './custom-input.component.html',
  styleUrls: ['./custom-input.component.scss'],
})
export class CustomInputComponent implements OnInit {
  @Input() formControl!: UntypedFormControl;
  @Input() inputMask!: InputmaskOptions<any>;
  @Input() placeholder: string | undefined;

  constructor() {}

  ngOnInit(): void {}
}
