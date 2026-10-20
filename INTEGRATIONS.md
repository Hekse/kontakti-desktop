# Kontaktin tiedonsiirtovalmius

20.10.2026: suunnittelupäätökset seuraavia integraatioita varten. Tämä dokumentti ei tarkoita toteutettua Rackbeat-/Pipedrive-yhteyttä tai automaattista synkronointia.

## Nykyinen malli

Asiakkaat ovat työtilaan sidottuja kontakti_customers-rivejä. Uusi ostos tallentuu omaksi kontakti_notes-rivikseen: customer_id, workspace_id, note_date (ostospäivä), purchases_text ja sales. Se ei muuta asiakkaan last_contact-/next_date-kenttiä. Yhteydenotto tallennetaan erikseen. Vanhat yhdistetyt yhteydenotto/ostosrivit säilyvät luettavina; niiden yhteistä päivää ei muuteta vain ostosta muokattaessa. Mahdollinen erottelu tarvitsee erillisen atomisen migraation ja linkin alkuperäiseen riviin.

## Tavoitemalli ennen ensimmäistä integraatiota

- Työtilakohtainen ulkoinen tunniste: workspace_id + source_system + source_account + entity_type + external_id. Yksilöllisyysrajat estävät saman tietueen tuonnin kahdesti ja erottavat eri lähdetilit.
- Asiakas kohdistetaan ensisijaisesti aikaisemmalla ulkoisella tunnisteella. Y-tunnus auttaa ehdottamaan osumia, mutta sama yritys voi sisältää useita toimipaikkoja. Pelkkä nimi ei automaattisesti yhdistä asiakkaita.
- Ostostapahtuma sisältää erikseen kaupallisen päivän, kirjausajan ja mahdollisen toimituspäivän. Lähdedokumentin laji ja tila ratkaisevat, mikä lasketaan toteutuneeksi myynniksi. Tilausta, laskua ja CRM-kauppaa ei lasketa kolmena ostona.
- Valuutta, brutto/netto, ALV, hyvitykset ja peruutukset määritellään ennen summien yhdistämistä. Nykyinen eurosumma ei yksin riitä monivaluuttaiseen tuontiin.
- Tuoterivit: lähteen tuotetunniste/SKU, alkuperäinen kuvaus, määrä, yksikkö, myyntierän pakkauskoko, yksikköhinta, alennus, verokanta ja rivisumma. ME ja kappalemäärä eivät ole sama asia. Vanhaa vapaata kuvausta ei hävitetä eikä tulkita automaattisesti tarkaksi tuoteriviksi.
- Muistiinpanot, henkilöt ja toimenpiteet ovat erillisiä tietotyyppejä. Pipedriven deal on myyntimahdollisuus, ei oletusarvoisesti toteutunut osto.

## Hallittu tuonti

Ensin tiedostotuonti sarakekohdistuksella ja esikatselulla: lisättävät/päivitettävät/epäselvät, duplikaatit, ristiriidat ja summat. Työtilan oikeudet tarkistetaan palvelimella. Tuontierällä on audit trail ja palautussuunnitelma, ja uudelleenajo on idempotentti. Lähteen alkuperä ja tuntemattomat kentät säilytetään hallitusti ilman tunnuksia/salaisuuksia. Näyttöön tuotava sisältö käsitellään tekstinä.

Jatkuva API-synkronointi on erillinen toteutus: tietoaluekohtainen ensisijainen lähde, muutossuunta, versio-/aikaleima, konfliktit ja poistojen käsittely päätetään ensin. Avaimet pysyvät palvelimella; nykyisiä RLS-rajoja ei laajenneta tämän käyttöliittymätyön vuoksi.

Dokumentaatio: https://developer.rackbeat.com/ ja https://developers.pipedrive.com/docs/api/v1 . Tarkista rajapintaversiot ja käytössä olevan tilin oikeudet varsinaisen integraation alussa.
