import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, getArticleBySlug } from "@/lib/actualites";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return ARTICLES.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticleBySlug(slug);
  if (!a) return { title: "Article introuvable — Fydelys" };
  return {
    title: `${a.title} — Fydelys`,
    description: a.excerpt,
    openGraph: {
      title: a.title,
      description: a.excerpt,
      images: [a.cover],
      type: "article",
      publishedTime: a.date,
    },
  };
}

function fmtDate(s: string) {
  return new Date(s + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  // 3 articles récents (hors article courant)
  const others = ARTICLES.filter(a => a.slug !== slug)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

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
        body{background:var(--bg);color:var(--text);font-family:var(--B);line-height:1.65;-webkit-font-smoothing:antialiased;}
        a{color:inherit;text-decoration:none;}
        nav.act{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;padding:0 40px;display:flex;align-items:center;justify-content:space-between;background:rgba(244,239,232,.93);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);}
        .nav-logo-name{font-family:var(--D);font-size:22px;font-weight:700;color:var(--text);letter-spacing:-.3px;}
        .nav-cta{padding:9px 20px;background:var(--btn);border-radius:9px;font-size:14px;font-weight:600;color:#fff;box-shadow:0 2px 8px rgba(154,96,48,.3);}
        .cover{position:relative;width:100%;height:clamp(280px,40vw,440px);background-size:cover;background-position:center;margin-top:64px;}
        .cover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(244,239,232,0) 60%,var(--bg) 100%);}
        .article{max-width:760px;margin:-90px auto 0;padding:48px 40px 64px;background:var(--surface);border:1.5px solid var(--border);border-radius:20px;position:relative;z-index:1;box-shadow:0 24px 60px rgba(42,31,20,.08);}
        .meta{display:flex;align-items:center;gap:10px;margin-bottom:18px;font-size:11px;color:var(--soft);text-transform:uppercase;letter-spacing:.6px;font-weight:600;flex-wrap:wrap;}
        .meta-cat{background:rgba(196,146,42,.13);color:var(--accent);padding:3px 10px;border-radius:10px;}
        .title{font-family:var(--D);font-size:clamp(28px,5vw,46px);font-weight:700;line-height:1.1;letter-spacing:-1px;color:var(--text);margin-bottom:18px;}
        .excerpt{font-size:18px;color:var(--mid);line-height:1.6;margin-bottom:32px;font-style:italic;border-left:3px solid var(--accent);padding-left:18px;}
        .content p{font-size:16px;color:var(--mid);line-height:1.85;margin-bottom:18px;}
        .content h2{font-family:var(--D);font-size:26px;font-weight:700;color:var(--text);margin:36px 0 12px;letter-spacing:-.4px;}
        .content h3{font-size:18px;font-weight:700;color:var(--text);margin:24px 0 8px;}
        .content ul{margin:0 0 18px 22px;}
        .content li{font-size:16px;color:var(--mid);line-height:1.8;margin-bottom:6px;}
        .content strong{color:var(--text);font-weight:700;}
        .content a{color:var(--accent);font-weight:600;border-bottom:1px solid rgba(160,104,56,.4);}
        .related{max-width:1100px;margin:0 auto;padding:64px 40px 96px;}
        .related-h{font-family:var(--D);font-size:28px;font-weight:700;letter-spacing:-.5px;color:var(--text);margin-bottom:24px;text-align:center;}
        .related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .rcard{background:var(--surface);border:1.5px solid var(--border);border-radius:14px;overflow:hidden;transition:transform .25s,box-shadow .25s;}
        .rcard:hover{transform:translateY(-3px);box-shadow:0 16px 32px rgba(42,31,20,.08);}
        .rcard-img{height:140px;background-size:cover;background-position:center;}
        .rcard-body{padding:14px 16px 16px;}
        .rcard-title{font-family:var(--D);font-size:16px;font-weight:700;line-height:1.25;color:var(--text);margin-bottom:6px;}
        .rcard-date{font-size:11px;color:var(--soft);}
        .cta-band{background:linear-gradient(135deg,#2A1F14 0%,#3D2E1E 50%,#2A1F14 100%);padding:48px 32px;text-align:center;color:#F4EFE8;border-radius:18px;margin-top:36px;}
        .cta-band h3{font-family:var(--D);font-size:28px;font-weight:700;margin-bottom:10px;letter-spacing:-.5px;}
        .cta-band p{font-size:14px;color:rgba(244,239,232,.7);margin-bottom:20px;}
        .cta-band a{display:inline-block;padding:13px 28px;background:var(--btn);border-radius:11px;color:#fff;font-weight:700;font-size:14px;}
        footer{border-top:1px solid var(--border);padding:32px 24px;text-align:center;font-size:12px;color:var(--muted);}
        footer a{color:var(--accent);font-weight:600;}
        @media(max-width:880px){
          nav.act{padding:0 18px;}
          .article{margin:-50px 18px 0;padding:32px 24px;}
          .related{padding:48px 18px 64px;}
          .related-grid{grid-template-columns:1fr;}
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap" />

      <nav className="act">
        <Link href="/" className="nav-logo-name">Fydelys</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/actualites" style={{ fontSize: 13, color: "var(--mid)" }}>← Toutes les actualités</Link>
          <Link href="/login?tab=register" className="nav-cta">Démarrer l'essai</Link>
        </div>
      </nav>

      <div className="cover" style={{ backgroundImage: `url(${article.cover})` }} />

      <article className="article">
        <div className="meta">
          <span className="meta-cat">{article.category}</span>
          <span>{fmtDate(article.date)}</span>
          {article.readMin && <span>· {article.readMin} min de lecture</span>}
        </div>
        <h1 className="title">{article.title}</h1>
        <p className="excerpt">{article.excerpt}</p>
        <div className="content" dangerouslySetInnerHTML={{ __html: article.content }} />

        <div className="cta-band">
          <h3>Vous gérez un studio de bien-être&nbsp;?</h3>
          <p>Découvrez Fydelys gratuitement pendant 15 jours, sans carte bancaire.</p>
          <Link href="/login?tab=register">Démarrer l'essai →</Link>
        </div>
      </article>

      {others.length > 0 && (
        <section className="related">
          <h2 className="related-h">À lire également</h2>
          <div className="related-grid">
            {others.map(a => (
              <Link key={a.slug} href={`/actualites/${a.slug}`} className="rcard">
                <div className="rcard-img" style={{ backgroundImage: `url(${a.cover})` }} />
                <div className="rcard-body">
                  <div className="rcard-title">{a.title}</div>
                  <div className="rcard-date">{fmtDate(a.date)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer>
        © 2026 Fydelys · <Link href="/">Accueil</Link> · <Link href="/actualites">Actualités</Link>
      </footer>
    </>
  );
}
