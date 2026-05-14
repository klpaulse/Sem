import Auth from "../components/shared/Auth";

export default function Loginpage(){
    return (
        <main className="login-page">
    <h1 className="live-header">Breddefotball Live</h1>
    <div className="login-card">
    <h2>Logg inn her</h2>
    <p>Logg inn med Google for enkleste tilgang</p>
    <Auth/>
    </div>
    </main>
    )
}