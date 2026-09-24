export function ManagerPageSize({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="cm-entry-count">
      Show{" "}
      <select
        aria-label="Entries per page"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {[10, 25, 50, 100].map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>{" "}
      Entries
    </label>
  );
}

export function ManagerPagination({
  total,
  page,
  pageSize,
  onPage,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const count = Math.max(1, Math.ceil(total / pageSize));
  const visible = new Set([0, count - 1]);
  const start = Math.max(0, Math.min(page - 2, count - 5));
  for (let i = start; i < Math.min(count, start + 5); i++) visible.add(i);
  const pages = [...visible].sort((a, b) => a - b);
  return (
    <div className="cm-pagination cm-platform-pagination">
      <span role="status">
        Showing {total ? page * pageSize + 1 : 0} to{" "}
        {Math.min((page + 1) * pageSize, total)} of {total} entries
      </span>
      <nav aria-label="Table pagination">
        <button
          className="cm-button"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        {pages.map((number, index) => (
          <span className="cm-page-slot" key={number}>
            {index > 0 && number > pages[index - 1] + 1 && (
              <span className="cm-page-ellipsis" aria-hidden="true">
                …
              </span>
            )}
            <button
              className={`cm-button ${number === page ? "is-current" : ""}`}
              aria-label={`Page ${number + 1} of ${count}`}
              aria-current={number === page ? "page" : undefined}
              onClick={() => onPage(number)}
            >
              {number + 1}
            </button>
          </span>
        ))}
        <button
          className="cm-button"
          disabled={page >= count - 1}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </nav>
    </div>
  );
}
