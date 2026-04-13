import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TemplateEditorPage from './pages/TemplateEditor'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/editor" element={<TemplateEditorPage />} />
        <Route path="/" element={<Navigate to="/editor" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App