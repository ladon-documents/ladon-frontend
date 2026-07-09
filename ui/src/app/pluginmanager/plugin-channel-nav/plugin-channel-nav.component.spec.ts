import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PluginChannelNavComponent } from './plugin-channel-nav.component';

describe('PluginChannelNavComponent', () => {
  let fixture: ComponentFixture<PluginChannelNavComponent>;
  let component: PluginChannelNavComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginChannelNavComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginChannelNavComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('channels', [
      { product: 'ladon', channel: 'stable' },
      { product: 'ladon', channel: 'beta' },
    ]);
    fixture.componentRef.setInput('activeChannel', 'stable');
    fixture.detectChanges();
  });

  it('renders channels and emits selected channel', () => {
    const emitSpy = spyOn(component.channelSelected, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(buttons.length).toBe(2);
    buttons[1].click();

    expect(emitSpy).toHaveBeenCalledWith('beta');
  });
});
