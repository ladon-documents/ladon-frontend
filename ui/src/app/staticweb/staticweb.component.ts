import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { STATIC_ID_PATTERN } from './draco-static-config.service';
import { DracoStaticRegistryService } from './draco-static-registry.service';
import { DracoStaticEntry } from './draco-static.types';
import { StaticAssetRewriterService } from './static-asset-rewriter.service';
import { StaticDefinitionResolver } from './static-definition.resolver';
import { StaticHtmlPolicyService } from './static-html-policy.service';
import { StaticRuntimeFacadeService } from './static-runtime-facade.service';
import { StaticScriptRunnerService } from './static-script-runner.service';

@Component({
  selector: 'lib-static-web',
  imports: [CommonModule],
  templateUrl: './staticweb.component.html',
  styleUrl: './staticweb.component.css',
})
export class StaticwebComponent implements OnInit, OnDestroy {
  private static readonly DRACO_STATIC_BUCKET = 'draco-statics';

  staticHTML?: SafeHtml;
  loading = false;
  error?: string;

  private subscription?: Subscription;
  private loadId = 0;

  constructor(
    private readonly apiFactory: FetchApiFactory,
    private readonly sanitizer: DomSanitizer,
    private readonly activatedRoute: ActivatedRoute,
    private readonly registry: DracoStaticRegistryService,
    private readonly definitionResolver: StaticDefinitionResolver,
    private readonly assetRewriter: StaticAssetRewriterService,
    private readonly htmlPolicy: StaticHtmlPolicyService,
    private readonly runtimeFacade: StaticRuntimeFacadeService,
    private readonly scriptRunner: StaticScriptRunnerService,
  ) {}

  ngOnInit(): void {
    this.subscription = this.activatedRoute.paramMap.subscribe((paramMap) => {
      void this.resolveAndRender(paramMap.get('staticId'));
    });
  }

  ngOnDestroy(): void {
    this.loadId += 1;
    this.subscription?.unsubscribe();
    this.clearRuntime();
  }

  private async resolveAndRender(staticId: string | null): Promise<void> {
    const currentLoadId = ++this.loadId;
    let errorContext = staticId ?? 'static';
    this.loading = true;
    this.error = undefined;
    this.staticHTML = undefined;
    this.clearRuntime();

    if (!staticId) {
      this.setError('No staticId requested');
      return;
    }

    if (!STATIC_ID_PATTERN.test(staticId)) {
      this.setError(`Invalid staticId "${staticId}"`);
      return;
    }

    try {
      const entry = await this.resolveEntry(staticId, currentLoadId);
      if (currentLoadId !== this.loadId) return;

      if (!entry) {
        this.setError(`Static "${staticId}" was not found in the registry`);
        return;
      }

      errorContext = entry.htmlKey;
      await this.loadEntry(entry, currentLoadId);
    } catch (error) {
      if (currentLoadId !== this.loadId) return;
      this.clearRuntime();
      this.staticHTML = undefined;
      this.dispatchHttpError(error, errorContext);
      this.setError(error instanceof Error ? error.message : 'Static page could not be loaded');
    }
  }

  private async resolveEntry(staticId: string, loadId: number): Promise<DracoStaticEntry | undefined> {
    let snapshot = this.registry.snapshot();
    if (snapshot.state === 'idle' || snapshot.state === 'loading') {
      snapshot = await this.registry.waitUntilSettled();
      if (loadId !== this.loadId) return undefined;
    }

    let result = this.definitionResolver.resolve({ staticId });
    let entry = result.definition ? this.registry.getById(staticId) : undefined;
    if (entry) {
      return entry;
    }

    if (snapshot.state === 'failed') {
      entry = await this.registry.lookupOnDemand(staticId);
      if (loadId !== this.loadId) return undefined;
      if (entry) {
        return entry;
      }

      result = this.definitionResolver.resolve({ staticId });
      entry = result.definition ? this.registry.getById(staticId) : undefined;
    }

    return entry;
  }

  private async loadEntry(entry: DracoStaticEntry, loadId: number): Promise<void> {
    const blob = await this.apiFactory.documentsApi.getDocument({
      bucket: StaticwebComponent.DRACO_STATIC_BUCKET,
      key: entry.htmlKey,
    });
    if (loadId !== this.loadId) return;

    const html = await blob.text();
    if (loadId !== this.loadId) return;

    const rewrittenHtml = this.assetRewriter.rewrite(html, entry.basePath);
    const plan = this.htmlPolicy.createRenderPlan(rewrittenHtml, entry.definition);
    if (loadId !== this.loadId) return;

    if (entry.definition.mode === 'display-only') {
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
    const status = this.getHttpStatus(error);
    if (typeof status !== 'number') {
      return;
    }

    this.handleError(status, url);
  }

  private getHttpStatus(error: unknown): unknown {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    if ('status' in error) {
      return (error as { status?: unknown }).status;
    }

    if ('response' in error) {
      const response = (error as { response?: unknown }).response;
      if (typeof response === 'object' && response !== null && 'status' in response) {
        return (response as { status?: unknown }).status;
      }
    }

    return undefined;
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
