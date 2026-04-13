import { create } from 'zustand'
import type { TemplateFile } from '@/types'

interface TemplateState {
  // 当前模板
  currentTemplate: TemplateFile | null
  templates: TemplateFile[]
  loading: boolean

  // Actions
  setCurrentTemplate: (template: TemplateFile | null) => void
  setTemplates: (templates: TemplateFile[]) => void
  setLoading: (loading: boolean) => void
}

export const useTemplateStore = create<TemplateState>((set) => ({
  currentTemplate: null,
  templates: [],
  loading: false,

  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  setTemplates: (templates) => set({ templates }),
  setLoading: (loading) => set({ loading }),
}))