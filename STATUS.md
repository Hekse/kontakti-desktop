# Kontakti: Ajo ja kulut yhteiseen responsiiviseen käyttöliittymään

8.10.2026: Hubin reposijainnit johtivat oikeaan käyttöliittymään: Hekse/kontakti-desktop, index.html -> cloud-ui-v12.html. Tässä versiossa on puhelimen alasvetovalikko ja Viikkoraportti. Hekse/kontakti-mobile on erillinen, välilehtiä käyttävä versio; kontakti-mobile2 on vanhempi paikallista dataa käyttävä versio. Niitä ei yhdistetty tai korvattu.

Toteutus: nykyinen Ajo ja kulut -moduuli tuotu tähän repoan. Valinta on heti Viikkoraportin alla ja avaa lomakkeen Kontaktin sisältöalueessa. Sama Supabase-host, olemassa oleva user/workspace ja asiakaslista, samat teemat. Ei schema- tai tunnusmuutoksia. Toiminto mukautuu myös desktop-leveyteen. FI/EN valikkoteksti lisätty; itse lomakkeen tekstit ovat toistaiseksi suomeksi.

Ulkoasu: ei ylimääräistä OPERO KONTAKTI -yläotsikkoa tai Kirjaa kentällä -tekstiä. Kevyet sivutoiminnot, yksi pääpainike, kulut riveinä, painotus loppusummaan, light/dark color-scheme date-kentälle. Vaalea ja tumma tila tarkistettu.

Varmennus: 8 paikallista logiikkatestiä läpäisi; integroidun moduulin JavaScript-syntaksi tarkistettu. Paikallinen esikatselu käyttää oikeaa HTML/CSS-kuorta ja simuloitua backendia. Puhelinleveys 390 px: ei ylivuotoa, valikossa Viikkoraportti -> Ajo ja kulut -> Asetukset, valinta sulkee valikon; date color-scheme light/dark vaihtuu. Tämä ei todista kirjautunutta pilvitallennusta uudessa kuoressa.

Esikatselu: http://127.0.0.1:3012/tests/integration-preview.html
Tuotantoosoite on GitHub Pagesin asetuksista varmennettu https://hekse.github.io/kontakti-desktop/ ; tämän haaran muutoksia ei ole julkaistu siihen.

8.10.2026: Valikon nimeksi Ajot & Kulut; nuoli korvattu skaalautuvalla, teeman tekstiväriä käyttävällä moottoritie-SVG:llä. Muutos myös integroidussa esikatselussa. Ei tuotantojulkaisua.

8.10.2026: Tiekuvake selkeytetty siniseksi tien pinnaksi, vaaleiksi reunoiksi ja valkoiseksi katkoviivaksi; poikkiviivat poistettu. Paikallinen esikatselu, ei tuotantojulkaisua.

8.10.2026 käyttäjän jatko-ohje: säilytä yrityksen logolle paikka sivuvalikossa Myynti YTD -kohdan alapuolella ja Työkalut-osion yläpuolella. Käyttäjän tuotantokuvassa Isokallan Panimon logo on tällä paikalla; integroidusta esikatselusta se puuttuu. Ajot & Kulut -valikkokohta ei saa syrjäyttää logopaikkaa. Varmista logo ja tilan riittävyys oikeassa käyttöliittymässä ennen julkaisua. Logoassetia ei kopioitu kuvakaappauksesta.

10.10.2026 julkaisuvalmistelu: käyttäjä hyväksyi tuotantoon viennin ja läpinäkyvän Opero-logon kuvavedoksen. Alkuperäisen SVG-merkin tumma taustalaatta ja sisäympyrän tausta poistettu splashista, puhelinotsikosta ja sivupalkista. Suomen ja Britannian liput SVG-kuvina kielipainikkeissa, joten Windows ei korvaa niitä FI/GB-kirjaimilla. Kirjautuneessa paikallisessa oikeassa sovelluksessa logo/liput näkyvät, FI/EN-vaihto toimii, yrityslogo säilyy Myynti YTD:n alla ja Ajot & Kulut avautuu. Testit 8/8 läpäisivät 10.10. Pilvitallennuksen ja kuittien kirjoitustestiä ei tässä kierroksessa tehty uudelleen; aiemmat simuloidut tarkistukset ja niiden rajat yllä säilyvät. Käyttäjä hyväksyi tämän version julkaistavaksi. Julkaisu-PR #1; suunniteltu release v1.2.0.

10.10.2026 tuotantojulkaisu: PR #1 ja #2 yhdistetty; main 3b48c789727570c91f5da80251e0b899af400ac0. v1.2.0 tag ja GitHub release tehty. Pages build built juuri tästä commitista. Tuotannon cloud-ui-v12.html, ajo-form.js, ajo-kulut.js ja ajo-kulut.css: HTTP 200 ja sisältö vastaa mainia. Kirjautuneen paikallisen sovelluksen UI tarkistettu; uutta tuotannon kirjoitustestiä ei tehty. Render-Hub-päivitys odottaa: nykyisessä käyttöliittymässä sallittu semantic preview/approve -polku ei auennut. Ehdotus output/hub-pending/contact-2026-10-10-release-preparation.json päivitetty lopputilaan; aiempaa julkaisematon-ehdotusta ei saa lähettää.

10.10.2026 v1.2.1: Ajot & Kulut -sisältöalueelle lisätty pystysuuntainen vieritys ja pohjan safe-area-tila. Kirjautuneessa paikallisessa selaimessa tietokoneleveys ja 390x844 px: vieritys pohjaan, tallennuspainike sekä Koonti ja raportti kokonaan näkyvissä. Ei tietomalli- tai tallennusmuutoksia.
