import { Node } from '@tiptap/core'
import type { DOMOutputSpec } from '@tiptap/pm/model'
import { Image } from '@tiptap/extension-image'
import { StarterKit } from '@tiptap/starter-kit'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figure: {
      setFigure: (options: ArticleEditorFigureAttrs) => ReturnType
    }
  }
}

export interface ArticleEditorFigureOptions {
  readonly HTMLAttributes?: Record<string, unknown>
}

export interface ArticleEditorFigureAttrs {
  readonly src: string | null
  readonly alt: string | null
  readonly caption: string | null
}

export interface ArticleEditorVideoAttrs { readonly src: string | null }

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoEmbed: { setVideoEmbed: (options: ArticleEditorVideoAttrs) => ReturnType }
  }
}

export const ArticleEditorVideo = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  addAttributes() { return { src: { default: null } } },
  parseHTML() { return [{ tag: 'iframe[data-press-video]' }] },
  renderHTML({ node }) {
    const src = String(node.attrs.src ?? '')
    const host = new URL(src, 'https://invalid.local').hostname
    const allowed = ['www.youtube-nocookie.com', 'www.youtube.com', 'player.vimeo.com']
    if (!allowed.includes(host)) return ['p', {}, 'Video no disponible']
    return ['figure', { class: 'article-video' }, ['iframe', {
      'data-press-video': 'true', src, title: 'Video integrado', loading: 'lazy',
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowfullscreen: 'true', referrerpolicy: 'strict-origin-when-cross-origin',
    }]]
  },
  addCommands() {
    return { setVideoEmbed: (options: ArticleEditorVideoAttrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs: options }) }
  },
})

/**
 * Nodo editorial que agrupa una imagen con su pie de foto. Se serializa a
 * HTML semántico (<figure><img /><figcaption>) para el contenido enriquecido.
 */
export const ArticleEditorFigure = Node.create<ArticleEditorFigureOptions>({
  name: 'figure',

  addOptions: () => ({
    HTMLAttributes: {},
  }),

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
    }
  },

  addCommands() {
    return {
      setFigure:
        (options: ArticleEditorFigureAttrs) => ({ commands }) =>
          commands.insertContent({
            type: 'figure',
            attrs: {
              src: options.src,
              alt: options.alt,
              caption: options.caption,
            },
          }),
    }
  },

  renderHTML({ node }) {
    const src = String(node.attrs.src ?? '')
    const alt = String(node.attrs.alt ?? '')
    const caption = String(node.attrs.caption ?? '').replace(/<[^>]*>/g, '').trim()
    const safeSrc = /^https?:\/\//i.test(src) ? src : ''
    const img: DOMOutputSpec = ['img', { src: safeSrc, alt }]

    if (!caption) {
      return img
    }

    return [
      'figure',
      { class: 'article-figure' },
      img,
      ['figcaption', { class: 'article-figure__caption' }, caption],
    ]
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
      },
    ]
  },
})

export function createArticleEditorExtensions() {
  return [
    StarterKit.configure({
      link: {
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      },
    }),
    ArticleEditorFigure,
    ArticleEditorVideo,
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
      resize: false,
    }),
  ]
}
