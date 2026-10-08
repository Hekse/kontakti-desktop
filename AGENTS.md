# Agenttiohjeet — Opero Kontakti

Hub-kohde: Opero Kontakti. Slug: contact.

<!-- opero-hub-session-end:v1 -->
## Opero: työsession lopun Hub-päivitys

Käyttäjä on 8.10.2026 valtuuttanut Opero-projektien tilannepäivitykset käyttämäänsä Render-Hubiin: https://opero-topi.onrender.com/ . Tee päivitys ennen toteutustyön loppuvastausta ilman erillistä muistutusta. Pelkkä kysymykseen vastaaminen tai muuttumattoman tilanteen lukeminen ei vaadi kirjoitusta.

1. Tunnista täsmällinen olemassa oleva projekti Hubista ja lue nykyiset tiedot sekä versio. Päivitä vain session aikana käsitellyt projektit. Älä luo nimimuunnelmasta uutta projektia. Opero-Anniskelu = aiempi Pulssi (slug pulssi), kaupallinen työnimi Opero Anniskelu. Opero Kontakti = aiempi Contact (slug contact). Muut tunnetut slugit: ajo, liidi, pakki, opero-fi, opero-hub, topi, world-news. Tuntematon projekti on varmistettava rekisteristä.
2. Kirjaa tiiviisti tehty työ, merkitykselliset testitulokset, avoimet esteet, nykyinen fokus ja seuraava konkreettinen tehtävä. Erota paikallinen toteutus, staging-testi, julkaisu ja tuotantovarmennus. Älä merkitse testaamatonta tai vain pyydettyä ominaisuutta valmiiksi. Säilytä projektin omat STATUS-/päiväkirja- ja muut lopetusvelvoitteet.
3. Käytä Hubin olemassa olevaa autentikoitua, auditoitua päivityspolkua: Ajantasainen projektitilanne -> Esikatsele tilannepäivitys -> hyväksyntä. API-vastine on /api/projects/:slug/semantic/preview ja /approve, expectedVersion, reason ja confirmed=true. Käytä nykyisen session oikeuksia; älä keksi tunnuksia, ota salaisuuksia lokiin tai laajenna käyttöoikeuksia. Nimi-/sijaintimuutokset tehdään erillisellä profile-polulla vain kun valtuutettu.
4. Kanoninen kohde on Renderin tuotanto-Hub. Tunnettu tietokanta: Neon young-breeze-96738564, endpoint ep-soft-tree-b1ke75y5. Paikallinen staging ei ole sen korvike. Älä kirjoita suoraan tuotantotietokantaan, kopioi stagingia tuotantoon, muuta muiden sovellusten tuotantoa tai julkaise koodia pelkän tilanneraportin vuoksi.
5. Version ristiriidassa lue nykytila uudelleen ja sovita päivitys; älä ylikirjoita toisen tekemiä muutoksia. Varmista onnistuminen uudella palvelinluvulla/sivulatauksella ja projektihistoriasta. Pelkkä lomakkeen täyttäminen tai aikaleiman muuttaminen ei ole valmis päivitys.
6. Jos yhteys, kirjautuminen tai sallittu kirjoituspolku puuttuu, tallenna ehdotus projektin output/hub-pending/ -hakemistoon (jos projektiohje ei salli tätä, käytä C:/Users/XXX/.codex/opero-hub-pending/). Tallenna projektitunniste, aika, ehdotetut tiedot, näyttö/perustelu ja täsmällinen este ilman salaisuuksia. Kerro loppuvastauksessa että Hub-päivitys odottaa. Seuraavan työn alussa sovita odottava päivitys nykytilaan ennen lähetystä; älä lähetä vanhaa tilannetta uudemman päälle.
7. Loppuvastauksessa ilmoita lyhyesti "Render-Hub päivitetty ja tallennus varmistettu" tai täsmällinen este. Älä väitä automaation toimivan chatin päättymisen tai sovelluksen sulkemisen jälkeen. Tämä ohje ei luo ajastusta eikä erillistä automaatiotunnusta.
<!-- /opero-hub-session-end:v1 -->