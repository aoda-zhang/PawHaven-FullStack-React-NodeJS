[English](./README.md) | [中文](./README.cn.md) | **Deutsch**

# 🐾 PawHaven – Plattform für Tierrettung und Adoption

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![pnpm](https://img.shields.io/badge/Package-pnpm-F69220?logo=pnpm&logoColor=white)
[![Lizenz: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**PawHaven** ist eine Full-Stack-Plattform zur Unterstützung der **Rettung und Adoption von streunenden Tieren**. Sie bringt freiwillige Helfer, potenzielle Adoptanten und die Community zusammen.

Nutzer können Rettungsfälle melden, den Fortschritt von Rettungsaktionen verfolgen und Erfahrungsberichte teilen. So werden Informationen zu hilfsbedürftigen Tieren sichtbarer und Rettungsaktivitäten besser koordiniert.

Neben der Anwendung selbst ist PawHaven auch ein praxisorientiertes Full-Stack-Engineering-Projekt mit Fokus auf skalierbare Architektur, wartbaren Code und effiziente Entwicklungsabläufe.

---

## 🛠 Voraussetzungen

- **Node.js:** `24.x`
- **pnpm:** `12.x`

Bitte stelle sicher, dass diese Versionen installiert sind, bevor du Abhängigkeiten installierst oder das Projekt startest.

---

## ✨ Hauptfunktionen

- **Verwaltung von Rettungsfällen**  
  Rettungsfälle erstellen und verfolgen, damit freiwillige Helfer Rettungsaktionen koordinieren können.

- **Authentifizierung und Zugriffskontrolle**  
  Sichere Authentifizierung mit JWT und rollenbasierter Zugriffskontrolle.

- **Wissensdatenbank**  
  Zentral verwaltete Ratgeber zur Tierrettung und Informationen zur Adoption.

- **Community und Austausch**  
  Rettungsgeschichten teilen und Erfahrungen innerhalb der Community austauschen.

---

## 🚀 Technologie-Stack und Architektur

| Bereich | Technologien | Schwerpunkt |
| --- | --- | --- |
| Frontend | React, TypeScript, React Query, React Hook Form | Komponentenbasierte und wartbare Frontend-Architektur |
| Backend | Node.js, NestJS | Vier unabhängig deploybare Services |
| Architektur | Monorepo, pnpm Workspaces | Gemeinsame TypeScript-Typen und Pakete |
| Daten und Validierung | MongoDB, Prisma, Zod | Datenzugriff und gemeinsame Schemas |
| Codequalität | ESLint, Prettier, Husky | Einheitliche Standards und Pre-Commit-Prüfungen |
| CI/CD | GitHub Actions | Automatisierte Workflows |

### Backend-Architektur

Das Backend besteht aus vier Services:

- **API Gateway:** Einziger öffentlich erreichbarer Einstiegspunkt für Browser-Anfragen; übernimmt unter anderem Proxying, CORS, Rate Limiting und die Weitergabe interner Identitätsinformationen.
- **Core Service:** Modularer Monolith mit den zentralen Geschäftsmodulen, beispielsweise Rettungsfälle, Adoption und Ratgeber.
- **Auth Service:** Zuständig für Zugangsdaten, Benutzeridentitäten, Sessions und JWT-Ausstellung.
- **Document Service:** Eigenständig deploybarer Service für PDF-Rendering, Dateispeicherung und E-Mail-Versand.

Die Services kommunizieren über HTTP. Innerhalb des Core Service sorgen klar definierte Modulgrenzen für eine wartbare Struktur. Der gesamte externe Datenverkehr läuft über das API Gateway.

---

## 🤖 KI-gestützter Entwicklungsprozess

**`.opencode/`** bildet die KI-gestützte Entwicklungsumgebung von PawHaven. Ein Agent-Orchestrator strukturiert Entwicklungsaufgaben in einen nachvollziehbaren Ablauf:

`Planung → Agenten koordinieren → Tests ausführen → Architektur und Implementierung prüfen → Wissen aktualisieren`

👉 [Entwicklungsumgebung ansehen](./.opencode/) – mit Skills, Slash-Command-Workflows, Agents und verbindlichen Projektregeln.

---

## 📚 Dokumentation

Die Projektdokumentation befindet sich im Verzeichnis [`docs/`](./docs/README.md). Sie ist nach ihrem Zweck gegliedert:

- **`context/`:** System- und Entwicklungsarchitektur sowie verbindliche Entwicklungsmuster.
- **`features/`:** Technische Dokumentation der einzelnen Portal-Funktionen.
- **`product/`:** Produktkonzepte und fachliche Grundlagen.
- **`how-i-build/`:** Hintergründe zum Design-System und zur UI-Komponentenbibliothek.

### Architektur und technische Entscheidungen

| Dokument | Inhalt |
| --- | --- |
| [Systemarchitektur](./docs/context/system-architecture-overview.md) | Services, Pakete, Datenflüsse und Deployment |
| [Frontend-Architektur](./docs/context/frontend-architecture.md) | Frontend-Einheiten und Abhängigkeitsregeln |
| [Backend-Architektur](./docs/context/backend-architecture.md) | Backend-Services, Module und Abhängigkeiten |
| [Design Tokens](./docs/how-i-build/design-tokens.md) | Aufbau und Durchsetzung des Design-Token-Systems |
| [UI-Komponentenbibliothek](./docs/how-i-build/ui-library.md) | Komponenten, Qualitätsprüfungen und Nutzung |

---

## 🧑‍💻 Lokale Entwicklung

Eine Schritt-für-Schritt-Anleitung zum Installieren, Bauen und Starten aller Anwendungen und Services findest du in der [Anleitung zur lokalen Entwicklung](./docs/context/development.md).

Kurz gesagt:

```bash
pnpm install
pnpm build:local
pnpm dev:local
```

---

## 🤝 Community und Beiträge

PawHaven ist ein offenes Projekt, das kontinuierlich weiterentwickelt wird. Wenn du dich für Tierrettung, Open Source oder die technische Weiterentwicklung des Projekts interessierst, bist du herzlich willkommen.

**Du möchtest beitragen?**

1. Erstelle zunächst ein Issue, um deine Idee zu besprechen.
2. Forke das Repository.
3. Erstelle einen Feature-Branch.
4. Reiche einen Pull Request ein.

Du kannst mich auch direkt über [WhatsApp](https://wa.me/8619102632826) kontaktieren, um Ideen und mögliche Beiträge zu besprechen.

**Beiträge und Feedback sind willkommen!**

---

## 📄 Lizenz

PawHaven steht unter der [MIT-Lizenz](./LICENSE).
