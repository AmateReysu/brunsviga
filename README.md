# Brunsviga 13 RK Emulator

Eine JavaScript-Applikation zur Emulation der mechanischen Rechenmaschine Brunsviga 13 RK.

## Übersicht

Diese Anwendung bildet die Brunsviga 13 RK Rechenmaschine als vollständige JavaScript-Applikation nach. Benutzer können alle Hebel und Drehbewegungen der original Maschine bedienen und zudem Algorithmen automatisiert ausführen und schrittweise verfolgen.

## Features

### Manuelle Bedienung
- **Einstellwerk**: 13-stelliges Eingaberegister mit Auf-/Ab-Tasten für jede Ziffer
- **Resultatwerk**: 13-stelliger Ergebniszähler mit visueller Anzeige
- **Umdrehungszähler**: 8-stelliger Zähler für die Anzahl der Kurbelumdrehungen
- **Kurbel**: Vorwärts- und Rückwärtsdrehung mit animierter Darstellung
- **Schlitten**: Positions-Steuerung (Links/Rechts)
- **Löschen**: Separate Lösch-Tasten für alle Register

### Automatische Algorithmen
- **Addition**: Automatische Addition zweier Zahlen
- **Subtraktion**: Automatische Subtraktion zweier Zahlen
- **Multiplikation**: Wiederholte Addition zur Multiplikation
- **Division**: Wiederholte Subtraktion zur Division

### Algorithmus-Visualisierung
- Schrittweise Anzeige des Algorithmus-Ablaufs
- Wiedergabe-Steuerung (Play, Pause, Vorwärts, Zurück, Stop)
- Einstellbare Geschwindigkeit (100ms - 2000ms pro Schritt)
- Status-Anzeige mit aktueller Operation
- Liste aller Schritte mit Markierung des aktuellen Schritts

## Installation und Nutzung

### Lokale Ausführung
1. Repository klonen
2. Einen lokalen Webserver starten:
   ```bash
   python3 -m http.server 8000
   ```
3. Browser öffnen und zu `http://localhost:8000/index.html` navigieren

### Dateien
- `index.html` - Hauptseite mit der Benutzeroberfläche
- `brunsviga.js` - JavaScript-Logik für die Maschinen-Emulation
- `styles.css` - Styling und Animationen
- `.gitignore` - Git-Konfiguration

## Benutzung

### Manuelle Rechnung
1. Zahlen im Einstellwerk über die ▲/▼ Tasten oder direkte Eingabe einstellen
2. Kurbel vorwärts (Addition) oder rückwärts (Subtraktion) drehen
3. Ergebnis im Resultatwerk ablesen
4. Bei Bedarf Register mit "Löschen"-Tasten zurücksetzen

### Automatischer Algorithmus
1. Operand A und Operand B eingeben
2. Gewünschte Operation auswählen (Addition, Subtraktion, Multiplikation, Division)
3. Die Schritte werden angezeigt
4. Mit ▶ Abspielen die automatische Ausführung starten
5. Oder mit ⏭ Vorwärts / ⏮ Zurück manuell durch die Schritte navigieren

## Technische Details

- Reine JavaScript-Implementierung ohne externe Abhängigkeiten
- Responsive Design für verschiedene Bildschirmgrößen
- Animationen für visuelles Feedback
- Objektorientierte Architektur (Brunsviga-Klasse)

## Entwickelt für

Studienarbeit zur Nachbildung der Brunsviga 13 RK Rechenmaschine als interaktive Web-Applikation.
