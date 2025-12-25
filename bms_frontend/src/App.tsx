
import { type FC } from 'react'
import Header from './components/Header/Header.tsx'
//import LoginPage from './components/Login/imports/LoginPage.tsx'
import HvacWsTable from './components/HvacWsTable.tsx';
import { Navigate, Route, Routes } from 'react-router-dom';
//import { HvacConfigForm } from './components/Forms/HvacConfigForm.tsx';

const App:FC = () => {


  return (
          <div className='min-h-screen bg-gray-950 text-white'>
            <div className='mx-auto max-w-6xl py-6'>
              <Header />
              <Routes>
                <Route path='/' element={<Navigate to="/hvac-live" replace />} />
                <Route path='/hvac-live' element={<HvacWsTable />} />
              </Routes>
              {/* <div className='my-4 w-full border-b border-gray-600'></div> 
              {isLoggedIn ? 
              (<HvacWsTable />) : 
              (<LoginPage onLogin={() => setIsLoggedIn(true)} />)} */}
              {/* <HvacWsTable /> */}
              
              
              
              {/* <HvacConfigForm /> */}
            </div>
          </div>
  )
}

export default App
