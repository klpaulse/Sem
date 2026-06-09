import { useLocation, Link } from "react-router-dom";

const HIDDEN_ON = ["/admin", "/reporter", "/admin-login", "/login"];

export default function Footer() {
  const { pathname } = useLocation();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="site-footer">
      <p className="site-footer__tagline">Følg kampene live – mål, hendelser og tabeller</p>
      <p className="site-footer__contact">
        Kontakt: <a href="mailto:Breddefotball-92@hotmail.com">Breddefotball-92@hotmail.com</a>
      </p>
      <p className="site-footer__copy">© {new Date().getFullYear()} Breddefotball Live · <Link to="/om" className="site-footer__link">Om siden</Link></p>
    </footer>
  );
}
