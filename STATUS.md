# Kontakti: Ajo ja kulut yhteiseen responsiiviseen käyttöliittymään

8.10.2026: Hubin reposijainnit johtivat oikeaan käyttöliittymään: Hekse/kontakti-desktop, index.html -> cloud-ui-v12.html. Tässä versiossa on puhelimen alasvetovalikko ja Viikkoraportti. Hekse/kontakti-mobile on erillinen, välilehtiä käyttävä versio; kontakti-mobile2 on vanhempi paikallista dataa käyttävä versio. Niitä ei yhdistetty tai korvattu.

Toteutus: nykyinen Ajo ja kulut -moduuli tuotu tähän repoan. Valinta on heti Viikkoraportin alla ja avaa lomakkeen Kontaktin sisältöalueessa. Sama Supabase-host, olemassa oleva user/workspace ja asiakaslista, samat teemat. Ei schema- tai tunnusmuutoksia. Toiminto mukautuu myös desktop-leveyteen. FI/EN valikkoteksti lisätty; itse lomakkeen tekstit ovat toistaiseksi suomeksi.

Ulkoasu: ei ylimääräistä OPERO KONTAKTI -yläotsikkoa tai Kirjaa kentällä -tekstiä. Kevyet sivutoiminnot, yksi pääpainike, kulut riveinä, painotus loppusummaan, light/dark color-scheme date-kentälle. Vaalea ja tumma tila tarkistettu.

Varmennus: 8 paikallista logiikkatestiä läpäisi; integroidun moduulin JavaScript-syntaksi tarkistettu. Paikallinen esikatselu käyttää oikeaa HTML/CSS-kuorta ja simuloitua backendia. Puhelinleveys 390 px: ei ylivuotoa, valikossa Viikkoraportti -> Ajo ja kulut -> Asetukset, valinta sulkee valikon; date color-scheme light/dark vaihtuu. Tämä ei todista kirjautunutta pilvitallennusta uudessa kuoressa.

Esikatselu: http://127.0.0.1:3012/tests/integration-preview.html
Tuotantoosoite on GitHub Pagesin asetuksista varmennettu https://hekse.github.io/kontakti-desktop/ ; tämän haaran muutoksia ei ole julkaistu siihen.
