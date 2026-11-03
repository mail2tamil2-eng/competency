import { Link, useLocation } from "react-router";

export function ManagerNavigation() {
  const proofs = useLocation().pathname.endsWith("/proofs");
  return (
    <nav className="cm-manager-navigation" aria-label="Manager Pages">
      <Link
        className={!proofs ? "active" : ""}
        aria-current={!proofs ? "page" : undefined}
        to="/competency-management/manager"
      >
        Team Overview
      </Link>
      <Link
        className={proofs ? "active" : ""}
        aria-current={proofs ? "page" : undefined}
        to="/competency-management/manager/proofs"
      >
        Proof Submissions
      </Link>
    </nav>
  );
}
