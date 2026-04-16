/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Docs from './pages/Docs';
import Settings from './pages/Settings';
import Bookmarks from './pages/Bookmarks';
import About from './pages/About';
import References from './pages/References';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="docs" element={<Docs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="about" element={<About />} />
          <Route path="references" element={<References />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

