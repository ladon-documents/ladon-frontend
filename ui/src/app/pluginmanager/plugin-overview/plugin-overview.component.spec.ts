import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PluginOverviewComponent } from './plugin-overview.component';

describe('PluginOverviewComponent', () => {
  let fixture: ComponentFixture<PluginOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginOverviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginOverviewComponent);
    fixture.componentRef.setInput('overview', {
      totalCount: 4,
      installedCount: 1,
      updateCount: 2,
      notInstalledCount: 1,
      requiredCount: 0,
      bundleCount: 1,
      bundleUpdateCount: 1,
      activeActionCount: 0,
      failedActionCount: 0,
    });
    fixture.detectChanges();
  });

  it('renders overview counts', () => {
    expect(fixture.nativeElement.textContent).toContain('Installed');
    expect(fixture.nativeElement.textContent).toContain('Updates');
    expect(fixture.nativeElement.textContent).toContain('2');
  });
});
