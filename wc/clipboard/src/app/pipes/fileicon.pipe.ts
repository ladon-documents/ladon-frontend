import { Pipe, PipeTransform } from '@angular/core';
import * as api from '@api';

@Pipe({
  name: 'fileicon',
})
export class FileiconPipe implements PipeTransform {
  transform(value: string | undefined): string | undefined {
    if (api && value) {
      const { fileiconPipeTransform } = api.utility;
      return fileiconPipeTransform(value);
    }
    return value;
  }
}
