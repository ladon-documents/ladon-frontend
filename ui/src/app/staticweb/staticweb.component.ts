import {ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit} from "@angular/core";
import { CommonModule } from "@angular/common";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {DocumentsService} from "../../api";

@Component({
	selector: "lib-static-web",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./staticweb.component.html",
	styleUrl: "./staticweb.component.css",
	//changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticwebComponent implements OnInit, OnDestroy {

	private subscription!: Subscription;
	staticHMTL!:SafeHtml;

	constructor(private http: HttpClient,
							private sanitizer: DomSanitizer,
							private activatedRoute: ActivatedRoute,
							private elementRef: ElementRef,
						private documentService: DocumentsService) {
	}

	ngOnInit() {
		this.subscription = this.activatedRoute.queryParams.subscribe(params => {
			const page = params['page'];
			const query = decodeURIComponent(location.search);
			if (page) {
				this.loadContent(page);
			}
		});
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	loadContent(url: string) {
		this.handleQueryParams();
		this.http.get(url, {responseType: "text"}).subscribe(response => {
			this.staticHMTL =  this.sanitizer.bypassSecurityTrustHtml(response);
		})
	}

	 handleQueryParams() {
		const query = decodeURIComponent(location.search);
		const page = query.startsWith("?page=");
		if (page) {
			const url = query.replace("?page=", "");
			let path = url.slice(url.indexOf("/") + 1);
			if (path.includes("&")) {
				path = path.slice(0, path.indexOf("&"));
			}
			const bucket = url.slice(0, url.indexOf("/"));
			this.documentService.getDocument( bucket, path).subscribe(response => {
				console.log(response);
				//this.staticHMTL =  this.sanitizer.bypassSecurityTrustHtml(response);
			});

		} else {
			this.staticHMTL = 'No content found';
		}
	}

	addScripts() {
		let b = document.createElement("div");
		b.innerHTML = "<h3>Returned html<h3>";

		let s = document.createElement("script");
		s.type = "text/javascript";
		s.innerHTML = "console.log('done');"; //inline script
		// s.src = "https://somesite.com/script.js"; // src script

		b.appendChild(s);

		this.elementRef.nativeElement.appendChild(b);
	}


	setInnerHTML (elm: any, html: any) {
		elm.innerHTML = html;
		Array.from(elm.querySelectorAll("script")).forEach((oldScript: any) => {
			const newScript = document.createElement("script");
			Array.from(oldScript.attributes)
					.forEach((attr: any) => newScript.setAttribute(attr.name, attr.value));
			newScript.appendChild(document.createTextNode(oldScript.innerHTML));
			oldScript.parentNode.replaceChild(newScript, oldScript);
		});
	};

	private handleError (code: number, url: string){
		let customEventName;
		switch (code) {
			case 401:
				customEventName = "ladon:error:page:401";
				break;
			case 404:
				customEventName = "ladon:error:page:404";
				break;
			case 500:
				customEventName = "ladon:error:page:500";
				break;
		}
		if (customEventName) {
			window.dispatchEvent(new CustomEvent(customEventName, { detail: url }));
		}
	};
}
