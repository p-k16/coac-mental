# Coach mental badminton — v0.2.0 (étapes 1 et 2)

## Contenu
- Bouton **URGENCE** : routine guidée de 30 s (souffle 2 × 4 s/6 s, relâchement, cible, phrase-clé).
- **Mode match** : minuteurs de 60 s (pause à 11 points) et 120 s (entre sets), bip à 10 s de la fin et à la fin, écran maintenu allumé.
- **Réglages** : routine et minuteurs modifiables.
- **Diagnostic** : état technique, mesures de vitesse, journal d'erreurs (remplace l'inspecteur Safari).
- Fonctionne hors ligne après la première ouverture.

## Nouveautés v0.2.0 (étape 2)
- **Check-in** quotidien : stress, énergie, humeur, tension (0-10), sommeil, événement clé, note libre. Étiquettes détectées automatiquement dans la note, corrigeables.
- **Accueil** : état du jour (écart à ta moyenne sur 28 jours dès 7 check-ins), série de jours, compte à rebours du prochain tournoi, rappel de sauvegarde hebdomadaire.
- **Journal de match** : contexte, stress et objectif avant le match, score vérifié (21 points, 2 d'écart, max 30), points décisifs (score, gagné/perdu, type), débrief en 3 temps.
- **Tournois** : calendrier avec importance et disciplines.
- **Sauvegarde** : export en fichier JSON (Enregistrer dans Fichiers), restauration.

## Mettre à jour le site avec une nouvelle version
1. Décompresse le nouveau `coach-mental.zip`.
2. Sur la page de ton dépôt GitHub : **Add file**, puis **Upload files**.
3. Glisse **le contenu** du dossier décompressé (dossiers compris) dans la zone. Les fichiers existants sont remplacés. Puis **Commit changes**.
4. Attends 2 minutes, ouvre l'app sur l'iPhone, touche **Mettre à jour** dans la bannière (si elle n'apparaît pas : ferme l'app complètement et rouvre-la, jusqu'à 2 fois). Vérifie dans Diagnostic que la version est 0.2.0.

## Mise en ligne initiale (une seule fois, environ 10 min, depuis un ordinateur)
1. Décompresse `coach-mental.zip`.
2. Sur github.com : bouton **+** en haut à droite, puis **New repository**.
   Nom : `coach-mental`. Visibilité : **Public** (obligatoire pour GitHub Pages gratuit ; le dépôt ne contient ni données ni clé). Ne coche rien d'autre, puis **Create repository**.
3. Sur la page du dépôt vide : lien **uploading an existing file**. Glisse **le contenu** du dossier décompressé (les dossiers `css`, `icons`, `js` et les fichiers `index.html`, `manifest.webmanifest`, `sw.js`, `.nojekyll`, `README.md`), pas le dossier lui-même. Sous Windows, affiche les fichiers cachés pour voir `.nojekyll` (Explorateur, **Affichage**, **Éléments masqués**). Puis **Commit changes**.
4. **Settings**, puis **Pages** dans le menu de gauche. Source : **Deploy from a branch** ; Branch : **main**, dossier **/ (root)**, puis **Save**.
5. Attends 1 à 2 minutes et recharge cette page : l'adresse s'affiche, de la forme `https://TON-PSEUDO.github.io/coach-mental/`.

## Installation sur l'iPhone
1. Ouvre l'adresse dans **Safari** (pas Chrome : seul Safari installe les PWA de façon fiable).
2. Bouton **Partager**, puis **Sur l'écran d'accueil**, puis **Ajouter**.
3. Lance l'app **depuis l'icône** « Coach ». Toujours depuis l'icône : dans un onglet Safari, les données sont stockées séparément.

## Mises à jour
Quand une nouvelle version est en ligne, ouvre l'app : une bannière « Nouvelle version disponible » apparaît sur l'accueil (parfois après une deuxième ouverture). Touche **Mettre à jour**. Le numéro de version est affiché dans Diagnostic.

## Tests à faire sur l'iPhone (critères de réussite)
Fais-les dans l'ordre. Note ✅ ou ❌ pour chacun.

| # | Test | Réussi si |
|---|---|---|
| 1 | Ouvre l'app depuis l'icône, puis **Diagnostic** | « Lancée depuis l'écran d'accueil : oui », « Service worker actif : oui », « IndexedDB : OK » |
| 2 | Active le **mode avion**, ferme l'app (balaye-la vers le haut dans le sélecteur d'apps), rouvre-la | L'accueil s'affiche |
| 3 | Mode avion toujours actif : touche **URGENCE** | La routine démarre immédiatement ; le cercle grossit sur l'inspiration (4 s) et rétrécit sur l'expiration (6 s) ; fin à 30 s avec « Routine terminée » |
| 4 | **Diagnostic**, ligne « Tap urgence → routine affichée » | Moins de 1000 ms (normalement moins de 100 ms) |
| 5 | Mode match : lance le minuteur **120 s** et, en même temps, le chronomètre de l'app Horloge. Revient dans Coach, verrouille l'iPhone 60 s, déverrouille, rouvre Coach | Temps restant = 120 − chrono, à ±1 s près |
| 6 | Lance le minuteur **60 s**, pose le téléphone sans y toucher | L'écran ne s'éteint pas avant la fin. Si ton verrouillage automatique est réglé sur 30 s et que l'écran s'éteint : ❌, note ce que Diagnostic indique à la ligne « Wake Lock » |
| 7 | Mode sonnerie activé (interrupteur latéral), minuteur 60 s | 1 bip à 10 s de la fin, 3 bips à la fin, écran qui clignote en orange |
| 8 | Pendant un minuteur, touche **URGENCE** | La routine affiche en haut le temps restant du minuteur |
| 9 | Réglages : mets 3 cycles, **Enregistrer**, ferme et rouvre l'app | La valeur 3 est conservée, la routine dure 40 s |

**En cas d'échec** : Diagnostic, **Copier tout**, puis colle-moi le texte avec le numéro du test.

## Tests de l'étape 2
| # | Test | Réussi si |
|---|---|---|
| 10 | Accueil, **Faire mon check-in**. Mets le stress à 8, écris dans la note « mal dormi, peur de rater au tournoi » | Les étiquettes Sommeil, Peur de l'erreur et Enjeu s'allument toutes seules |
| 11 | **Enregistrer** | Retour à l'accueil, carte « Aujourd'hui » avec stress 8, « Série : 1 j » |
| 12 | Ferme l'app complètement, rouvre-la | Le check-in est toujours là |
| 13 | **Tournois**, ajoute ton prochain tournoi | Il apparaît sur l'accueil avec « J-x » correct |
| 14 | **Journal**, **Nouveau match** : saisis 21-18, 19-21, 25-24 | Message « set 3 impossible ». Corrige en 24-22 : « victoire » |
| 15 | Ajoute un point décisif (19-20, Perdu, Faute filet), remplis le débrief, **Enregistrer** | Le match apparaît dans la liste avec « V » |
| 16 | **Sauvegarde**, **Préparer**, **Enregistrer le fichier**, puis **Enregistrer dans Fichiers** (iCloud Drive) | Le fichier `coach-sauvegarde-AAAA-MM-JJ.json` est dans l'app Fichiers ; la bannière de sauvegarde disparaît de l'accueil |
| 17 | **Sauvegarde**, **Choisir un fichier**, prends ce fichier | Le résumé indique 1 check-in et 1 match (ne touche pas « Remplacer » sauf pour tester : ça remplace tout) |
| 18 | Mode avion, ouvre Journal et Check-in | Tout fonctionne |

## Limites connues
- Pas de vibration : iOS ne l'autorise pas pour les web apps.
- Pas de bip si l'iPhone est en mode silencieux.
- Écran verrouillé, rien ne s'affiche ni ne sonne ; le temps reste exact au retour.
