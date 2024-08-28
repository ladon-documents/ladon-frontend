import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LadonContextMenuComponent } from "./ladon-context-menu.component";

describe("LadonContextMenuComponent", () => {
	let component: LadonContextMenuComponent;
	let fixture: ComponentFixture<LadonContextMenuComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [LadonContextMenuComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(LadonContextMenuComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
