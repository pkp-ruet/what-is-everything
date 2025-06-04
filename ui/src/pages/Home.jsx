import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/blogs")
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          setBlogs(response.data);
        } else {
          setError("Failed to load blogs");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch blogs");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="p-6 text-center text-lg text-indigo-600">
        Loading blogs...
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-500 font-medium">{error}</div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-purple-800 mb-10 drop-shadow-sm">
          📚 What is Everything
        </h1>

        <div className="grid sm:grid-cols-2 gap-6">
          {blogs.length === 0 ? (
            <div className="col-span-full text-center text-gray-600">
              No blogs found.
            </div>
          ) : (
            blogs.map((blog) => (
              <Link
                to={`/blog/${blog._id}`}
                key={blog._id}
                className="block p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 border-l-4 border-pink-500 hover:border-purple-500"
              >
                <h2 className="text-lg font-semibold text-gray-800 hover:text-purple-700 transition-colors">
                  {blog.title}
                </h2>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
