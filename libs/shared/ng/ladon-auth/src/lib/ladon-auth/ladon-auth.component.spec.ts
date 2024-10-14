import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LadonAuthComponent } from "./ladon-auth.component";

describe("LadonAuthComponent", () => {
	let component: LadonAuthComponent;
	let fixture: ComponentFixture<LadonAuthComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [LadonAuthComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(LadonAuthComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
