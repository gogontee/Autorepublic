import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import BlogContent from './BlogContent' // your existing 'use client' component

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: blog } = await supabase
    .from('blogs')
    .select('title, excerpt, cover_image, category, tags, published_at, updated_at, author, slug')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!blog) {
    return {
      title: 'Article Not Found | AutoRepublic',
      robots: { index: false, follow: false },
    }
  }

  const url = `https://autorepublic.ng/blog/${blog.slug}`
  const description = blog.excerpt || `${blog.title} — AutoRepublic Blog`

  return {
    title: `${blog.title} | AutoRepublic Blog`,
    description,
    keywords: blog.tags || [blog.category, 'car blog', 'AutoRepublic'],
    authors: [{ name: blog.author || 'AutoRepublic' }],
    alternates: { canonical: url },
    openGraph: {
      title: blog.title,
      description,
      url,
      siteName: 'AutoRepublic',
      type: 'article',
      publishedTime: blog.published_at,
      modifiedTime: blog.updated_at,
      authors: [blog.author || 'AutoRepublic'],
      images: blog.cover_image
        ? [{ url: blog.cover_image, width: 1200, height: 630, alt: blog.title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description,
      images: blog.cover_image ? [blog.cover_image] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export const revalidate = 3600 // ISR

export default async function BlogPostPage({ params }: Props) {
  const { data: blog } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!blog) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60">Article not found</p>
      </div>
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt,
    image: blog.cover_image ? [blog.cover_image] : [],
    datePublished: blog.published_at,
    dateModified: blog.updated_at || blog.published_at,
    author: {
      '@type': 'Person',
      name: blog.author || 'AutoRepublic',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AutoRepublic',
      logo: {
        '@type': 'ImageObject',
        url: 'https://autorepublic.ng/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://autorepublic.ng/blog/${blog.slug}`,
    },
    keywords: (blog.tags || []).join(', '),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://autorepublic.ng' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://autorepublic.ng/blog' },
      {
        '@type': 'ListItem',
        position: 3,
        name: blog.title,
        item: `https://autorepublic.ng/blog/${blog.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <BlogContent
        blog={blog}
        relatedPosts={[]}
        formattedDate={new Date(blog.published_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      />
    </>
  )
}