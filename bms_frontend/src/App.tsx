
import type { FC } from 'react'
import HvacWsTable from './components/HvacWsTable.tsx'
import Header from './components/Header/Header.tsx'

const App:FC = () => (

    <div className='min-h-screen bg-gray-950 text-white'>
      <div className='mx-auto max-w-6xl py-8'>
        <Header />
        <div className='my-4 w-full border-b border-gray-600'></div>
        <HvacWsTable />
      </div>
    </div>
)

export default App
