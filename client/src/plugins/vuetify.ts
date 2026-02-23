import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const savedLocale = localStorage.getItem('locale') || 'he'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#5C6BC0',
          secondary: '#26A69A',
          accent: '#FF7043',
          error: '#EF5350',
          success: '#66BB6A',
          warning: '#FFA726',
          background: '#F5F7FA',
          surface: '#FFFFFF',
        },
      },
    },
  },
  defaults: {
    VCard: {
      rounded: 'xl',
      elevation: 2,
    },
    VBtn: {
      rounded: 'lg',
    },
    VTextField: {
      rounded: 'lg',
      variant: 'outlined',
    },
    VSelect: {
      rounded: 'lg',
      variant: 'outlined',
    },
    VFileInput: {
      rounded: 'lg',
      variant: 'outlined',
    },
    VDialog: {
      transition: 'dialog-bottom-transition',
    },
    VNavigationDrawer: {
      rounded: 'e-xl',
    },
    VChip: {
      rounded: 'lg',
    },
  },
  locale: {
    locale: savedLocale,
    rtl: {
      he: true,
      en: false,
    },
  },
})
