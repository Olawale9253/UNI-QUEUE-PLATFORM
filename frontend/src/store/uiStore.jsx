import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
    persist(
        (set, get) => ({
            sidebarCollapsed: false,
            mobileSidebarOpen: false,

            toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
            setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),

            openMobileSidebar: () => set({ mobileSidebarOpen: true }),
            closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
        }),
        {
            name: 'uniqueue-ui',
            // Only persist desktop collapse preference — mobile drawer state is ephemeral
            partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
        }
    )
)