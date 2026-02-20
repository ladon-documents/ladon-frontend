import { Pipe, PipeTransform } from '@angular/core';
import { utility } from '@ladon/utility';

@Pipe({
  name: 'alias',
})
export class AliasPipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (value) {
      return utility.aliasPipeTransform(value as string);
    }
    return value;
  }
}
