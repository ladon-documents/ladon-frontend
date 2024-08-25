define(["exports"], function (exports) {
	"use strict";

	/**
	 * German language package
	 * Translated by @logemann
	 */
	var de_DE = {
		base64: {
			default: "Bitte eine Base64 Kodierung eingeben",
		},
		between: {
			default: "Bitte einen Wert zwischen %s und %s eingeben",
			notInclusive: "Bitte einen Wert zwischen %s und %s (strictly) eingeben",
		},
		bic: {
			default: "Bitte gültige BIC Nummer eingeben",
		},
		callback: {
			default: "Bitte einen gültigen Wert eingeben",
		},
		choice: {
			between: "Zwischen %s - %s Werten wählen",
			default: "Bitte einen gültigen Wert eingeben",
			less: "Bitte mindestens %s Werte eingeben",
			more: "Bitte maximal %s Werte eingeben",
		},
		color: {
			default: "Bitte gültige Farbe eingeben",
		},
		creditCard: {
			default: "Bitte gültige Kreditkartennr. eingeben",
		},
		cusip: {
			default: "Bitte gültige CUSIP Nummer eingeben",
		},
		date: {
			default: "Bitte gültiges Datum eingeben",
			max: "Bitte gültiges Datum vor %s",
			min: "Bitte gültiges Datum nach %s",
			range: "Bitte gültiges Datum im zwischen %s - %s",
		},
		different: {
			default: "Bitte anderen Wert eingeben",
		},
		digits: {
			default: "Bitte Zahlen eingeben",
		},
		ean: {
			default: "Bitte gültige EAN Nummer eingeben",
		},
		ein: {
			default: "Bitte gültige EIN Nummer eingeben",
		},
		emailAddress: {
			default: "Bitte gültige Emailadresse eingeben",
		},
		file: {
			default: "Bitte gültiges File eingeben",
		},
		greaterThan: {
			default: "Bitte Wert größer gleich %s eingeben",
			notInclusive: "Bitte Wert größer als %s eingeben",
		},
		grid: {
			default: "Bitte gültige GRId Nummer eingeben",
		},
		hex: {
			default: "Bitte gültigen Hexadezimalwert eingeben",
		},
		iban: {
			countries: {
				AD: "Andorra",
				AE: "Vereinigte Arabische Emirate",
				AL: "Albanien",
				AO: "Angola",
				AT: "Österreich",
				AZ: "Aserbaidschan",
				BA: "Bosnien und Herzegowina",
				BE: "Belgien",
				BF: "Burkina Faso",
				BG: "Bulgarien",
				BH: "Bahrein",
				BI: "Burundi",
				BJ: "Benin",
				BR: "Brasilien",
				CH: "Schweiz",
				CI: "Elfenbeinküste",
				CM: "Kamerun",
				CR: "Costa Rica",
				CV: "Kap Verde",
				CY: "Zypern",
				CZ: "Tschechische",
				DE: "Deutschland",
				DK: "Dänemark",
				DO: "Dominikanische Republik",
				DZ: "Algerien",
				EE: "Estland",
				ES: "Spanien",
				FI: "Finnland",
				FO: "Färöer-Inseln",
				FR: "Frankreich",
				GB: "Vereinigtes Königreich",
				GE: "Georgien",
				GI: "Gibraltar",
				GL: "Grönland",
				GR: "Griechenland",
				GT: "Guatemala",
				HR: "Croatia",
				HU: "Ungarn",
				IE: "Irland",
				IL: "Israel",
				IR: "Iran",
				IS: "Island",
				IT: "Italien",
				JO: "Jordanien",
				KW: "Kuwait",
				KZ: "Kasachstan",
				LB: "Libanon",
				LI: "Liechtenstein",
				LT: "Litauen",
				LU: "Luxemburg",
				LV: "Lettland",
				MC: "Monaco",
				MD: "Moldawien",
				ME: "Montenegro",
				MG: "Madagaskar",
				MK: "Mazedonien",
				ML: "Mali",
				MR: "Mauretanien",
				MT: "Malta",
				MU: "Mauritius",
				MZ: "Mosambik",
				NL: "Niederlande",
				NO: "Norwegen",
				PK: "Pakistan",
				PL: "Polen",
				PS: "Palästina",
				PT: "Portugal",
				QA: "Katar",
				RO: "Rumänien",
				RS: "Serbien",
				SA: "Saudi-Arabien",
				SE: "Schweden",
				SI: "Slowenien",
				SK: "Slowakei",
				SM: "San Marino",
				SN: "Senegal",
				TL: "Ost-Timor",
				TN: "Tunesien",
				TR: "Türkei",
				VG: "Jungferninseln",
				XK: "Republik Kosovo",
			},
			country: "Bitte eine gültige IBAN Nummer für %s eingeben",
			default: "Bitte eine gültige IBAN Nummer eingeben",
		},
		id: {
			countries: {
				BA: "Bosnien und Herzegowina",
				BG: "Bulgarien",
				BR: "Brasilien",
				CH: "Schweiz",
				CL: "Chile",
				CN: "China",
				CZ: "Tschechische",
				DK: "Dänemark",
				EE: "Estland",
				ES: "Spanien",
				FI: "Finnland",
				HR: "Kroatien",
				IE: "Irland",
				IS: "Island",
				LT: "Litauen",
				LV: "Lettland",
				ME: "Montenegro",
				MK: "Mazedonien",
				NL: "Niederlande",
				PL: "Polen",
				RO: "Rumänien",
				RS: "Serbien",
				SE: "Schweden",
				SI: "Slowenien",
				SK: "Slowakei",
				SM: "San Marino",
				TH: "Thailand",
				TR: "Türkei",
				ZA: "Südafrika",
			},
			country: "Bitte gültige Identifikationsnummer für %s eingeben",
			default: "Bitte gültige Identifikationsnnummer eingeben",
		},
		identical: {
			default: "Bitte gleichen Wert eingeben",
		},
		imei: {
			default: "Bitte gültige IMEI Nummer eingeben",
		},
		imo: {
			default: "Bitte gültige IMO Nummer eingeben",
		},
		integer: {
			default: "Bitte Zahl eingeben",
		},
		ip: {
			default: "Bitte  gültige IP-Adresse eingeben",
			ipv4: "Bitte  gültige IPv4 Adresse eingeben",
			ipv6: "Bitte  gültige IPv6 Adresse eingeben",
		},
		isbn: {
			default: "Bitte gültige ISBN Nummer eingeben",
		},
		isin: {
			default: "Bitte gültige ISIN Nummer eingeben",
		},
		ismn: {
			default: "Bitte gültige ISMN Nummer eingeben",
		},
		issn: {
			default: "Bitte gültige ISSN Nummer eingeben",
		},
		lessThan: {
			default: "Bitte Wert kleiner gleich %s eingeben",
			notInclusive: "Bitte Wert kleiner als %s eingeben",
		},
		mac: {
			default: "Bitte gültige MAC Adresse eingeben",
		},
		meid: {
			default: "Bitte gültige MEID Nummer eingeben",
		},
		notEmpty: {
			default: "Bitte Wert eingeben",
		},
		numeric: {
			default: "Bitte Nummer eingeben",
		},
		phone: {
			countries: {
				AE: "Vereinigte Arabische Emirate",
				BG: "Bulgarien",
				BR: "Brasilien",
				CN: "China",
				CZ: "Tschechische",
				DE: "Deutschland",
				DK: "Dänemark",
				ES: "Spanien",
				FR: "Frankreich",
				GB: "Vereinigtes Königreich",
				IN: "Indien",
				MA: "Marokko",
				NL: "Niederlande",
				PK: "Pakistan",
				RO: "Rumänien",
				RU: "Russland",
				SK: "Slowakei",
				TH: "Thailand",
				US: "Vereinigte Staaten von Amerika",
				VE: "Venezuela",
			},
			country: "Bitte valide Telefonnummer für %s eingeben",
			default: "Bitte gültige Telefonnummer eingeben",
		},
		promise: {
			default: "Bitte einen gültigen Wert eingeben",
		},
		regexp: {
			default: "Bitte Wert eingeben, der der Maske entspricht",
		},
		remote: {
			default: "Bitte einen gültigen Wert eingeben",
		},
		rtn: {
			default: "Bitte gültige RTN Nummer eingeben",
		},
		sedol: {
			default: "Bitte gültige SEDOL Nummer eingeben",
		},
		siren: {
			default: "Bitte gültige SIREN Nummer eingeben",
		},
		siret: {
			default: "Bitte gültige SIRET Nummer eingeben",
		},
		step: {
			default: "Bitte einen gültigen Schritt von %s eingeben",
		},
		stringCase: {
			default: "Bitte nur Kleinbuchstaben eingeben",
			upper: "Bitte nur Großbuchstaben eingeben",
		},
		stringLength: {
			between: "Bitte Wert zwischen %s und %s Zeichen eingeben",
			default: "Bitte Wert mit gültiger Länge eingeben",
			less: "Bitte weniger als %s Zeichen eingeben",
			more: "Bitte mehr als %s Zeichen eingeben",
		},
		uri: {
			default: "Bitte gültige URI eingeben",
		},
		uuid: {
			default: "Bitte gültige UUID Nummer eingeben",
			version: "Bitte gültige UUID Version %s eingeben",
		},
		vat: {
			countries: {
				AT: "Österreich",
				BE: "Belgien",
				BG: "Bulgarien",
				BR: "Brasilien",
				CH: "Schweiz",
				CY: "Zypern",
				CZ: "Tschechische",
				DE: "Deutschland",
				DK: "Dänemark",
				EE: "Estland",
				EL: "Griechenland",
				ES: "Spanisch",
				FI: "Finnland",
				FR: "Frankreich",
				GB: "Vereinigtes Königreich",
				GR: "Griechenland",
				HR: "Kroatien",
				HU: "Ungarn",
				IE: "Irland",
				IS: "Island",
				IT: "Italien",
				LT: "Litauen",
				LU: "Luxemburg",
				LV: "Lettland",
				MT: "Malta",
				NL: "Niederlande",
				NO: "Norwegen",
				PL: "Polen",
				PT: "Portugal",
				RO: "Rumänien",
				RS: "Serbien",
				RU: "Russland",
				SE: "Schweden",
				SI: "Slowenien",
				SK: "Slowakei",
				VE: "Venezuela",
				ZA: "Südafrika",
			},
			country: "Bitte gültige VAT Nummer für %s eingeben",
			default: "Bitte gültige VAT Nummer eingeben",
		},
		vin: {
			default: "Bitte gültige VIN Nummer eingeben",
		},
		zipCode: {
			countries: {
				AT: "Österreich",
				BG: "Bulgarien",
				BR: "Brasilien",
				CA: "Kanada",
				CH: "Schweiz",
				CZ: "Tschechische",
				DE: "Deutschland",
				DK: "Dänemark",
				ES: "Spanien",
				FR: "Frankreich",
				GB: "Vereinigtes Königreich",
				IE: "Irland",
				IN: "Indien",
				IT: "Italien",
				MA: "Marokko",
				NL: "Niederlande",
				PL: "Polen",
				PT: "Portugal",
				RO: "Rumänien",
				RU: "Russland",
				SE: "Schweden",
				SG: "Singapur",
				SK: "Slowakei",
				US: "Vereinigte Staaten von Amerika",
			},
			country: "Bitte gültige Postleitzahl für %s eingeben",
			default: "Bitte gültige PLZ eingeben",
		},
	};

	exports.de_DE = de_DE;
});
