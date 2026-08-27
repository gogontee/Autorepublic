// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabaseServer } from '@/lib/supabase/server'
import BlogContent from './BlogContent'

interface BlogPageProps {
  params: {
    slug: string
  }
}

// Generate metadata for the blog post
export async function generateMetadata(
  { params }: BlogPageProps
): Promise<Metadata> {
  const { data: blog, error } = await supabaseServer
    .from('blogs')
    .select('title, excerpt, cover_image, category, published_at, tags')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (error || !blog) {
    return {
      title: 'Article Not Found | AutoRepublic',
      description: 'The article you are looking for could not be found.',
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  const canonicalUrl = `https://autorepublic.ng/blog/${params.slug}`

  return {
    title: `${blog.title} | AutoRepublic Blog`,
    description: blog.excerpt || `Read about ${blog.title} on AutoRepublic Blog.`,
    keywords: [
      blog.title,
      blog.category,
      ...(blog.tags || []),
      'AutoRepublic',
      'Auto Republic',
      'cars in Nigeria',
      'vehicle blog',
      'auto blog Nigeria',
    ].filter(Boolean),

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },

    openGraph: {
      type: 'article',
      locale: 'en_NG',
      url: canonicalUrl,
      siteName: 'AutoRepublic',
      title: blog.title,
      description: blog.excerpt || `Read about ${blog.title} on AutoRepublic Blog.`,
      images: blog.cover_image
        ? [
            {
              url: blog.cover_image,
              width: 1200,
              height: 630,
              alt: blog.title,
            },
          ]
        : [],
      publishedTime: blog.published_at,
      authors: ['AutoRepublic'],
      tags: blog.tags || [],
    },

    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt || `Read about ${blog.title} on AutoRepublic Blog.`,
      images: blog.cover_image ? [blog.cover_image] : [],
    },
  }
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const { data: blogs } = await supabaseServer
    .from('blogs')
    .select('slug')
    .eq('is_published', true)

  return (blogs || []).map((blog) => ({
    slug: blog.slug,
  }))
}

// Format date function (now used on the server)
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

// Main page component
export default async function BlogDetailPage({ params }: BlogPageProps) {
  // Fetch the blog post
  const { data: blog, error } = await supabaseServer
    .from('blogs')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  // If blog not found, show 404
  if (error || !blog) {
    notFound()
  }

  // Increment view count
  try {
    const { data: currentBlog } = await supabaseServer
      .from('blogs')
      .select('views')
      .eq('id', blog.id)
      .single()

    const currentViews = currentBlog?.views || 0
    const newViews = currentViews + 1

    await supabaseServer
      .from('blogs')
      .update({ views: newViews })
      .eq('id', blog.id)
  } catch (err) {
    console.error('Error incrementing views:', err)
  }

  // Fetch related blog posts
  const { data: relatedPosts } = await supabaseServer
    .from('blogs')
    .select('id, title, slug, cover_image, excerpt, published_at, category')
    .eq('is_published', true)
    .neq('id', blog.id)
    .eq('category', blog.category)
    .order('published_at', { ascending: false })
    .limit(3)

  // Format the date on the server before passing to client
  const formattedDate = formatDate(blog.published_at || blog.created_at)

  return (
    <BlogContent 
      blog={blog} 
      relatedPosts={relatedPosts || []} 
      formattedDate={formattedDate}
    />
  )
}