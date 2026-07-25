import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { RAPID_ID_PATTERN } from './draco-rapid-config.service';
import { DracoRapidRegistryService } from './draco-rapid-registry.service';
import { DracoRapidEntry } from './draco-rapid.types';
import { RapidAssetRewriterService } from './rapid-asset-rewriter.service';
import { RapidDefinitionResolver } from './rapid-definition.resolver';
import { RapidHtmlPolicyService } from './rapid-html-policy.service';
import { RapidRuntimeFacadeService } from './rapid-runtime-facade.service';
import { RapidScriptRunnerService } from './rapid-script-runner.service';
import { RAPID_SOURCE_CONFIG, RapidSourceConfig } from './rapid-source-config';

@Component({
  selector: 'lib-rapid-web',
  imports: [CommonModule],
  templateUrl: './rapidweb.component.html',
  styleUrl: './rapidweb.component.css',
})
export class RapidwebComponent implements OnInit, OnDestroy {
  private static readonly DRACO_RAPID_BUCKET = 'draco-rapids';

  rapidHTML?: SafeHtml;
  loading = false;
  error?: string;

  private subscription?: Subscription;
  private loadId = 0;

  constructor(
    private readonly apiFactory: FetchApiFactory,
    private readonly sanitizer: DomSanitizer,
    private readonly activatedRoute: ActivatedRoute,
    private readonly registry: DracoRapidRegistryService,
    private readonly definitionResolver: RapidDefinitionResolver,
    private readonly assetRewriter: RapidAssetRewriterService,
    private readonly htmlPolicy: RapidHtmlPolicyService,
    private readonly runtimeFacade: RapidRuntimeFacadeService,
    private readonly scriptRunner: RapidScriptRunnerService,
    @Inject(RAPID_SOURCE_CONFIG) private readonly sourceConfig: RapidSourceConfig,
  ) {}

  ngOnInit(): void {
    this.subscription = this.activatedRoute.paramMap.subscribe((paramMap) => {
      void this.resolveAndRender(paramMap.get('rapidId'));
    });
  }

  ngOnDestroy(): void {
    this.loadId += 1;
    this.subscription?.unsubscribe();
    this.clearRuntime();
  }

  private async resolveAndRender(rapidId: string | null): Promise<void> {
    const currentLoadId = ++this.loadId;
    let errorContext = rapidId ?? 'rapid';
    this.loading = true;
    this.error = undefined;
    this.rapidHTML = undefined;
    this.clearRuntime();

    if (!rapidId) {
      this.setError('No rapidId requested');
      return;
    }

    if (!RAPID_ID_PATTERN.test(rapidId)) {
      this.setError(`Invalid rapidId "${rapidId}"`);
      return;
    }

    try {
      const entry = await this.resolveEntry(rapidId, currentLoadId);
      if (currentLoadId !== this.loadId) return;

      if (!entry) {
        this.setError(`Rapid "${rapidId}" was not found in the registry`);
        return;
      }

      errorContext = entry.htmlKey;
      await this.loadEntry(entry, currentLoadId);
    } catch (error) {
      if (currentLoadId !== this.loadId) return;
      this.clearRuntime();
      this.rapidHTML = undefined;
      this.dispatchHttpError(error, errorContext);
      this.setError(error instanceof Error ? error.message : 'Rapid page could not be loaded');
    }
  }

  private async resolveEntry(rapidId: string, loadId: number): Promise<DracoRapidEntry | undefined> {
    let snapshot = this.registry.snapshot();
    if (snapshot.state === 'idle' || snapshot.state === 'loading') {
      snapshot = await this.registry.waitUntilSettled();
      if (loadId !== this.loadId) return undefined;
    }

    let result = this.definitionResolver.resolve({ rapidId });
    let entry = result.definition ? this.registry.getById(rapidId) : undefined;
    if (entry) {
      return entry;
    }

    if (snapshot.state === 'failed') {
      entry = await this.registry.lookupOnDemand(rapidId);
      if (loadId !== this.loadId) return undefined;
      if (entry) {
        return entry;
      }

      result = this.definitionResolver.resolve({ rapidId });
      entry = result.definition ? this.registry.getById(rapidId) : undefined;
    }

    return entry;
  }

  private async loadEntry(entry: DracoRapidEntry, loadId: number): Promise<void> {
    const html = await this.loadHtml(entry);
    if (loadId !== this.loadId) return;

    const rewrittenHtml = this.assetRewriter.rewrite(html, entry.basePath);
    const plan = this.htmlPolicy.createRenderPlan(rewrittenHtml, entry.definition);
    if (loadId !== this.loadId) return;

    if (entry.definition.mode === 'display-only') {
      this.clearRuntime();
      this.rapidHTML = this.sanitizer.bypassSecurityTrustHtml(plan.html);
      this.loading = false;
      return;
    }

    this.runtimeFacade.install();
    this.rapidHTML = this.sanitizer.bypassSecurityTrustHtml(plan.html);
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

  private async loadHtml(entry: DracoRapidEntry): Promise<string> {
    if (this.sourceConfig.source === 'local') {
      const response = await fetch(this.localUrlForKey(entry.htmlKey));
      if (!response.ok) {
        throw { status: response.status, message: 'Rapid page could not be loaded' };
      }

      return response.text();
    }

    const blob = await this.apiFactory.documentsApi.getDocument({
      bucket: RapidwebComponent.DRACO_RAPID_BUCKET,
      key: entry.htmlKey,
    });

    return blob.text();
  }

  private localUrlForKey(key: string): string {
    const basePath = this.sourceConfig.source === 'local' ? this.sourceConfig.local.basePath.replace(/\/+$/, '') : '';

    return `${basePath}/${key
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/')}`;
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
