export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://autorepublic.ng/#organization',
        name: 'AutoRepublic',
        url: 'https://autorepublic.ng',
        logo: {
          '@type': 'ImageObject',
          url: 'https://autorepublic.ng/autorepublic.svg',
        },
        description:
          'AutoRepublic is a Nigerian vehicle marketplace for buying and selling used, foreign-used, brand-new, electric, luxury and other vehicles.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://autorepublic.ng/#website',
        url: 'https://autorepublic.ng',
        name: 'AutoRepublic',
        description:
          'Buy and sell vehicles in Nigeria with AutoRepublic.',
        publisher: {
          '@id': 'https://autorepublic.ng/#organization',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  )
}