import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, firstValueFrom, Subscription } from 'rxjs';

import { StaticDefinitionResolver } from './static-definition.resolver';
import { StaticHtmlPolicyService } from './static-html-policy.service';
import { StaticRuntimeFacadeService } from './static-runtime-facade.service';
import { StaticScriptRunnerService } from './static-script-runner.service';
import { StaticDefinition } from './staticweb.types';

@Component({
  selector: 'lib-static-web',
  imports: [CommonModule],
  templateUrl: './staticweb.component.html',
  styleUrl: './staticweb.component.css',
})
export class StaticwebComponent implements OnInit, OnDestroy {
  staticHTML?: SafeHtml;
  loading = false;
  error?: string;

  private subscription?: Subscription;
  private loadId = 0;

  constructor(
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
    private readonly activatedRoute: ActivatedRoute,
    private readonly definitionResolver: StaticDefinitionResolver,
    private readonly htmlPolicy: StaticHtmlPolicyService,
    private readonly runtimeFacade: StaticRuntimeFacadeService,
    private readonly scriptRunner: StaticScriptRunnerService,
  ) {}

  ngOnInit(): void {
    this.subscription = combineLatest([this.activatedRoute.queryParams, this.activatedRoute.paramMap]).subscribe(
      ([queryParams, paramMap]) => {
        void this.resolveAndRender(paramMap.get('htmlId'), queryParams['page'] ?? null);
      },
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.clearRuntime();
  }

  private async resolveAndRender(htmlId: string | null, page: string | null): Promise<void> {
    const currentLoadId = ++this.loadId;
    this.loading = true;
    this.error = undefined;
    this.staticHTML = undefined;
    this.clearRuntime();

    const result = this.definitionResolver.resolve({ htmlId, page });
    if (!result.definition) {
      this.setError(result.error ?? 'Static page is not available');
      return;
    }

    try {
      await this.loadDefinition(result.definition, currentLoadId);
    } catch (error) {
      if (currentLoadId !== this.loadId) return;
      this.clearRuntime();
      this.staticHTML = undefined;
      this.dispatchHttpError(error, result.definition.source);
      this.setError(error instanceof Error ? error.message : 'Static page could not be loaded');
    }
  }

  private async loadDefinition(definition: StaticDefinition, loadId: number): Promise<void> {
    const html = await firstValueFrom(this.http.get(definition.source, { responseType: 'text' }));
    if (loadId !== this.loadId) return;

    const plan = this.htmlPolicy.createRenderPlan(html, definition);
    if (definition.mode === 'display-only') {
      this.clearRuntime();
      this.staticHTML = this.sanitizer.bypassSecurityTrustHtml(plan.html);
      this.loading = false;
      return;
    }

    this.runtimeFacade.install();
    this.staticHTML = this.sanitizer.bypassSecurityTrustHtml(plan.html);
    await this.scriptRunner.run(plan.scripts);
    if (loadId !== this.loadId) return;
    this.loading = false;
  }

  private clearRuntime(): void {
    this.scriptRunner.cleanup();
    this.runtimeFacade.clear();
  }

  private setError(message: string): void {
    this.loading = false;
    this.error = message;
  }

  private dispatchHttpError(error: unknown, url: string): void {
    if (typeof error !== 'object' || error === null || !('status' in error)) {
      return;
    }

    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') {
      this.handleError(status, url);
    }
  }

  private handleError(code: number, url: string): void {
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
