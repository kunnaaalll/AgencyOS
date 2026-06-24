import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  ArrowLeft, Save, UploadCloud,
  Bold, Italic, Strikethrough, Code,
  List, ListOrdered, Quote, Heading1, Heading2,
  Undo, Redo
} from 'lucide-react';
import { KnowledgeAPI } from '../api';
import { KnowledgeStatus } from '../types';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive = false, disabled = false, children }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-md transition-colors ${
        isActive ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
      } disabled:opacity-50`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-neutral-200 bg-neutral-50/50 sticky top-0 z-10 backdrop-blur-sm">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} isActive={editor.isActive('code')}>
        <Code className="w-4 h-4" />
      </ToolbarButton>
      
      <div className="w-px h-6 bg-neutral-200 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}>
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-neutral-200 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}>
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}>
        <Redo className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
};

export function KnowledgeEditorPage() {
  const { id } = useParams({ strict: false });
  const isEditing = Boolean(id && id !== 'new');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<KnowledgeStatus>('DRAFT');

  const { data: article } = useQuery({
    queryKey: ['knowledge_article', id],
    queryFn: () => KnowledgeAPI.getArticle(id as string),
    enabled: isEditing,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your SOP, playbook, or documentation here...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-neutral max-w-none focus:outline-none min-h-[400px]',
      },
    },
  });

  useEffect(() => {
    if (article && editor) {
      setTitle(article.title);
      setStatus(article.status);
      if (editor.getHTML() !== article.content) {
        editor.commands.setContent(article.content);
      }
    }
  }, [article, editor]);

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; status: KnowledgeStatus; slug: string }) => {
      if (isEditing) {
        return KnowledgeAPI.updateArticle(id as string, data);
      }
      return KnowledgeAPI.createArticle(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_articles'] });
      navigate({ to: '/knowledge' });
    },
  });

  const handleSave = (newStatus: KnowledgeStatus) => {
    if (!title.trim() || !editor) return;
    saveMutation.mutate({
      title,
      content: editor.getHTML(),
      status: newStatus,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      <header className="flex items-center justify-between px-8 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: '/knowledge' })}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Article Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold text-neutral-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-neutral-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSave('DRAFT')}
            disabled={saveMutation.isPending || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button 
            onClick={() => handleSave('PUBLISHED')}
            disabled={saveMutation.isPending || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            Publish
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-neutral-50/30">
        <div className="max-w-4xl mx-auto py-8 px-8">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <MenuBar editor={editor} />
            <div className="p-8 flex-1 cursor-text" onClick={() => editor?.commands.focus()}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
