import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PluginSearchComponent } from './plugin-search.component';

describe('PluginSearchComponent', () => {
  let fixture: ComponentFixture<PluginSearchComponent>;
  let component: PluginSearchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginSearchComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('searchTerm', 'user');
    fixture.detectChanges();
  });

  it('emits search term changes', () => {
    const emitSpy = spyOn(component.searchTermChange, 'emit');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'plugin';
    input.dispatchEvent(new Event('input'));

    expect(emitSpy).toHaveBeenCalledWith('plugin');
  });
});
