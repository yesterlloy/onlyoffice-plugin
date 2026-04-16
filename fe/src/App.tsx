import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TemplateManagementPage from './pages/TemplateManagement'
import TemplateEditorPage from './pages/TemplateEditor'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TemplateManagementPage />} />
        <Route path="/editor" element={<TemplateEditorPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App