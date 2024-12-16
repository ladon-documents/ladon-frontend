import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SearchbarComponent } from "./searchbar.component";
import { DebugElement } from "@angular/core";
import { By } from "@angular/platform-browser";
import { ReactiveFormsModule } from "@angular/forms";
import { emit } from "process";

describe("SearchbarComponent", () => {
	let component: SearchbarComponent, fixture: ComponentFixture<SearchbarComponent>, debugElement: DebugElement;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [SearchbarComponent, ReactiveFormsModule],
		}).compileComponents();

		fixture = TestBed.createComponent(SearchbarComponent);
		debugElement = fixture.debugElement;
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("run search query", (done) => {
		const searchTerm = `Foobar`;
		const emitSpy = jest.spyOn(component.searchResult, "emit");

		component.search.setValue(searchTerm);
		setTimeout(() => {
			expect(emitSpy).toHaveBeenCalled();
			expect(emitSpy).toHaveBeenCalledWith([]);
			done();
		}, 800);
	});
});
