# 📖 Kuchařka: Kompletní návod ke spuštění, nasazení do cloudu a instalaci StockPulse do telefonu

Tento dokument je přesný postup **krok za krokem**, jak s aplikací naložit od A do Z, abyste měl plně funkční systém se sledováním novinek, AI nedopalků a push notifikacemi pro všech 15 vybraných firem.

---

## 🛠️ Co už je pro vás kompletně naprogramováno a připraveno

1. **Backendový server (`/server`)**:
   - Využívá váš Finnhub API klíč (`d979u3hr01qluk1jqu9gd979u3hr01qluk1jqua0`).
   - Stahuje novinky z **Finnhub API**, **Yahoo Finance RSS**, **Google News RSS** a **SEC EDGAR** (insider transakce a instituce).
   - Automaticky odstraňuje duplicity zpráv (podle MD5 hashe URL a nadpisu).
   - Generuje „Nedopalky“ (AI syntézu důležitých přehlížených informací pro retail investory).
   - Obsahuje **automatický Cron**, který každých 30 minut stáhne nová data a odešle **Push Notifikace** do vašeho mobilu.
2. **Mobilní aplikace (`StockPulse`)**:
   - Kompletně v českém jazyce, v moderním tmavém designu se skleněnými prvky a barevným odlišením čerstvosti zpráv (< 1 hodina zeleně, < 24 hodin žlutě).
   - 4 obrazovky: **Přehled** (dle sektorů), **Detail akcie** (Novinky, Insideři, Nedopalky, Katalyzátory), **Centrum zpráv** a **Nastavení**.

---

## 🟢 KROK 1: Vyzkoušení aplikace u vás na počítači (Lokální test)

Než aplikaci pošleme do cloudu, můžete si ji okamžitě spouštět na svém PC:

### A) Spuštění backendového serveru
1. Otevřete příkazový řádek (PowerShell nebo Terminál) ve složce projektu:
   ```powershell
   cd c:\Users\mrtnp\OneDrive\Plocha\Rados_apka\server
   ```
2. Spusťte server příkazem:
   ```powershell
   npm run dev
   ```
3. V terminálu uvidíte zprávu: `Server running on port 3001` a server okamžitě stáhne první dávku novinek pro všech 15 firem. (Tento terminál nechte běžet).

### B) Spuštění mobilní aplikace
1. Otevřete **druhé** okno terminálu ve složce projektu:
   ```powershell
   cd c:\Users\mrtnp\OneDrive\Plocha\Rados_apka
   ```
2. Spusťte aplikaci:
   ```powershell
   npm run start
   ```
3. Zobrazí se QR kód. Pokud máte na počítači Android Emulátor, stiskněte klávesu `a`. Pokud chcete aplikaci vidět na telefonu v lokální síti, naskenujte QR kód přes aplikaci **Expo Go**.

---

## ☁️ KROK 2: Nasazení backendu na Render.com (aby běžel 24/7 zdarma v cloudu)

Aby vás aplikace upozorňovala na novinky **i když máte vypnutý počítač**, nasadíme backend zdarma na cloudovou službu **Render.com**.

### 1. Nahrání kódu na GitHub
1. Pokud ještě nemáte projekt na GitHubu, vytvořte si na [github.com](https://github.com) nový soukromý repozitář (např. `stockpulse-app`).
2. Nahrajte tam obsah složky `Rados_apka`.

### 2. Vytvoření služby na Render.com
1. Přihlaste se na [Render.com](https://render.com) (můžete se přihlásit přímo přes GitHub účet).
2. Klikněte na tlačítko **+ New** vpravo nahoře a vyberte **Web Service**.
3. Vyberte váš repozitář s aplikací.
4. Vyplňte nastavení služby:
   - **Name**: `stockpulse-backend` (nebo libovolný název)
   - **Root Directory**: `server` *(DŮLEŽITÉ: napište sem slovo `server`, protože backend leží v této podsložce)*
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Instance Type**: `Free` (Zdarma)
5. V sekci **Environment Variables** (proměnné prostředí) klikněte na **Add Environment Variable** a přidejte:
   - Klíč: `FINNHUB_API_KEY` | Hodnota: `d979u3hr01qluk1jqu9gd979u3hr01qluk1jqua0`
   - Klíč: `PORT` | Hodnota: `3001`
6. Klikněte na **Create Web Service**.
7. Počkejte 1–2 minuty, než se server sestaví. Nahoře pod názvem služby uvidíte vaši cloudovou adresu, např.:
   `https://stockpulse-backend-xxxx.onrender.com`

### 3. Propojení mobilní aplikace s cloudem
1. Otevřete soubor `c:\Users\mrtnp\OneDrive\Plocha\Rados_apka\src\utils\constants.ts`.
2. Na řádku **147** nahraďte lokální adresu vaší novou adresou z Renderu:
   ```typescript
   // Původní:
   export const API_BASE_URL = 'http://localhost:3001/api';

   // Nové (změňte za vaši URL z Renderu + /api na konci):
   export const API_BASE_URL = 'https://stockpulse-backend-xxxx.onrender.com/api';
   ```

---

## 📱 KROK 3: Instalace plnohodnotné aplikace do Android telefonu (s Push Notifikacemi)

> ⚠️ **DŮLEŽITÉ UPOZORNĚNÍ PRO ANDROID**:  
> Běžná aplikace *Expo Go* od verze SDK 53 neumožňuje příjem vzdálených Push Notifikací z cloudových serverů z důvodů pravidel Google Play.  
> Pro plné fungování notifikací si vygenerujeme **vlastní instalační APK soubor** nebo aplikaci nainstalujeme přímo do mobilu přes kabel.

Máte dvě nejjednodušší cesty:

### Možnost A: Instalace přímo přes USB kabel do Androidu (Nejrychlejší)
1. Na svém Android telefonu si v *Nastavení -> O telefonu -> 7x klikněte na Číslo sestavení* zapněte **Vývojářské možnosti** a v nich povolte **Ladění USB (USB Debugging)**.
2. Připojte telefon k počítači USB kabelem.
3. V terminálu ve složce projektu spusťte:
   ```powershell
   npx expo run:android
   ```
4. Expo automaticky sestaví aplikaci a nainstaluje ji přímo do vašeho mobilu jako plnohodnotnou aplikaci se všemi ikonami a plnou podporou Push Notifikací!

### Možnost B: Vygenerování instalačního `.apk` souboru přes EAS Build (Cloudový build zdarma)
Pokud nechcete připojovat telefon kabelem:
1. V terminálu se přihlaste k bezplatnému Expo účtu (nebo se zaregistrujte na expo.dev):
   ```powershell
   npx eas-cli login
   ```
2. Spusťte sestavení APK pro Android:
   ```powershell
   npx eas-cli build -p android --profile preview
   ```
3. Po dokončení sestavení (cca 5-10 minut) vám terminál zobrazí **odkaz ke stažení `.apk` souboru** a QR kód.
4. Naskenujte QR kód telefonem, stáhněte `.apk` soubor a nainstalujte si ho do mobilu.

---

## 🔍 Ověření, že vše funguje na 100 %

1. Otevřete aplikaci **StockPulse** v telefonu.
2. Přejděte do záložky **Nastavení (⚙️)**.
3. V sekci **Push Notifikace** uvidíte zelenou fajfku `Token registrován`. To znamená, že váš telefon odeslal svůj unikátní token na váš Render backend.
4. Od této chvíle váš backend na Renderu každých 30 minut zkontroluje všech 15 firem, uloží nové zprávy a okamžitě vám pošle notifikaci na displej telefonu, jakmile vyjde novinka!
