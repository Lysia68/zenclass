import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/lib/actualites";

export const metadata: Metadata = {
  title: "Actualités — Fydelys",
  description: "Conseils, nouveautés produit et bonnes pratiques pour les studios de yoga, pilates et bien-être.",
};

function fmtDate(s: string) {
  return new Date(s + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function ActualitesPage() {
  const sorted = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));
  const [featured, ...rest] = sorted;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --bg:#F4EFE8;--bg2:#EDE7DD;--surface:#FDFAF7;
          --border:rgba(160,104,56,.15);--border2:rgba(160,104,56,.1);
          --text:#2A1F14;--mid:#5C4A38;--soft:#8C7B6C;--muted:#B0A090;
          --accent:#A06838;--gold:#C4922A;
          --btn:linear-gradient(145deg,#B88050,#9A6030);
          --D:'Cormorant Garamond',Georgia,serif;
          --B:'DM Sans',system-ui,sans-serif;
        }
        body{background:var(--bg);color:var(--text);font-family:var(--B);line-height:1.6;-webkit-font-smoothing:antialiased;}
        a{color:inherit;text-decoration:none;}
        nav.act{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;padding:0 40px;display:flex;align-items:center;justify-content:space-between;background:rgba(244,239,232,.93);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);}
        .nav-logo{display:flex;align-items:center;gap:10px;}
        .nav-logo-name{font-family:var(--D);font-size:22px;font-weight:700;color:var(--text);letter-spacing:-.3px;}
        .nav-cta{padding:9px 20px;background:var(--btn);border-radius:9px;font-size:14px;font-weight:600;color:#fff;box-shadow:0 2px 8px rgba(154,96,48,.3);}
        .nav-back{font-size:13px;color:var(--mid);}
        .nav-back:hover{color:var(--accent);}
        .hero{padding:120px 24px 48px;text-align:center;max-width:760px;margin:0 auto;}
        .hero-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--accent);margin-bottom:14px;}
        .hero-h{font-family:var(--D);font-size:clamp(36px,6vw,60px);font-weight:700;line-height:1.05;letter-spacing:-1.5px;color:var(--text);margin-bottom:18px;}
        .hero-sub{font-size:17px;color:var(--soft);max-width:520px;margin:0 auto;line-height:1.65;}
        .wrap{max-width:1100px;margin:0 auto;padding:0 24px 96px;}
        .featured{display:grid;grid-template-columns:1.2fr 1fr;gap:32px;background:var(--surface);border:1.5px solid var(--border);border-radius:20px;overflow:hidden;margin-bottom:48px;box-shadow:0 12px 40px rgba(42,31,20,.06);}
        .featured-img{height:100%;min-height:320px;background-size:cover;background-position:center;}
        .featured-body{padding:36px 36px;display:flex;flex-direction:column;justify-content:center;}
        .meta{display:flex;align-items:center;gap:10px;margin-bottom:14px;font-size:11px;color:var(--soft);text-transform:uppercase;letter-spacing:.6px;font-weight:600;}
        .meta-cat{background:rgba(196,146,42,.13);color:var(--accent);padding:3px 10px;border-radius:10px;}
        .featured-title{font-family:var(--D);font-size:clamp(24px,3vw,32px);font-weight:700;line-height:1.15;color:var(--text);margin-bottom:14px;letter-spacing:-.5px;}
        .featured-excerpt{font-size:14.5px;color:var(--soft);line-height:1.7;margin-bottom:20px;}
        .read-more{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:var(--accent);}
        .read-more:hover{gap:10px;}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .card{background:var(--surface);border:1.5px solid var(--border);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s;}
        .card:hover{transform:translateY(-3px);box-shadow:0 18px 36px rgba(42,31,20,.08);}
        .card-img{height:170px;background-size:cover;background-position:center;}
        .card-body{padding:18px 20px 20px;display:flex;flex-direction:column;flex:1;}
        .card-title{font-family:var(--D);font-size:18px;font-weight:700;line-height:1.25;color:var(--text);margin-bottom:8px;letter-spacing:-.3px;}
        .card-excerpt{font-size:13px;color:var(--soft);line-height:1.6;margin-bottom:14px;flex:1;}
        footer{border-top:1px solid var(--border);padding:32px 24px;text-align:center;font-size:12px;color:var(--muted);}
        footer a{color:var(--accent);font-weight:600;}
        @media(max-width:880px){
          nav.act{padding:0 18px;}
          .featured{grid-template-columns:1fr;}
          .featured-img{min-height:220px;}
          .featured-body{padding:24px;}
          .grid{grid-template-columns:1fr;}
          .hero{padding:100px 18px 40px;}
          .wrap{padding:0 18px 64px;}
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap" />

      <nav className="act">
        <Link href="/" className="nav-logo">
          <span className="nav-logo-name">Fydelys</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/" className="nav-back">← Accueil</Link>
          <Link href="/login?tab=register" className="nav-cta">Démarrer l'essai</Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-tag">✦ Le journal Fydelys</div>
        <h1 className="hero-h">Actualités &amp; conseils</h1>
        <p className="hero-sub">Bonnes pratiques, retours d'expérience et nouveautés produit pour les studios de bien-être.</p>
      </header>

      <main className="wrap">
        {/* Article en vedette */}
        {featured && (
          <Link href={`/actualites/${featured.slug}`} className="featured">
            <div className="featured-img" style={{ backgroundImage: `url(${featured.cover})` }} />
            <div className="featured-body">
              <div className="meta">
                <span className="meta-cat">{featured.category}</span>
                <span>{fmtDate(featured.date)}</span>
                {featured.readMin && <span>· {featured.readMin} min de lecture</span>}
              </div>
              <h2 className="featured-title">{featured.title}</h2>
              <p className="featured-excerpt">{featured.excerpt}</p>
              <span className="read-more">Lire l'article →</span>
            </div>
          </Link>
        )}

        {/* Grille des autres articles */}
        {rest.length > 0 && (
          <div className="grid">
            {rest.map(a => (
              <Link key={a.slug} href={`/actualites/${a.slug}`} className="card">
                <div className="card-img" style={{ backgroundImage: `url(${a.cover})` }} />
                <div className="card-body">
                  <div className="meta">
                    <span className="meta-cat">{a.category}</span>
                    <span>{fmtDate(a.date)}</span>
                  </div>
                  <h3 className="card-title">{a.title}</h3>
                  <p className="card-excerpt">{a.excerpt}</p>
                  <span className="read-more">Lire →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer>
        © 2026 Fydelys · <Link href="/">Retour à l'accueil</Link>
      </footer>
    </>
  );
}
