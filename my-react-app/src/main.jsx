import { createRoot } from 'react-dom/client'
import './index.css'
import App, {AnalyticsTracker} from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ReactGA from "react-ga4"


ReactGA.initialize("G-L9M4PLX9B2")
ReactGA.send("pageview")


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <AnalyticsTracker />
    <App />
  </BrowserRouter>,
)
