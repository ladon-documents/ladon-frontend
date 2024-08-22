import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LadonSpinnerComponent } from "./ladon-spinner.component";

describe("LadonSpinnerComponent", () => {
	let component: LadonSpinnerComponent;
	let fixture: ComponentFixture<LadonSpinnerComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [LadonSpinnerComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(LadonSpinnerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
