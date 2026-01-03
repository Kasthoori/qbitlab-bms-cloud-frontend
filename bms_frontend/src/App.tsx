
import type { FC } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import Dashboard from './components/Pages/Dashboard'
import Hvac from './components/Pages/Hvac'
// import HvacWsTable from './components/HvacWsTable.tsx'
// import Header from './components/Header/Header.tsx'
// import { HvacConfigForm } from './components/Forms/HvacConfigForm.tsx'

const App:FC = () => (

    // <div className='min-h-screen bg-gray-950 text-white'>
    //   <div className='mx-auto max-w-6xl py-8'>
    //     <Header />
    //     <div className='my-4 w-full border-b border-gray-600'></div>
    //     <HvacWsTable />
    //     <HvacConfigForm />
    //   </div>
    // </div>

    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/hvac' element={<Hvac />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
)

export default App
