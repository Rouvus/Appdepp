# Hierher kommen die Sprachaufnahmen

Dieser Ordner ist absichtlich leer. Solange er leer ist, spricht die App
mit der Sprachausgabe des Geräts — auf iPhones ist die für Koreanisch ab
Werk nicht installiert, dort bleibt der Lautsprecher dann stumm und
erklärt beim Antippen, wie man die Stimme nachlädt.

Sobald hier echte Aufnahmen liegen, schaltet die App von selbst um. Es
ist nichts einzustellen und nichts neu zu programmieren: Sie sucht beim
Start nach `index.json`, und wenn sie eine findet, klingt der Kurs.

## Aufnahmen erzeugen

```
python3 tools/audio-erzeugen.py --key DEIN_SCHLUESSEL
sh build-pwa.sh
```

Der gesamte Kurs sind 728 Texte mit zusammen 4.547 Zeichen — knapp ein
halbes Promille des monatlichen Gratiskontingents von Google. Es
entstehen keine Kosten, und danach wird nie wieder eine Schnittstelle
aufgerufen: Die Dateien liegen dann hier und werden mit ausgeliefert.

`python3 tools/audio-erzeugen.py --dry-run` zählt vorher durch, ohne
etwas zu erzeugen und ohne einen Schlüssel zu brauchen.

## Was hier entsteht

| Datei | Inhalt |
|---|---|
| `index.json` | Verzeichnis aller Aufnahmen — daran erkennt die App, dass es sie gibt |
| `0a1b2c3d.mp3` | eine Aufnahme je Text; der Name ist ein Streuwert über den Text selbst |

Die Namen berechnen App und Skript unabhängig voneinander mit derselben
Formel (FNV-1a, 32 Bit, über die UTF-8-Bytes). Wird eine der beiden
geändert, findet die App die Dateien nicht mehr — dann muss die andere
mitgeändert werden.

## Eine Stimme, nicht mehrere

Wer mittendrin die Stimme wechselt, bekommt einen Kurs, der wie zwei
verschiedene Kurse klingt. Zum Neuerzeugen deshalb den Ordner ganz
leeren, statt ihn zu ergänzen — das Skript überspringt vorhandene
Dateien absichtlich, damit ein abgebrochener Lauf fortsetzbar ist.
