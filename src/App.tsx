import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import Cart from './pages/Cart'
import Home from './pages/Home'
import { Contact, InfoPage } from './pages/Info'
import NotFound from './pages/NotFound'
import ProductPage from './pages/Product'
import Shop from './pages/Shop'
import ThankYou from './pages/ThankYou'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:cat" element={<Shop />} />
        <Route path="/shop/:cat/:sub" element={<Shop />} />
        <Route path="/p/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/:slug" element={<InfoPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
