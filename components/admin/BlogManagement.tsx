// components/admin/BlogManagement.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import FontFamily from '@tiptap/extension-font-family'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Tag,
  Calendar,
  Clock,
  User,
  BookOpen,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  Link2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Code,
  Type,
  Palette,
  Highlighter,
  Minus,
  Video,
  Image as ImageIcon2,
  Columns,
  Grid,
  Maximize,
  Minimize
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import NextLink from 'next/link'

// Custom Image extension with drag support
const CustomImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: element => element.style.width || element.getAttribute('width') || '100%',
        renderHTML: attributes => ({
          style: `width: ${attributes.width}; height: auto;`,
        }),
      },
      height: {
        default: 'auto',
        parseHTML: element => element.style.height || element.getAttribute('height') || 'auto',
        renderHTML: attributes => ({
          style: `height: ${attributes.height};`,
        }),
      },
      align: {
        default: 'center',
        parseHTML: element => element.style.float || element.getAttribute('data-align') || 'center',
        renderHTML: attributes => ({
          'data-align': attributes.align,
          style: `float: ${attributes.align === 'center' ? 'none' : attributes.align}; display: ${attributes.align === 'center' ? 'block' : 'inline-block'}; margin: ${attributes.align === 'center' ? '0 auto' : '0 10px'};`,
        }),
      },
    }
  },
})

// Custom Video extension
const VideoExtension = ImageExtension.extend({
  name: 'video',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
      width: {
        default: '100%',
      },
      poster: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', { ...HTMLAttributes, controls: 'true', style: `width: ${HTMLAttributes.width || '100%'}; max-width: 100%;` }]
  },
})

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  author: string
  category: string
  tags: string[]
  read_time: number
  views: number
  likes: number
  is_published: boolean
  is_featured: boolean
  published_at: string
  created_at: string
  updated_at: string
}

interface BlogFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  author: string
  category: string
  tags: string[]
  read_time: number
  is_published: boolean
  is_featured: boolean
}

const categories = [
  'General',
  'Buying Guides',
  'Car Reviews',
  'Electric Vehicles',
  'Luxury Cars',
  'Maintenance Tips',
  'Industry News',
  'Auto Trends',
  'Safety',
  'Featured'
]

const emptyFormData: BlogFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  author: 'AutoRepublic',
  category: 'General',
  tags: [],
  read_time: 5,
  is_published: true,
  is_featured: false,
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [formData, setFormData] = useState<BlogFormData>(emptyFormData)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaCaption, setMediaCaption] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSourceView, setIsSourceView] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaFileInputRef = useRef<HTMLInputElement>(null)

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your amazing blog post here...',
      }),
      CustomImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'blog-image',
        },
      }),
      VideoExtension,
      LinkExtension.configure({
        openOnClick: false,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-red-400 hover:text-red-300 underline',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      Underline,
      FontFamily,
    ],
    content: formData.content || '',
    editable: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setFormData(prev => ({ ...prev, content: html }))
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const files = event.dataTransfer.files
          const file = files[0]
          if (file && file.type.startsWith('image/')) {
            handleMediaFileUpload(file, 'image')
            return true
          }
          if (file && file.type.startsWith('video/')) {
            handleMediaFileUpload(file, 'video')
            return true
          }
        }
        return false
      },
    },
  })

  // Update editor content when formData.content changes
  useEffect(() => {
    if (editor && formData.content !== editor.getHTML()) {
      editor.commands.setContent(formData.content || '')
    }
  }, [editor, formData.content])

  // Fetch blog posts
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      console.error('Error fetching posts:', err)
      setError('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Toggle expanded post
  const toggleExpanded = (id: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Handle media file upload via drag and drop or file picker
  const handleMediaFileUpload = async (file: File, type: 'image' | 'video') => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `blog-media/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('blogs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('blogs')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      if (type === 'image') {
        editor?.chain().focus().setImage({ src: publicUrl }).run()
      } else {
        // Insert video
        editor?.chain().focus().insertContent(`
          <video src="${publicUrl}" controls style="width: 100%; max-width: 100%; border-radius: 8px; margin: 1rem 0;">
            Your browser does not support the video tag.
          </video>
        `).run()
      }

      setSuccess(`${type === 'image' ? 'Image' : 'Video'} inserted successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error uploading media:', err)
      setFormError(`Failed to upload ${type}`)
      setTimeout(() => setFormError(''), 3000)
    }
  }

  // Handle media URL insert
  const handleMediaUrlInsert = async () => {
    if (!mediaUrl) return

    try {
      if (mediaType === 'image') {
        editor?.chain().focus().setImage({ src: mediaUrl }).run()
      } else {
        editor?.chain().focus().insertContent(`
          <video src="${mediaUrl}" controls style="width: 100%; max-width: 100%; border-radius: 8px; margin: 1rem 0;">
            Your browser does not support the video tag.
          </video>
        `).run()
      }

      setShowMediaModal(false)
      setMediaUrl('')
      setMediaCaption('')
      setSuccess(`${mediaType === 'image' ? 'Image' : 'Video'} inserted successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error inserting media:', err)
      setFormError('Failed to insert media')
    }
  }

  // Handle image upload for cover image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `blog-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('blogs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('blogs')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, cover_image: urlData.publicUrl }))
      setSuccess('Cover image uploaded successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error uploading image:', err)
      setFormError('Failed to upload cover image')
    }
  }

  // Editor toolbar actions
  const toggleBold = () => editor?.chain().focus().toggleBold().run()
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run()
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run()
  
  const toggleHeading1 = () => editor?.chain().focus().toggleHeading({ level: 1 }).run()
  const toggleHeading2 = () => editor?.chain().focus().toggleHeading({ level: 2 }).run()
  const toggleHeading3 = () => editor?.chain().focus().toggleHeading({ level: 3 }).run()
  
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run()
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run()
  
  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    editor?.chain().focus().setTextAlign(align).run()
  }
  
  const toggleCode = () => editor?.chain().focus().toggleCode().run()
  
  const toggleHighlight = () => editor?.chain().focus().toggleHighlight().run()
  
  const setColor = (color: string) => {
    editor?.chain().focus().setColor(color).run()
  }

  const setFontFamily = (font: string) => {
    editor?.chain().focus().setFontFamily(font).run()
  }

  const handleInsertLink = () => {
    if (linkText && linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run()
      setLinkText('')
      setLinkUrl('')
      setShowLinkModal(false)
    }
  }

  const handleRemoveLink = () => {
    editor?.chain().focus().unsetLink().run()
  }

  const toggleFullscreen = () => {
    if (!editorRef.current) return
    
    if (!isFullscreen) {
      if (editorRef.current.requestFullscreen) {
        editorRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (name === 'title') {
      const slug = generateSlug(value)
      setFormData(prev => ({ 
        ...prev, 
        title: value,
        slug: slug 
      }))
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Handle tag input
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    setSuccess('')

    try {
      // Validate
      if (!formData.title || !formData.content) {
        setFormError('Title and content are required')
        setSubmitting(false)
        return
      }

      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || '',
        content: formData.content, // Already HTML from editor
        cover_image: formData.cover_image || '',
        author: formData.author || 'AutoRepublic',
        category: formData.category || 'General',
        tags: formData.tags || [],
        read_time: formData.read_time || 5,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        published_at: formData.is_published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      let result
      
      if (editingPost) {
        const { data, error } = await supabase
          .from('blogs')
          .update(postData)
          .eq('id', editingPost.id)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .from('blogs')
          .insert({
            ...postData,
            views: 0,
            likes: 0,
          })
          .select()
          .single()

        if (error) throw error
        result = data
      }

      setSuccess(editingPost ? 'Post updated successfully!' : 'Post created successfully!')
      await fetchPosts()
      
      setTimeout(() => {
        setShowForm(false)
        setEditingPost(null)
        setFormData(emptyFormData)
        setSuccess('')
        if (editor) {
          editor.commands.setContent('')
        }
      }, 1500)

    } catch (err: any) {
      console.error('Error saving post:', err)
      setFormError(err.message || 'Failed to save post')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete post
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchPosts()
      setSuccess('Post deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error deleting post:', err)
      setFormError('Failed to delete post')
    }
  }

  // Edit post
  const handleEdit = (post: BlogPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      cover_image: post.cover_image || '',
      author: post.author || 'AutoRepublic',
      category: post.category || 'General',
      tags: post.tags || [],
      read_time: post.read_time || 5,
      is_published: post.is_published,
      is_featured: post.is_featured,
    })
    if (editor) {
      editor.commands.setContent(post.content || '')
    }
    setShowForm(true)
  }

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Color options
  const colorOptions = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff', '#94a3b8']
  const fontOptions = ['Arial', 'Georgia', 'Inter', 'Times New Roman', 'Courier New', 'Verdana']

  return (
    <div className="bg-black/40 rounded-2xl border border-white/5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-400" />
            Blog Management
          </h2>
          <p className="text-sm text-white/40 mt-0.5">Create, edit, and manage blog posts</p>
        </div>
        <button
          onClick={() => {
            setEditingPost(null)
            setFormData(emptyFormData)
            setFormError('')
            setShowForm(true)
            if (editor) {
              editor.commands.setContent('')
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}
      
      {formError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {formError}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search posts by title, excerpt, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
        >
          <option value="All">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Blog Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 sm:p-6 max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-white/10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingPost(null)
                  setFormData(emptyFormData)
                  setFormError('')
                  if (editor) {
                    editor.commands.setContent('')
                  }
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter post title"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Slug <span className="text-white/30 text-xs">(auto-generated)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">autorepublic.ng/blog/</span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="post-slug"
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Excerpt <span className="text-white/30 text-xs">(short description)</span>
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Brief summary of the post..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                />
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Content <span className="text-red-500">*</span>
                </label>
                
                <div ref={editorRef} className="relative">
                  {/* Editor Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-2 bg-white/5 rounded-t-xl border border-white/10 border-b-0 sticky top-0 z-10 backdrop-blur-sm">
                    {/* Font Family */}
                    <select
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-red-500/50"
                    >
                      {fontOptions.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>

                    <span className="w-px h-5 bg-white/10 mx-0.5" />

                    {/* Headings */}
                    <button
                      type="button"
                      onClick={toggleHeading1}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('heading', { level: 1 }) ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Heading 1"
                    >
                      <Heading1 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleHeading2}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Heading 2"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleHeading3}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('heading', { level: 3 }) ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Heading 3"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-px h-5 bg-white/10 mx-0.5" />

                    {/* Text Formatting */}
                    <button
                      type="button"
                      onClick={toggleBold}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('bold') ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleItalic}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('italic') ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleUnderline}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('underline') ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Underline"
                    >
                      <UnderlineIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleStrike}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('strike') ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Strikethrough"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-px h-5 bg-white/10 mx-0.5" />

                    {/* Text Color */}
                    <div className="flex items-center gap-0.5">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setColor(color)}
                          className="w-4 h-4 rounded-full border border-white/10 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={toggleHighlight}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('highlight') ? 'bg-white/10 text-yellow-400' : 'text-white/60 hover:text-white'}`}
                      title="Highlight"
                    >
                      <Highlighter className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-px h-5 bg-white/10 mx-0.5" />

                    {/* Lists */}
                    <button
                      type="button"
                      onClick={toggleBulletList}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('bulletList') ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleOrderedList}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('orderedList') ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Numbered List"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-px h-5 bg-white/10 mx-0.5" />

                    {/* Alignment */}
                    <button
                      type="button"
                      onClick={() => setTextAlign('left')}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive({ textAlign: 'left' }) ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlign('center')}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive({ textAlign: 'center' }) ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Center"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlign('right')}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive({ textAlign: 'right' }) ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Align Right"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlign('justify')}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Justify"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-px h-5 bg-white/10 mx-0.5" />

                    {/* Media */}
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType('image')
                        setShowMediaModal(true)
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                      title="Insert Image"
                    >
                      <ImageIcon2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaType('video')
                        setShowMediaModal(true)
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                      title="Insert Video"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-px h-5 bg-white/10 mx-0.5" />

                    {/* Links */}
                    <button
                      type="button"
                      onClick={() => setShowLinkModal(true)}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('link') ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Insert Link"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                    {editor?.isActive('link') && (
                      <button
                        type="button"
                        onClick={handleRemoveLink}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                        title="Remove Link"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <span className="w-px h-5 bg-white/10 mx-0.5" />

                    {/* Blockquote & Code */}
                    <button
                      type="button"
                      onClick={toggleBlockquote}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('blockquote') ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Quote"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleCode}
                      className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${editor?.isActive('code') ? 'bg-white/10 text-red-400' : 'text-white/60 hover:text-white'}`}
                      title="Code"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-px h-5 bg-white/10 mx-0.5" />

                    {/* Fullscreen */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white ml-auto"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Editor Content */}
                  <div className="border border-white/10 rounded-b-xl bg-white/5 min-h-[400px] overflow-auto">
                    <EditorContent editor={editor} />
                  </div>

                  {/* Drag and drop overlay hint */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/10 rounded-xl opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg text-xs text-white/60">
                      Drag & drop images or videos here
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-white/30">
                    Rich text editor with drag & drop support for images and videos
                  </p>
                  <span className="text-xs text-white/20">
                    {editor?.getText().length || 0} characters
                  </span>
                </div>
              </div>

              {/* Link Modal */}
              {showLinkModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
                    <h4 className="text-lg font-bold text-white mb-4">Insert Link</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">
                          Link Text
                        </label>
                        <input
                          type="text"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          placeholder="Enter link text..."
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">
                          URL
                        </label>
                        <input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://example.com..."
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleInsertLink}
                          className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors"
                        >
                          Insert Link
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowLinkModal(false)
                            setLinkText('')
                            setLinkUrl('')
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Media Modal */}
              {showMediaModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl animate-in zoom-in duration-300">
                    <h4 className="text-lg font-bold text-white mb-4">
                      Insert {mediaType === 'image' ? 'Image' : 'Video'}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">
                          Upload File
                        </label>
                        <input
                          ref={mediaFileInputRef}
                          type="file"
                          accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleMediaFileUpload(file, mediaType)
                              setShowMediaModal(false)
                            }
                          }}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-500 file:text-white hover:file:bg-red-600"
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-gray-900 px-2 text-white/40">Or enter URL</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/60 mb-1">
                          {mediaType === 'image' ? 'Image' : 'Video'} URL
                        </label>
                        <input
                          type="url"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder={mediaType === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleMediaUrlInsert}
                          className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-colors"
                        >
                          Insert {mediaType === 'image' ? 'Image' : 'Video'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMediaModal(false)
                            setMediaUrl('')
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Cover Image
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Cover Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {formData.cover_image && (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        <img
                          src={formData.cover_image}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Category & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Author
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Author name"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag..."
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-sm text-red-400 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white/5 rounded-full text-xs text-white/60"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-white/40 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Read Time & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1.5">
                    Read Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="read_time"
                    value={formData.read_time}
                    onChange={handleInputChange}
                    min="1"
                    max="60"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500 focus:ring-offset-0"
                    />
                    Published
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500 focus:ring-offset-0"
                    />
                    Featured
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingPost ? 'Update Post' : 'Create Post'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingPost(null)
                    setFormData(emptyFormData)
                    setFormError('')
                    if (editor) {
                      editor.commands.setContent('')
                    }
                  }}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blog Posts Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-white/60 ml-3">Loading posts...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No blog posts found</p>
          <button
            onClick={() => {
              setEditingPost(null)
              setFormData(emptyFormData)
              setFormError('')
              setShowForm(true)
              if (editor) {
                editor.commands.setContent('')
              }
            }}
            className="mt-2 text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            Create your first post
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-2 text-xs font-medium text-white/40">Title</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-white/40 hidden sm:table-cell">Category</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-white/40 hidden md:table-cell">Status</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-white/40 hidden lg:table-cell">Published</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-white/40 hidden xl:table-cell">Views</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      {post.cover_image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 hidden sm:block">
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">
                          {post.title}
                        </p>
                        <p className="text-[10px] text-white/30 truncate max-w-[200px]">
                          {post.content.replace(/<[^>]*>/g, '').substring(0, 80)}...
                        </p>
                        {post.is_featured && (
                          <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 hidden sm:table-cell">
                    <span className="text-xs text-white/40">{post.category}</span>
                  </td>
                  <td className="py-3 px-2 hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      post.is_published 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {post.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 px-2 hidden lg:table-cell">
                    <span className="text-xs text-white/40">
                      {formatDate(post.published_at || post.created_at)}
                    </span>
                  </td>
                  <td className="py-3 px-2 hidden xl:table-cell">
                    <span className="text-xs text-white/40">{post.views || 0}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-end gap-1">
                      <NextLink
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </NextLink>
                      <button
                        onClick={() => handleEdit(post)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-blue-400"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="mt-4 flex items-center justify-between text-xs text-white/30">
          <span>Total posts: {posts.length}</span>
          <span>Showing {filteredPosts.length} filtered</span>
        </div>
      )}
    </div>
  )
}