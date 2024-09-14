import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DocmanagerComponent } from "./docmanager.component";

describe("DocmanagerComponent", () => {
	let component: DocmanagerComponent;
	let fixture: ComponentFixture<DocmanagerComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DocmanagerComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(DocmanagerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
