import { useLocation, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

function BlogDetail() {
  const { state } = useLocation();
  const { id } = useParams();
  const [blog, setBlog] = useState(state?.blog || null);
  const [loading, setLoading] = useState(!state?.blog);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!blog) {
      fetch(`http://localhost:3000/api/blogs/${id}`)
        .then((res) => res.json())
        .then((response) => {
          if (response.success) {
            setBlog(response.data);
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

  if (loading) return <div className="p-6 text-center">Loading blog...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!blog) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Blogs
      </Link>
      <div dangerouslySetInnerHTML={{ __html: blog.content }} />
    </div>
  );
}

export default BlogDetail;
