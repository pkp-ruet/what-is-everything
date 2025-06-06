import { useLocation, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./BlogDetail.css";

function BlogDetail() {
  const { state } = useLocation();
  const { id } = useParams();

  const [blog, setBlog] = useState(state?.blog || null);
  const [loading, setLoading] = useState(!state?.blog);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!blog) {
      setLoading(true);
      fetch(`http://localhost:3000/api/blogs/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((response) => {
          if (response.success) {
            setBlog(response.data);
            setError(null);
          } else {
            setError("Failed to load blog");
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to fetch blog");
          setLoading(false);
        });
    }
  }, [id, blog]);

  if (loading)
    return <div className="blog-detail-loading">Loading blog...</div>;

  if (error) return <div className="blog-detail-error">{error}</div>;

  if (!blog) return <div className="blog-detail-error">Blog not found.</div>;

  return (
    <div className="blog-detail-container">
      <Link to="/" className="blog-detail-back-link">
        ← Back to Blogs
      </Link>
      <h1 className="blog-detail-title">{blog.title}</h1>
      <div
        className="blog-detail-content"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </div>
  );
}

export default BlogDetail;
