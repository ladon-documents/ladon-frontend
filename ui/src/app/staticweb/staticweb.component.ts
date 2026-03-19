import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DocumentsService } from '@ladon/api';

@Component({
  selector: 'lib-static-web',
  imports: [CommonModule],
  templateUrl: './staticweb.component.html',
  styleUrl: './staticweb.component.css',
})
export class StaticwebComponent implements OnInit, OnDestroy {
  private subscription!: Subscription;
  staticHMTL!: SafeHtml;
  private injectedScripts: HTMLScriptElement[] = [];

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private activatedRoute: ActivatedRoute,
    private elementRef: ElementRef,
    private documentService: DocumentsService,
  ) {}

  ngOnInit() {
    this.subscription = this.activatedRoute.queryParams.subscribe((params) => {
      const page = params['page'];
      const query = decodeURIComponent(location.search);
      if (page) {
        this.loadContent(page);
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.cleanupScripts();
  }

  loadContent(url: string) {
    this.handleQueryParams();
    this.http.get(url, { responseType: 'text' }).subscribe((response) => {
      this.cleanupScripts();

      this.processHtmlWithScripts(response);
    });
  }

  handleQueryParams() {
    const query = decodeURIComponent(location.search);
    const page = query.startsWith('?page=');
    if (page) {
      const url = query.replace('?page=', '');
      let path = url.slice(url.indexOf('/') + 1);
      if (path.includes('&')) {
        path = path.slice(0, path.indexOf('&'));
      }
      const bucket = url.slice(0, url.indexOf('/'));
      this.documentService.getDocument(bucket, path).subscribe((response) => {
        console.log(response);
        this.cleanupScripts();

        // Process the response HTML
        //this.processHtmlWithScripts(response);
      });
    } else {
      this.staticHMTL = this.sanitizer.bypassSecurityTrustHtml('No content found');
    }
  }

  private processHtmlWithScripts(htmlString: string) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const scriptTags = tempDiv.querySelectorAll('script');
    const scripts: { type: 'inline' | 'external'; content: string; attributes: { [key: string]: string } }[] = [];
    scriptTags.forEach((script) => {
      const scriptInfo = {
        type: script.src ? ('external' as const) : ('inline' as const),
        content: script.src || script.innerHTML,
        attributes: {} as { [key: string]: string },
      };

      Array.from(script.attributes).forEach((attr) => {
        scriptInfo.attributes[attr.name] = attr.value;
      });

      scripts.push(scriptInfo);
      script.remove();
    });

    this.staticHMTL = this.sanitizer.bypassSecurityTrustHtml(tempDiv.innerHTML);

    setTimeout(() => {
      this.executeScripts(scripts);
    }, 0);
  }

  private executeScripts(
    scripts: { type: 'inline' | 'external'; content: string; attributes: { [key: string]: string } }[],
  ) {
    scripts.forEach((scriptInfo, index) => {
      if (scriptInfo.type === 'external') {
        this.loadExternalScript(scriptInfo.content, scriptInfo.attributes, index);
      } else {
        this.executeInlineScript(scriptInfo.content, scriptInfo.attributes, index);
      }
    });
  }

  private loadExternalScript(src: string, attributes: { [key: string]: string }, index: number) {
    const script = document.createElement('script');
    script.src = src;

    Object.entries(attributes).forEach(([key, value]) => {
      if (key !== 'src') {
        script.setAttribute(key, value);
      }
    });

    script.onload = () => {
      console.log(`External script ${index} loaded:`, src);
    };

    script.onerror = (error) => {
      console.error(`Failed to load external script ${index}:`, src, error);
    };

    this.injectedScripts.push(script);

    document.head.appendChild(script);
  }

  private executeInlineScript(scriptContent: string, attributes: { [key: string]: string }, index: number) {
    try {
      const script = document.createElement('script');

      Object.entries(attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });

      const wrappedScript = `
        try {
          ${scriptContent}
        } catch (error) {
          console.error('Error in inline script ${index}:', error);
        }
      `;

      script.innerHTML = wrappedScript;

      this.injectedScripts.push(script);

      document.head.appendChild(script);

      console.log(`Inline script ${index} executed`);
    } catch (error) {
      console.error(`Failed to execute inline script ${index}:`, error);
    }
  }

  private cleanupScripts() {
    this.injectedScripts.forEach((script) => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });
    this.injectedScripts = [];
  }

  private handleError(code: number, url: string) {
    let customEventName;
    switch (code) {
      case 401:
        customEventName = 'ladon:error:page:401';
        break;
      case 404:
        customEventName = 'ladon:error:page:404';
        break;
      case 500:
        customEventName = 'ladon:error:page:500';
        break;
    }
    if (customEventName) {
      window.dispatchEvent(new CustomEvent(customEventName, { detail: url }));
    }
  }
}
