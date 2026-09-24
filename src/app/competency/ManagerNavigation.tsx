import { Link, useLocation } from "react-router";

export function ManagerNavigation() {
  const proofs = useLocation().pathname.endsWith("/proofs");
  return (
    <nav className="cm-manager-navigation" aria-label="Manager pages">
      <Link
        className={!proofs ? "active" : ""}
        aria-current={!proofs ? "page" : undefined}
        to="/competency-management/manager"
      >
        Team overview
      </Link>
      <Link
        className={proofs ? "active" : ""}
        aria-current={proofs ? "page" : undefined}
        to="/competency-management/manager/proofs"
      >
        Proof submissions
      </Link>
    </nav>
  );
}
