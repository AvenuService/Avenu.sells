import { Link, useParams } from "react-router-dom";
import { getJournalPost } from "../data/journal";

export default function StoreJournalPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getJournalPost(slug) : undefined;

  if (!post) {
    return (
      <div className="container" style={{ paddingBlock: "3.5rem 5rem" }}>
        <h1 className="section-title">Post not found</h1>
        <p className="muted">The page you are looking for does not exist.</p>
        <Link to="/store-journal" className="btn btn-ghost btn-sm" style={{ marginTop: "1rem" }}>
          ← Back to the journal
        </Link>
      </div>
    );
  }

  return (
    <article className="container" style={{ paddingBlock: "3.5rem 5rem", maxWidth: "720px" }}>
      <Link to="/store-journal" className="muted" style={{ fontSize: "0.78rem" }}>
        ← Back to the journal
      </Link>
      <p className="eyebrow" style={{ marginTop: "1rem" }}>
        The dispatch
      </p>
      <h1 className="section-title" style={{ margin: "0.5rem 0" }}>
        {post.title}
      </h1>
      <time dateTime={post.date} className="muted">
        {post.date}
      </time>
      <p className="muted" style={{ marginTop: "1rem", lineHeight: 1.7 }}>{post.excerpt}</p>
      <div style={{ marginTop: "1.5rem" }}>
        {post.body.map((para, i) => (
          <p key={i} className="muted" style={{ marginBottom: "1rem", lineHeight: 1.7 }}>
            {para}
          </p>
        ))}
      </div>
    </article>
  );
}
