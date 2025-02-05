import { Pipe, PipeTransform } from '@angular/core';
import * as api from '@api';

@Pipe({
  name: 'filesize',
})
export class FilesizePipe implements PipeTransform {
  transform(value: unknown): string | undefined | null | unknown {
    if (api && value) {
      const { filesizePipeTransform } = api.utility;
      return filesizePipeTransform(value);
    }
    return value;
  }
}
