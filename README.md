# Manga Tagger

Application web locale développée avec React et Vite, conçue pour faciliter et accélérer le processus d'annotation et de classification de pages de magazines numérisés. L'outil intègre une interface ergonomique optimisée pour l'utilisation au clavier, ainsi qu'une détection automatique des propriétés des images.

## Fonctionnalités principales

*   **Annotation rapide par raccourcis clavier :** Mapping pensé pour un clavier AZERTY. Les actions les plus fréquentes sont regroupées sous la main gauche en position de repos (A, Z, E, D) pour minimiser la fatigue.
*   **Analyse d'image embarquée :** Détection automatique des pages en couleurs ou en noir et blanc via l'analyse des pixels, et calcul d'une empreinte visuelle (dHash perceptuel) pour chaque page.
*   **Filtres de navigation :** Tri des pages selon leur état d'annotation (labellisé / sans label) et leur colorimétrie (couleur / N&B).
*   **Assignation en masse :** Possibilité de sélectionner une plage de pages ou de combler automatiquement toutes les pages restantes avec un label dominant (ex: "Manga").
*   **Persistance des données :** Sauvegarde hybride garantissant qu'aucune donnée n'est perdue. Les données sont conservées dans le `localStorage` du navigateur et synchronisées en temps réel sur le disque via une API locale.
*   **Restauration automatique :** En cas de vidage du cache du navigateur, l'application recharge automatiquement les données depuis les fichiers de sauvegarde locaux au démarrage.

## Structure des données

L'application génère et lit deux fichiers de sauvegarde à la racine du projet :

*   `data_annotations.json` : Contient la structure des données métier (chemin du fichier, catégorie assignée, métadonnées du magazine, empreinte dHash).
*   `data_cache.json` : Agit comme un système de mise en cache technique évitant de recalculer la colorimétrie et le hash à chaque rechargement de l'application.

## Raccourcis clavier (AZERTY)

Afin de fluidifier le travail d'annotation, la souris n'est requise que pour des actions spécifiques. La catégorisation se fait au clavier.

**Navigation :**
*   `Flèche Gauche` : Page précédente
*   `Flèche Droite` : Page suivante

**Labels fréquents (Position de repos ergonomique) :**
*   `A` : Couverture
*   `Z` : Gravure
*   `E` : Manga
*   `D` : Publicité

**Labels secondaires (Approche mnémotechnique) :**
*   `S` : Sommaire
*   `R` : Article / Édito (Rédaction)
*   `C` : Concours
*   `B` : Bonus
*   `L` : LineUp
*   `X` : Autre