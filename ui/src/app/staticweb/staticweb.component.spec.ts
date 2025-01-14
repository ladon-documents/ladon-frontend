import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StaticwebComponent } from "./staticweb.component";

describe("StaticWebComponent", () => {
	let component: StaticwebComponent;
	let fixture: ComponentFixture<StaticwebComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [StaticwebComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(StaticwebComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
