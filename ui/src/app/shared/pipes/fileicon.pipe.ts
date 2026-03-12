import { Pipe, PipeTransform } from '@angular/core';
import { fileiconPipeTransform } from '@ladon/utility';

@Pipe({
  name: 'fileicon',
})
export class FileiconPipe implements PipeTransform {
  transform(value: string, ...args: unknown[]): unknown {
    return fileiconPipeTransform(value);
  }
}
