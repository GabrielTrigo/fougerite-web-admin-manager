// ============================================================
// FWAM — PrimeNG PassThrough Preset: Rust Legacy Theme
//
// Applied globally via providePrimeNG({ unstyled: true, pt: RustPreset })
// Every PrimeNG component slot is styled via Tailwind utility classes.
// ============================================================

const rustInputTextPreset = {
  root: {
    class: [
      'w-full px-3 py-2 text-sm rounded-sm',
      'bg-[var(--color-rust-elevated)] text-[var(--color-rust-text-primary)]',
      'border border-[var(--color-rust-border)]',
      'placeholder:text-[var(--color-rust-text-muted)]',
      'focus:outline-none focus:border-[var(--color-rust-500)]',
      'transition-colors duration-150',
      'font-mono',
    ]
  }
};

const rustIconFieldPreset = {
  root: {
    class: [
      'relative block',
      '[&_.p-inputtext]:w-full',
      '[&_.p-inputtext]:pl-9',
    ]
  }
};

const rustInputIconPreset = {
  root: {
    class: [
      'absolute left-3 top-1/2 z-[1] -translate-y-1/2',
      'pointer-events-none text-[var(--color-rust-text-muted)] text-sm',
    ]
  }
};

const rustPaginatorPreset = {
  root: { class: 'flex flex-wrap items-center justify-end px-4 py-3 border-t border-[var(--color-rust-border)] bg-[var(--color-rust-surface)] w-full gap-1' },
  content: { class: 'flex flex-wrap items-center gap-1' },
  pages: { class: 'flex flex-wrap items-center gap-1' },
  first: { class: 'w-8 h-8 flex items-center justify-center text-xs rounded-sm border border-[var(--color-rust-border)] text-[var(--color-rust-text-secondary)] hover:bg-[var(--color-rust-overlay)] hover:text-white cursor-pointer transition-colors' },
  previous: { class: 'w-8 h-8 flex items-center justify-center text-xs rounded-sm border border-[var(--color-rust-border)] text-[var(--color-rust-text-secondary)] hover:bg-[var(--color-rust-overlay)] hover:text-white cursor-pointer transition-colors' },
  next: { class: 'w-8 h-8 flex items-center justify-center text-xs rounded-sm border border-[var(--color-rust-border)] text-[var(--color-rust-text-secondary)] hover:bg-[var(--color-rust-overlay)] hover:text-white cursor-pointer transition-colors' },
  last: { class: 'w-8 h-8 flex items-center justify-center text-xs rounded-sm border border-[var(--color-rust-border)] text-[var(--color-rust-text-secondary)] hover:bg-[var(--color-rust-overlay)] hover:text-white cursor-pointer transition-colors' },
  pageButton: ({ context }: any) => ({
    class: [
      'w-8 h-8 flex items-center justify-center text-xs font-mono rounded-sm border transition-colors duration-100 cursor-pointer',
      context?.active || context?.selected
        ? 'bg-[var(--color-rust-500)] text-white border-[var(--color-rust-500)]'
        : 'text-[var(--color-rust-text-secondary)] border-[var(--color-rust-border)] hover:bg-[var(--color-rust-overlay)] hover:text-white'
    ]
  }),
  page: ({ context }: any) => ({
    class: [
      'w-8 h-8 flex items-center justify-center text-xs font-mono rounded-sm border transition-colors duration-100 cursor-pointer',
      context?.active || context?.selected
        ? 'bg-[var(--color-rust-500)] text-white border-[var(--color-rust-500)]'
        : 'text-[var(--color-rust-text-secondary)] border-[var(--color-rust-border)] hover:bg-[var(--color-rust-overlay)] hover:text-white'
    ]
  }),
  firstPageIcon: { class: 'pi pi-angle-double-left text-xs' },
  previousPageIcon: { class: 'pi pi-angle-left text-xs' },
  nextPageIcon: { class: 'pi pi-angle-right text-xs' },
  lastPageIcon: { class: 'pi pi-angle-double-right text-xs' },
};

const rustTablePreset = {
  root: { class: 'w-full' },
  tableContainer: { class: 'px-4 pt-4 pb-3 overflow-x-auto' },
  table: { class: 'w-full border-collapse' },
  thead: { class: '' },
  tbody: { class: '' },
  headerRow: { class: '' },
  headerCell: ({ context }: any) => ({
    class: [
      'px-4 py-3 text-left align-middle',
      'section-label border-b border-[var(--color-rust-border)] border-r last:border-r-0',
      '[background:var(--color-rust-elevated)]',
      context.sorted ? 'text-[var(--color-rust-500)]' : 'text-[var(--color-rust-text-muted)]',
      context.sortable ? 'cursor-pointer select-none hover:text-[var(--color-rust-text-secondary)]' : '',
    ]
  }),
  row: ({ context }: any) => ({
    class: [
      'border-b border-[var(--color-rust-border)]',
      'transition-colors duration-100',
      context?.selected
        ? '[background:var(--color-rust-glow)] border-[var(--color-rust-border-accent)]'
        : 'hover:[background:var(--color-rust-overlay)]',
    ]
  }),
  bodyCell: {
    class: 'px-4 py-3 align-middle text-sm text-[var(--color-rust-text-primary)] border-r border-[var(--color-rust-border)] last:border-r-0'
  },
  footer: { class: 'px-4 py-3 text-[var(--color-rust-text-muted)] text-xs border-t border-[var(--color-rust-border)]' },
  sortIcon: { class: 'ml-1 text-xs' },
  paginator: rustPaginatorPreset,
  pcPaginator: rustPaginatorPreset,
  emptyMessage: { class: 'px-4 py-12 text-center text-[var(--color-rust-text-muted)] text-sm italic' },
};

const rustSelectOverlayPreset = {
  root: {
    class: [
      'z-50 mt-1 overflow-hidden rounded-sm shadow-xl',
      'border border-[var(--color-rust-border-accent)]',
      'bg-[var(--color-rust-elevated)]',
      'max-h-[min(24rem,calc(100vh-6rem))]',
    ]
  },
  content: {
    class: [
      'overflow-hidden rounded-sm',
      'bg-[var(--color-rust-elevated)] text-[var(--color-rust-text-primary)]',
    ]
  }
};

const rustSelectPreset = {
  root: {
    class: [
      'relative flex min-h-10 w-full items-center',
      'px-3 py-2 text-sm rounded-sm cursor-pointer',
      'bg-[var(--color-rust-elevated)] text-[var(--color-rust-text-primary)]',
      'border border-[var(--color-rust-border)]',
      'focus:outline-none focus:border-[var(--color-rust-500)]',
      'transition-colors duration-150',
    ]
  },
  label: { class: 'min-w-0 flex-1 truncate pr-2 text-sm text-[var(--color-rust-text-primary)]' },
  dropdown: { class: 'ml-2 flex items-center justify-center text-[var(--color-rust-text-muted)]' },
  dropdownIcon: { class: 'text-xs' },
  overlay: rustSelectOverlayPreset,
  pcOverlay: rustSelectOverlayPreset,
  header: { class: 'border-b border-[var(--color-rust-border)] bg-[var(--color-rust-surface)] p-2' },
  pcFilterContainer: {
    root: {
      class: [
        'relative block',
        '[&_.p-inputtext]:w-full',
        '[&_.p-inputtext]:pl-9',
      ]
    }
  },
  pcFilter: rustInputTextPreset,
  pcFilterIconContainer: rustInputIconPreset,
  filterIcon: { class: 'text-[var(--color-rust-text-muted)] text-sm' },
  listContainer: {
    class: 'max-h-[min(18rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain bg-[var(--color-rust-elevated)]'
  },
  list: { class: 'py-1' },
  option: ({ context }: any) => ({
    class: [
      'px-3 py-2 text-sm cursor-pointer transition-colors duration-100',
      context.selected
        ? 'bg-[var(--color-rust-glow)] text-[var(--color-rust-500)]'
        : 'text-[var(--color-rust-text-primary)] hover:bg-[var(--color-rust-overlay)]'
    ]
  }),
  optionLabel: { class: 'truncate' },
  emptyMessage: { class: 'px-3 py-3 text-sm italic text-[var(--color-rust-text-muted)]' },
};

export const RustPreset = {

  // ────────────────────── BUTTON ──────────────────────────
  button: {
    root: ({ props }: any) => ({
      class: [
        // Base
        'inline-flex items-center justify-center gap-2',
        'font-display font-semibold uppercase tracking-widest text-xs',
        'border transition-all duration-150 cursor-pointer select-none',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-rust-500)]',
        'disabled:opacity-40 disabled:cursor-not-allowed',

        // Severity: default (rust orange)
        {
          '[background:var(--color-rust-500)] text-white border-[var(--color-rust-600)]':
            !props?.severity && !props?.outlined && !props?.text,
          'hover:[background:var(--color-rust-600)] active:[background:var(--color-rust-600)]':
            !props?.severity && !props?.outlined && !props?.text,

          // Severity: danger (red)
          '[background:var(--color-rust-danger)] text-white border-[var(--color-rust-danger)]':
            props?.severity === 'danger' && !props?.outlined && !props?.text,
          'hover:[background:var(--color-rust-danger-light)]':
            props?.severity === 'danger' && !props?.outlined && !props?.text,

          // Severity: secondary (olive)
          '[background:var(--color-rust-surface)] text-[var(--color-rust-text-primary)] border-[var(--color-rust-border)]':
            props?.severity === 'secondary' && !props?.outlined && !props?.text,
          'hover:border-[var(--color-rust-border-accent)] hover:[background:var(--color-rust-overlay)]':
            props?.severity === 'secondary' && !props?.outlined && !props?.text,

          // Outlined
          'bg-transparent border-[var(--color-rust-500)] text-[var(--color-rust-500)]':
            props?.outlined && !props?.severity,
          'hover:[background:var(--color-rust-glow)]': props?.outlined && !props?.severity,

          // Text only
          'bg-transparent border-transparent text-[var(--color-rust-text-secondary)]':
            props?.text,
          'hover:[background:var(--color-rust-overlay)] hover:text-[var(--color-rust-text-primary)]':
            props?.text,

          // Sizing
          'px-4 py-2 text-xs rounded-sm': props?.size === undefined || props?.size === 'normal',
          'px-2 py-1 text-xs rounded-sm': props?.size === 'small',
          'px-5 py-3 text-sm rounded-sm': props?.size === 'large',
        }
      ]
    }),
    label: { class: 'font-semibold' },
    icon: { class: 'text-sm' },
    loadingIcon: { class: 'animate-spin' },
  },

  // ────────────────────── TABLE ──────────────────────────
  datatable: rustTablePreset,
  table: rustTablePreset,

  // ────────────────────── PAGINATOR ──────────────────────
  paginator: rustPaginatorPreset,

  // ────────────────────── INPUT TEXT ──────────────────────
  inputtext: rustInputTextPreset,
  inputText: rustInputTextPreset,
  iconfield: rustIconFieldPreset,
  iconField: rustIconFieldPreset,
  inputicon: rustInputIconPreset,
  inputIcon: rustInputIconPreset,

  // ────────────────────── TEXTAREA ──────────────────────
  textarea: {
    root: {
      class: [
        'w-full px-3 py-2 text-sm rounded-sm resize-none',
        'bg-[var(--color-rust-elevated)] text-[var(--color-rust-text-primary)]',
        'border border-[var(--color-rust-border)]',
        'placeholder:text-[var(--color-rust-text-muted)]',
        'focus:outline-none focus:border-[var(--color-rust-500)]',
        'transition-colors duration-150',
      ]
    }
  },

  // ────────────────────── SELECT (Dropdown) ─────────────
  select: rustSelectPreset,

  // ────────────────────── DIALOG ──────────────────────────
  dialog: {
    root: { class: 'relative rounded-sm shadow-2xl max-w-lg w-full mx-4' },
    mask: { class: 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm' },
    header: {
      class: [
        'flex items-center justify-between px-5 py-4',
        'bg-[var(--color-rust-elevated)] border-b border-[var(--color-rust-border)]',
        'border-t-2 border-t-[var(--color-rust-500)]',
        'rounded-t-sm',
      ]
    },
    title: { class: 'font-display font-bold uppercase tracking-wider text-[var(--color-rust-text-primary)] text-base' },
    closeButton: {
      class: [
        'ml-auto flex items-center justify-center w-7 h-7 rounded-sm',
        'text-[var(--color-rust-text-muted)] hover:text-[var(--color-rust-text-primary)]',
        'hover:bg-[var(--color-rust-overlay)] transition-colors duration-100',
        'cursor-pointer border-0 bg-transparent',
      ]
    },
    content: {
      class: 'px-5 py-4 bg-[var(--color-rust-surface)] text-[var(--color-rust-text-primary)] text-sm'
    },
    footer: {
      class: [
        'px-5 py-4 flex items-center justify-end gap-3',
        'bg-[var(--color-rust-surface)] border-t border-[var(--color-rust-border)]',
        'rounded-b-sm',
      ]
    },
  },

  // ────────────────────── TAG / BADGE ──────────────────────
  tag: {
    root: ({ props }: any) => ({
      class: [
        'inline-flex items-center gap-1 px-2 py-0.5',
        'text-xs font-mono font-semibold uppercase tracking-wider rounded-sm',
        {
          'bg-[var(--color-rust-glow)] text-[var(--color-rust-400)] border border-[var(--color-rust-border-accent)]':
            !props?.severity || props?.severity === 'primary',
          'bg-[var(--color-rust-danger-glow)] text-[var(--color-rust-danger-light)] border border-[var(--color-rust-danger)]':
            props?.severity === 'danger',
          'bg-[var(--color-rust-success)]/20 text-[var(--color-rust-success-light)] border border-[var(--color-rust-success)]':
            props?.severity === 'success',
          'bg-[var(--color-rust-warning)]/20 text-[var(--color-rust-warning-light)] border border-[var(--color-rust-warning)]':
            props?.severity === 'warning',
          '[background:#2a4a6b30] text-blue-300 border border-[var(--color-rust-info)]':
            props?.severity === 'info',
          '[background:var(--color-rust-elevated)] text-[var(--color-rust-text-muted)] border border-[var(--color-rust-border)]':
            props?.severity === 'secondary',
        }
      ]
    }),
  },

  // ────────────────────── TOAST ──────────────────────────
  toast: {
    root: { class: 'fixed z-50 top-4 right-4 flex flex-col gap-2 pointer-events-none' },
    message: ({ props }: any) => ({
      class: [
        'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-sm shadow-lg',
        'border border-l-4 min-w-72 max-w-sm',
        'animate-rust-slide-in',
        {
          'border-[var(--color-rust-500)] border-l-[var(--color-rust-500)] [background:var(--color-rust-surface)]':
            props.message?.severity === 'success' || !props.message?.severity,
          'border-[var(--color-rust-danger)] border-l-[var(--color-rust-danger)] [background:var(--color-rust-surface)]':
            props.message?.severity === 'error',
          'border-[var(--color-rust-warning)] border-l-[var(--color-rust-warning)] [background:var(--color-rust-surface)]':
            props.message?.severity === 'warn',
          'border-[var(--color-rust-border-accent)] border-l-[var(--color-rust-500)] [background:var(--color-rust-surface)]':
            props.message?.severity === 'info',
        }
      ]
    }),
    messageContent: { class: 'flex items-start gap-3 flex-1 min-w-0' },
    messageIcon: { class: 'mt-0.5 shrink-0 text-base' },
    messageText: { class: 'flex-1 min-w-0' },
    messageSummary: { class: 'font-display font-semibold text-xs uppercase tracking-wider text-[var(--color-rust-text-primary)]' },
    messageDetail: { class: 'text-xs text-[var(--color-rust-text-secondary)] mt-0.5 break-words' },
    closeButton: { class: 'ml-auto shrink-0 cursor-pointer text-[var(--color-rust-text-muted)] hover:text-[var(--color-rust-text-primary)] transition-colors' },
  },

  // ────────────────────── TOGGLE SWITCH ──────────────────
  toggleswitch: {
    root: ({ props }: any) => ({
      class: [
        'group relative inline-flex items-center w-11 h-6 cursor-pointer rounded-full',
        'transition-colors duration-200',
        'bg-[var(--color-rust-border)] has-[:checked]:bg-[var(--color-rust-500)]',
        props?.disabled ? 'opacity-40 cursor-not-allowed' : '',
      ]
    }),
    input: {
      class: 'peer w-full h-full absolute top-0 left-0 z-10 p-0 m-0 opacity-0 appearance-none cursor-pointer'
    },
    slider: {
      class: 'absolute inset-0 rounded-full'
    },
    handle: {
      class: [
        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow',
        'transition-transform duration-200',
        'group-has-[:checked]:translate-x-5'
      ]
    },
  },

  // ────────────────────── PANEL ──────────────────────────
  panel: {
    root: { class: 'rust-panel' },
    header: {
      class: [
        'flex items-center justify-between px-4 py-3',
        'border-b border-[var(--color-rust-border)]',
      ]
    },
    title: { class: 'font-display font-bold uppercase tracking-wider text-sm text-[var(--color-rust-text-primary)]' },
    content: { class: 'p-4' },
  },

  // ────────────────────── TAB VIEW ──────────────────────
  tabs: {
    root: { class: 'flex flex-col' },
    nav: { class: 'flex border-b border-[var(--color-rust-border)] overflow-x-auto' },
    tab: { class: 'flex-shrink-0' },
    tabpanels: { class: 'pt-4' },
  },
  tab: {
    root: ({ context }: any) => ({
      class: [
        'px-4 py-2.5 text-xs font-display font-semibold uppercase tracking-wider cursor-pointer',
        'border-b-2 transition-colors duration-150',
        '-mb-px',
        context.active
          ? 'border-[var(--color-rust-500)] text-[var(--color-rust-500)]'
          : 'border-transparent text-[var(--color-rust-text-muted)] hover:text-[var(--color-rust-text-secondary)]',
      ]
    }),
  },
  tabpanel: {
    root: { class: 'animate-rust-fade-in' },
  },

  // ────────────────────── CHIP ──────────────────────────
  chip: {
    root: {
      class: [
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm',
        'text-xs font-mono bg-[var(--color-rust-elevated)] text-[var(--color-rust-text-secondary)]',
        'border border-[var(--color-rust-border)]',
      ]
    },
  },

  // ────────────────────── TOOLTIP ──────────────────────────
  tooltip: {
    root: { class: 'absolute pointer-events-none' },
    text: {
      class: [
        'px-2 py-1 text-[11px] font-mono leading-none rounded-sm shadow-md',
        'bg-[var(--color-rust-elevated)] text-[var(--color-rust-text-primary)]',
        'border border-[var(--color-rust-border-accent)]',
      ]
    }
  },

  // ────────────────────── DRAWER (Sidebar) ─────────────────
  drawer: {
    root: ({ props }: any) => ({
      class: [
        'fixed flex flex-col z-50 transition-transform duration-300',
        'bg-[var(--color-rust-base)] text-[var(--color-rust-text-primary)]',
        'shadow-2xl h-full border-l border-[var(--color-rust-border)]',
        props?.visible ? 'translate-x-0' : 'translate-x-full',
      ],
      style: props?.style // Passa a prop de style manualmente caso tenha vindo fixed width
    }),
    header: { class: 'flex items-center justify-between px-5 py-4 border-b border-[var(--color-rust-border)] bg-[var(--color-rust-elevated)]' },
    title: { class: 'font-display font-bold uppercase tracking-wider text-[var(--color-rust-text-primary)] text-base' },
    closeButton: {
      class: [
        'ml-auto flex items-center justify-center w-7 h-7 rounded-sm',
        'text-[var(--color-rust-text-muted)] hover:text-[var(--color-rust-text-primary)]',
        'hover:bg-[var(--color-rust-overlay)] transition-colors duration-100',
        'cursor-pointer border-0 bg-transparent',
      ]
    },
    content: { class: 'px-5 py-4 overflow-y-auto flex-1 bg-[var(--color-rust-surface)]' },
    mask: { class: 'fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300' }
  },
};
