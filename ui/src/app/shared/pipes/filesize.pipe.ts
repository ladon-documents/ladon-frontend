import { Pipe, PipeTransform } from '@angular/core';
import { filesizePipeTransform } from '../../../../../api/utility/filesize.pipe';

@Pipe({
  name: 'filesize',
})
export class FilesizePipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return filesizePipeTransform(value);
  }
}
