import { Component } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { createMask } from '@ectuser/input-mask-test';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title: Date = new Date();

  dateInputMask = createMask<Date>({
    alias: 'datetime',
    inputFormat: 'dd/mm/yyyy',
    parser: (value: string) => {
      const values = value.split('/');
      const year = +values[2];
      const month = +values[1] - 1;
      const date = +values[0];
      return new Date(year, month, date);
    },
  });
  dateInputMaskCustom = createMask<Date>({
    alias: 'datetime',
    inputFormat: 'dd/mm/yyyy',
    parser: (value: string) => {
      const values = value.split('/');
      const year = +values[2];
      const month = +values[1] - 1;
      const date = +values[0];
      return new Date(year, month, date);
    },
  });
  currencyInputMask = createMask({
    alias: 'numeric',
    groupSeparator: ',',
    digits: 2,
    digitsOptional: false,
    prefix: '$ ',
    placeholder: '0',
  });
  licensePlateInputMask = createMask('[9-]AAA-999');

  ipAddressMask = createMask({ alias: 'ip' });
  ipAddress = new UntypedFormControl('');
  dateFC = new UntypedFormControl('', [Validators.required]);
  dateFCCustom = new UntypedFormControl('');
}
