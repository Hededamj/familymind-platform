'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Minus,
} from 'lucide-react'
import { useCallback } from 'react'

type RichTextEditorProps = {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image,
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? 'Skriv din artikel her...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none',
      },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Billede-URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap gap-0.5 border-b bg-muted/30 p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`size-8 p-0 ${editor.isActive('bold') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`size-8 p-0 ${editor.isActive('italic') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`size-8 p-0 ${editor.isActive('underline') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </Button>

        <div className="mx-1 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`size-8 p-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`size-8 p-0 ${editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-4" />
        </Button>

        <div className="mx-1 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`size-8 p-0 ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`size-8 p-0 ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`size-8 p-0 ${editor.isActive('blockquote') ? 'bg-muted' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
        </Button>

        <div className="mx-1 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`size-8 p-0 ${editor.isActive('link') ? 'bg-muted' : ''}`}
          onClick={setLink}
        >
          <LinkIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={addImage}
        >
          <ImageIcon className="size-4" />
        </Button>

        <div className="mx-1 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="size-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
