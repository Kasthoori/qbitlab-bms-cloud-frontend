
import type { FC } from 'react'
import HvacWsTable from './components/HvacWsTable.tsx'

const App:FC = () => (

    <div className='min-h-screen bg-gray-950 text-white'>
      <div className='mx-auto max-w-6xl py-8'>
        <HvacWsTable />
      </div>
    </div>
)

export default App
