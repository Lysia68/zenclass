// Articles d'actualité Fydelys
// Pour publier un nouvel article : ajouter une entrée en haut de la liste.
// Le contenu (`content`) accepte du HTML simple (<p>, <h2>, <h3>, <ul>, <li>, <strong>, <em>, <a>).

export type Article = {
  slug: string;
  title: string;
  date: string;        // YYYY-MM-DD
  category: string;    // ex: "Conseils", "Nouveautés produit", "Témoignage", "Réglementation"
  excerpt: string;
  cover: string;       // URL image (Unsplash, Supabase storage…)
  readMin?: number;
  content: string;     // HTML
};

export const ARTICLES: Article[] = [
  {
    slug: "rgpd-studios-bien-etre",
    title: "RGPD : ce que tout studio de bien-être doit savoir sur les données adhérents",
    date: "2026-04-15",
    category: "Réglementation",
    excerpt: "Coordonnées, dates de naissance, paiements… Vos fichiers d'adhérents contiennent des données personnelles soumises au RGPD. Voici les bonnes pratiques pour rester en conformité, sans complexité.",
    cover: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=75&auto=format&fit=crop",
    readMin: 5,
    content: `
      <p>Depuis 2018, le règlement européen RGPD impose à toute structure manipulant des données personnelles — y compris votre studio — de protéger ces informations et d'en informer les personnes concernées. Voici l'essentiel pour vous mettre en règle sans paniquer.</p>

      <h2>Quelles données êtes-vous concerné(e) ?</h2>
      <p>Si vous collectez nom, prénom, email, téléphone, date de naissance, adresse ou historique de paiement de vos adhérents, vous traitez des données personnelles. Le simple fait d'avoir un fichier Excel ou un cahier d'inscriptions vous concerne.</p>

      <h2>Les 4 obligations de base</h2>
      <ul>
        <li><strong>Information claire</strong> : indiquez à vos adhérents quelles données vous collectez et pourquoi (gestion de leur abonnement, communication des cours…).</li>
        <li><strong>Consentement</strong> : pour l'envoi d'emails marketing ou newsletters, l'accord doit être explicite.</li>
        <li><strong>Droit d'accès et de suppression</strong> : tout adhérent peut demander à consulter ses données ou à être supprimé.</li>
        <li><strong>Sécurité</strong> : les données doivent être protégées (mot de passe, sauvegardes, hébergement européen).</li>
      </ul>

      <h2>Comment Fydelys vous aide</h2>
      <p>L'ensemble de vos données sont hébergées en Europe (Vercel + Supabase), conformes RGPD par défaut. Les paiements transitent par Stripe (leader mondial certifié PCI-DSS). Vous pouvez exporter ou supprimer la fiche d'un adhérent en un clic.</p>

      <p>Bonus : la création de comptes adhérent se fait par lien magique (sans mot de passe à stocker), réduisant les risques de fuite.</p>
    `,
  },
  {
    slug: "reduire-no-shows",
    title: "Comment réduire les absences imprévues à vos cours collectifs",
    date: "2026-04-08",
    category: "Conseils",
    excerpt: "Les no-shows pénalisent vos coachs et frustrent les adhérents en liste d'attente. Voici 5 leviers concrets pour les diminuer durablement.",
    cover: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=1200&q=75&auto=format&fit=crop",
    readMin: 4,
    content: `
      <p>Un cours à 8 inscrits qui se retrouve à 4 personnes le matin même : c'est démotivant pour vos coachs et injuste pour ceux qui auraient voulu venir. Bonne nouvelle : quelques règles simples permettent de diviser les no-shows par deux.</p>

      <h2>1. Rappel automatique 24h avant</h2>
      <p>Un email ou SMS la veille rappelle l'engagement et permet à l'adhérent qui ne peut plus venir d'annuler à temps. C'est la mesure la plus efficace.</p>

      <h2>2. Délai d'annulation clair</h2>
      <p>Fixez une règle (par exemple : annulation possible jusqu'à 2h avant le cours). Au-delà, le crédit reste consommé. Annoncée gentiment mais clairement, cette règle est très bien acceptée.</p>

      <h2>3. Liste d'attente automatique</h2>
      <p>Quand un cours affiche complet, proposez systématiquement la liste d'attente. Toute annulation tardive promeut automatiquement le suivant — votre cours reste plein.</p>

      <h2>4. Suivi des récidivistes</h2>
      <p>Identifiez les adhérents qui ne viennent jamais à leurs réservations. Un message bienveillant ("Tout va bien ?") suffit souvent à régler la situation.</p>

      <h2>5. Crédits non transférables</h2>
      <p>Évitez les forfaits "illimités" sans contrainte : ils encouragent les réservations sans engagement réel. Un système de crédits responsabilise davantage.</p>

      <p>Avec Fydelys, ces 5 mécanismes sont disponibles dès l'inscription. Vous configurez vos délais d'annulation, vos rappels automatiques et la gestion de liste d'attente en quelques clics.</p>
    `,
  },
  {
    slug: "site-vitrine-studio",
    title: "Faut-il un site web pour son studio ? Les vraies questions à se poser",
    date: "2026-04-01",
    category: "Conseils",
    excerpt: "Wix, WordPress, simple page Facebook ou plateforme spécialisée ? Voici comment choisir sans surinvestir, selon la taille et les ambitions de votre studio.",
    cover: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&q=75&auto=format&fit=crop",
    readMin: 5,
    content: `
      <p>"J'ai besoin d'un site, mais je ne sais pas par où commencer." C'est l'une des questions les plus fréquentes que nous recevons de gérants de studios. Voici une grille de décision simple.</p>

      <h2>1. À quoi va vraiment servir votre site ?</h2>
      <ul>
        <li><strong>Vitrine pure</strong> (présentation, contact) : une simple page Facebook ou Google Maps bien renseignée peut suffire.</li>
        <li><strong>Réservation en ligne</strong> : indispensable de passer à un outil dédié — un site Wix sans système de réservation vous fera perdre du temps.</li>
        <li><strong>Vente d'abonnements</strong> : il faut une intégration paiement sécurisée. Wix le permet, mais demande de tout configurer manuellement.</li>
      </ul>

      <h2>2. Qui va le maintenir ?</h2>
      <p>Si vous (ou un proche) n'êtes pas à l'aise avec WordPress, oubliez. Un site jamais mis à jour fait plus de mal que de bien. Préférez une solution clés en main avec interface simple.</p>

      <h2>3. Quel budget réaliste ?</h2>
      <p>Comptez 100-300€ pour un site Wix (mais sans réservation), ou 1500-3000€ pour un site WordPress sur mesure. Une plateforme tout-en-un comme Fydelys revient à environ 200-400€/an, avec réservations + paiements + planning inclus.</p>

      <h2>Notre recommandation</h2>
      <p>Pour 90% des studios, une plateforme spécialisée (Fydelys, Liberfit, Resamania…) est plus rentable qu'un site sur mesure. Vous obtenez une vitrine professionnelle (votre-nom.fydelys.fr), un planning public, des inscriptions et des paiements en ligne — sans rien à coder ni à entretenir.</p>
    `,
  },
  {
    slug: "fidelisation-adherents",
    title: "5 idées simples pour fidéliser vos adhérents sur la durée",
    date: "2026-03-22",
    category: "Conseils",
    excerpt: "L'acquisition coûte cher. La fidélisation est rentable. Voici 5 actions concrètes que vous pouvez mettre en place dès cette semaine, sans budget marketing.",
    cover: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=75&auto=format&fit=crop",
    readMin: 4,
    content: `
      <p>Acquérir un nouvel adhérent coûte 5 à 7 fois plus cher que de fidéliser un existant. Pourtant, la plupart des studios concentrent leur énergie sur l'acquisition. Voici 5 leviers simples pour rééquilibrer.</p>

      <h2>1. Le message du 1er mois</h2>
      <p>30 jours après l'inscription, envoyez un email personnel : "Comment se passe votre découverte ? Y a-t-il un cours qui vous a particulièrement plu ?" 80% n'attendaient que ça pour se sentir reconnus.</p>

      <h2>2. Le rappel du 90e jour</h2>
      <p>Au 3e mois, un adhérent qui n'est plus venu depuis 2-3 semaines est sur le point de partir. Un message bienveillant à ce moment précis sauve la moitié des départs.</p>

      <h2>3. Un anniversaire qui marque</h2>
      <p>Une séance offerte le jour de l'anniversaire, ou simplement un message personnalisé : c'est l'attention qui compte, pas la valeur du cadeau.</p>

      <h2>4. Le programme de parrainage</h2>
      <p>"Parrainez un proche, recevez 1 séance offerte." Simple, viral, mesurable. Les parrainés ont en moyenne 3x plus de chances de rester clients à 6 mois.</p>

      <h2>5. Le rendez-vous trimestriel</h2>
      <p>Tous les 3 mois, prenez 5 minutes avec un adhérent pour faire un point. Ses objectifs ont-ils évolué ? Le format actuel lui convient-il toujours ? C'est la base d'une vraie relation.</p>

      <p>Avec Fydelys, vous identifiez en un clic les adhérents inactifs depuis X jours, et déclenchez des séquences d'emails personnalisées.</p>
    `,
  },
  {
    slug: "lancement-fydelys",
    title: "Bienvenue sur Fydelys",
    date: "2026-03-15",
    category: "Nouveautés produit",
    excerpt: "Nous lançons Fydelys, la plateforme française dédiée à la gestion des studios de yoga, pilates et bien-être. Notre mission : vous faire gagner du temps pour ce qui compte vraiment.",
    cover: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=75&auto=format&fit=crop",
    readMin: 3,
    content: `
      <p>Après plus d'un an de développement avec des studios partenaires, nous avons le plaisir de vous présenter <strong>Fydelys</strong>, une plateforme tout-en-un pensée par et pour les gérants de studios de bien-être en France.</p>

      <h2>Pourquoi Fydelys ?</h2>
      <p>Les outils existants étaient soit trop chers, soit trop génériques, soit conçus pour les salles de fitness américaines. Aucun ne répondait vraiment aux besoins d'un studio de yoga ou de pilates de quartier : interface simple, langue française, support réactif, tarif accessible.</p>

      <h2>Ce que vous trouverez chez nous</h2>
      <ul>
        <li>Un planning hebdomadaire visuel et facile à gérer</li>
        <li>Une fiche adhérent complète avec abonnements et historique</li>
        <li>Des paiements sécurisés en ligne (Stripe)</li>
        <li>Une page vitrine personnalisée (votre-nom.fydelys.fr)</li>
        <li>Un espace adhérent sans mot de passe (lien magique par email)</li>
        <li>Des rappels automatiques avant chaque cours</li>
      </ul>

      <h2>Et ensuite ?</h2>
      <p>Nous publierons régulièrement des conseils, des nouveautés produit et des retours d'expérience de studios partenaires. Suivez notre actualité, et n'hésitez pas à nous écrire pour nous faire part de vos besoins — c'est ce qui guide notre roadmap.</p>

      <p>Bienvenue dans la communauté Fydelys.</p>
    `,
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find(a => a.slug === slug);
}
