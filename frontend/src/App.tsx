import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GiWeightLiftingUp } from "react-icons/gi";
import { BsGraphUpArrow } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";

// @ts-ignore
import IndexPage from './pages/index.js';
// @ts-ignore
import StatsPage from './pages/stats';
// @ts-ignore
import SettingsPage from './pages/settings';

export default function App() {

  return <>
    <div className="dock">

      <a className='dock-label' href='/'><GiWeightLiftingUp size={25} className='m-auto' /></a>

      <a className="dock-label" href='/routine'><BsGraphUpArrow size={22} className='m-auto' /></a>

      <a className='dock-label' href='/settings'><IoSettingsOutline size={22} className='m-auto' /></a>

    </div>


    <BrowserRouter>
      <Routes>

        <Route path='/' element={<IndexPage />} />
        <Route path='/routine' element={<StatsPage />} />
        <Route path='/settings' element={<SettingsPage />} />

      </Routes>
    </BrowserRouter>
  </>
}