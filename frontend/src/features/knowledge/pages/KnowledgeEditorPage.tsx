import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from '@tanstack/react-router';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  ArrowLeft, Save, UploadCloud,
  Bold, Italic, Strikethrough, Code,
  List, ListOrdered, Quote, Heading1, Heading2,
  Undo, Redo, Settings, X, Tag as TagIcon, Layout, FileText, CheckCircle2
} from 'lucide-react';
import { KnowledgeAPI } from '../api';
import { KnowledgeStatus, KnowledgeCategory } from '../types';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive = false, disabled = false, children, title }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        isActive 
          ? 'bg-neutral-900 text-white shadow-sm' 
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
      } disabled:opacity-30 disabled:hover:bg-transparent`}
    >
      {children}
    </button>
  );

  return (
    <div className="sticky top-6 z-20 mx-auto w-max flex items-center gap-1 p-1.5 bg-white/90 backdrop-blur-md border border-neutral-200/80 rounded-2xl shadow-sm mb-12 transition-all hover:shadow-md">
      <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Code" onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} isActive={editor.isActive('code')}>
        <Code className="w-4 h-4" />
      </ToolbarButton>
      
      <div className="w-px h-5 bg-neutral-200 mx-1" />

      <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Ordered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}>
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-neutral-200 mx-1" />

      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}>
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}>
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

  // State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [status, setStatus] = useState<KnowledgeStatus>('DRAFT');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Queries
  const { data: article, isLoading: isArticleLoading } = useQuery({
    queryKey: ['knowledge_article', id],
    queryFn: () => KnowledgeAPI.getArticle(id as string),
    enabled: isEditing,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['knowledge_categories'],
    queryFn: () => KnowledgeAPI.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  // Title to Slug auto-generation
  useEffect(() => {
    if (!slugEdited && !isEditing && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [title, slugEdited, isEditing]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your documentation, SOP, or playbook here. Use "/" for commands...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-neutral prose-lg max-w-none focus:outline-none min-h-[500px]',
      },
    },
    onUpdate: () => {
      setIsSaved(false);
    }
  });

  useEffect(() => {
    if (article && editor) {
      setTitle(article.title);
      setSlug(article.slug || '');
      setStatus(article.status);
      setCategoryId(article.categoryId || '');
      setTags(article.tags || []);
      if (editor.getHTML() !== article.content) {
        editor.commands.setContent(article.content);
      }
      setSlugEdited(true); // Don't auto-update slug on edit
    }
  }, [article, editor]);

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; status: KnowledgeStatus; slug: string; categoryId?: string; tags?: string[] }) => {
      if (isEditing) {
        return KnowledgeAPI.updateArticle(id as string, data);
      }
      return KnowledgeAPI.createArticle(data);
    },
    onSuccess: (savedArticle) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_articles'] });
      setIsSaved(true);
      if (!isEditing) {
        // Redirect to edit mode so we don't keep creating new ones
        navigate({ to: `/knowledge/${savedArticle.id}/edit`, replace: true });
      }
    },
  });

  const handleSave = (newStatus?: KnowledgeStatus) => {
    if (!title.trim() || !editor) return;
    saveMutation.mutate({
      title,
      content: editor.getHTML(),
      status: newStatus || status,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      categoryId: categoryId || undefined,
      tags: tags.length > 0 ? tags : undefined
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      e.currentTarget.value = '';
      setIsSaved(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
    setIsSaved(false);
  };

  if (isEditing && isArticleLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mb-4" />
          <p className="text-neutral-500 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: '/knowledge' })}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-0.5">
              <Link to="/knowledge" className="hover:text-neutral-900 transition-colors">Knowledge Base</Link>
              <span>/</span>
              <span className="text-neutral-900 font-medium">{isEditing ? 'Edit Article' : 'New Article'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                'bg-neutral-100 text-neutral-700'
              }`}>
                {status}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {saveMutation.isPending && (
                  <span className="text-neutral-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Saving...
                  </span>
                )}
                {isSaved && !saveMutation.isPending && (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
                {!isSaved && !saveMutation.isPending && title.trim() && (
                  <span className="text-amber-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl transition-all border ${
              showSettings 
                ? 'bg-neutral-100 border-neutral-200 text-neutral-900' 
                : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
            title="Toggle Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-neutral-200" />

          <button 
            onClick={() => handleSave(status)}
            disabled={saveMutation.isPending || !title.trim()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:shadow-none"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          
          <button 
            onClick={() => handleSave(status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
            disabled={saveMutation.isPending || !title.trim()}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:shadow-none ${
              status === 'PUBLISHED'
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'
                : 'bg-neutral-900 text-white hover:bg-neutral-800 border border-transparent'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            {status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Editor */}
        <main className="flex-1 overflow-y-auto bg-[#fafafa]">
          <div className="max-w-4xl mx-auto py-12 px-8 md:px-16 pb-32">
            <input
              type="text"
              placeholder="Article Title..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsSaved(false);
              }}
              className="w-full text-5xl font-bold text-neutral-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-neutral-300 p-0 mb-8 tracking-tight"
            />
            
            <MenuBar editor={editor} />
            
            <div 
              className="cursor-text min-h-[500px]" 
              onClick={() => {
                if (!editor?.isFocused) {
                  editor?.commands.focus('end');
                }
              }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        </main>

        {/* Right Sidebar (Settings) */}
        {showSettings && (
          <aside className="w-80 border-l border-neutral-200 bg-white overflow-y-auto shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 animate-in slide-in-from-right-4 duration-200">
            <div className="p-6">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-400" />
                Article Settings
              </h3>
              
              {/* Status */}
              <div className="mb-8">
                <label className="text-sm font-medium text-neutral-700 block mb-2">Publishing Status</label>
                <div className="relative">
                  <select 
                    value={status} 
                    onChange={e => {
                      setStatus(e.target.value as KnowledgeStatus);
                      setIsSaved(false);
                    }} 
                    className="w-full pl-3 pr-10 py-2.5 appearance-none border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all font-medium text-neutral-700"
                  >
                    <option value="DRAFT">Draft — Hidden</option>
                    <option value="PUBLISHED">Published — Live</option>
                    <option value="ARCHIVED">Archived — Read Only</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-neutral-100 mb-8" />

              {/* URL Slug */}
              <div className="mb-8">
                <label className="text-sm font-medium text-neutral-700 block mb-2">URL Slug</label>
                <div className="flex items-center px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50/50 transition-all focus-within:ring-2 focus-within:ring-neutral-900/10 focus-within:border-neutral-300">
                  <span className="text-neutral-400 text-sm mr-1 select-none">/</span>
                  <input 
                    value={slug} 
                    onChange={e => {
                      setSlug(e.target.value);
                      setSlugEdited(true);
                      setIsSaved(false);
                    }} 
                    placeholder="article-slug"
                    className="w-full bg-transparent border-none p-0 text-sm focus:outline-none text-neutral-700 font-medium" 
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">The unique URL path for this article.</p>
              </div>

              {/* Category */}
              <div className="mb-8">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-2 mb-2">
                  <Layout className="w-4 h-4 text-neutral-400" />
                  Category
                </label>
                <div className="relative">
                  <select 
                    value={categoryId} 
                    onChange={e => {
                      setCategoryId(e.target.value);
                      setIsSaved(false);
                    }} 
                    className="w-full pl-3 pr-10 py-2.5 appearance-none border border-neutral-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all text-neutral-700"
                  >
                    <option value="">No Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-8">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-2 mb-2">
                  <TagIcon className="w-4 h-4 text-neutral-400" />
                  Tags
                </label>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map(t => (
                      <span key={t} className="bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-neutral-200/60 shadow-sm transition-all hover:bg-neutral-200/50">
                        {t} 
                        <button onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors focus:outline-none">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <input 
                  placeholder="Add a tag and press Enter..." 
                  onKeyDown={handleAddTag}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all placeholder-neutral-400"
                />
              </div>

            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
