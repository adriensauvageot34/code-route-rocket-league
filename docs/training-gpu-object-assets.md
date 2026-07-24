# Assets des futurs objets GPU Training

Chaque objet peut contenir plusieurs `alignmentGroup`. Seuls les calques réellement alignés partagent un crop : ils doivent alors conserver les mêmes dimensions source, `crop`, dimensions finales, padding et espace de placement.

Groupes définis depuis les dimensions réelles :

- chaque effet de voiture possède son propre groupe d’alignement ;
- le ballon sépare le groupe base/énergie 1672 × 941 du groupe volume 1254 × 1254 ;
- la surface Fennec utilise `fennec-surface-frame`, tandis que son contour reste dans l’espace `scene`.

`crop.x` et `crop.y` conservent la position du rectangle dans l’image source originale. Un crop ne recentre jamais l’objet dans la scène : le renderer reconstruira mathématiquement son placement dans le repère logique 1672 × 941, puis appliquera l’espace `scene`, `grounded-scene`, `target-frame`, `fennec-surface-frame` ou `fennec-impact-frame`.

Conserver les images originales. Les futurs fichiers recadrés seront placés dans `public/ui/training-objects`, sans supprimer les PNG historiques nécessaires au fallback DOM. Le premier recadrage ne doit effectuer aucun redimensionnement et doit préserver l’alpha. WebP lossless est recommandé pour les surfaces et contours ; PNG reste autorisé pour tout fichier dont les bords sont dégradés par WebP.

Arborescence cible :

```text
public/ui/training-objects/
  left-car/
    manifest.json
    base.webp
    volume-surface.webp
    volume-contour.webp
    tactical-wireframe.webp
    tactical-glow.webp
  back-right-car/
    manifest.json
    base.webp
    volume-surface.webp
    volume-contour.webp
    tactical-wireframe.webp
    tactical-glow.webp
  front-right-car/
    manifest.json
    base.webp
    volume-surface.webp
    volume-contour.webp
    tactical-wireframe.webp
    tactical-glow.webp
  ball/
    manifest.json
    base.webp
    volume-surface.webp
    volume-contour.webp
    tactical-energy.webp
  fennec/
    manifest.json
    base.webp
    volume-surface.webp
    volume-contour.webp
    tactical-impact.webp
    headlight-glow.webp
    rear-accent.webp
```

Tous les rôles d’un même `alignmentGroup` doivent avoir les mêmes dimensions finales. Un fichier particulier peut rester en PNG lorsque la comparaison WebP n’est pas satisfaisante.
