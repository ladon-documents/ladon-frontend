import {Pipe, PipeTransform} from "@angular/core";

export const assetUrl = (url: string): string => {
  // @ts-ignore
  const publicPath = location.pathname;
  const updatedPath = publicPath.replace("index.html", "");
  const publicPathSuffix = updatedPath.endsWith('/') ? '' : '/';
  const urlPrefix = url.startsWith('/') ? '' : '/';

  return `${updatedPath}${publicPathSuffix}assets${urlPrefix}${url}`;
}


@Pipe({
  name: "assetUrl",
  standalone: true,
})
export class AssetUrlPipe implements PipeTransform {
  transform(value: string): string {
    return assetUrl(value);

  }
}

