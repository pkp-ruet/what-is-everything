import { useEffect, useState } from "react";
import "./Home.css"; // Import the CSS file

function Home() {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorList, setErrorList] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);

  useEffect(() => {
    // Fetch blog list when the component mounts
    fetch("http://localhost:3000/api/blogs")
      .then((res) => {
        if (!res.ok) {
          // Handle HTTP errors (e.g., 404, 500)
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((response) => {
        if (response.success) {
          setBlogs(response.data);
        } else {
          // Handle API-specific errors (e.g., response.success is false)
          setErrorList(response.message || "Failed to load blogs");
        }
        setLoadingList(false);
      })
      .catch((e) => {
        // Handle network errors
        setErrorList(`Failed to fetch blogs: ${e.message}`);
        setLoadingList(false);
      });
  }, []); // Empty dependency array ensures this runs once on mount

  const handleBlogClick = (blog) => {
    // Set a preliminary selected blog to show title quickly
    // Clear content to show loading state if previous blog was selected
    setSelectedBlog({ ...blog, content: null });
    setLoadingDetail(true);
    setErrorDetail(null); // Clear any previous detail errors

    // Fetch full blog content
    fetch(`http://localhost:3000/api/blogs/${blog._id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((response) => {
        if (response.success) {
          setSelectedBlog({ ...response.data }); // Update with full content
        } else {
          setErrorDetail(response.message || "Failed to load blog content");
        }
        setLoadingDetail(false);
      })
      .catch((e) => {
        setErrorDetail(`Failed to fetch blog content: ${e.message}`);
        setLoadingDetail(false);
      });
  };

  return (
    <div className={`home-container ${selectedBlog ? "detail-open" : ""}`}>
      {/* Blog List Panel */}
      <div className="blog-list">
        <h1 className="main-title">What is Everything</h1>
        {loadingList ? (
          <div className="loading">Loading ancient texts...</div>
        ) : errorList ? (
          <div className="error">{errorList}</div>
        ) : (
          <ul>
            {blogs.map((blog) => (
              <li
                key={blog._id}
                onClick={() => handleBlogClick(blog)}
                // Add 'active' class if this blog is currently selected
                className={`blog-item ${
                  selectedBlog && selectedBlog._id === blog._id ? "active" : ""
                }`}
                // ARIA attribute for accessibility (optional, but good practice)
                aria-pressed={selectedBlog && selectedBlog._id === blog._id}
              >
                {blog.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Blog Detail Panel */}
      <div className="blog-detail">
        {/* Collapse button, visible only when a blog is selected */}
        <button
          className="collapse-btn"
          onClick={() => setSelectedBlog(null)}
          aria-label="Close blog detail"
          style={{
            visibility: selectedBlog ? "visible" : "hidden", // Hide if no blog is selected
            opacity: selectedBlog ? 1 : 0, // Fade in/out
            pointerEvents: selectedBlog ? "auto" : "none", // Disable interaction when hidden
          }}
        >
          ←
        </button>

        {/* Conditional rendering for detail content */}
        {selectedBlog ? (
          <>
            {loadingDetail ? (
              <p className="loading-detail">Retrieving ancient wisdom...</p>
            ) : errorDetail ? (
              <p className="error-detail">{errorDetail}</p>
            ) : (
              <>
                <div
                  className="blog-content"
                  // !! IMPORTANT: Use dangerouslySetInnerHTML with caution !!
                  // Ensure `selectedBlog.content` is sanitized on the server-side
                  // or from a trusted source to prevent XSS attacks.
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />
              </>
            )}
          </>
        ) : (
          // Placeholder message when no blog is selected
          <p className="detail-placeholder">
            Select a scroll from the left to unveil its hidden truths.
          </p>
        )}
      </div>
    </div>
  );
}

export default Home;
