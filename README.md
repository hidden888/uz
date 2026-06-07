# Mickey Mouse Stimmen-Konverter

Eine Web-Anwendung, die deine Stimme in Echtzeit in eine Mickey-Mouse-Stimme umwandelt.

## Starten

```bash
# Option 1 – Python (überall verfügbar)
cd /pfad/zum/projekt
python3 -m http.server 8080

# Option 2 – Node.js http-server
npx http-server . -p 8080
```

Dann im Browser öffnen: `http://localhost:8080`

> Die App funktioniert **nicht** per `file://` (Browser-Sicherheitsrichtlinien).  
> Immer einen lokalen HTTP-Server verwenden.

## Bedienung

1. **Aufnahme starten** – Button klicken und Mikrofon-Berechtigung erteilen
2. **Sprechen** – Timer zeigt die vergangene Aufnahmedauer
3. **Stoppen** – erneut auf den Button klicken
4. **Ergebnis** – beide Audio-Player werden angezeigt:
   - *Original* – deine unverarbeitete Aufnahme
   - *Mickey Mouse* – hochgestimmte Version (+9 Halbtöne)
5. **Herunterladen** – WAV-Datei per Klick speichern

## Technische Details

| Komponente | Technologie |
|---|---|
| Aufnahme | MediaRecorder API (WebM/Opus) |
| Pitch-Shifting | Tone.js `PitchShift` (Phase-Vocoder) |
| Export | Manueller RIFF/WAV-Encoder (Float32 PCM) |
| Abhängigkeiten | Nur Tone.js via CDN – kein npm, kein Build-Schritt |

**Pitch-Parameter:** +9 Halbtöne (≈ Frequenzfaktor 1,68×)

## Browser-Kompatibilität

| Browser | Status |
|---|---|
| Chrome 66+ | ✓ Vollständig |
| Firefox 76+ | ✓ Vollständig |
| Edge 79+ | ✓ Vollständig |
| Safari 14.1+ | ✓ Vollständig |
