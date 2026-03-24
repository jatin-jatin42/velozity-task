import { Link } from "react-router-dom";

export const NotFoundPage = () => (
  <section className="panel">
    <div className="panel__header">
      <h2>Page not found</h2>
    </div>
    <p>This route does not exist.</p>
    <Link to="/">Back to dashboard</Link>
  </section>
);
