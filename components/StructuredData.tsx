export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.autorepublic.ng/#organization',
        name: 'AutoRepublic',
        url: 'https://www.autorepublic.ng',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.autorepublic.ng/autorepublic.svg',
        },
        description:
          'AutoRepublic is a Nigerian vehicle marketplace for buying and selling used, foreign-used, brand-new, electric, luxury and other vehicles.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.autorepublic.ng/#website',
        url: 'https://www.autorepublic.ng',
        name: 'AutoRepublic',
        description:
          'Buy and sell vehicles in Nigeria with AutoRepublic.',
        publisher: {
          '@id': 'https://www.autorepublic.ng/#organization',
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